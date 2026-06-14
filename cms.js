// Aura: Resonance Native Local CMS & Compiler Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const DATA_FILE = path.join(PUBLIC_DIR, 'site_data.json');
const INDEX_TEMPLATE = path.join(PUBLIC_DIR, 'index.template.html');
const ZENITH_TEMPLATE = path.join(PUBLIC_DIR, 'zenith.template.html');
const BLOG_TEMPLATE = path.join(PUBLIC_DIR, 'blog.template.html');
const POST_TEMPLATE = path.join(PUBLIC_DIR, 'post.template.html');


// --- Helper: Get Content Type ---
function getContentType(filePath) {
    const extname = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg',
        '.ico': 'image/x-icon'
    };
    return contentTypeMap[extname] || 'application/octet-stream';
}

// --- Helper: Read request JSON body ---
function readJSONBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(err);
            }
        });
    });
}

// --- Compiler Engine: Re-generate static files ---
function compileSite() {
    console.log('Compiling static files...');
    if (!fs.existsSync(DATA_FILE)) {
        console.error('Data file not found!');
        return false;
    }
    
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(rawData);
        
        const activeTheme = data.selectedTheme || 'resonance';
        const defaultThemeMode = data.defaultThemeMode || 'dark';
        
        const bodyClass = activeTheme === 'zenith' ? 'zenith-theme' : '';
        let navLinks = '';
        let footerMarkup = '';
        
        if (activeTheme === 'zenith') {
            navLinks = `
                <a href="/index.html" class="nav-link">Releases</a>
                <a href="/blog.html" class="nav-link active-nav">Journal</a>
            `;
            footerMarkup = `
                <footer class="footer gallery-footer" style="padding: 40px 24px 20px; border-top: 1px solid var(--glass-border); background: var(--bg-darker); margin-top: 60px;">
                    <div class="footer-bottom" style="display: flex; justify-content: space-between; align-items: center; max-width: var(--container-width); margin: 0 auto; flex-wrap: wrap; gap: 16px;">
                        <p style="color: var(--color-text-muted); font-size: 0.85rem; margin: 0;">{{footerCopyright}}</p>
                        <p class="footer-desc" style="color: var(--color-text-muted); font-size: 0.85rem; margin: 0;">{{footerDescription}}</p>
                    </div>
                </footer>
            `;
        } else {
            navLinks = `
                <a href="/index.html#about" class="nav-link">Concept</a>
                <a href="/index.html#player-section" class="nav-link">Listen</a>
                <a href="/index.html#tracklist" class="nav-link">Tracks</a>
                <a href="/blog.html" class="nav-link active-nav">Journal</a>
                <a href="/index.html#subscribe" class="nav-link">Stay Tuned</a>
            `;
            footerMarkup = `
                <footer class="footer">
                    <div class="footer-top">
                        <div class="footer-brand">
                            <a href="/index.html" class="logo" style="text-decoration: none;">
                                <span class="logo-dot"></span>
                                <span class="logo-text">{{logoText}}</span>
                            </a>
                            <p class="footer-desc">{{footerDescription}}</p>
                        </div>
                        <div class="footer-links-wrap">
                            <div class="footer-group">
                                <h4>Navigation</h4>
                                <a href="/index.html#about">Concept</a>
                                <a href="/index.html#player-section">Listen</a>
                                <a href="/index.html#tracklist">Tracklist</a>
                                <a href="/blog.html">Journal</a>
                            </div>
                            <div class="footer-group">
                                <h4>GitHub Pages</h4>
                                <a href="https://pages.github.com/" target="_blank" rel="noopener">Hosting Details</a>
                                <a href="https://github.com" target="_blank" rel="noopener">Fork Repository</a>
                                <a href="/index.html#hero">Documentation</a>
                            </div>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>{{footerCopyright}}</p>
                        <div class="socials">
                            <a href="#" aria-label="Twitter">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                            </a>
                            <a href="#" aria-label="YouTube">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                            </a>
                            <a href="#" aria-label="GitHub">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            </a>
                        </div>
                    </div>
                </footer>
            `;
        }
        
        let templatePath = INDEX_TEMPLATE;
        
        if (activeTheme === 'zenith') {
            if (fs.existsSync(ZENITH_TEMPLATE)) {
                templatePath = ZENITH_TEMPLATE;
            } else {
                console.warn('Zenith template not found, falling back to index.template.html');
            }
        }
        
        if (!fs.existsSync(templatePath)) {
            console.error('Active template file not found!');
            return false;
        }
        
        // 1. Compile Main index.html
        let indexHtml = fs.readFileSync(templatePath, 'utf8');
        
        // Replace Branding & General Settings
        indexHtml = indexHtml.replace(/{{logoText}}/g, data.branding.logoText);
        indexHtml = indexHtml.replace(/{{spotifyLink}}/g, data.branding.spotifyLink || 'https://open.spotify.com');
        indexHtml = indexHtml.replace(/{{youtubeLink}}/g, data.branding.youtubeLink || 'https://youtube.com');
        indexHtml = indexHtml.replace(/{{appleLink}}/g, data.branding.appleLink || 'https://music.apple.com');
        indexHtml = indexHtml.replace(/{{defaultThemeMode}}/g, defaultThemeMode);
        
        // Replace Hero settings
        indexHtml = indexHtml.replace(/{{heroTagline}}/g, data.hero.tagline);
        indexHtml = indexHtml.replace(/{{heroTitlePart1}}/g, data.hero.titlePart1);
        indexHtml = indexHtml.replace(/{{heroTitleGradient}}/g, data.hero.titleGradient);
        indexHtml = indexHtml.replace(/{{heroDescription}}/g, data.hero.description);
        indexHtml = indexHtml.replace(/{{heroCtaPrimaryText}}/g, data.hero.ctaPrimaryText);
        indexHtml = indexHtml.replace(/{{heroCtaPrimaryLink}}/g, data.hero.ctaPrimaryLink);
        indexHtml = indexHtml.replace(/{{heroCtaSecondaryText}}/g, data.hero.ctaSecondaryText);
        indexHtml = indexHtml.replace(/{{heroCtaSecondaryLink}}/g, data.hero.ctaSecondaryLink);
        
        // Set Default Player details (first track)
        const defaultTrack = data.tracks[0] || {
            title: "No Tracks", artist: "Unknown", cover: "/assets/lofi_chill.png",
            genre: "NONE", badgeClass: "badge-lofi"
        };
        indexHtml = indexHtml.replace(/{{defaultTitle}}/g, defaultTrack.title);
        indexHtml = indexHtml.replace(/{{defaultArtist}}/g, defaultTrack.artist);
        indexHtml = indexHtml.replace(/{{defaultCover}}/g, defaultTrack.cover.startsWith('/') ? defaultTrack.cover : '/' + defaultTrack.cover);
        indexHtml = indexHtml.replace(/{{defaultGenre}}/g, defaultTrack.genre);
        indexHtml = indexHtml.replace(/{{defaultBadgeClass}}/g, defaultTrack.badgeClass);
        indexHtml = indexHtml.replace(/{{defaultCategory}}/g, defaultTrack.category || 'Single');
        
        let defaultSongsHtml = '';
        if (defaultTrack.songs && Array.isArray(defaultTrack.songs)) {
            defaultTrack.songs.forEach((song, idx) => {
                defaultSongsHtml += `
                    <div class="song-item${idx === 0 ? ' song-item-active' : ''}" data-song-idx="${idx}" style="cursor:pointer;">
                        <span><span class="song-item-number">${String(idx + 1).padStart(2, '0')}</span><span class="song-item-title">${song.title}</span></span>
                        <span class="song-item-artist">${song.artist}</span>
                    </div>`;
            });
        }
        indexHtml = indexHtml.replace('<!-- DEFAULT_SONGS_PLACEHOLDER -->', defaultSongsHtml);
        
        // Compile Track Cards grid
        let trackCardsHtml = '';
        data.tracks.forEach((track, index) => {
            const absoluteCover = track.cover.startsWith('/') ? track.cover : '/' + track.cover;
            trackCardsHtml += `
                <div class="track-card glass-card ${index === 0 ? 'active-track' : ''}" data-index="${index}" id="track-${index}">
                    <div class="track-card-art">
                        <img src="${absoluteCover}" alt="${track.title} Cover">
                        <div class="track-card-hover">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg>
                        </div>
                    </div>
                    <div class="track-card-body">
                        <div class="track-card-meta">
                            <span class="track-num">${String(index + 1).padStart(2, '0')}</span>
                            <span class="track-badge ${track.badgeClass}">${track.genre}</span>
                        </div>
                        <h4 class="track-card-title">${track.title}</h4>
                        <p class="track-card-desc">${track.artist}</p>
                    </div>
                </div>`;
        });
        indexHtml = indexHtml.replace('<!-- TRACK_CARDS_PLACEHOLDER -->', trackCardsHtml);
        
        // Compile Blog Cards feed
        let blogFeedHtml = '';
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach((post) => {
                const absolutePostCover = post.cover.startsWith('/') ? post.cover : '/' + post.cover;
                blogFeedHtml += `
                    <article class="blog-card glass-card" onclick="if(window.navigateToPage){window.navigateToPage('/posts/${post.id}.html');}else{window.location.href='/posts/${post.id}.html';}">
                        <div class="blog-card-art">
                            <img src="${absolutePostCover}" alt="${post.title} Cover">
                        </div>
                        <div class="blog-card-body">
                            <div class="blog-card-meta">
                                <span class="blog-card-date">${post.date}</span>
                                <span class="blog-card-author">By Aura Team</span>
                            </div>
                            <h4 class="blog-card-title">${post.title}</h4>
                            <p class="blog-card-excerpt">${post.excerpt}</p>
                            <span class="blog-card-link">Read Article &rarr;</span>
                        </div>
                    </article>`;
            });
        } else {
            blogFeedHtml = '<p class="text-center var-muted" style="grid-column: 1/-1;">No journal articles published yet.</p>';
        }
        indexHtml = indexHtml.replace('<!-- BLOG_POSTS_PLACEHOLDER -->', blogFeedHtml);
        
        // Compile Feature Grid Cards
        let featuresHtml = '';
        data.about.features.forEach((feature) => {
            featuresHtml += `
                <div class="feature-card glass-card">
                    <div class="feature-icon">
                        ${feature.icon}
                    </div>
                    <h3>${feature.title}</h3>
                    <p>${feature.description}</p>
                </div>`;
        });
        indexHtml = indexHtml.replace('<!-- FEATURES_PLACEHOLDER -->', featuresHtml);
        
        // Replace sections details
        indexHtml = indexHtml.replace(/{{aboutSubtitle}}/g, data.about.subtitle);
        indexHtml = indexHtml.replace(/{{aboutTitle}}/g, data.about.title);
        indexHtml = indexHtml.replace(/{{subscribeTitle}}/g, data.subscribe.title);
        indexHtml = indexHtml.replace(/{{subscribeDescription}}/g, data.subscribe.description);
        indexHtml = indexHtml.replace(/{{footerDescription}}/g, data.footer.description);
        indexHtml = indexHtml.replace(/{{footerCopyright}}/g, data.footer.copyright);
        
        // Inject Tracks JSON inside script
        indexHtml = indexHtml.replace('<!-- TRACKS_JSON_PLACEHOLDER -->', JSON.stringify(data.tracks));
        
        // Write compiled file
        fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml, 'utf8');
        
        // 2. Compile Standalone blog.html Journal Feed
        if (fs.existsSync(BLOG_TEMPLATE)) {
            let blogHtml = fs.readFileSync(BLOG_TEMPLATE, 'utf8');
            blogHtml = blogHtml.replace('<!-- BODY_CLASS_PLACEHOLDER -->', bodyClass);
            blogHtml = blogHtml.replace('<!-- NAV_LINKS_PLACEHOLDER -->', navLinks);
            blogHtml = blogHtml.replace('<!-- FOOTER_PLACEHOLDER -->', footerMarkup);
            
            blogHtml = blogHtml.replace(/{{logoText}}/g, data.branding.logoText);
            blogHtml = blogHtml.replace(/{{spotifyLink}}/g, data.branding.spotifyLink || 'https://open.spotify.com');
            blogHtml = blogHtml.replace(/{{youtubeLink}}/g, data.branding.youtubeLink || 'https://youtube.com');
            blogHtml = blogHtml.replace(/{{appleLink}}/g, data.branding.appleLink || 'https://music.apple.com');
            blogHtml = blogHtml.replace(/{{footerDescription}}/g, data.footer.description);
            blogHtml = blogHtml.replace(/{{footerCopyright}}/g, data.footer.copyright);
            blogHtml = blogHtml.replace(/{{defaultThemeMode}}/g, defaultThemeMode);
            blogHtml = blogHtml.replace('<!-- BLOG_POSTS_PLACEHOLDER -->', blogFeedHtml);
            
            // Resolve lightbox default track placeholders
            blogHtml = blogHtml.replace(/{{defaultTitle}}/g, defaultTrack.title);
            blogHtml = blogHtml.replace(/{{defaultArtist}}/g, defaultTrack.artist);
            blogHtml = blogHtml.replace(/{{defaultCover}}/g, defaultTrack.cover.startsWith('/') ? defaultTrack.cover : '/' + defaultTrack.cover);
            blogHtml = blogHtml.replace(/{{defaultGenre}}/g, defaultTrack.genre);
            blogHtml = blogHtml.replace(/{{defaultBadgeClass}}/g, defaultTrack.badgeClass);
            blogHtml = blogHtml.replace(/{{defaultCategory}}/g, defaultTrack.category || 'Single');
            blogHtml = blogHtml.replace('<!-- DEFAULT_SONGS_PLACEHOLDER -->', defaultSongsHtml);
            
            fs.writeFileSync(path.join(PUBLIC_DIR, 'blog.html'), blogHtml, 'utf8');
        }
        
        // 3. Compile Individual Blog Posts
        if (data.posts && data.posts.length > 0 && fs.existsSync(POST_TEMPLATE)) {
            const postsDir = path.join(PUBLIC_DIR, 'posts');
            if (!fs.existsSync(postsDir)) {
                fs.mkdirSync(postsDir, { recursive: true });
            }
            
            const postTemplateHtml = fs.readFileSync(POST_TEMPLATE, 'utf8');
            
            data.posts.forEach((post) => {
                let compiledPost = postTemplateHtml;
                
                // Replace nav, footer, body class placeholders for each post
                compiledPost = compiledPost.replace('<!-- BODY_CLASS_PLACEHOLDER -->', bodyClass);
                compiledPost = compiledPost.replace('<!-- NAV_LINKS_PLACEHOLDER -->', navLinks);
                compiledPost = compiledPost.replace('<!-- FOOTER_PLACEHOLDER -->', footerMarkup);
                
                compiledPost = compiledPost.replace(/{{logoText}}/g, data.branding.logoText);
                compiledPost = compiledPost.replace(/{{spotifyLink}}/g, data.branding.spotifyLink || 'https://open.spotify.com');
                compiledPost = compiledPost.replace(/{{youtubeLink}}/g, data.branding.youtubeLink || 'https://youtube.com');
                compiledPost = compiledPost.replace(/{{appleLink}}/g, data.branding.appleLink || 'https://music.apple.com');
                compiledPost = compiledPost.replace(/{{footerDescription}}/g, data.footer.description);
                compiledPost = compiledPost.replace(/{{footerCopyright}}/g, data.footer.copyright);
                compiledPost = compiledPost.replace(/{{defaultThemeMode}}/g, defaultThemeMode);
                
                // Resolve lightbox default track placeholders
                compiledPost = compiledPost.replace(/{{defaultTitle}}/g, defaultTrack.title);
                compiledPost = compiledPost.replace(/{{defaultArtist}}/g, defaultTrack.artist);
                compiledPost = compiledPost.replace(/{{defaultCover}}/g, defaultTrack.cover.startsWith('/') ? defaultTrack.cover : '/' + defaultTrack.cover);
                compiledPost = compiledPost.replace(/{{defaultGenre}}/g, defaultTrack.genre);
                compiledPost = compiledPost.replace(/{{defaultBadgeClass}}/g, defaultTrack.badgeClass);
                compiledPost = compiledPost.replace(/{{defaultCategory}}/g, defaultTrack.category || 'Single');
                compiledPost = compiledPost.replace('<!-- DEFAULT_SONGS_PLACEHOLDER -->', defaultSongsHtml);
                
                compiledPost = compiledPost.replace(/{{postTitle}}/g, post.title);
                compiledPost = compiledPost.replace(/{{postDate}}/g, post.date);
                // Fix: strip leading slash from postCover since template already has /
                const postCoverPath = post.cover.startsWith('/') ? post.cover.slice(1) : post.cover;
                compiledPost = compiledPost.replace(/{{postCover}}/g, postCoverPath);
                compiledPost = compiledPost.replace(/{{postExcerpt}}/g, post.excerpt);
                compiledPost = compiledPost.replace(/{{postContent}}/g, post.content);
                
                fs.writeFileSync(path.join(postsDir, `${post.id}.html`), compiledPost, 'utf8');
            });
        }
        
        console.log('Static site compiled successfully.');
        return true;
    } catch (err) {
        console.error('Compilation Error:', err);
        return false;
    }
}

// --- CMS Server Core Routing ---
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // --- API Endpoints ---
    
    // 1. GET /api/site-data
    if (pathname === '/api/site-data' && req.method === 'GET') {
        fs.readFile(DATA_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to read site data' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }
    
    // 2. POST /api/save-site
    if (pathname === '/api/save-site' && req.method === 'POST') {
        readJSONBody(req)
            .then(data => {
                fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4), 'utf8', err => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to write site data' }));
                        return;
                    }
                    // Trigger compilation of index.html and posts
                    const success = compileSite();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success, message: 'Settings saved and site compiled successfully' }));
                });
            })
            .catch(err => {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload', details: err.message }));
            });
        return;
    }
    
    // 3. POST /api/upload-cover
    if (pathname === '/api/upload-cover' && req.method === 'POST') {
        readJSONBody(req)
            .then(payload => {
                const { filename, data } = payload;
                if (!filename || !data) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Filename and base64 data required' }));
                    return;
                }
                
                // Clean Base64 format e.g. "data:image/png;base64,iVBORw0KGgo..."
                const base64Data = data.split(';base64,').pop();
                const buffer = Buffer.from(base64Data, 'base64');
                const savePath = path.join(PUBLIC_DIR, 'assets', filename);
                
                // Ensure assets directory exists
                const assetsDir = path.join(PUBLIC_DIR, 'assets');
                if (!fs.existsSync(assetsDir)) {
                    fs.mkdirSync(assetsDir, { recursive: true });
                }
                
                fs.writeFile(savePath, buffer, err => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to save uploaded cover art' }));
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, coverPath: `assets/${filename}` }));
                });
            })
            .catch(err => {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid upload request', details: err.message }));
            });
        return;
    }
    
    // 4. GET /api/git-status
    if (pathname === '/api/git-status' && req.method === 'GET') {
        exec('git status -s && git branch --show-current', (err, stdout, stderr) => {
            if (err) {
                // Git not initialized or failed
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ initialized: false, error: 'Git not initialized or not found in workspace' }));
                return;
            }
            const lines = stdout.trim().split('\n');
            const currentBranch = lines.pop() || 'main';
            const changes = lines.filter(line => line.trim() !== '');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                initialized: true,
                branch: currentBranch,
                modifiedFilesCount: changes.length,
                statusRaw: stdout
            }));
        });
        return;
    }
    
    // 5. POST /api/git-push
    if (pathname === '/api/git-push' && req.method === 'POST') {
        readJSONBody(req)
            .then(payload => {
                const commitMessage = payload.message || 'Updated website content via local CMS';
                
                // Get current branch first
                exec('git branch --show-current', (branchErr, branchStdout) => {
                    const branch = branchStdout.trim() || 'main';
                    
                    const gitCmd = `git add . && git commit -m "${commitMessage.replace(/"/g, '\\"')}" && git push origin ${branch}`;
                    console.log('Running deploy command:', gitCmd);
                    
                    exec(gitCmd, (err, stdout, stderr) => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: !err,
                            consoleOutput: stdout || stderr,
                            error: err ? err.message : null
                        }));
                    });
                });
            })
            .catch(err => {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid payload' }));
            });
        return;
    }
    
    // --- Static File Server ---
    
    // Default route points to index.html, /admin points to admin.html
    let filePath = '';
    if (pathname === '/' || pathname === '/index.html') {
        filePath = path.join(PUBLIC_DIR, 'index.html');
    } else if (pathname === '/admin' || pathname === '/admin/') {
        filePath = path.join(PUBLIC_DIR, 'admin.html');
    } else {
        filePath = path.join(PUBLIC_DIR, pathname);
    }
    
    // Security: Check that request is within our public directory
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File Not Found');
            return;
        }
        
        fs.readFile(filePath, (readErr, data) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': getContentType(filePath) });
            res.end(data);
        });
    });
});

// Run initial compile on startup so everything is generated properly
compileSite();

// Start Listening
server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  Aura Resonance Local CMS running!`);
    console.log(`  - Main Site:  http://localhost:${PORT}`);
    console.log(`  - Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`======================================================\n`);
});
