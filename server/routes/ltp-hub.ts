import { RequestHandler } from "express";
import * as fs from 'fs';
import * as path from 'path';

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

function parseCSV(csvContent: string): LTPHubData[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: LTPHubData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV parsing with proper comma handling (basic implementation)
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length >= headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Only include rows that have a Project # (primary identifier)
      if (row['Project #']) {
        data.push(row as LTPHubData);
      }
    }
  }
  
  return data;
}

export const handleLTPHubData: RequestHandler = (req, res) => {
  try {
    const csvFilePath = path.join(__dirname, '..', 'data', 'ltphub.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'LTP Hub CSV file not found',
        path: csvFilePath
      });
    }
    
    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const data = parseCSV(csvContent);
    
    res.json({
      success: true,
      data: data,
      count: data.length,
      source: 'ltphub.csv'
    });
    
  } catch (error) {
    console.error('Error reading LTP Hub CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read LTP Hub CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
