const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = 'C:\\Users\\ASUS\\.gemini\\antigravity\\scratch\\music-promo-web';

console.log('Testing exec and execFile for ffmpeg and yt-dlp:');

// Test 1: exec global ffmpeg
exec('ffmpeg -version', (err, stdout, stderr) => {
    console.log('\n--- Exec ffmpeg -version ---');
    if (err) {
        console.log('Error:', err.message);
    } else {
        const match = stdout.match(/ffmpeg\s+version\s+([^\s,]+)/i);
        console.log('Success! Version:', match ? match[1] : 'Unknown');
    }
    
    // Test 2: exec local yt-dlp
    const localYtdlp = path.join(PUBLIC_DIR, 'yt-dlp.exe');
    console.log('\nLocal ytdlp exists:', fs.existsSync(localYtdlp));
    
    const ytdlpCmd = `"${localYtdlp}" --version`;
    exec(ytdlpCmd, (ytErr, ytStdout, ytStderr) => {
        console.log('\n--- Exec yt-dlp.exe --version ---');
        if (ytErr) {
            console.log('Error:', ytErr.message);
        } else {
            console.log('Success! Version:', ytStdout.trim());
        }
        
        // Test 3: execFile local yt-dlp
        execFile(localYtdlp, ['--version'], (fileErr, fileStdout) => {
            console.log('\n--- ExecFile yt-dlp.exe --version ---');
            if (fileErr) {
                console.log('Error:', fileErr.message);
            } else {
                console.log('Success! Version:', fileStdout.trim());
            }
        });
    });
});
