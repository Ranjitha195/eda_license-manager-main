const fs = require('fs');
const path = require('path');

// Input and output paths
const inputFile = path.join(__dirname, 'incoming', 'synopsys');
const outputFile = path.join(__dirname, 'frontend', 'public', 'licenses.json');

function parseLicenseFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const features = [];
        let currentFeature = null;
        let version = '';
        let expiry = '';

        // First pass: Extract version and expiry
        for (const line of lines) {
            const versionMatch = line.match(/"([^"]+)"\s+v([\d.]+)/);
            if (versionMatch) version = versionMatch[2];
            
            const expiryMatch = line.match(/expiry:\s*([^\s,]+)/i);
            if (expiryMatch) expiry = expiryMatch[1];
        }

        // Second pass: Extract features
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Look for feature line
            const featureMatch = line.match(/Users of ([^:]+):\s*\(Total of (\d+) license[s]? issued;\s*Total of (\d+) license[s]? in use\)/i);
            
            if (featureMatch) {
                // Save previous feature
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
                    tool: 'synopsys',
                    users: []
                };
            }
        }
        
        // Add the last feature
        if (currentFeature) {
            features.push(currentFeature);
        }
        
        return features;
    } catch (error) {
        console.error('Error parsing license file:', error);
        return [];
    }
}

// Process the file
const features = parseLicenseFile(inputFile);

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Save the results
fs.writeFileSync(outputFile, JSON.stringify(features, null, 2));

console.log(`✅ Processed ${features.length} features`);
console.log(`📊 Data saved to: ${outputFile}`);
