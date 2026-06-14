const http = require('http');
const fs = require('fs');
const path = require('path');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data.substring(0, 100)}`));
                }
            });
        }).on('error', err => reject(err));
    });
}

async function runTests() {
    console.log("=== STARTING VERIFICATION TESTS ===\n");
    const publicDir = path.join(__dirname, '..');

    // Test 1: Spotify Track Resolution & Local Download
    try {
        console.log("Test 1: Resolving Spotify Track '3JNgpaqUdpozbCnbPOMqPQ'...");
        const res = await makeRequest('http://localhost:3000/api/resolve-preview?spotifyId=3JNgpaqUdpozbCnbPOMqPQ');
        console.log("Response:", JSON.stringify(res, null, 2));
        
        if (res.success && res.cover && res.previewUrl) {
            const coverExists = fs.existsSync(path.join(publicDir, res.cover));
            const previewExists = fs.existsSync(path.join(publicDir, res.previewUrl));
            console.log(`[Success] Files saved locally! Cover exists: ${coverExists}, Preview exists: ${previewExists}`);
        } else {
            console.error("[Fail] Cover or previewUrl is missing from response");
        }
    } catch (e) {
        console.error("Test 1 error:", e.message);
    }
    console.log("\n-----------------------------------\n");

    // Test 2: Spotify Album Resolution
    try {
        console.log("Test 2: Resolving Spotify Album '6g9uPPHtnxQLSUd6d9xK8n'...");
        const res = await makeRequest('http://localhost:3000/api/resolve-preview?spotifyAlbumId=6g9uPPHtnxQLSUd6d9xK8n');
        console.log("Response (without songs list):", {
            success: res.success,
            title: res.title,
            artist: res.artist,
            genre: res.genre,
            cover: res.cover,
            releaseDate: res.releaseDate,
            songsCount: res.songs ? res.songs.length : 0
        });
        
        if (res.success && res.cover && res.songs && res.songs.length > 0) {
            const coverExists = fs.existsSync(path.join(publicDir, res.cover));
            console.log(`[Success] Spotify Album cover exists: ${coverExists}. Sample track:`, res.songs[0]);
        } else {
            console.error("[Fail] Cover or songs array is invalid");
        }
    } catch (e) {
        console.error("Test 2 error:", e.message);
    }
    console.log("\n-----------------------------------\n");

    // Test 3: Apple Music Album Resolution
    try {
        console.log("Test 3: Resolving Apple Music Album '1499385848'...");
        const res = await makeRequest('http://localhost:3000/api/resolve-preview?appleAlbumId=1499385848');
        console.log("Response (without songs list):", {
            success: res.success,
            title: res.title,
            artist: res.artist,
            genre: res.genre,
            cover: res.cover,
            releaseDate: res.releaseDate,
            songsCount: res.songs ? res.songs.length : 0
        });
        
        if (res.success && res.cover && res.songs && res.songs.length > 0) {
            const coverExists = fs.existsSync(path.join(publicDir, res.cover));
            console.log(`[Success] Apple Music Album cover exists: ${coverExists}. Sample track:`, res.songs[0]);
        } else {
            console.error("[Fail] Cover or songs array is invalid");
        }
    } catch (e) {
        console.error("Test 3 error:", e.message);
    }
    console.log("\n-----------------------------------\n");

    // Test 4: YouTube Music Trim & Download
    try {
        console.log("Test 4: Resolving YouTube Music Track with Trim (Start: 00:15, End: 00:45)...");
        const start = Date.now();
        const res = await makeRequest('http://localhost:3000/api/resolve-preview?youtubeId=JGwWNGJdvx8&trimStart=00:15&trimEnd=00:45');
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`Response (received in ${duration}s):`, JSON.stringify(res, null, 2));
        
        if (res.success && res.cover && res.previewUrl) {
            const coverExists = fs.existsSync(path.join(publicDir, res.cover));
            const previewExists = fs.existsSync(path.join(publicDir, res.previewUrl));
            console.log(`[Success] Files saved locally! Cover exists: ${coverExists}, Trimmed preview exists: ${previewExists}`);
        } else {
            console.error("[Fail] Cover or previewUrl is missing from response");
        }
    } catch (e) {
        console.error("Test 4 error:", e.message);
    }
    console.log("\n=== VERIFICATION TESTS COMPLETED ===");
}

runTests();
