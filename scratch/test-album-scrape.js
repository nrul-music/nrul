const https = require('https');
const fs = require('fs');
const path = require('path');

const albumUrl = 'https://open.spotify.com/embed/album/6g9uPPHtnxQLSUd6d9xK8n';

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    }
};

https.get(albumUrl, options, (res) => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const idx = data.indexOf('__NEXT_DATA__');
            if (idx === -1) {
                console.log('__NEXT_DATA__ not found');
                return;
            }
            const start = data.indexOf('>', idx) + 1;
            const end = data.indexOf('</script>', start);
            const jsonStr = data.substring(start, end);
            const parsed = JSON.parse(jsonStr);
            fs.writeFileSync(path.join(__dirname, 'spotify_album_parsed.json'), JSON.stringify(parsed, null, 2));
            console.log("Wrote parsed file.");
        } catch (e) {
            console.log("Error:", e.message);
        }
    });
}).on('error', (err) => {
    console.error("HTTP error:", err.message);
});
