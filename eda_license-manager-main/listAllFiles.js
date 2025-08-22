const fs = require('fs');
const path = require('path');

function listFiles(dir, prefix = '') {
    try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            try {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    console.log(prefix + '📁 ' + file + '/');
                    listFiles(filePath, prefix + '  ');
                } else {
                    console.log(prefix + '📄 ' + file + ` (${(stats.size / 1024).toFixed(2)} KB)`);
                }
            } catch (error) {
                console.error(prefix + '❌ Error accessing:', file, error.message);
            }
        });
    } catch (error) {
        console.error('Error reading directory:', dir, error.message);
    }
}

console.log('Project directory structure:');
listFiles(__dirname);
