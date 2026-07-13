const fs = require('fs');

const adminJs = 'C:/Users/ASUS/.gemini/antigravity/scratch/music-promo-web/admin.js';
const content = fs.readFileSync(adminJs, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('video-track-title') || line.includes('video-track-artist')) {
        console.log(`Line ${idx+1}: ${line.trim()}`);
    }
});
