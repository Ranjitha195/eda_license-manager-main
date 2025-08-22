const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'incoming');
const outputFile = path.join(__dirname, 'frontend', 'public', 'licenses.json');

function processFile(filePath, toolName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const features = [];
    
    let currentFeature = null;
    let version = '';
    let expiry = '';

    // First pass: Find version and expiry
    for (const line of lines) {
      const versionMatch = line.match(/"([^"]+)"\s+v([\d.]+)/);
      if (versionMatch) version = versionMatch[2];
      
      const expiryMatch = line.match(/expiry:\s*([^\s,]+)/i);
      if (expiryMatch) expiry = expiryMatch[1];
    }

    // Second pass: Find features
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for feature line
      const featureMatch = line.match(/Users of ([^:]+):\s*\(Total of (\d+) license[s]? issued;\s*Total of (\d+) license[s]? in use\)/i);
      
      if (featureMatch) {
        // Save previous feature if exists
        if (currentFeature) {
          features.push(currentFeature);
        }
        
        // Create new feature
        currentFeature = {
          feature: featureMatch[1].trim(),
          totalLicenses: parseInt(featureMatch[2]),
          inUse: parseInt(featureMatch[3]),
          available: parseInt(featureMatch[2]) - parseInt(featureMatch[3]),
          version: version,
          expiry: expiry,
          tool: toolName,
          users: [],
          sourceFile: path.basename(filePath)
        };
      }
    }
    
    // Add the last feature
    if (currentFeature) {
      features.push(currentFeature);
    }
    
    return features;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return [];
  }
}

function processAllFiles() {
  try {
    const files = fs.readdirSync(inputDir);
    let allFeatures = [];
    const tools = new Set();
    
    for (const file of files) {
      const filePath = path.join(inputDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && (file.endsWith('.txt') || file.includes('.'))) {
        console.log(`Processing ${file}...`);
        const toolName = path.basename(file, path.extname(file));
        const features = processFile(filePath, toolName);
        
        if (features.length > 0) {
          allFeatures = [...allFeatures, ...features];
          tools.add(toolName);
          console.log(`  Found ${features.length} features`);
        }
      }
    }
    
    // Save the results
    if (allFeatures.length > 0) {
      // Ensure directory exists
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputFile, JSON.stringify(allFeatures, null, 2));
      console.log(`\n✅ Processed ${allFeatures.length} features from ${tools.size} tools`);
      console.log(`📊 Data saved to: ${outputFile}`);
      console.log(`🛠️  Tools found: ${Array.from(tools).join(', ')}`);
    } else {
      console.log('No features found in any files');
    }
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

// Run the script
processAllFiles();
