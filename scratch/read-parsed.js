const fs = require('fs');
const path = require('path');

const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'spotify_album_parsed.json'), 'utf8'));
const entity = parsed.props?.pageProps?.state?.data?.entity;

if (entity) {
    console.log("Entity keys:", Object.keys(entity));
    if (entity.artists) console.log("Artists:", entity.artists);
    if (entity.subtitle) console.log("Subtitle:", entity.subtitle);
} else {
    console.log("Entity not found!");
}
