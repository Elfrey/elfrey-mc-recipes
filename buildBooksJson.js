const fs = require('fs');
const path = require('path');

function scanDirectory(dir) {
    const bookIndex = {};
    
    function scan(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
                const folderName = entry.name;
                // Scan the directory for JSON files
                const folderEntries = fs.readdirSync(fullPath, { withFileTypes: true });
                const jsonFiles = folderEntries
                    .filter(file => file.isFile() && file.name.endsWith('.json'))
                    .map(file => path.join(folderName, file.name).replace('\\', '/'));
                
                if (jsonFiles.length > 0) {
                    bookIndex[folderName] = jsonFiles;
                }
            }
        }
    }
    
    scan(dir);
    return bookIndex;
}

function generateIndex() {
    try {
        const booksDir = path.join(__dirname, 'books');
        const index = scanDirectory(booksDir);
        
        fs.writeFileSync(
            path.join(booksDir, 'index.json'),
            JSON.stringify(index, null, 2)
        );
        console.log('Successfully generated index.json:');
        console.log(index);
    } catch (error) {
        console.error('Error generating index:', error);
    }
}

generateIndex(); 