const http = require('http');

function testAlbumFetch() {
    // Apple Music Album: Billie Eilish - dont smile at me
    const appleAlbumUrl = 'https://music.apple.com/us/album/dont-smile-at-me/1440898929';
    const requestUrl = `http://localhost:3000/api/resolve-preview?metadataUrl=${encodeURIComponent(appleAlbumUrl)}&trimStart=00:00&trimEnd=00:30`;
    
    console.log(`[Test] Requesting Album autofill: ${requestUrl}`);
    const start = Date.now();
    
    http.get(requestUrl, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            const elapsed = ((Date.now() - start) / 1000).toFixed(2);
            console.log(`[Result] Status Code: ${res.statusCode} (took ${elapsed}s)`);
            try {
                const data = JSON.parse(body);
                console.log("Success:", data.success);
                if (data.success) {
                    console.log("Release Title:", data.title);
                    console.log("Artist:", data.artist);
                    console.log("Genre:", data.genre);
                    console.log("Release Date:", data.releaseDate);
                    console.log("Songs count:", data.songs ? data.songs.length : 0);
                    if (data.songs && data.songs.length > 0) {
                        console.log("First song details:");
                        console.log("  Title:", data.songs[0].title);
                        console.log("  Artist:", data.songs[0].artist);
                        console.log("  Preview URL:", JSON.stringify(data.songs[0].previewUrl));
                        console.log("  Trim Start:", data.songs[0].trimStart);
                        console.log("  Trim End:", data.songs[0].trimEnd);
                    }
                    console.log("Track-level previewUrl:", JSON.stringify(data.previewUrl));
                } else {
                    console.log("Error from API:", data.error);
                }
            } catch (e) {
                console.log("Error parsing JSON:", e.message);
                console.log("Body:", body);
            }
        });
    }).on('error', err => {
        console.error("HTTP error:", err.message);
    });
}

testAlbumFetch();
