import * as fs from 'fs';
import * as path from 'path';

export class DataFileManager {
  private static readonly DATA_DIR = path.join(__dirname, '..', 'data');
  private static readonly LTP_HUB_FILE = 'ltphub.csv';
  private static readonly AFE_DATA_FILE = 'AFE_data.iqy';

  /**
   * Get the full path to the LTP Hub CSV file
   */
  static getLTPHubPath(): string {
    return path.join(this.DATA_DIR, this.LTP_HUB_FILE);
  }

  /**
   * Get the full path to the AFE Data IQY file
   */
  static getAFEDataPath(): string {
    return path.join(this.DATA_DIR, this.AFE_DATA_FILE);
  }

  /**
   * Check if data directory exists, create if not
   */
  static ensureDataDirectory(): void {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
    }
  }

  /**
   * Check if a file exists
   */
  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Get file stats (size, modified date, etc.)
   */
  static getFileStats(filePath: string) {
    if (!this.fileExists(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
      isFile: stats.isFile()
    };
  }

  /**
   * List all files in the data directory
   */
  static listDataFiles(): string[] {
    this.ensureDataDirectory();
    return fs.readdirSync(this.DATA_DIR);
  }

  /**
   * Get info about both data files
   */
  static getDataFilesInfo() {
    const ltpPath = this.getLTPHubPath();
    const afePath = this.getAFEDataPath();
    
    return {
      ltpHub: {
        path: ltpPath,
        exists: this.fileExists(ltpPath),
        stats: this.getFileStats(ltpPath)
      },
      afeData: {
        path: afePath,
        exists: this.fileExists(afePath),
        stats: this.getFileStats(afePath)
      }
    };
  }

  /**
   * Backup existing files with timestamp
   */
  static backupFiles(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ltpPath = this.getLTPHubPath();
    const afePath = this.getAFEDataPath();
    
    if (this.fileExists(ltpPath)) {
      const backupPath = path.join(this.DATA_DIR, `ltphub_backup_${timestamp}.csv`);
      fs.copyFileSync(ltpPath, backupPath);
    }
    
    if (this.fileExists(afePath)) {
      const backupPath = path.join(this.DATA_DIR, `AFE_data_backup_${timestamp}.iqy`);
      fs.copyFileSync(afePath, backupPath);
    }
  }
}
