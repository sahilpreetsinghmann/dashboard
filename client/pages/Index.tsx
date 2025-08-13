import React, { useState, useCallback, useEffect } from "react";
import {
  Activity,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LTPHubData,
  AFEData,
  LTPHubResponse,
  AFEDataResponse,
  DashboardMetrics,
  PlannerStats,
} from "@shared/api";

export default function Index() {
  const [ltpData, setLtpData] = useState<LTPHubData[]>([]);
  const [afeData, setAfeData] = useState<AFEData[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [plannerStats, setPlannerStats] = useState<PlannerStats[]>([]);
  const [selectedPlanner, setSelectedPlanner] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const calculateMetrics = useCallback(
    (ltpData: LTPHubData[], afeData: AFEData[]): DashboardMetrics => {
      // Calculate total gigawatts requested from LTP hub
      const totalGigawattsRequested = ltpData.reduce((sum, row) => {
        const load = parseFloat(row["Total Load Projection"]) || 0;
        return sum + load / 1000; // Convert MW to GW
      }, 0);

      // Calculate total gigawatts submitted (projects that appear in AFE)
      const ltpProjectNumbers = new Set(ltpData.map((row) => row["Project #"]));
      const afeProjectNumbers = new Set(
        afeData.map((row) => row["Project Number"]),
      );
      const submittedProjects = ltpData.filter((row) =>
        afeProjectNumbers.has(row["Project #"]),
      );

      const totalGigawattsSubmitted = submittedProjects.reduce((sum, row) => {
        const load = parseFloat(row["Total Load Projection"]) || 0;
        return sum + load / 1000;
      }, 0);

      // Calculate revenue (using Est. Budget as proxy for revenue)
      const totalRevenueRequested = ltpData.reduce((sum, row) => {
        const budget =
          parseFloat(row["Est. Budget"]?.replace(/[^0-9.]/g, "")) || 0;
        return sum + budget;
      }, 0);

      const totalRevenuePlanned = submittedProjects.reduce((sum, row) => {
        const budget =
          parseFloat(row["Est. Budget"]?.replace(/[^0-9.]/g, "")) || 0;
        return sum + budget;
      }, 0);

      // Calculate pending requests
      const pendingRequests = ltpData.filter(
        (row) => !afeProjectNumbers.has(row["Project #"]),
      ).length;

      // Calculate average time to plan
      let totalDays = 0;
      let projectsWithDates = 0;

      submittedProjects.forEach((ltpRow) => {
        const afeRow = afeData.find(
          (afe) => afe["Project Number"] === ltpRow["Project #"],
        );
        if (afeRow && ltpRow["DP Request Date"] && afeRow["Date Created"]) {
          const ltpDate = new Date(ltpRow["DP Request Date"]);
          const afeDate = new Date(afeRow["Date Created"]);
          if (!isNaN(ltpDate.getTime()) && !isNaN(afeDate.getTime())) {
            const daysDiff =
              (afeDate.getTime() - ltpDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff >= 0) {
              totalDays += daysDiff;
              projectsWithDates++;
            }
          }
        }
      });

      const avgTimeToPlan =
        projectsWithDates > 0 ? totalDays / projectsWithDates : 0;

      return {
        totalGigawattsRequested,
        totalGigawattsSubmitted,
        totalRevenueRequested,
        totalRevenuePlanned,
        totalRequests: ltpData.length,
        pendingRequests,
        avgTimeToPlan,
      };
    },
    [],
  );

  const calculatePlannerStats = useCallback(
    (ltpData: LTPHubData[], afeData: AFEData[]): PlannerStats[] => {
      const plannerMap = new Map<string, PlannerStats>();

      // Get unique planners
      const planners = Array.from(
        new Set([
          ...ltpData.map((row) => row["Planner"]).filter(Boolean),
          ...afeData.map((row) => row["ET Planner"]).filter(Boolean),
        ]),
      );

      planners.forEach((plannerName) => {
        if (!plannerName) return;

        // Find completed projects for this planner (appear in both LTP and AFE)
        const ltpProjects = ltpData.filter(
          (row) => row["Planner"] === plannerName,
        );
        const afeProjects = afeData.filter(
          (row) => row["ET Planner"] === plannerName,
        );
        const completedProjects = ltpProjects.filter((ltpRow) =>
          afeProjects.some(
            (afeRow) => afeRow["Project Number"] === ltpRow["Project #"],
          ),
        );

        const totalLoadConnected = completedProjects.reduce((sum, row) => {
          const load = parseFloat(row["Total Load Projection"]) || 0;
          return sum + load / 1000; // Convert to GW
        }, 0);

        const totalRevenueConnected = completedProjects.reduce((sum, row) => {
          const budget =
            parseFloat(row["Est. Budget"]?.replace(/[^0-9.]/g, "")) || 0;
          return sum + budget;
        }, 0);

        // Calculate average time for completed projects
        let totalDays = 0;
        let projectsWithDates = 0;

        completedProjects.forEach((ltpRow) => {
          const afeRow = afeProjects.find(
            (afe) => afe["Project Number"] === ltpRow["Project #"],
          );
          if (afeRow && ltpRow["DP Request Date"] && afeRow["Date Created"]) {
            const ltpDate = new Date(ltpRow["DP Request Date"]);
            const afeDate = new Date(afeRow["Date Created"]);
            if (!isNaN(ltpDate.getTime()) && !isNaN(afeDate.getTime())) {
              const daysDiff =
                (afeDate.getTime() - ltpDate.getTime()) / (1000 * 60 * 60 * 24);
              if (daysDiff >= 0) {
                totalDays += daysDiff;
                projectsWithDates++;
              }
            }
          }
        });

        const avgTimeToComplete =
          projectsWithDates > 0 ? totalDays / projectsWithDates : 0;

        plannerMap.set(plannerName, {
          name: plannerName,
          completedProjects: completedProjects.length,
          totalLoadConnected,
          totalRevenueConnected,
          avgTimeToComplete,
        });
      });

      return Array.from(plannerMap.values()).sort(
        (a, b) => b.completedProjects - a.completedProjects,
      );
    },
    [],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [ltpResponse, afeResponse] = await Promise.all([
        fetch("/api/ltp-hub"),
        fetch("/api/afe-data"),
      ]);

      if (!ltpResponse.ok || !afeResponse.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const ltpResult: LTPHubResponse = await ltpResponse.json();
      const afeResult: AFEDataResponse = await afeResponse.json();

      if (!ltpResult.success || !afeResult.success) {
        throw new Error("Server returned error response");
      }

      setLtpData(ltpResult.data);
      setAfeData(afeResult.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        `Failed to load dashboard data: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate metrics when data changes
  useEffect(() => {
    if (ltpData.length > 0 && afeData.length > 0) {
      const newMetrics = calculateMetrics(ltpData, afeData);
      const newPlannerStats = calculatePlannerStats(ltpData, afeData);
      setMetrics(newMetrics);
      setPlannerStats(newPlannerStats);
    }
  }, [ltpData, afeData, calculateMetrics, calculatePlannerStats]);

  const selectedPlannerData = plannerStats.find(
    (p) => p.name === selectedPlanner,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Project Analytics Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time project analytics from LTP Hub and AFE data
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={fetchData}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Data Status */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    LTP Hub Data
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {ltpData.length} projects loaded
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  ✓ Connected
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    AFE Data
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {afeData.length} records loaded
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  ✓ Connected
                </Badge>
              </div>
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

        {/* Loading State */}
        {isLoading && !metrics && (
          <Card className="text-center py-12">
            <CardContent>
              <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Loading Dashboard Data
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Fetching project analytics from the server...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard */}
        {metrics && !isLoading && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Gigawatts Requested
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalGigawattsRequested.toFixed(2)} GW
                  </div>
                  <p className="text-xs opacity-75">Total DP requested</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Gigawatts Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalGigawattsSubmitted.toFixed(2)} GW
                  </div>
                  <p className="text-xs opacity-75">CPR submitted</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Revenue Requested
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(metrics.totalRevenueRequested / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs opacity-75">Total requested</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Revenue Planned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(metrics.totalRevenuePlanned / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs opacity-75">In AFE pipeline</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalRequests}
                  </div>
                  <p className="text-xs opacity-75">All projects</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.pendingRequests}
                  </div>
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
                  <Select
                    value={selectedPlanner}
                    onValueChange={setSelectedPlanner}
                  >
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
                        <CardTitle className="text-sm text-blue-700 dark:text-blue-300">
                          Completed Projects
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {selectedPlannerData.completedProjects}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-700 dark:text-green-300">
                          Load Connected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {selectedPlannerData.totalLoadConnected.toFixed(2)} GW
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-purple-700 dark:text-purple-300">
                          Revenue Connected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          $
                          {(
                            selectedPlannerData.totalRevenueConnected / 1000000
                          ).toFixed(1)}
                          M
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-orange-700 dark:text-orange-300">
                          Avg. Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {selectedPlannerData.avgTimeToComplete.toFixed(1)}{" "}
                          days
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!metrics &&
          !isLoading &&
          ltpData.length === 0 &&
          afeData.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No Data Available
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Unable to load dashboard data from the server
                </p>
                <Button onClick={fetchData} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
