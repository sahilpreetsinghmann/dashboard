import React, { useState, useCallback } from 'react';
import { Upload, FileText, Activity, DollarSign, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LTPHubData {
  'Project #': string;
  'Project Name': string;
  'Status': string;
  'Target Date': string;
  'PJM #': string;
  'Planner': string;
  'Region': string;
  'Total Load Projection': string;
  'Five Year Load Projection': string;
  'Est. Budget': string;
  'Customer Contact Name': string;
  'Customer Contact Email': string;
  'DP Request Date': string;
}

interface AFEData {
  'ID': string;
  'Title': string;
  'Date Created': string;
  'AFE Status': string;
  'ET Planner': string;
  'Project Number': string;
  'Project Title': string;
  'CPR Target Date': string;
  'CPR Est Project Cost': string;
  'AFE Target Date': string;
  'Est. Project Cost': string;
  'Final Approval Date': string;
  'Submit': string;
}

interface DashboardMetrics {
  totalGigawattsRequested: number;
  totalGigawattsSubmitted: number;
  totalRevenueRequested: number;
  totalRevenuePlanned: number;
  totalRequests: number;
  pendingRequests: number;
  avgTimeToPlan: number;
}

interface PlannerStats {
  name: string;
  completedProjects: number;
  totalLoadConnected: number;
  totalRevenueConnected: number;
  avgTimeToComplete: number;
}

export default function Index() {
  const [ltpData, setLtpData] = useState<LTPHubData[]>([]);
  const [afeData, setAfeData] = useState<AFEData[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [plannerStats, setPlannerStats] = useState<PlannerStats[]>([]);
  const [selectedPlanner, setSelectedPlanner] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const parseCSV = useCallback((text: string): any[] => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return data;
  }, []);

  const calculateMetrics = useCallback((ltpData: LTPHubData[], afeData: AFEData[]): DashboardMetrics => {
    // Calculate total gigawatts requested from LTP hub
    const totalGigawattsRequested = ltpData.reduce((sum, row) => {
      const load = parseFloat(row['Total Load Projection']) || 0;
      return sum + (load / 1000); // Convert MW to GW
    }, 0);

    // Calculate total gigawatts submitted (projects that appear in AFE)
    const ltpProjectNumbers = new Set(ltpData.map(row => row['Project #']));
    const afeProjectNumbers = new Set(afeData.map(row => row['Project Number']));
    const submittedProjects = ltpData.filter(row => afeProjectNumbers.has(row['Project #']));
    
    const totalGigawattsSubmitted = submittedProjects.reduce((sum, row) => {
      const load = parseFloat(row['Total Load Projection']) || 0;
      return sum + (load / 1000);
    }, 0);

    // Calculate revenue (using Est. Budget as proxy for revenue)
    const totalRevenueRequested = ltpData.reduce((sum, row) => {
      const budget = parseFloat(row['Est. Budget']?.replace(/[^0-9.]/g, '')) || 0;
      return sum + budget;
    }, 0);

    const totalRevenuePlanned = submittedProjects.reduce((sum, row) => {
      const budget = parseFloat(row['Est. Budget']?.replace(/[^0-9.]/g, '')) || 0;
      return sum + budget;
    }, 0);

    // Calculate pending requests
    const pendingRequests = ltpData.filter(row => !afeProjectNumbers.has(row['Project #'])).length;

    // Calculate average time to plan
    let totalDays = 0;
    let projectsWithDates = 0;

    submittedProjects.forEach(ltpRow => {
      const afeRow = afeData.find(afe => afe['Project Number'] === ltpRow['Project #']);
      if (afeRow && ltpRow['DP Request Date'] && afeRow['Date Created']) {
        const ltpDate = new Date(ltpRow['DP Request Date']);
        const afeDate = new Date(afeRow['Date Created']);
        if (!isNaN(ltpDate.getTime()) && !isNaN(afeDate.getTime())) {
          const daysDiff = (afeDate.getTime() - ltpDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff >= 0) {
            totalDays += daysDiff;
            projectsWithDates++;
          }
        }
      }
    });

    const avgTimeToPlan = projectsWithDates > 0 ? totalDays / projectsWithDates : 0;

    return {
      totalGigawattsRequested,
      totalGigawattsSubmitted,
      totalRevenueRequested,
      totalRevenuePlanned,
      totalRequests: ltpData.length,
      pendingRequests,
      avgTimeToPlan
    };
  }, []);

  const calculatePlannerStats = useCallback((ltpData: LTPHubData[], afeData: AFEData[]): PlannerStats[] => {
    const plannerMap = new Map<string, PlannerStats>();
    
    // Get unique planners
    const planners = Array.from(new Set([
      ...ltpData.map(row => row['Planner']).filter(Boolean),
      ...afeData.map(row => row['ET Planner']).filter(Boolean)
    ]));

    planners.forEach(plannerName => {
      if (!plannerName) return;
      
      // Find completed projects for this planner (appear in both LTP and AFE)
      const ltpProjects = ltpData.filter(row => row['Planner'] === plannerName);
      const afeProjects = afeData.filter(row => row['ET Planner'] === plannerName);
      const completedProjects = ltpProjects.filter(ltpRow => 
        afeProjects.some(afeRow => afeRow['Project Number'] === ltpRow['Project #'])
      );

      const totalLoadConnected = completedProjects.reduce((sum, row) => {
        const load = parseFloat(row['Total Load Projection']) || 0;
        return sum + (load / 1000); // Convert to GW
      }, 0);

      const totalRevenueConnected = completedProjects.reduce((sum, row) => {
        const budget = parseFloat(row['Est. Budget']?.replace(/[^0-9.]/g, '')) || 0;
        return sum + budget;
      }, 0);

      // Calculate average time for completed projects
      let totalDays = 0;
      let projectsWithDates = 0;

      completedProjects.forEach(ltpRow => {
        const afeRow = afeProjects.find(afe => afe['Project Number'] === ltpRow['Project #']);
        if (afeRow && ltpRow['DP Request Date'] && afeRow['Date Created']) {
          const ltpDate = new Date(ltpRow['DP Request Date']);
          const afeDate = new Date(afeRow['Date Created']);
          if (!isNaN(ltpDate.getTime()) && !isNaN(afeDate.getTime())) {
            const daysDiff = (afeDate.getTime() - ltpDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff >= 0) {
              totalDays += daysDiff;
              projectsWithDates++;
            }
          }
        }
      });

      const avgTimeToComplete = projectsWithDates > 0 ? totalDays / projectsWithDates : 0;

      plannerMap.set(plannerName, {
        name: plannerName,
        completedProjects: completedProjects.length,
        totalLoadConnected,
        totalRevenueConnected,
        avgTimeToComplete
      });
    });

    return Array.from(plannerMap.values()).sort((a, b) => b.completedProjects - a.completedProjects);
  }, []);

  const handleFileUpload = useCallback(async (file: File, type: 'ltp' | 'afe') => {
    setIsLoading(true);
    setError('');
    
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (type === 'ltp') {
        setLtpData(data as LTPHubData[]);
      } else {
        setAfeData(data as AFEData[]);
      }
    } catch (err) {
      setError(`Error parsing ${type === 'ltp' ? 'LTP Hub' : 'AFE'} file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV]);

  // Recalculate metrics when data changes
  React.useEffect(() => {
    if (ltpData.length > 0 && afeData.length > 0) {
      const newMetrics = calculateMetrics(ltpData, afeData);
      const newPlannerStats = calculatePlannerStats(ltpData, afeData);
      setMetrics(newMetrics);
      setPlannerStats(newPlannerStats);
    }
  }, [ltpData, afeData, calculateMetrics, calculatePlannerStats]);

  const selectedPlannerData = plannerStats.find(p => p.name === selectedPlanner);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Project Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Upload your LTP Hub and AFE data files to view comprehensive project analytics
          </p>
        </div>

        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                LTP Hub Data
              </CardTitle>
              <CardDescription>Upload your ltp hub.csv file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-blue-500" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {ltpData.length > 0 ? `${ltpData.length} records loaded` : 'Click to upload LTP Hub CSV'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.iqy"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'ltp')}
                  />
                </label>
              </div>
              {ltpData.length > 0 && (
                <Badge variant="secondary" className="mt-2">
                  ✓ {ltpData.length} projects loaded
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                AFE Data
              </CardTitle>
              <CardDescription>Upload your AFE data.iqy file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-green-300 border-dashed rounded-lg cursor-pointer bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-green-500" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {afeData.length > 0 ? `${afeData.length} records loaded` : 'Click to upload AFE Data IQY'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.iqy"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'afe')}
                  />
                </label>
              </div>
              {afeData.length > 0 && (
                <Badge variant="secondary" className="mt-2">
                  ✓ {afeData.length} AFE records loaded
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard */}
        {metrics && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Gigawatts Requested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalGigawattsRequested.toFixed(2)} GW</div>
                  <p className="text-xs opacity-75">Total DP requested</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Gigawatts Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalGigawattsSubmitted.toFixed(2)} GW</div>
                  <p className="text-xs opacity-75">CPR submitted</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Revenue Requested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(metrics.totalRevenueRequested / 1000000).toFixed(1)}M</div>
                  <p className="text-xs opacity-75">Total requested</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Revenue Planned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(metrics.totalRevenuePlanned / 1000000).toFixed(1)}M</div>
                  <p className="text-xs opacity-75">In AFE pipeline</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalRequests}</div>
                  <p className="text-xs opacity-75">All projects</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.pendingRequests}</div>
                  <p className="text-xs opacity-75">Not in AFE</p>
                </CardContent>
              </Card>
            </div>

            {/* Average Time Card */}
            <Card className="mb-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  Planning Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                  {metrics.avgTimeToPlan.toFixed(1)} days
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Average time from DP request to AFE submission
                </p>
              </CardContent>
            </Card>

            {/* Planner Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Planner Performance Analytics
                </CardTitle>
                <CardDescription>
                  Select a planner to view their individual performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Select value={selectedPlanner} onValueChange={setSelectedPlanner}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select a planner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plannerStats.map((planner) => (
                        <SelectItem key={planner.name} value={planner.name}>
                          {planner.name} ({planner.completedProjects} projects)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlannerData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-700 dark:text-blue-300">Completed Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {selectedPlannerData.completedProjects}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-700 dark:text-green-300">Load Connected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {selectedPlannerData.totalLoadConnected.toFixed(2)} GW
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-purple-700 dark:text-purple-300">Revenue Connected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          ${(selectedPlannerData.totalRevenueConnected / 1000000).toFixed(1)}M
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-orange-700 dark:text-orange-300">Avg. Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {selectedPlannerData.avgTimeToComplete.toFixed(1)} days
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!metrics && ltpData.length === 0 && afeData.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Ready for Data Upload
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Upload both LTP Hub and AFE data files to begin analyzing your project metrics
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
