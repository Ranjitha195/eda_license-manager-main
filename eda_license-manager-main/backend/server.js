const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

console.log('Starting server...');
console.log('Current working directory:', process.cwd());

// Try to load LicenseParser with error handling
let LicenseParser;
try {
  LicenseParser = require('./licenseParser');
  console.log('LicenseParser loaded successfully');
} catch (error) {
  console.error('Error loading LicenseParser:', error);
  process.exit(1);
}

const app = express();
const port = 3001;

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // Only accept text files
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Ensure upload directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize license parser
const parser = new LicenseParser();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  let tempFilePath = '';
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded or invalid file type' });
    }
    
    // Verify file exists and has content
    const stats = fs.statSync(req.file.path);
    if (stats.size === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Uploaded file is empty' });
    }

    // Determine tool name from filename (remove extension and special chars)
    const originalName = req.file.originalname.replace(/[^\w\d.-]/g, '_');
    const toolName = req.body.tool || path.parse(originalName).name.toLowerCase();
    
    // Create incoming directory if it doesn't exist
    const incomingDir = path.join(__dirname, '..', 'incoming');
    if (!fs.existsSync(incomingDir)) {
      fs.mkdirSync(incomingDir, { recursive: true });
    }
    
    // Construct the base target path with original filename
    const originalFileName = req.file.originalname;
    const fileExtension = path.extname(originalFileName);
    const baseFileName = path.basename(originalFileName, fileExtension);
    
    let counter = 0;
    let targetFileName = originalFileName;
    let targetPath = path.join(incomingDir, targetFileName);
    
    let isDuplicate = false;
    // Check if the original file name already exists
    if (fs.existsSync(path.join(incomingDir, originalFileName))) {
      // If it exists, return an error and prevent upload
      fs.unlinkSync(req.file.path); // Delete the temporary uploaded file
      return res.status(409).json({ success: false, error: 'File already exists', fileName: originalFileName });
    }

    // If not a duplicate, save with the original name
    targetFileName = originalFileName;
    targetPath = path.join(incomingDir, targetFileName);
    
    // No need for counter logic here as exact duplicates are prevented
    // while (fs.existsSync(targetPath)) {
    //   counter++;
    //   targetFileName = `${baseFileName}_${counter}${fileExtension}`;
    //   targetPath = path.join(incomingDir, targetFileName);
    // }
    
    // Move the file to the incoming directory
    fs.renameSync(req.file.path, targetPath);
    tempFilePath = targetPath;
    
    console.log(`File saved to: ${targetPath}`);
    
    // Parse the uploaded file
    const parsedData = parser.parseLicenseFile(targetPath, toolName);
    
    res.json({ 
      success: true, 
      data: parsedData,
      tool: toolName,
      filePath: targetPath,
      // isDuplicate: isDuplicate, // Removed: Not relevant with new flow
      // targetFileName: targetFileName // Removed: Not relevant with new flow
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    // Clean up temp file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    } else if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process file',
      details: error.message 
    });
  }
});



// Routes

// Get all available tools
app.get('/api/tools', (req, res) => {
  try {
    const tools = parser.getAvailableTools();
    res.json({ success: true, tools });
  } catch (error) {
    console.error('Error getting tools:', error);
    res.status(500).json({ success: false, error: 'Failed to get tools' });
  }
});

// Get license data with optional tool filter
app.get('/api/licenses', (req, res) => {
  try {
    const { tool } = req.query;
    const data = parser.getLicenseDataByTool(tool);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting license data:', error);
    res.status(500).json({ success: false, error: 'Failed to get license data' });
  }
});



// Get license data for specific tool
app.get('/api/licenses/:tool', (req, res) => {
  try {
    const { tool } = req.params;
    const data = parser.getLicenseDataByTool(tool);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting license data for tool:', error);
    res.status(500).json({ success: false, error: 'Failed to get license data' });
  }
});

// Get all files for a specific tool
app.get('/api/files/:toolName', (req, res) => {
  const { toolName } = req.params;
  const incomingDir = path.join(__dirname, '..', 'incoming');

  try {
    if (!fs.existsSync(incomingDir)) {
      return res.status(404).json({ success: false, error: 'Incoming directory not found' });
    }

    const files = fs.readdirSync(incomingDir).filter(file =>
      file.toLowerCase().startsWith(toolName.toLowerCase())
    );

    res.json({ success: true, files });
  } catch (error) {
    console.error(`Error getting files for tool ${toolName}:`, error);
    res.status(500).json({ success: false, error: 'Failed to retrieve files', details: error.message });
  }
});

// Get detailed user information for a specific feature
app.get('/api/feature/:tool/:feature', (req, res) => {
  try {
    const { tool, feature } = req.params;
    const featureDetails = parser.getFeatureUserDetails(feature, tool);
    
    if (!featureDetails) {
      return res.status(404).json({ 
        success: false, 
        error: 'Feature not found' 
      });
    }
    
    res.json({ success: true, data: featureDetails });
  } catch (error) {
    console.error('Error getting feature details:', error);
    res.status(500).json({ success: false, error: 'Failed to get feature details' });
  }
});

// Check for file changes in incoming folder
app.get('/api/check-changes', (req, res) => {
  try {
    const hasChanges = parser.checkForFileChanges();
    res.json({ success: true, hasChanges });
  } catch (error) {
    console.error('Error checking for file changes:', error);
    res.status(500).json({ success: false, error: 'Failed to check for file changes' });
  }
});

// Endpoint to delete all files for a specific tool
app.delete('/api/tool/:toolName', (req, res) => {
  const { toolName } = req.params;
  const incomingDir = path.join(__dirname, '..', 'incoming');

  console.log(`[DELETE /api/tool/${toolName}] Attempting to delete files for tool: ${toolName}`);

  try {
    if (!fs.existsSync(incomingDir)) {
      console.warn(`[DELETE /api/tool/${toolName}] Incoming directory not found: ${incomingDir}`);
      return res.status(404).json({ success: false, error: 'Incoming directory not found' });
    }

    const filesInDir = fs.readdirSync(incomingDir);
    console.log(`[DELETE /api/tool/${toolName}] Files found in incoming directory:`, filesInDir);

    const filesToDelete = filesInDir.filter(file => {
      const baseFileName = path.basename(file, path.extname(file));
      const parsedToolName = baseFileName.replace(/_\d+$/, '').toLowerCase();
      const match = parsedToolName === toolName.toLowerCase() && file.endsWith('.txt');
      if (match) {
        console.log(`[DELETE /api/tool/${toolName}] Identified for deletion: ${file}`);
      }
      return match;
    });

    if (filesToDelete.length === 0) {
      console.log(`[DELETE /api/tool/${toolName}] No license files found for tool: ${toolName}`);
      return res.status(404).json({ success: false, error: `No license files found for tool: ${toolName}` });
    }

    console.log(`[DELETE /api/tool/${toolName}] Proceeding to delete ${filesToDelete.length} files.`);

    filesToDelete.forEach(file => {
      const filePath = path.join(incomingDir, file);
      fs.unlinkSync(filePath);
      console.log(`[DELETE /api/tool/${toolName}] Successfully deleted file: ${filePath}`);
    });

    // Trigger a refresh of the parser's file state after deletion
    parser.checkForFileChanges();
    console.log(`[DELETE /api/tool/${toolName}] parser.checkForFileChanges() called.`);

    res.json({ success: true, message: `Successfully deleted ${filesToDelete.length} files for tool: ${toolName}` });
  } catch (error) {
    console.error(`[DELETE /api/tool/${toolName}] Error deleting files for tool ${toolName}:`, error);
    res.status(500).json({ success: false, error: 'Failed to delete tool files', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EDA License Manager API is running' });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Press Ctrl+C to stop the server');
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  GET  /api/tools - Get available tools`);
  console.log(`  GET  /api/licenses?tool=<tool> - Get license data with optional tool filter`);
  console.log(`  GET  /api/licenses/<tool> - Get license data for specific tool`);
  console.log(`  GET  /api/check-changes - Check for file changes in incoming folder`);
  console.log(`  DELETE /api/tool/:toolName - Delete all license files for a specific tool`);
  console.log(`  DELETE /api/file/:fileName - Delete a specific license file by name`);
  console.log(`  GET  /api/files/:toolName - Get all license files for a specific tool`);
});

app.delete('/api/file/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '..', 'incoming', fileName);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: `File not found: ${fileName}` });
    }

    fs.unlinkSync(filePath);
    console.log(`Deleted specific file: ${filePath}`);

    // Trigger a refresh of the parser's file state after deletion
    parser.checkForFileChanges();

    res.json({ success: true, message: `Successfully deleted file: ${fileName}` });
  } catch (error) {
    console.error(`Error deleting file ${fileName}:`, error);
    res.status(500).json({ success: false, error: 'Failed to delete file', details: error.message });
  }
});
