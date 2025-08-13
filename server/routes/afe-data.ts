import { RequestHandler } from "express";
import * as fs from 'fs';
import * as path from 'path';

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

function parseIQY(iqyContent: string): AFEData[] {
  // IQY files are typically CSV-like format, so we can use similar parsing
  const lines = iqyContent.split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: AFEData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV-like parsing with proper comma handling
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length >= headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Only include rows that have an ID (primary identifier)
      if (row['ID']) {
        data.push(row as AFEData);
      }
    }
  }
  
  return data;
}

export const handleAFEData: RequestHandler = (req, res) => {
  try {
    const iqyFilePath = path.join(__dirname, '..', 'data', 'AFE_data.iqy');
    
    // Check if file exists
    if (!fs.existsSync(iqyFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'AFE IQY file not found',
        path: iqyFilePath
      });
    }
    
    // Read and parse IQY file
    const iqyContent = fs.readFileSync(iqyFilePath, 'utf-8');
    const data = parseIQY(iqyContent);
    
    res.json({
      success: true,
      data: data,
      count: data.length,
      source: 'AFE_data.iqy'
    });
    
  } catch (error) {
    console.error('Error reading AFE IQY file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read AFE IQY file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
