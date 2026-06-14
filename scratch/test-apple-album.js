const https = require('https');
const fs = require('fs');
const path = require('path');

const albumId = '1488408555'; // After Hours by The Weeknd
const url = `https://itunes.apple.com/lookup?id=${albumId}&entity=song`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            fs.writeFileSync(path.join(__dirname, 'apple_album_parsed.json'), JSON.stringify(parsed, null, 2));
            console.log("Total results returned:", parsed.resultCount);
            if (parsed.results && parsed.results.length > 0) {
                console.log("Result 0 (wrapperType):", parsed.results[0].wrapperType, "/", parsed.results[0].collectionName, "by", parsed.results[0].artistName);
                if (parsed.results[1]) {
                    console.log("Result 1 (wrapperType):", parsed.results[1].wrapperType, "/", parsed.results[1].trackName, "by", parsed.results[1].artistName);
                }
            }
        } catch (e) {
            console.log("Error parsing JSON:", e.message);
        }
    });
}).on('error', (err) => {
    console.error("HTTP error:", err.message);
});
