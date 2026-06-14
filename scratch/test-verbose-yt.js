const { exec } = require('child_process');
const path = require('path');

const ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
const playlistUrl = 'https://music.youtube.com/playlist?list=OLAK5uy_mrf2r17MekZ63g51R-0h5L0_A16VfRgwk';

const cmd = `"${ytdlpPath}" --verbose --flat-playlist -J "${playlistUrl}"`;
console.log("Running command:", cmd);

exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    console.log("Error:", err ? err.message : "None");
    console.log("Stderr output:\n", stderr);
});
