const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
const videoId = 'JGwWNGJdvx8';
const youtubeUrl = `https://music.youtube.com/watch?v=${videoId}`;
const rawPath = path.join(__dirname, `raw_${Date.now()}.mp3`);
const trimmedPath = path.join(__dirname, `trimmed_${Date.now()}.mp3`);

const trimStart = '00:10'; // 10 seconds in
const trimEnd = '00:40'; // 40 seconds in (duration 30s)

console.log("Downloading audio using yt-dlp...");
const cmd1 = `"${ytdlpPath}" -x --audio-format mp3 --audio-quality 0 -o "${rawPath.replace(/\\/g, '/')}" "${youtubeUrl}"`;
console.log("Cmd:", cmd1);

exec(cmd1, (err, stdout, stderr) => {
    if (err) {
        console.error("yt-dlp failed:", err.message);
        console.error(stderr);
        return;
    }
    console.log("yt-dlp success. Output:", stdout);
    console.log("Checking if raw file exists:", fs.existsSync(rawPath));
    
    if (fs.existsSync(rawPath)) {
        console.log("Trimming audio using ffmpeg...");
        // ffmpeg -y -ss [start] -to [end] -i [input] -c copy [output]
        // Note: -to specifies the end position.
        // Wait, does -to work correctly? Yes. Or we can use -ss [start] -t [duration].
        // Let's compute duration if needed, or ffmpeg accepts -to.
        // Wait, for -to to work, it's best placed after -i or before -i.
        // Let's use: ffmpeg -y -i [input] -ss [start] -to [end] -c:a libmp3lame -q:a 2 [output]
        // (re-encoding ensures accurate seek/cut)
        const cmd2 = `ffmpeg -y -i "${rawPath.replace(/\\/g, '/')}" -ss ${trimStart} -to ${trimEnd} -c:a libmp3lame -q:a 2 "${trimmedPath.replace(/\\/g, '/')}"`;
        console.log("Cmd:", cmd2);
        
        exec(cmd2, (err2, stdout2, stderr2) => {
            if (err2) {
                console.error("ffmpeg failed:", err2.message);
                console.error(stderr2);
                return;
            }
            console.log("ffmpeg success!");
            console.log("Checking if trimmed file exists:", fs.existsSync(trimmedPath));
            
            // Cleanup raw
            fs.unlinkSync(rawPath);
            console.log("Cleaned up raw file.");
        });
    }
});
