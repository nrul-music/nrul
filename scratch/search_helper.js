const fs = require('fs');
const content = fs.readFileSync('C:/Users/ASUS/.gemini/antigravity/scratch/music-promo-web/admin.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('click') && (line.includes('modal') || line.includes('backdrop') || line.includes('active'))) {
        console.log(`Line ${idx+1}: ${line.trim()}`);
    }
});
