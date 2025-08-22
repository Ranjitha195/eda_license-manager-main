const fs = require('fs');
const path = require('path');

class LicenseParser {
  constructor() {
    this.incomingDir = path.join(__dirname, '..', 'incoming');
    this.lastFileState = this.getCurrentFileState();
  }

  // Parse license file and extract relevant data
  parseLicenseFile(filepath, toolName) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.split('\n');
      const features = [];

      let currentFeature = null;
      let inUserSection = false;
      let users = [];
      let userDetails = [];
      let version = '';
      let expiry = '';
      let featureName = '';

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const originalLine = lines[i]; // Keep original line for user parsing

        // Check for feature usage pattern
        const featureMatch = line.match(/Users of ([^:]+):\s*\(Total of (\d+) licenses issued;\s*Total of (\d+) licenses in use\)/i);
        if (featureMatch) {
          // Save previous feature if exists
          if (currentFeature) {
            currentFeature.users = users;
            currentFeature.userDetails = userDetails;
            features.push(currentFeature);
          }

          // Start new feature
          featureName = featureMatch[1].trim();
          currentFeature = {
            feature: featureName,
            totalLicenses: parseInt(featureMatch[2]),
            inUse: parseInt(featureMatch[3]),
            available: parseInt(featureMatch[2]) - parseInt(featureMatch[3]),
            version: '',
            expiry: '',
            tool: toolName,
            users: [],
            userDetails: [],
            sourceFile: path.basename(filepath),
            processId: null, // Initialize processId
            startDate: null // Initialize startDate
          };
          
          // Reset for new feature
          users = [];
          userDetails = [];
          inUserSection = true;
          version = '';
          expiry = '';
          continue;
        }

        // Check for version and expiry in the next line after feature
        if (currentFeature && !currentFeature.version) {
          const versionExpiryMatch = line.match(/"[^"]+" v([\d.]+), vendor: [^,]+,\s*expiry:\s*([^\s,]+)/i);
          if (versionExpiryMatch) {
            currentFeature.version = versionExpiryMatch[1];
            currentFeature.expiry = versionExpiryMatch[2];
            continue;
          }
        }

        // Check for Process ID and Start Date
        if (currentFeature) {
          // Make regex more flexible for PID, looking for variations like "PID:", "Process ID:", or just "PID "
          const processIdMatch = line.match(/(?:PID|Process ID|Port)\s*[:=]?\s*(\d+)/i);
          if (processIdMatch) {
            currentFeature.processId = processIdMatch[1];
            console.log(`  [Parser] Found Process ID: ${currentFeature.processId} in line: "${line}"`);
          }

          // Make regex more flexible for ISSUED date, handling different separators or less strict formats
          // This regex tries to capture DD-MMM-YYYY, DD/MMM/YYYY, or MMM DD YYYY. Added more common date variations.
          const startDateMatch = line.match(/(?:ISSUED|Start Date|Started)\s*[:=]?\s*(\d{1,2}[\/\-][a-zA-Z]{3}[\/\-]\d{4}|[a-zA-Z]{3}\s+\d{1,2}\s+\d{4}|[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2})/i);
          if (startDateMatch) {
            currentFeature.startDate = startDateMatch[1];
            console.log(`  [Parser] Found Start Date: ${currentFeature.startDate} in line: "${line}"`);
          }
        }

        // Process user information
        if (currentFeature && inUserSection) {
          // Skip empty lines or section markers
          if (line === '' || line === 'floating license' || line.startsWith('vendor_string:')) {
            continue;
          }

          // Check for user information line
          // Enhanced userMatch to capture processId and startTime more robustly, and handle hostnames with dots or colons
          const userMatch = originalLine.match(/^\s*([^\s]+)\s+((?:[^\s:]+\s+)*[^\s:]+)(?:\s*:(\d+))?\s*\(v([\d.]+)\)\s*\(([^)]+)\),\s*start\s+([A-Za-z]{3}\s+\d{1,2}\/\d{1,2}\s+\d{2}:\d{2})/);
          if (userMatch) {
            const username = userMatch[1];
            let host = userMatch[2];
            let port = userMatch[3] || '';
            
            // Handle cases like "hostname:port" that might not be captured by the main regex due to spaces
            if (!port && host.includes(':')) {
              const hostParts = host.split(':');
              host = hostParts[0];
              port = hostParts[1];
            }

            // Further refine host if it contains multiple parts or domain names
            const hostComponents = host.split(/\s+/); // Split by spaces
            if (hostComponents.length > 1) {
              // Take the last part which usually is the most specific hostname or FQDN
              host = hostComponents[hostComponents.length - 1];
            }
            // Clean up any remaining non-hostname characters if necessary (e.g. trailing numbers after split)
            host = host.replace(/\d+_\d+$/, '').trim();

            // Extract additional details if available
            const version = userMatch[4] || '';
            const details = userMatch[5] || '';
            const userStartTime = userMatch[6] || null; // Capture potential user-specific start time

            // Extract Process ID from the details string (e.g., "yamuna/5280 6701")
            const pidInDetailsMatch = details.match(/\s+(\d+)$/);
            const userProcessId = pidInDetailsMatch ? pidInDetailsMatch[1] : null; // Capture Process ID

            // Add to users if not already present
            if (!users.includes(username)) {
              users.push(username);
            }

            // Add to user details
            userDetails.push({
              username,
              host: host.trim(), // Trim host in case of leading/trailing spaces
              port,
              version,
              details,
              timestamp: new Date().toISOString(),
              processId: userProcessId || currentFeature.processId || 'N/A', // Prioritize user-specific, then feature-level, then N/A
              startDate: userStartTime || currentFeature.startDate || 'N/A' // Prioritize user-specific, then feature-level, then N/A
            });
          }
        }

        // End of section - look for next feature
        if (line.startsWith('Users of ') && currentFeature) {
          inUserSection = false;
        }
      }

      // Save the last feature if exists
      if (currentFeature) {
        currentFeature.users = [...new Set(users)]; // Remove duplicates
        currentFeature.userDetails = userDetails;
        features.push(currentFeature);
      }

      // Log parsed features for debugging
      console.log(`Parsed ${features.length} features from ${path.basename(filepath)}`);
      if (features.length > 0) {
        console.log('Sample feature:', {
          feature: features[0].feature,
          totalLicenses: features[0].totalLicenses,
          inUse: features[0].inUse,
          version: features[0].version,
          expiry: features[0].expiry,
          processId: features[0].processId, // Include in log
          startDate: features[0].startDate,   // Include in log
          users: features[0].users.length,
          userDetails: features[0].userDetails.length,
          sampleUserDetail: features[0].userDetails[0] ? { // Sample user detail to check processId/startDate
            username: features[0].userDetails[0].username,
            processId: features[0].userDetails[0].processId,
            startDate: features[0].userDetails[0].startDate,
            timestamp: features[0].userDetails[0].timestamp
          } : 'N/A'
        });
      }

      return features;
    } catch (error) {
      console.error(`Error parsing file ${filepath}:`, error);
      return [];
    }
  }

  // Get all license data from incoming folder
  getAllLicenseData() {
    const allData = [];
    
    try {
      console.log(`Reading license data from: ${this.incomingDir}`);
      
      // Ensure incoming directory exists
      if (!fs.existsSync(this.incomingDir)) {
        console.log(`Creating incoming directory: ${this.incomingDir}`);
        fs.mkdirSync(this.incomingDir, { recursive: true });
        console.log('Incoming directory created');
        return [];
      }
      
      const files = fs.readdirSync(this.incomingDir);
      console.log(`Found ${files.length} files in incoming directory`);
      
      if (files.length === 0) {
        console.log('No files found in incoming directory');
        return [];
      }
      
      for (const file of files) {
        try {
          const filepath = path.join(this.incomingDir, file);
          const stats = fs.statSync(filepath);
          
          // Skip directories and hidden files
          if (stats.isDirectory() || file.startsWith('.')) {
            console.log(`Skipping directory/hidden file: ${file}`);
            continue;
          }
          
          // Extract base tool name from filename (remove numbers and extension)
          const baseFileName = path.basename(file, path.extname(file));
          const toolName = baseFileName.replace(/_\d+$/, '').toLowerCase();
          
          console.log(`\nProcessing file: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
          console.log(`Processing as tool: ${toolName}`);
          
          // Parse the license file
          const features = this.parseLicenseFile(filepath, toolName);
          
          if (features && features.length > 0) {
            console.log(`Found ${features.length} features in ${file}`);
            // Log first 2 features as sample
            features.slice(0, 2).forEach((feature, idx) => {
              console.log(`  Feature ${idx + 1}: ${feature.feature} (PID: ${feature.processId || 'N/A'}, Start: ${feature.startDate || 'N/A'}, ${feature.inUse}/${feature.totalLicenses} in use)`);
            });
            if (features.length > 2) {
              console.log(`  ... and ${features.length - 2} more features`);
            }
            allData.push(...features);
          } else {
            console.log(`No valid features found in ${file}`);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file}:`, fileError.message);
          // Continue with next file
        }
      }
      
    } catch (error) {
      console.error('Error reading incoming directory:', error);
    }

    console.log(`\nTotal features found across all files: ${allData.length}`);
    if (allData.length > 0) {
      console.log('First feature sample:', {
        feature: allData[0]?.feature,
        tool: allData[0]?.tool,
        version: allData[0]?.version,
        expiry: allData[0]?.expiry,
        processId: allData[0]?.processId,
        startDate: allData[0]?.startDate,
        users: allData[0]?.users?.length || 0,
        sampleUserDetail: allData[0]?.userDetails[0] ? {
          username: allData[0].userDetails[0].username,
          processId: allData[0].userDetails[0].processId,
          startDate: allData[0].userDetails[0].startDate,
          timestamp: allData[0].userDetails[0].timestamp
        } : 'N/A'
      });
    }
    
    return allData;
  }

  // Get license data filtered by tool
  getLicenseDataByTool(toolName) {
    const allData = this.getAllLicenseData();
    if (!toolName || toolName === 'all') {
      return allData;
    }
    return allData.filter(item => item.tool.toLowerCase() === toolName.toLowerCase());
  }

  // Get detailed user information for a specific feature
  getFeatureUserDetails(featureName, toolName) {
    const allData = this.getAllLicenseData();
    const feature = allData.find(item => 
      item.feature === featureName && 
      item.tool.toLowerCase() === toolName.toLowerCase()
    );
    
    if (!feature) {
      return null;
    }

    // Count usage frequency for each user
    const userUsageCount = {};
    const userDetails = feature.userDetails || [];
    
    userDetails.forEach(detail => {
      if (userUsageCount[detail.username]) {
        userUsageCount[detail.username]++;
      } else {
        userUsageCount[detail.username] = 1;
      }
    });

    // Add usage count to each user detail
    const enhancedUserDetails = userDetails.map(detail => ({
      ...detail,
      usageCount: userUsageCount[detail.username]
    }));

    return {
      feature: feature.feature,
      tool: feature.tool,
      version: feature.version,
      expiry: feature.expiry,
      totalLicenses: feature.totalLicenses,
      inUse: feature.inUse,
      available: feature.available,
      processId: feature.processId, // Include processId at feature level
      startDate: feature.startDate,   // Include startDate at feature level
      userDetails: enhancedUserDetails,
      userUsageCount: userUsageCount
    };
  }

  // Get available tools
  getAvailableTools() {
    try {
      const files = fs.readdirSync(this.incomingDir);
      return [...new Set(files.filter(file => {
        const filepath = path.join(this.incomingDir, file);
        return fs.statSync(filepath).isFile();
      }).map(file => {
        const baseFileName = path.basename(file, path.extname(file));
        return baseFileName.replace(/_\d+$/, '').toLowerCase();
      }))];
    } catch (error) {
      console.error('Error reading incoming directory:', error);
      return [];
    }
  }

  // Get current file state (file names and modification times)
  getCurrentFileState() {
    try {
      const files = fs.readdirSync(this.incomingDir);
      const fileState = {};
      
      for (const file of files) {
        const filepath = path.join(this.incomingDir, file);
        const stats = fs.statSync(filepath);
        if (stats.isFile()) {
          fileState[file] = {
            mtime: stats.mtime.getTime(),
            size: stats.size
          };
        }
      }
      
      return fileState;
    } catch (error) {
      console.error('Error reading file state:', error);
      return {};
    }
  }

  // Check for file changes in incoming folder
  checkForFileChanges() {
    try {
      const currentState = this.getCurrentFileState();
      const hasChanges = this.hasFileStateChanged(currentState);
      
      if (hasChanges) {
        this.lastFileState = currentState;
        console.log('File changes detected in incoming folder');
      }
      
      return hasChanges;
    } catch (error) {
      console.error('Error checking for file changes:', error);
      return false;
    }
  }

  // Compare current file state with last known state
  hasFileStateChanged(currentState) {
    const currentFiles = Object.keys(currentState);
    const lastFiles = Object.keys(this.lastFileState);

    // Check if number of files changed
    if (currentFiles.length !== lastFiles.length) {
      return true;
    }

    // Check if any files were added, removed, or modified
    for (const file of currentFiles) {
      if (!this.lastFileState[file]) {
        // New file added
        return true;
      }
      
      const currentFile = currentState[file];
      const lastFile = this.lastFileState[file];
      
      if (currentFile.mtime !== lastFile.mtime || currentFile.size !== lastFile.size) {
        // File was modified
        return true;
      }
    }

    // Check if any files were removed
    for (const file of lastFiles) {
      if (!currentState[file]) {
        // File was removed
        return true;
      }
    }

    return false;
  }
}

module.exports = LicenseParser;
