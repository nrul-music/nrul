const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const YTDLP_PATH = path.join(__dirname, '..', 'yt-dlp.exe');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        
        function get(targetUrl) {
            console.log("Downloading from:", targetUrl);
            https.get(targetUrl, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Follow redirect
                    get(res.headers.location);
                    return;
                }
                
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to download, status code: ${res.statusCode}`));
                    return;
                }
                
                res.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve());
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => reject(err));
            });
        }
        
        get(url);
    });
}

async function main() {
    if (fs.existsSync(YTDLP_PATH)) {
        console.log("yt-dlp.exe already exists at:", YTDLP_PATH);
    } else {
        console.log("Downloading yt-dlp.exe...");
        const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
        try {
            await downloadFile(downloadUrl, YTDLP_PATH);
            console.log("yt-dlp.exe downloaded successfully!");
        } catch (e) {
            console.error("Failed to download yt-dlp.exe:", e.message);
            return;
        }
    }
    
    // Test execution of yt-dlp
    exec(`"${YTDLP_PATH}" --version`, (err, stdout, stderr) => {
        if (err) {
            console.error("Error running yt-dlp:", err.message);
        } else {
            console.log("yt-dlp version:", stdout.trim());
        }
    });
}

main();
