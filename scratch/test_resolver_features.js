const http = require('http');

function testEndpoint(url, name) {
    console.log(`\n=========================================\n[Test] ${name}: requesting ${url}`);
    http.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log(`[Result] ${name} - Status Code: ${res.statusCode}`);
            try {
                const parsed = JSON.parse(body);
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log("Body length:", body.length);
                console.log("Raw output:", body.substring(0, 500));
            }
            console.log("=========================================");
        });
    }).on('error', err => {
        console.error(`[Error] ${name}:`, err.message);
    });
}

// 1. Test Single Track search cut query ("Cut" button simulation)
const query = 'Ed Sheeran - Shape of You';
testEndpoint(`http://localhost:3000/api/resolve-preview?youtubeSearchQuery=${encodeURIComponent(query)}&trimStart=00:00&trimEnd=00:03`, 'Cut Action Global Search');

// 2. Test Spotify Track global search fallback (No YouTube URL supplied)
const spotifyTrack = 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3';
testEndpoint(`http://localhost:3000/api/resolve-preview?metadataUrl=${encodeURIComponent(spotifyTrack)}&trimStart=00:00&trimEnd=00:03`, 'Spotify Track Search Fallback');

// 3. Test youtube.com Video URL parsing
const standardYtUrl = 'https://www.youtube.com/watch?v=JGwWNGJdvx8';
const spotifyTrack2 = 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3';
testEndpoint(`http://localhost:3000/api/resolve-preview?metadataUrl=${encodeURIComponent(spotifyTrack2)}&youtubeUrl=${encodeURIComponent(standardYtUrl)}&trimStart=00:00&trimEnd=00:03`, 'Standard youtube.com URL Parsing');
