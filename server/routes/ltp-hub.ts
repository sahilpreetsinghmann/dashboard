import { RequestHandler } from "express";

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

// Sample LTP Hub data - replace with actual data source
const sampleLTPData: LTPHubData[] = [
  {
    'Project #': 'LTP-001',
    'Project Name': 'Data Center Alpha Connection',
    'Status': 'Active',
    'Target Date': '2024-06-15',
    'PJM #': 'PJM-2024-001',
    'Planner': 'John Smith',
    'Region': 'North',
    'Total Load Projection': '150',
    'Five Year Load Projection': '200',
    'Est. Budget': '2500000',
    'Customer Contact Name': 'Alice Johnson',
    'Customer Contact Email': 'alice@datacenter.com',
    'DP Request Date': '2024-01-15'
  },
  {
    'Project #': 'LTP-002',
    'Project Name': 'Industrial Complex Beta',
    'Status': 'Planning',
    'Target Date': '2024-08-30',
    'PJM #': 'PJM-2024-002',
    'Planner': 'Sarah Davis',
    'Region': 'South',
    'Total Load Projection': '300',
    'Five Year Load Projection': '350',
    'Est. Budget': '4200000',
    'Customer Contact Name': 'Bob Wilson',
    'Customer Contact Email': 'bob@industrial.com',
    'DP Request Date': '2024-02-01'
  },
  {
    'Project #': 'LTP-003',
    'Project Name': 'Manufacturing Hub Gamma',
    'Status': 'Active',
    'Target Date': '2024-07-20',
    'PJM #': 'PJM-2024-003',
    'Planner': 'Mike Johnson',
    'Region': 'East',
    'Total Load Projection': '225',
    'Five Year Load Projection': '275',
    'Est. Budget': '3100000',
    'Customer Contact Name': 'Carol Brown',
    'Customer Contact Email': 'carol@manufacturing.com',
    'DP Request Date': '2024-01-30'
  },
  {
    'Project #': 'LTP-004',
    'Project Name': 'Tech Campus Delta',
    'Status': 'Pending',
    'Target Date': '2024-09-15',
    'PJM #': 'PJM-2024-004',
    'Planner': 'John Smith',
    'Region': 'West',
    'Total Load Projection': '400',
    'Five Year Load Projection': '500',
    'Est. Budget': '5800000',
    'Customer Contact Name': 'David Lee',
    'Customer Contact Email': 'david@techcampus.com',
    'DP Request Date': '2024-02-15'
  },
  {
    'Project #': 'LTP-005',
    'Project Name': 'Logistics Center Epsilon',
    'Status': 'Active',
    'Target Date': '2024-10-01',
    'PJM #': 'PJM-2024-005',
    'Planner': 'Sarah Davis',
    'Region': 'Central',
    'Total Load Projection': '180',
    'Five Year Load Projection': '220',
    'Est. Budget': '2800000',
    'Customer Contact Name': 'Emma Garcia',
    'Customer Contact Email': 'emma@logistics.com',
    'DP Request Date': '2024-03-01'
  }
];

export const handleLTPHubData: RequestHandler = (req, res) => {
  try {
    // In a real application, this would fetch from a database
    res.json({
      success: true,
      data: sampleLTPData,
      count: sampleLTPData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LTP Hub data'
    });
  }
};
