// Aura Studio CMS Control Logic
let siteData = {};
let currentTab = 'general';

// Temporary memory for uploads
let pendingTrackCover = null;
let pendingPostCover = null;

// --- Initialize CMS ---
document.addEventListener("DOMContentLoaded", () => {
    fetchSiteData();
    setupNavigation();
    setupForms();
    setupTrackControls();
    setupBlogControls();
    setupDeployControls();
});

// --- API Calls ---
function fetchSiteData() {
    fetch('/api/site-data')
        .then(res => res.json())
        .then(data => {
            siteData = data;
            populateGeneralSettings();
            renderTracksTable();
            renderBlogTable();
            checkGitStatus();
        })
        .catch(err => {
            console.error('Error loading site data:', err);
            showToast('Error loading settings', true);
        });
}

function saveAndCompile() {
    // Collect General settings values
    siteData.selectedTheme = document.getElementById('site-theme-selector').value;
    siteData.defaultThemeMode = document.getElementById('default-theme-mode').value;
    siteData.baseUrl = document.getElementById('base-url').value.trim();
    siteData.branding.logoText = document.getElementById('logo-text').value;
    siteData.branding.spotifyLink = document.getElementById('spotify-link').value;
    siteData.branding.youtubeLink = document.getElementById('youtube-link').value;
    siteData.branding.appleLink = document.getElementById('apple-link').value;
    
    siteData.hero.tagline = document.getElementById('hero-tagline').value;
    siteData.hero.titlePart1 = document.getElementById('hero-title1').value;
    siteData.hero.titleGradient = document.getElementById('hero-title2').value;
    siteData.hero.description = document.getElementById('hero-description').value;
    siteData.hero.ctaPrimaryText = document.getElementById('hero-cta-p-text').value;
    siteData.hero.ctaSecondaryText = document.getElementById('hero-cta-s-text').value;
    
    siteData.about.subtitle = document.getElementById('about-subtitle').value;
    siteData.about.title = document.getElementById('about-title').value;
    
    siteData.subscribe.title = document.getElementById('subscribe-title').value;
    siteData.subscribe.description = document.getElementById('subscribe-desc').value;
    
    siteData.footer.description = document.getElementById('footer-desc').value;
    siteData.footer.copyright = document.getElementById('footer-copy').value;
    
    // Save to server
    fetch('/api/save-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            showToast('Website compiled successfully!');
            checkGitStatus(); // Refresh Git
        } else {
            showToast('Compilation failed!', true);
        }
    })
    .catch(err => {
        console.error('Error compiling:', err);
        showToast('Connection error', true);
    });
}

// --- Navigation Controller ---
function setupNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");
    const workspaceTitle = document.getElementById("workspace-title");
    
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            navButtons.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.classList.remove("active"));
            
            btn.classList.add("active");
            document.getElementById(`panel-${targetTab}`).classList.add("active");
            
            // Set Workspace Header title
            const tabTitles = {
                general: "General Settings",
                tracks: "Track Catalog Manager",
                blog: "Journal & Blog Manager",
                deploy: "GitHub Pages Deployment"
            };
            workspaceTitle.textContent = tabTitles[targetTab];
            currentTab = targetTab;
            
            if (targetTab === 'deploy') {
                checkGitStatus();
            }
        });
    });
}

// --- General Settings Panel ---
function populateGeneralSettings() {
    document.getElementById('site-theme-selector').value = siteData.selectedTheme || 'resonance';
    document.getElementById('default-theme-mode').value = siteData.defaultThemeMode || 'dark';
    document.getElementById('base-url').value = siteData.baseUrl || '';
    document.getElementById('logo-text').value = siteData.branding.logoText || '';
    document.getElementById('spotify-link').value = siteData.branding.spotifyLink || '';
    document.getElementById('youtube-link').value = siteData.branding.youtubeLink || '';
    document.getElementById('apple-link').value = siteData.branding.appleLink || '';
    
    document.getElementById('hero-tagline').value = siteData.hero.tagline || '';
    document.getElementById('hero-title1').value = siteData.hero.titlePart1 || '';
    document.getElementById('hero-title2').value = siteData.hero.titleGradient || '';
    document.getElementById('hero-description').value = siteData.hero.description || '';
    document.getElementById('hero-cta-p-text').value = siteData.hero.ctaPrimaryText || '';
    document.getElementById('hero-cta-s-text').value = siteData.hero.ctaSecondaryText || '';
    
    document.getElementById('about-subtitle').value = siteData.about.subtitle || '';
    document.getElementById('about-title').value = siteData.about.title || '';
    
    document.getElementById('subscribe-title').value = siteData.subscribe.title || '';
    document.getElementById('subscribe-desc').value = siteData.subscribe.description || '';
    
    document.getElementById('footer-desc').value = siteData.footer.description || '';
    document.getElementById('footer-copy').value = siteData.footer.copyright || '';
}

function setupForms() {
    document.getElementById("btn-global-save").addEventListener("click", saveAndCompile);
    
    // Theme Toggle click handler for Creator Studio UI
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            const isLight = document.documentElement.classList.toggle('light-mode');
            localStorage.setItem('themeMode', isLight ? 'light' : 'dark');
        });
    }
}

// --- Track Catalog Manager ---
function renderTracksTable() {
    const tbody = document.getElementById("tracks-table-body");
    tbody.innerHTML = "";
    
    if (!siteData.tracks || siteData.tracks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted);">No tracks in catalog. Click Add Track to start.</td></tr>`;
        return;
    }
    
    siteData.tracks.forEach((track, index) => {
        const tr = document.createElement("tr");
        const categoryVal = track.category || 'Single';
        const songsListHtml = track.songs && track.songs.length > 0 
            ? `<div style="font-size: 0.75rem; opacity: 0.6; margin-top: 4px; max-height: 50px; overflow-y: auto; text-align: left;"><strong>Songs:</strong> ${track.songs.map(s => `${s.artist} - ${s.title}`).join(', ')}</div>` 
            : '';
        tr.innerHTML = `
            <td><img src="${track.cover}" class="table-cover-preview" alt="Cover"></td>
            <td style="font-weight: 600;">
                ${track.title}
                <span style="font-size: 0.75rem; opacity: 0.6; display: block; font-weight: normal; margin-top: 4px;">Category: <strong>${categoryVal}</strong></span>
            </td>
            <td class="var-muted">
                ${track.artist}
                ${songsListHtml}
            </td>
            <td><span class="genre-badge ${track.badgeClass}">${track.genre}</span></td>
            <td>
                <span class="color-dot-preview" style="background: ${track.theme.accent1};"></span>
                <span class="color-dot-preview" style="background: ${track.theme.accent2};"></span>
            </td>
            <td class="actions-col">
                <button class="btn btn-secondary btn-sm" onclick="openEditTrackModal(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTrack(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupTrackControls() {
    const modal = document.getElementById("modal-track-edit");
    const btnAdd = document.getElementById("btn-add-track");
    const btnCancel = document.getElementById("btn-track-cancel");
    const form = document.getElementById("track-form");
    const coverInput = document.getElementById("track-cover-file");
    
    // Add Song button listener
    const btnAddSong = document.getElementById("btn-add-song-item");
    if (btnAddSong) {
        // Remove existing listener to prevent duplicate binding
        const newBtn = btnAddSong.cloneNode(true);
        btnAddSong.parentNode.replaceChild(newBtn, btnAddSong);
        newBtn.addEventListener("click", () => {
            addSongInputRow("", "");
        });
    }

    btnAdd.addEventListener("click", () => {
        document.getElementById("track-modal-title").textContent = "Add New Track";
        document.getElementById("track-edit-index").value = "-1";
        form.reset();
        
        // Reset defaults
        document.getElementById("track-cover-preview").src = "assets/lofi_chill.png";
        document.getElementById("track-file-info").textContent = "assets/lofi_chill.png";
        document.getElementById("track-color1").value = "#8a2be2";
        document.getElementById("track-color2").value = "#ff007f";
        document.getElementById("track-spotify").value = "";
        document.getElementById("track-youtube").value = "";
        document.getElementById("track-apple").value = "";
        document.getElementById("track-category").value = "Single";
        document.getElementById("songs-list-inputs").innerHTML = "";
        pendingTrackCover = null;
        
        modal.classList.add("active");
    });
    
    btnCancel.addEventListener("click", () => {
        modal.classList.remove("active");
    });
    
    // Cover upload file listener
    coverInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById("track-file-info").textContent = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById("track-cover-preview").src = event.target.result;
                pendingTrackCover = {
                    filename: `cover_${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
                    data: event.target.result
                };
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Save/Submit track
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const index = parseInt(document.getElementById("track-edit-index").value);
        
        let coverPath = index >= 0 ? siteData.tracks[index].cover : "assets/lofi_chill.png";
        
        // If there's a pending cover image upload, upload it first
        if (pendingTrackCover) {
            try {
                const res = await fetch('/api/upload-cover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingTrackCover)
                }).then(r => r.json());
                
                if (res.success) {
                    coverPath = res.coverPath;
                }
            } catch (err) {
                console.error("Cover upload error:", err);
                showToast("Failed to upload cover art", true);
                return;
            }
        }
        
        const trackTitle = document.getElementById("track-title").value;
        const trackArtist = document.getElementById("track-artist").value;
        const trackUrl = document.getElementById("track-url").value;
        const trackGenre = document.getElementById("track-genre").value;
        const badgeClass = document.getElementById("track-badge").value;
        const categoryVal = document.getElementById("track-category").value;
        
        const trackSpotify = document.getElementById("track-spotify").value;
        const trackYoutube = document.getElementById("track-youtube").value;
        const trackApple = document.getElementById("track-apple").value;
        
        const c1 = document.getElementById("track-color1").value;
        const c2 = document.getElementById("track-color2").value;
        
        // Parse songs list
        const songs = [];
        const songRows = document.querySelectorAll(".song-input-row");
        songRows.forEach(row => {
            const titleVal = row.querySelector(".song-input-title").value.trim();
            const artistVal = row.querySelector(".song-input-artist").value.trim();
            const urlVal = row.querySelector(".song-input-url").value.trim();
            if (titleVal && artistVal) {
                songs.push({ title: titleVal, artist: artistVal, url: urlVal });
            }
        });
        
        // Helper to convert hex to translucent rgba
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        const newTrack = {
            title: trackTitle,
            artist: trackArtist,
            url: trackUrl,
            cover: coverPath,
            genre: trackGenre,
            badgeClass: badgeClass,
            category: categoryVal,
            songs: songs,
            spotify: trackSpotify,
            youtube: trackYoutube,
            apple: trackApple,
            theme: {
                accent1: c1,
                accent2: c2,
                glow1: hexToRgba(c1, 0.15),
                glow2: hexToRgba(c2, 0.15)
            }
        };
        
        if (index >= 0) {
            // Edit mode
            siteData.tracks[index] = newTrack;
        } else {
            // Add mode
            if (!siteData.tracks) siteData.tracks = [];
            siteData.tracks.push(newTrack);
        }
        
        renderTracksTable();
        modal.classList.remove("active");
        showToast("Playlist updated. Click Save & Compile to build.");
    });
}

window.openEditTrackModal = function(index) {
    const modal = document.getElementById("modal-track-edit");
    const track = siteData.tracks[index];
    
    document.getElementById("track-modal-title").textContent = "Edit Track";
    document.getElementById("track-edit-index").value = index;
    
    document.getElementById("track-title").value = track.title;
    document.getElementById("track-artist").value = track.artist;
    document.getElementById("track-url").value = track.url;
    document.getElementById("track-genre").value = track.genre;
    document.getElementById("track-badge").value = track.badgeClass || "badge-lofi";
    document.getElementById("track-category").value = track.category || "Single";
    
    // Clear and populate songs list
    const songsContainer = document.getElementById("songs-list-inputs");
    songsContainer.innerHTML = "";
    if (track.songs && Array.isArray(track.songs)) {
        track.songs.forEach(song => {
            addSongInputRow(song.title, song.artist, song.url || '');
        });
    }
    
    document.getElementById("track-cover-preview").src = track.cover;
    document.getElementById("track-file-info").textContent = track.cover;
    
    document.getElementById("track-spotify").value = track.spotify || "";
    document.getElementById("track-youtube").value = track.youtube || "";
    document.getElementById("track-apple").value = track.apple || "";
    
    document.getElementById("track-color1").value = track.theme.accent1;
    document.getElementById("track-color2").value = track.theme.accent2;
    
    pendingTrackCover = null;
    modal.classList.add("active");
};

window.deleteTrack = function(index) {
    if (confirm(`Are you sure you want to delete track "${siteData.tracks[index].title}"?`)) {
        siteData.tracks.splice(index, 1);
        renderTracksTable();
        showToast("Track removed from list.");
    }
};

// --- Journal & Blog Manager ---
function renderBlogTable() {
    const tbody = document.getElementById("blog-table-body");
    tbody.innerHTML = "";
    
    if (!siteData.posts || siteData.posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-muted);">No journal articles. Click Create New Post.</td></tr>`;
        return;
    }
    
    siteData.posts.forEach((post, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><img src="${post.cover}" class="table-cover-preview" alt="Cover"></td>
            <td style="font-family: monospace;">${post.date}</td>
            <td style="font-weight: 600;">${post.title}</td>
            <td class="var-muted" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${post.excerpt}</td>
            <td class="actions-col">
                <button class="btn btn-secondary btn-sm" onclick="openEditPostModal(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deletePost(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupBlogControls() {
    const modal = document.getElementById("modal-post-edit");
    const btnAdd = document.getElementById("btn-add-post");
    const btnCancel = document.getElementById("btn-post-cancel");
    const form = document.getElementById("post-form");
    const coverInput = document.getElementById("post-cover-file");
    
    btnAdd.addEventListener("click", () => {
        document.getElementById("post-modal-title").textContent = "Create New Article";
        document.getElementById("post-edit-index").value = "-1";
        form.reset();
        
        // Auto fill date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById("post-date-field").value = today;
        document.getElementById("post-file-info").textContent = "Default Vibe Cover";
        pendingPostCover = null;
        
        modal.classList.add("active");
    });
    
    btnCancel.addEventListener("click", () => {
        modal.classList.remove("active");
    });
    
    coverInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById("post-file-info").textContent = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                pendingPostCover = {
                    filename: `blog_${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
                    data: event.target.result
                };
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Save Post Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const index = parseInt(document.getElementById("post-edit-index").value);
        
        let coverPath = index >= 0 ? siteData.posts[index].cover : "assets/lofi_chill.png";
        
        if (pendingPostCover) {
            try {
                const res = await fetch('/api/upload-cover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingPostCover)
                }).then(r => r.json());
                
                if (res.success) {
                    coverPath = res.coverPath;
                }
            } catch (err) {
                console.error("Cover upload error:", err);
                showToast("Failed to upload article cover", true);
                return;
            }
        }
        
        const postTitle = document.getElementById("post-title-field").value;
        const postSlug = document.getElementById("post-slug-field").value.toLowerCase().replace(/[^a-z0-9\-]/g, '');
        const postDate = document.getElementById("post-date-field").value;
        const postExcerpt = document.getElementById("post-excerpt-field").value;
        const postContent = document.getElementById("post-content-field").value;
        
        // Validate slug uniqueness
        const duplicate = siteData.posts.find((p, idx) => p.id === postSlug && idx !== index);
        if (duplicate) {
            alert("This Slug URL ID is already in use by another article. Please change it.");
            return;
        }
        
        const newPost = {
            id: postSlug,
            title: postTitle,
            date: postDate,
            excerpt: postExcerpt,
            content: postContent,
            cover: coverPath
        };
        
        if (index >= 0) {
            siteData.posts[index] = newPost;
        } else {
            if (!siteData.posts) siteData.posts = [];
            siteData.posts.push(newPost);
        }
        
        renderBlogTable();
        modal.classList.remove("active");
        showToast("Article saved. Click Save & Compile to build.");
    });
}

window.openEditPostModal = function(index) {
    const modal = document.getElementById("modal-post-edit");
    const post = siteData.posts[index];
    
    document.getElementById("post-modal-title").textContent = "Edit Article";
    document.getElementById("post-edit-index").value = index;
    
    document.getElementById("post-title-field").value = post.title;
    document.getElementById("post-slug-field").value = post.id;
    document.getElementById("post-date-field").value = post.date;
    document.getElementById("post-excerpt-field").value = post.excerpt;
    document.getElementById("post-content-field").value = post.content;
    
    document.getElementById("post-file-info").textContent = post.cover;
    pendingPostCover = null;
    
    modal.classList.add("active");
};

window.deletePost = function(index) {
    if (confirm(`Are you sure you want to delete article "${siteData.posts[index].title}"?`)) {
        siteData.posts.splice(index, 1);
        renderBlogTable();
        showToast("Article removed from list.");
    }
};

// --- GitHub Pages Deployment Panel ---
function checkGitStatus() {
    const statusVal = document.getElementById("git-status-val");
    const branchVal = document.getElementById("git-branch-val");
    const filesVal = document.getElementById("git-files-val");
    const output = document.getElementById("deploy-logs-output");
    
    fetch('/api/git-status')
        .then(res => res.json())
        .then(res => {
            if (res.initialized) {
                statusVal.textContent = res.modifiedFilesCount > 0 ? "Pending Changes" : "Up to Date";
                statusVal.className = res.modifiedFilesCount > 0 ? "value text-warning" : "value text-success";
                branchVal.textContent = res.branch;
                filesVal.textContent = res.modifiedFilesCount;
            } else {
                statusVal.textContent = "Not Setup / Error";
                statusVal.className = "value text-warning";
                branchVal.textContent = "None";
                filesVal.textContent = "0";
                output.innerHTML += `\n[Git warning]: Make sure you run 'git init' in your repository folder to enable deploys from this dashboard.`;
            }
        })
        .catch(err => {
            console.error('Error fetching git status:', err);
        });
}

function setupDeployControls() {
    const btnDeploy = document.getElementById("btn-deploy-push");
    const commitInput = document.getElementById("deploy-commit-msg");
    const terminal = document.getElementById("deploy-logs-output");
    const btnClear = document.getElementById("btn-clear-logs");
    
    btnDeploy.addEventListener("click", () => {
        const msg = commitInput.value.trim() || 'Updated content via local Aura CMS';
        
        btnDeploy.disabled = true;
        btnDeploy.textContent = "Publishing to GitHub...";
        terminal.innerHTML += `\n\n-------------------------------\n[Deploy Init]: Starting Git push pipeline...\nCommit message: "${msg}"\n`;
        
        // Scroll terminal to bottom
        terminal.scrollTop = terminal.scrollHeight;
        
        fetch('/api/git-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        })
        .then(res => res.json())
        .then(res => {
            btnDeploy.disabled = false;
            btnDeploy.textContent = "Publish Updates to GitHub";
            
            terminal.innerHTML += `\n[Git Output]:\n${res.consoleOutput}`;
            if (res.success) {
                terminal.innerHTML += `\n\n[Success]: Changes successfully pushed to GitHub Pages!`;
                commitInput.value = "";
                showToast("Pushed to GitHub Pages!");
            } else {
                terminal.innerHTML += `\n\n[Error]: Git execution encountered error.\nDetails: ${res.error}`;
                showToast("Git deploy failed", true);
            }
            terminal.scrollTop = terminal.scrollHeight;
            checkGitStatus();
        })
        .catch(err => {
            btnDeploy.disabled = false;
            btnDeploy.textContent = "Publish Updates to GitHub";
            terminal.innerHTML += `\n\n[Connection Error]: Failed to contact API server.\n`;
            terminal.scrollTop = terminal.scrollHeight;
        });
    });
    
    btnClear.addEventListener("click", () => {
        terminal.textContent = "[Terminal clear. Awaiting action...]";
    });
}

// --- Toast System ---
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    
    if (isError) {
        toast.style.background = "linear-gradient(135deg, #ef4444, #b91c1c)";
    } else {
        toast.style.background = "linear-gradient(135deg, var(--accent-1), var(--accent-2))";
    }
    
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

// --- Song Input Row Generator Helper ---
function addSongInputRow(title = '', artist = '', url = '') {
    const songsContainer = document.getElementById("songs-list-inputs");
    const row = document.createElement("div");
    row.className = "song-input-row";
    row.style.marginBottom = "10px";
    row.style.padding = "10px";
    row.style.background = "rgba(255,255,255,0.02)";
    row.style.border = "1px solid rgba(255,255,255,0.05)";
    row.style.borderRadius = "8px";
    
    row.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <input type="text" class="input-field song-input-title" placeholder="Judul Lagu" style="flex:1; padding: 6px 10px; font-size: 0.85rem;" value="${title.replace(/"/g, '&quot;')}" required>
            <input type="text" class="input-field song-input-artist" placeholder="Nama Artis" style="flex:1; padding: 6px 10px; font-size: 0.85rem;" value="${artist.replace(/"/g, '&quot;')}" required>
            <button type="button" class="btn-remove-song" style="padding: 5px 10px; background: rgba(220,53,69,0.15); color: #dc3545; border: 1px solid rgba(220,53,69,0.3); border-radius: 6px; cursor: pointer; font-size:1rem; line-height:1; flex-shrink:0;">&times;</button>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted); flex-shrink:0;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <input type="text" class="input-field song-input-url" placeholder="URL Audio lagu ini (misal: assets/lagu.mp3) — kosongkan jika pakai audio utama" style="flex:1; padding: 6px 10px; font-size: 0.8rem; color: var(--color-text-muted);" value="${url.replace(/"/g, '&quot;')}">
        </div>
    `;
    
    // Register delete action
    row.querySelector(".btn-remove-song").addEventListener("click", () => {
        row.remove();
    });
    
    songsContainer.appendChild(row);
}

