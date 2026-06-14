const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
const playlistUrl = 'https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoRs7chjwtxJH';

const cmd = `"${ytdlpPath}" --flat-playlist -J "${playlistUrl}"`;
console.log("Running command:", cmd);

exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
        console.error("Failed to run yt-dlp:", err.message);
        return;
    }
    
    try {
        const parsed = JSON.parse(stdout);
        console.log("Playlist Title:", parsed.title);
        console.log("Playlist uploader:", parsed.uploader);
        console.log("Tracks Count:", parsed.entries ? parsed.entries.length : 0);
        if (parsed.entries && parsed.entries.length > 0) {
            console.log("Sample Entry 0:", JSON.stringify(parsed.entries[0], null, 2));
        }
    } catch (e) {
        console.error("Failed to parse output:", e.message);
    }
});
