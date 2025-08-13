import { RequestHandler } from "express";
import { DataFileManager } from "../utils/file-manager";

export const handleFileInfo: RequestHandler = (req, res) => {
  try {
    const filesInfo = DataFileManager.getDataFilesInfo();
    const allFiles = DataFileManager.listDataFiles();

    res.json({
      success: true,
      files: filesInfo,
      allFiles: allFiles,
      dataDirectory: DataFileManager.getDataFilesInfo(),
    });
  } catch (error) {
    console.error("Error getting file info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get file information",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
