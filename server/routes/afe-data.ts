import { RequestHandler } from "express";

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

// Sample AFE data - replace with actual data source
const sampleAFEData: AFEData[] = [
  {
    'ID': 'AFE-001',
    'Title': 'Data Center Alpha AFE',
    'Date Created': '2024-02-01',
    'AFE Status': 'Approved',
    'ET Planner': 'John Smith',
    'Project Number': 'LTP-001',
    'Project Title': 'Data Center Alpha Connection',
    'CPR Target Date': '2024-05-15',
    'CPR Est Project Cost': '2500000',
    'AFE Target Date': '2024-06-15',
    'Est. Project Cost': '2500000',
    'Final Approval Date': '2024-02-15',
    'Submit': '2024-02-01'
  },
  {
    'ID': 'AFE-002',
    'Title': 'Industrial Complex Beta AFE',
    'Date Created': '2024-02-20',
    'AFE Status': 'In Review',
    'ET Planner': 'Sarah Davis',
    'Project Number': 'LTP-002',
    'Project Title': 'Industrial Complex Beta',
    'CPR Target Date': '2024-07-30',
    'CPR Est Project Cost': '4200000',
    'AFE Target Date': '2024-08-30',
    'Est. Project Cost': '4200000',
    'Final Approval Date': '',
    'Submit': '2024-02-20'
  },
  {
    'ID': 'AFE-003',
    'Title': 'Manufacturing Hub Gamma AFE',
    'Date Created': '2024-02-15',
    'AFE Status': 'Approved',
    'ET Planner': 'Mike Johnson',
    'Project Number': 'LTP-003',
    'Project Title': 'Manufacturing Hub Gamma',
    'CPR Target Date': '2024-06-20',
    'CPR Est Project Cost': '3100000',
    'AFE Target Date': '2024-07-20',
    'Est. Project Cost': '3100000',
    'Final Approval Date': '2024-03-01',
    'Submit': '2024-02-15'
  }
];

export const handleAFEData: RequestHandler = (req, res) => {
  try {
    // In a real application, this would fetch from a database
    res.json({
      success: true,
      data: sampleAFEData,
      count: sampleAFEData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AFE data'
    });
  }
};
