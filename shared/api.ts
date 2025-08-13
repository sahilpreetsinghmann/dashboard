export interface DemoResponse {
  message: string;
}

export interface LTPHubData {
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

export interface AFEData {
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

export interface LTPHubResponse {
  success: boolean;
  data: LTPHubData[];
  count: number;
}

export interface AFEDataResponse {
  success: boolean;
  data: AFEData[];
  count: number;
}

export interface DashboardMetrics {
  totalGigawattsRequested: number;
  totalGigawattsSubmitted: number;
  totalRevenueRequested: number;
  totalRevenuePlanned: number;
  totalRequests: number;
  pendingRequests: number;
  avgTimeToPlan: number;
}

export interface PlannerStats {
  name: string;
  completedProjects: number;
  totalLoadConnected: number;
  totalRevenueConnected: number;
  avgTimeToComplete: number;
}
