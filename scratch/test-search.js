const https = require('https');

const term = 'After Hours The Weeknd';
const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=5`;

https.get(searchUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log("Search results size:", parsed.resultCount);
            parsed.results.forEach((item, idx) => {
                console.log(`[${idx}] Collection ID: ${item.collectionId}, Name: ${item.collectionName}, Artist: ${item.artistName}`);
            });
            if (parsed.results[0]) {
                const collId = parsed.results[0].collectionId;
                const lookupUrl = `https://itunes.apple.com/lookup?id=${collId}&entity=song`;
                console.log("Looking up collection songs via:", lookupUrl);
                https.get(lookupUrl, (res2) => {
                    let data2 = '';
                    res2.on('data', chunk => data2 += chunk);
                    res2.on('end', () => {
                        const parsed2 = JSON.parse(data2);
                        console.log("Lookup result count:", parsed2.resultCount);
                        parsed2.results.slice(0, 5).forEach((song, idx2) => {
                            console.log(`  - [${idx2}] Type: ${song.wrapperType}, Title: ${song.trackName || song.collectionName}, Artist: ${song.artistName}`);
                        });
                    });
                });
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    });
});
