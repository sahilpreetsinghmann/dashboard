# Dashboard Data Files

This directory contains the data files that the dashboard reads from:

## Files Structure

### `ltphub.csv`
- **Format**: CSV (Comma Separated Values)
- **Description**: Contains LTP Hub project data
- **Key Columns**:
  - `Project #` - Unique project identifier
  - `Project Name` - Name of the project
  - `Planner` - Assigned planner
  - `Total Load Projection` - Load in MW
  - `Est. Budget` - Estimated budget
  - `DP Request Date` - Date when DP was requested
  - `Status` - Current project status

### `AFE_data.iqy`
- **Format**: IQY (Internet Query file, CSV-like)
- **Description**: Contains AFE (Authorization for Expenditure) data
- **Key Columns**:
  - `ID` - Unique AFE identifier
  - `Project Number` - Links to LTP Hub Project #
  - `ET Planner` - Engineering & Technical planner
  - `Date Created` - When AFE was created
  - `Est. Project Cost` - Estimated cost
  - `AFE Status` - Current AFE status

## File Management

### Updating Data Files
1. **Backup Current Files**: The system can create automatic backups
2. **Replace Files**: Simply replace the files with updated versions
3. **Restart Server**: The server will automatically pick up changes

### File Format Requirements
- **CSV Format**: Standard comma-separated values
- **Headers**: First row must contain column headers
- **Encoding**: UTF-8 recommended
- **Line Endings**: Unix (LF) or Windows (CRLF) both supported

### API Endpoints
- `GET /api/ltp-hub` - Returns LTP Hub data from CSV
- `GET /api/afe-data` - Returns AFE data from IQY
- `GET /api/file-info` - Returns file status and metadata

## Data Relationships

The dashboard links data between files using:
- **LTP Hub `Project #`** ↔ **AFE `Project Number`**

Projects that appear in both files are considered "submitted to AFE"
Projects only in LTP Hub are considered "pending"

## Troubleshooting

### File Not Found Errors
- Ensure files exist in `/server/data/` directory
- Check file permissions
- Verify file names match exactly: `ltphub.csv` and `AFE_data.iqy`

### Parsing Errors
- Check CSV format (proper commas, quotes)
- Ensure headers are in first row
- Remove empty lines at end of file
- Check for special characters that might break parsing

### Data Issues
- Verify `Project #` and `Project Number` fields match for linking
- Check date formats are consistent
- Ensure numeric fields (load, budget) contain valid numbers
