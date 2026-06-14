const https = require('https');

const albumId = '1499385336';
const albumUrl = `https://itunes.apple.com/lookup?id=${albumId}&entity=song`;

https.get(albumUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log("Album results size:", parsed.resultCount);
            parsed.results.slice(0, 10).forEach((item, idx) => {
                console.log(`[${idx}] Type: ${item.wrapperType}, Name: ${item.trackName || item.collectionName}, Artist: ${item.artistName}`);
            });
        } catch (e) {
            console.log("Error:", e.message);
        }
    });
});
