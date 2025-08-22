const fs = require('fs');
const path = require('path');

function listFiles(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            console.log(prefix + '📁 ' + file);
            listFiles(filePath, prefix + '  ');
        } else {
            console.log(prefix + '📄 ' + file + ` (${(stats.size / 1024).toFixed(2)} KB)`);
        }
    });
}

console.log('Project directory structure:');
listFiles(__dirname);
