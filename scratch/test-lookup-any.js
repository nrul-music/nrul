const https = require('https');

const trackId = '1488408568';
const url = `https://itunes.apple.com/lookup?id=${trackId}&entity=song`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log("Result count for track lookup with entity=song:", parsed.resultCount);
            if (parsed.results) {
                parsed.results.forEach((item, idx) => {
                    console.log(`[${idx}] Type: ${item.wrapperType}, Name: ${item.trackName || item.collectionName}, Artist: ${item.artistName}`);
                });
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    });
});
