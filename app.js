// Aura: Resonance Application Logic

// --- Audio Player State ---
let currentIndex = 0;
let currentSongIndex = 0; // Active song index within the current track's song list
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isMuted = false;
let currentVolume = 0.8;
let hasStartedPlaying = false;
let currentSlideIndex = 0;

// --- DOM Elements ---
const audio = new Audio();
audio.crossOrigin = "anonymous"; // Request CORS access for visualizer

let playerContainer;
let playerCover;
let playerTitle;
let playerArtist;
let playerGenreBadge;
let playerCategoryBadge;
let playerSongList;

let btnPlayPause;
let playIcon;
let pauseIcon;
let btnPrev;
let btnNext;
let btnShuffle;
let btnRepeat;

let progressBarWrap;
let progressBarFill;
let progressHandle;
let timeCurrent;
let timeDuration;

let btnMute;
let volumeIcon;
let volumeSliderWrap;
let volumeBarFill;
let volumeHandle;

let canvas;
let canvasCtx;

// --- Web Audio API Setup ---
let audioCtx;
let analyser;
let source;
let dataArray;
let isAudioCtxInitialized = false;

// Query elements dynamically on page load / page swap
function queryPlayerElements() {
    playerContainer = document.querySelector(".player-container");
    playerCover = document.getElementById("player-cover");
    playerTitle = document.getElementById("player-title");
    playerArtist = document.getElementById("player-artist");
    playerGenreBadge = document.getElementById("player-genre-badge");
    playerCategoryBadge = document.getElementById("player-category-badge");
    playerSongList = document.getElementById("player-song-list");
    
    btnPlayPause = document.getElementById("btn-play-pause");
    playIcon = document.getElementById("play-icon");
    pauseIcon = document.getElementById("pause-icon");
    btnPrev = document.getElementById("btn-prev");
    btnNext = document.getElementById("btn-next");
    btnShuffle = document.getElementById("btn-shuffle");
    btnRepeat = document.getElementById("btn-repeat");
    
    progressBarWrap = document.getElementById("progress-bar-wrap");
    progressBarFill = document.getElementById("progress-bar-fill");
    progressHandle = document.getElementById("progress-handle");
    timeCurrent = document.getElementById("time-current");
    timeDuration = document.getElementById("time-duration");
    
    btnMute = document.getElementById("btn-mute");
    volumeIcon = document.getElementById("volume-icon");
    volumeSliderWrap = document.getElementById("volume-slider-wrap");
    volumeBarFill = document.getElementById("volume-bar-fill");
    volumeHandle = document.getElementById("volume-handle");
    
    canvas = document.getElementById("visualizer");
    if (canvas) {
        canvasCtx = canvas.getContext("2d");
    }
}

// Helpers for absolute path resolution
const __BASE__ = (window.__BASE__ || '').replace(/\/$/, '');

function getAbsolutePath(path) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('//')) {
        return path; // external URL, leave as-is
    }
    // Already includes baseUrl prefix
    if (__BASE__ && path.startsWith(__BASE__)) return path;
    // Absolute path starting with /
    if (path.startsWith('/')) {
        return __BASE__ + path;
    }
    // Relative path (e.g. "assets/song.mp3")
    return __BASE__ + '/' + path;
}

// Tracks list resolver (fallback to fetching site_data.json if undefined)
function getTracks() {
    if (typeof trackList !== 'undefined') {
        return trackList;
    }
    return window.trackList || [];
}

async function ensureTrackList() {
    if (!window.trackList && (typeof trackList === 'undefined' || !trackList)) {
        try {
            const response = await fetch(__BASE__ + '/site_data.json');
            const data = await response.json();
            window.trackList = data.tracks || [];
        } catch (e) {
            console.error("Failed to load tracks from site_data.json:", e);
        }
    }
}

// --- Initialize & Load Track ---
async function initApp() {
    await ensureTrackList();
    queryPlayerElements();
    
    // Load initial track details if tracks are available
    const tracks = getTracks();
    if (tracks.length > 0) {
        loadTrack(currentIndex);
    }
    
    setupGlobalAudioListeners();
    setupEventDelegation();
    rebindPageScripts();
    
    // Setup visualizer canvas resize
    resizeCanvas();
    window.removeEventListener("resize", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);
}

function loadTrack(index) {
    const tracks = getTracks();
    if (!tracks || tracks.length === 0) return;
    
    const track = tracks[index];
    currentIndex = index;
    currentSlideIndex = index;
    updateSlides();
    
    // Update Audio Element
    audio.src = getAbsolutePath(track.url);
    audio.load();
    
    // Update Player UI if elements exist
    if (playerCover) playerCover.src = getAbsolutePath(track.cover);
    if (playerTitle) playerTitle.textContent = track.title;
    if (playerArtist) playerArtist.textContent = track.artist;
    if (playerGenreBadge) {
        playerGenreBadge.textContent = track.genre;
        playerGenreBadge.className = "genre-badge " + track.badgeClass;
    }
    if (playerCategoryBadge) {
        playerCategoryBadge.textContent = track.category || "Single";
    }
    
    // Update Floating bar Now Playing text
    const floatingTrackInfo = document.getElementById("floating-track-info");
    if (floatingTrackInfo) {
        floatingTrackInfo.textContent = `Now Playing: ${track.title} - ${track.artist}`;
    }
    const floatingCover = document.getElementById("floating-cover-preview");
    if (floatingCover) {
        floatingCover.src = getAbsolutePath(track.cover);
    }
    
    // Update Song List
    if (playerSongList) {
        playerSongList.innerHTML = "";
        currentSongIndex = 0; // Reset to first song when loading a new track
        if (track.songs && Array.isArray(track.songs) && track.songs.length > 0) {
            track.songs.forEach((song, idx) => {
                const songItem = document.createElement("div");
                songItem.className = "song-item" + (idx === 0 ? " song-item-active" : "");
                songItem.setAttribute("data-song-idx", idx);
                songItem.style.cursor = "pointer";
                songItem.innerHTML = `
                    <span><span class="song-item-number">${String(idx + 1).padStart(2, '0')}</span><span class="song-item-title">${song.title}</span></span>
                    <span class="song-item-artist">${song.artist}</span>
                `;
                playerSongList.appendChild(songItem);
            });
            playerSongList.style.display = "block";
        } else {
            playerSongList.style.display = "none";
        }
    }
    
    // Reset Progress Bar elements
    if (progressBarFill) progressBarFill.style.width = "0%";
    if (progressHandle) progressHandle.style.left = "0%";
    if (timeCurrent) timeCurrent.textContent = "0:00";
    if (timeDuration) timeDuration.textContent = "0:00";
    
    // Update Theme styling variables
    if (track.theme) {
        document.documentElement.style.setProperty("--accent-1", track.theme.accent1);
        document.documentElement.style.setProperty("--accent-2", track.theme.accent2);
        document.documentElement.style.setProperty("--accent-glow-1", track.theme.glow1);
        document.documentElement.style.setProperty("--accent-glow-2", track.theme.glow2);
    }
    
    // Update Queue card highlights
    document.querySelectorAll(".track-card").forEach((card, idx) => {
        if (idx === index) {
            card.classList.add("active-track");
        } else {
            card.classList.remove("active-track");
        }
    });

    // Update DSP Streaming Links
    const dspContainer = document.getElementById("player-dsp-links");
    if (dspContainer) {
        dspContainer.innerHTML = "";
        if (track.spotify) {
            dspContainer.innerHTML += `
                <a href="${track.spotify}" target="_blank" rel="noopener" class="dsp-link dsp-spotify" title="Listen on Spotify">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.892-1.007-.336.074-.67-.142-.744-.48-.074-.336.143-.67.48-.744 3.844-.88 7.143-.51 9.806 1.12.294.18.387.563.207.857zm1.225-2.72c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.66-1.11 8.224-.563 11.35 1.36.366.226.486.707.26 1.074zm.106-2.833C14.992 8.98 9.333 8.794 6.05 9.79c-.506.153-1.04-.137-1.193-.646-.152-.507.137-1.04.646-1.193 3.76-1.143 10.007-.93 13.43 1.103.456.27.604.862.333 1.32-.27.455-.86.604-1.32.332z"/></svg>
                </a>`;
        }
        if (track.youtube) {
            dspContainer.innerHTML += `
                <a href="${track.youtube}" target="_blank" rel="noopener" class="dsp-link dsp-youtube" title="Watch on YouTube">
                    <svg viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>`;
        }
        if (track.apple) {
            dspContainer.innerHTML += `
                <a href="${track.apple}" target="_blank" rel="noopener" class="dsp-link dsp-apple" title="Listen on Apple Music">
                    <svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="m10.995 0 .573.001q.241 0 .483.007c.35.01.705.03 1.051.093.352.063.68.166.999.329a3.36 3.36 0 0 1 1.47 1.468c.162.32.265.648.328 1 .063.347.084.7.093 1.051q.007.241.007.483l.001.573v5.99l-.001.573q0 .241-.008.483c-.01.35-.03.704-.092 1.05a3.5 3.5 0 0 1-.33 1 3.36 3.36 0 0 1-1.468 1.468 3.5 3.5 0 0 1-1 .33 7 7 0 0 1-1.05.092q-.241.007-.483.008l-.573.001h-5.99l-.573-.001q-.241 0-.483-.008a7 7 0 0 1-1.052-.092 3.6 3.6 0 0 1-.998-.33 3.36 3.36 0 0 1-1.47-1.468 3.6 3.6 0 0 1-.328-1 7 7 0 0 1-.093-1.05Q.002 11.81 0 11.568V5.005l.001-.573q0-.241.007-.483c.01-.35.03-.704.093-1.05a3.6 3.6 0 0 1 .329-1A3.36 3.36 0 0 1 1.9.431 3.5 3.5 0 0 1 2.896.1 7 7 0 0 1 3.95.008Q4.19.002 4.432 0h.573zm-.107 2.518-4.756.959H6.13a.66.66 0 0 0-.296.133.5.5 0 0 0-.16.31c-.004.027-.01.08-.01.16v5.952c0 .14-.012.275-.106.39-.095.115-.21.15-.347.177l-.31.063c-.393.08-.65.133-.881.223a1.4 1.4 0 0 0-.519.333 1.25 1.25 0 0 0-.332.995c.031.297.166.582.395.792.156.142.35.25.578.296.236.047.49.031.858-.043.196-.04.38-.102.555-.205a1.4 1.4 0 0 0 .438-.405 1.5 1.5 0 0 0 .233-.55c.042-.202.052-.386.052-.588V6.347c0-.276.08-.35.302-.404.024-.005 3.954-.797 4.138-.833.257-.049.378.025.378.294v3.524c0 .14-.001.28-.096.396-.094.115-.211.15-.348.178l-.31.062c-.393.08-.649.133-.88.223a1.4 1.4 0 0 0-.52.334 1.26 1.26 0 0 0-.34.994c.03.297.174.582.404.792a1.2 1.2 0 0 0 .577.294c.237.048.49.03.858-.044.197-.04.381-.098.556-.202a1.4 1.4 0 0 0 .438-.405q.173-.252.233-.549a2.7 2.7 0 0 0 .044-.589V2.865c0-.273-.143-.443-.4-.42-.04.003-.383.064-.424.073"/></svg>
                </a>`;
        }
    }

    // If was playing, keep playing
    if (isPlaying) {
        audio.play().catch(err => console.log("Play interrupted or blocked:", err));
    }
}

// --- Play a specific song from the current release's song list ---
function playListSong(songIdx) {
    hasStartedPlaying = true;
    const tracks = getTracks();
    if (!tracks || tracks.length === 0) return;
    const track = tracks[currentIndex];
    if (!track || !track.songs || !track.songs[songIdx]) return;
    
    currentSongIndex = songIdx;
    const song = track.songs[songIdx];
    
    // Highlight active song in the list
    if (playerSongList) {
        playerSongList.querySelectorAll('.song-item').forEach((el, i) => {
            el.classList.toggle('song-item-active', i === songIdx);
        });
    }
    
    // Update the player title & artist to the selected song
    if (playerTitle) playerTitle.textContent = song.title;
    if (playerArtist) playerArtist.textContent = song.artist;
    
    // Update floating now playing bar
    const floatingTrackInfo = document.getElementById("floating-track-info");
    if (floatingTrackInfo) {
        floatingTrackInfo.textContent = `Now Playing: ${song.title} - ${song.artist}`;
    }
    const floatingCover = document.getElementById("floating-cover-preview");
    if (floatingCover) {
        floatingCover.src = getAbsolutePath(track.cover);
    }
    
    // Switch audio source: use song's own URL if available, else fallback to track URL
    const songUrl = song.url && song.url.trim() !== '' ? song.url : track.url;
    const newSrc = getAbsolutePath(songUrl);
    if (audio.src !== newSrc && audio.src !== window.location.origin + newSrc) {
        audio.src = newSrc;
        audio.load();
    }
    
    // Reset progress bar
    if (progressBarFill) progressBarFill.style.width = "0%";
    if (progressHandle) progressHandle.style.left = "0%";
    if (timeCurrent) timeCurrent.textContent = "0:00";
    
    // Play from beginning
    audio.currentTime = 0;
    if (!isAudioCtxInitialized) initAudioContext();
    isPlaying = true;
    if (playerContainer) playerContainer.classList.add("playing");
    if (playIcon) playIcon.classList.add("hidden");
    if (pauseIcon) pauseIcon.classList.remove("hidden");
    audio.play().catch(err => console.log("Song play failed:", err));
    
    // Show floating bar if lightbox not open
    const floatingIndicator = document.getElementById("floating-player-indicator");
    const lightbox = document.getElementById("player-lightbox");
    if (floatingIndicator && (!lightbox || !lightbox.classList.contains("active"))) {
        floatingIndicator.classList.add("show");
    }
}

// --- Audio Controls Actions ---
function playTrack() {
    hasStartedPlaying = true;
    // Initialize AudioContext on first user interaction
    if (!isAudioCtxInitialized) {
        initAudioContext();
    }
    
    isPlaying = true;
    if (playerContainer) playerContainer.classList.add("playing");
    if (playIcon) playIcon.classList.add("hidden");
    if (pauseIcon) pauseIcon.classList.remove("hidden");
    
    // Sync indicator
    const floatingIndicator = document.getElementById("floating-player-indicator");
    const playerLightbox = document.getElementById("player-lightbox");
    if (floatingIndicator && (!playerLightbox || !playerLightbox.classList.contains("active"))) {
        floatingIndicator.classList.add("show");
    }
    
    audio.play().catch(err => {
        console.log("Play failed: ", err);
        isPlaying = false;
        if (playerContainer) playerContainer.classList.remove("playing");
        if (playIcon) playIcon.classList.remove("hidden");
        if (pauseIcon) pauseIcon.classList.add("hidden");
        if (floatingIndicator) floatingIndicator.classList.remove("show");
    });
}

function pauseTrack() {
    isPlaying = false;
    if (playerContainer) playerContainer.classList.remove("playing");
    if (playIcon) playIcon.classList.remove("hidden");
    if (pauseIcon) pauseIcon.classList.add("hidden");
    
    audio.pause();
}

function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function prevTrack() {
    const tracks = getTracks();
    if (tracks.length === 0) return;
    
    const track = tracks[currentIndex];
    if (track.songs && Array.isArray(track.songs) && track.songs.length > 0) {
        if (currentSongIndex > 0) {
            playListSong(currentSongIndex - 1);
            return;
        }
    }
    
    let newIndex = currentIndex - 1;
    if (newIndex < 0) {
        newIndex = tracks.length - 1;
    }
    loadTrack(newIndex);
    
    // Auto-play the last song of the new album if it's an album
    const newTrack = tracks[newIndex];
    if (newTrack.songs && Array.isArray(newTrack.songs) && newTrack.songs.length > 0) {
        playListSong(newTrack.songs.length - 1);
    } else {
        if (isPlaying) playTrack();
    }
}

function nextTrack() {
    const tracks = getTracks();
    if (tracks.length === 0) return;
    
    const track = tracks[currentIndex];
    if (track.songs && Array.isArray(track.songs) && track.songs.length > 0) {
        if (currentSongIndex < track.songs.length - 1) {
            playListSong(currentSongIndex + 1);
            return;
        }
    }
    
    let newIndex;
    if (isShuffle) {
        do {
            newIndex = Math.floor(Math.random() * tracks.length);
        } while (newIndex === currentIndex && tracks.length > 1);
    } else {
        newIndex = currentIndex + 1;
        if (newIndex >= tracks.length) {
            newIndex = 0;
        }
    }
    loadTrack(newIndex);
    
    // Auto-play the first song of the new album if it's an album
    const newTrack = tracks[newIndex];
    if (newTrack.songs && Array.isArray(newTrack.songs) && newTrack.songs.length > 0) {
        playListSong(0);
    } else {
        if (isPlaying) playTrack();
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    if (btnShuffle) btnShuffle.classList.toggle("active-mode", isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    if (btnRepeat) btnRepeat.classList.toggle("active-mode", isRepeat);
}

// Format duration helper
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Update playback progress
function updateProgress() {
    const { duration, currentTime } = audio;
    if (isNaN(duration)) return;
    
    const percent = (currentTime / duration) * 100;
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    if (progressHandle) progressHandle.style.left = `${percent}%`;
    
    if (timeCurrent) timeCurrent.textContent = formatTime(currentTime);
    if (timeDuration) timeDuration.textContent = formatTime(duration);
}

// Seek position
function seek(event) {
    if (!progressBarWrap || isNaN(audio.duration)) return;
    const rect = progressBarWrap.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    let percent = clickX / width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    
    audio.currentTime = percent * audio.duration;
    updateProgress();
}

// Handle volume slider update
function updateVolume(event) {
    if (!volumeSliderWrap) return;
    const rect = volumeSliderWrap.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    let percent = clickX / width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    
    currentVolume = percent;
    audio.volume = percent;
    isMuted = percent === 0;
    
    if (volumeBarFill) volumeBarFill.style.width = `${percent * 100}%`;
    if (volumeHandle) volumeHandle.style.left = `${percent * 100}%`;
    
    updateVolumeIcon();
}

// Toggle Mute
function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
        audio.volume = 0;
        if (volumeBarFill) volumeBarFill.style.width = "0%";
        if (volumeHandle) volumeHandle.style.left = "0%";
    } else {
        audio.volume = currentVolume;
        if (volumeBarFill) volumeBarFill.style.width = `${currentVolume * 100}%`;
        if (volumeHandle) volumeHandle.style.left = `${currentVolume * 100}%`;
    }
    updateVolumeIcon();
}

function updateVolumeIcon() {
    if (!btnMute) return;
    if (isMuted || audio.volume === 0) {
        btnMute.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
    } else if (audio.volume < 0.5) {
        btnMute.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    } else {
        btnMute.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    }
}

// --- Global Audio Event Handlers (register once) ---
function setupGlobalAudioListeners() {
    audio.removeEventListener("timeupdate", updateProgress);
    audio.addEventListener("timeupdate", updateProgress);
    
    audio.removeEventListener("ended", onAudioEnded);
    audio.addEventListener("ended", onAudioEnded);
    
    audio.removeEventListener("pause", onAudioPause);
    audio.addEventListener("pause", onAudioPause);
    
    audio.removeEventListener("play", onAudioPlay);
    audio.addEventListener("play", onAudioPlay);
}

function onAudioEnded() {
    if (isRepeat) {
        audio.currentTime = 0;
        playTrack();
    } else {
        nextTrack();
    }
}

function onAudioPause() {
    document.body.classList.remove("playing");
    if (playerContainer) playerContainer.classList.remove("playing");
    if (playIcon) playIcon.classList.remove("hidden");
    if (pauseIcon) pauseIcon.classList.add("hidden");
    
    // Sync floating controls play/pause icon
    const floatPlay = document.getElementById("floating-play-icon");
    const floatPause = document.getElementById("floating-pause-icon");
    if (floatPlay) floatPlay.classList.remove("hidden");
    if (floatPause) floatPause.classList.add("hidden");
}

function onAudioPlay() {
    hasStartedPlaying = true;
    const floatingIndicator = document.getElementById("floating-player-indicator");
    const playerLightbox = document.getElementById("player-lightbox");
    if (hasStartedPlaying && floatingIndicator && (!playerLightbox || !playerLightbox.classList.contains("active"))) {
        floatingIndicator.classList.add("show");
    }
    
    document.body.classList.add("playing");
    if (playerContainer) playerContainer.classList.add("playing");
    if (playIcon) playIcon.classList.add("hidden");
    if (pauseIcon) pauseIcon.classList.remove("hidden");
    
    // Sync floating controls play/pause icon
    const floatPlay = document.getElementById("floating-play-icon");
    const floatPause = document.getElementById("floating-pause-icon");
    if (floatPlay) floatPlay.classList.add("hidden");
    if (floatPause) floatPause.classList.remove("hidden");
}

// --- Event Delegation on document.body (click listeners are persistent) ---
function setupEventDelegation() {
    document.body.addEventListener("click", (e) => {
        // 1. Play/Pause
        const playPauseBtn = e.target.closest("#btn-play-pause");
        if (playPauseBtn) {
            togglePlay();
            return;
        }
        
        // 2. Prev
        const prevBtn = e.target.closest("#btn-prev");
        if (prevBtn) {
            prevTrack();
            return;
        }
        
        // 3. Next
        const nextBtn = e.target.closest("#btn-next");
        if (nextBtn) {
            nextTrack();
            return;
        }
        
        // 4. Shuffle
        const shuffleBtn = e.target.closest("#btn-shuffle");
        if (shuffleBtn) {
            toggleShuffle();
            return;
        }
        
        // 5. Repeat
        const repeatBtn = e.target.closest("#btn-repeat");
        if (repeatBtn) {
            toggleRepeat();
            return;
        }
        
        // 6. Mute
        const muteBtn = e.target.closest("#btn-mute");
        if (muteBtn) {
            toggleMute();
            return;
        }
        
        // 7. Close Lightbox
        const closeLightboxBtn = e.target.closest("#btn-close-lightbox");
        if (closeLightboxBtn) {
            const playerLightbox = document.getElementById("player-lightbox");
            const floatingIndicator = document.getElementById("floating-player-indicator");
            if (playerLightbox) playerLightbox.classList.remove("active");
            if (isPlaying && !audio.paused && floatingIndicator) {
                floatingIndicator.classList.add("show");
            }
            return;
        }
        
        // 8. Floating Player Indicator click
        const floatingIndicatorClick = e.target.closest("#floating-player-indicator");
        if (floatingIndicatorClick) {
            // First check if click was on one of the floating buttons
            const floatBtn = e.target.closest(".floating-btn");
            if (floatBtn) {
                e.stopPropagation();
                e.preventDefault();
                if (floatBtn.id === 'btn-floating-prev') {
                    prevTrack();
                } else if (floatBtn.id === 'btn-floating-play-pause') {
                    togglePlay();
                } else if (floatBtn.id === 'btn-floating-next') {
                    nextTrack();
                }
                return;
            }
            
            const playerLightbox = document.getElementById("player-lightbox");
            const hasEmbeddedPlayer = document.getElementById("player-section");
            if (document.body.classList.contains("zenith-theme") || !hasEmbeddedPlayer) {
                if (playerLightbox) {
                    playerLightbox.classList.add("active");
                    setTimeout(resizeCanvas, 50);
                }
                floatingIndicatorClick.classList.remove("show");
            } else {
                const playerSection = document.getElementById("player-section");
                if (playerSection) playerSection.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }
        
        // 9. Track card selection
        const trackCard = e.target.closest(".track-card");
        if (trackCard) {
            const index = parseInt(trackCard.getAttribute("data-index"));
            loadTrack(index);
            playTrack();
            
            if (document.body.classList.contains("zenith-theme")) {
                const lightbox = document.getElementById("player-lightbox");
                if (lightbox) lightbox.classList.add("active");
                
                const indicator = document.getElementById("floating-player-indicator");
                if (indicator) indicator.classList.remove("show");
                
                setTimeout(resizeCanvas, 50);
            } else {
                const playerSection = document.getElementById("player-section");
                if (playerSection) playerSection.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }
        
        // 9b. Song item click inside player song list
        const songItem = e.target.closest(".song-item[data-song-idx]");
        if (songItem) {
            const songIdx = parseInt(songItem.getAttribute("data-song-idx"));
            playListSong(songIdx);
            return;
        }
        
        // 10. Success modal controls
        const modalClose = e.target.closest("#modal-close, #btn-modal-ok");
        if (modalClose) {
            const modal = document.getElementById("modal-success");
            if (modal) modal.classList.remove("active");
            return;
        }
        const successModal = document.getElementById("modal-success");
        if (successModal && e.target === successModal) {
            successModal.classList.remove("active");
            return;
        }
        
        // 11. Theme toggle
        const themeToggleBtn = e.target.closest("#btn-theme-toggle");
        if (themeToggleBtn) {
            const isLight = document.documentElement.classList.toggle('light-mode');
            localStorage.setItem('themeMode', isLight ? 'light' : 'dark');
            return;
        }

        // 12. PJAX Link Clicks Interception
        const anchor = e.target.closest("a");
        if (anchor) {
            const href = anchor.getAttribute("href");
            if (href) {
                // If it is a local hash link
                if (href.startsWith("#")) {
                    const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
                    if (!isHome) {
                        e.preventDefault();
                        navigateToPage('/index.html' + href);
                    }
                    return;
                }
                
                if (isInternalLink(anchor)) {
                    e.preventDefault();
                    navigateToPage(anchor.href);
                }
            }
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
        navigateToPage(window.location.href, true);
    });
}

// --- PJAX Router Functions ---
function isInternalLink(anchor) {
    if (!anchor.href) return false;
    const url = new URL(anchor.href, window.location.href);
    const isSameOrigin = url.origin === window.location.origin;
    const isNotAdmin = !url.pathname.includes('/admin') && !url.pathname.includes('admin.html');
    const isNotExternal = anchor.getAttribute('target') !== '_blank';
    const isNotDownload = !anchor.hasAttribute('download');
    return isSameOrigin && isNotAdmin && isNotExternal && isNotDownload;
}

async function navigateToPage(url, isPopState = false) {
    try {
        // Close the lightbox if it's open so it doesn't block the incoming page
        const playerLightbox = document.getElementById('player-lightbox');
        if (playerLightbox && playerLightbox.classList.contains('active')) {
            playerLightbox.classList.remove('active');
            // If music is still playing, show the floating bar instead
            if (isPlaying && !audio.paused) {
                const floatingIndicator = document.getElementById('floating-player-indicator');
                if (floatingIndicator) floatingIndicator.classList.add('show');
            }
        }
        
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(8px)';
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP error " + response.status);
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        document.title = doc.title;
        
        if (!isPopState) {
            history.pushState(null, '', url);
        }
        
        const newMain = doc.querySelector('main');
        const currentMain = document.querySelector('main');
        
        if (newMain && currentMain) {
            // Transfer any inline <style> tags from the fetched page head (safety net for PJAX)
            document.querySelectorAll('style[data-pjax]').forEach(el => el.remove());
            doc.querySelectorAll('head style').forEach(styleEl => {
                const clone = document.createElement('style');
                clone.setAttribute('data-pjax', 'true');
                clone.textContent = styleEl.textContent;
                document.head.appendChild(clone);
            });
            
            setTimeout(() => {

                currentMain.innerHTML = newMain.innerHTML;
                currentMain.className = newMain.className;
                currentMain.id = newMain.id;
                
                // Sync body class (zenith-theme etc)
                if (doc.body.classList.contains('zenith-theme')) {
                    document.body.classList.add('zenith-theme');
                } else {
                    document.body.classList.remove('zenith-theme');
                }
                
                // Rebind elements, controllers, sliders, scrollreveal
                rebindPageScripts();
                updateNavigationLinks();
                
                // Fade in
                currentMain.style.opacity = '1';
                currentMain.style.transform = 'translateY(0)';
                
                // Scroll to hash target if needed
                const hashIndex = url.indexOf('#');
                if (hashIndex !== -1) {
                    const hash = url.substring(hashIndex + 1);
                    const targetEl = document.getElementById(hash);
                    if (targetEl) {
                        setTimeout(() => {
                            targetEl.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    }
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 200);
        }
    } catch (e) {
        console.error("PJAX navigation failed, falling back to full reload:", e);
        window.location.href = url;
    }
}

function updateNavigationLinks() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.header .nav-link, header .nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const isHome = currentPath === '/' || 
                           currentPath.endsWith('index.html') || 
                           currentPath === __BASE__ || 
                           currentPath === __BASE__ + '/';
            const isBlog = currentPath.endsWith('blog.html') || currentPath.includes('/posts/');
            
            if (href.includes('index.html') && isHome) {
                link.classList.add('active-nav');
            } else if (href.includes('blog.html') && isBlog) {
                link.classList.add('active-nav');
            } else {
                link.classList.remove('active-nav');
            }
        }
    });
}

// --- Re-bind UI Controls & State on DOM updates ---
function rebindPageScripts() {
    queryPlayerElements();
    
    // Sync metadata from active index
    const tracks = getTracks();
    if (tracks.length > 0 && currentIndex < tracks.length) {
        const track = tracks[currentIndex];
        let activeTitle = track.title;
        let activeArtist = track.artist;
        
        if (track.songs && Array.isArray(track.songs) && track.songs[currentSongIndex]) {
            activeTitle = track.songs[currentSongIndex].title;
            activeArtist = track.songs[currentSongIndex].artist;
        }
        
        if (playerTitle) playerTitle.textContent = activeTitle;
        if (playerArtist) playerArtist.textContent = activeArtist;
        if (playerCover) playerCover.src = getAbsolutePath(track.cover);
        if (playerGenreBadge) {
            playerGenreBadge.textContent = track.genre;
            playerGenreBadge.className = "genre-badge " + track.badgeClass;
        }
        if (playerCategoryBadge) {
            playerCategoryBadge.textContent = track.category || "Single";
        }
        
        // Re-populate the song list items in player if it exists
        if (playerSongList) {
            playerSongList.innerHTML = "";
            if (track.songs && Array.isArray(track.songs) && track.songs.length > 0) {
                track.songs.forEach((song, idx) => {
                    const songItem = document.createElement("div");
                    songItem.className = "song-item" + (idx === currentSongIndex ? " song-item-active" : "");
                    songItem.setAttribute("data-song-idx", idx);
                    songItem.style.cursor = "pointer";
                    songItem.innerHTML = `
                        <span><span class="song-item-number">${String(idx + 1).padStart(2, '0')}</span><span class="song-item-title">${song.title}</span></span>
                        <span class="song-item-artist">${song.artist}</span>
                    `;
                    playerSongList.appendChild(songItem);
                });
                playerSongList.style.display = "block";
            } else {
                playerSongList.style.display = "none";
            }
        }
        
        // Sync active highlight class in track card listings on current page
        document.querySelectorAll(".track-card").forEach((card, idx) => {
            if (idx === currentIndex) {
                card.classList.add("active-track");
            } else {
                card.classList.remove("active-track");
            }
        });
        
        // Sync Floating Now Playing bar track details
        const floatingTrackInfo = document.getElementById("floating-track-info");
        if (floatingTrackInfo) {
            floatingTrackInfo.textContent = `Now Playing: ${activeTitle} - ${activeArtist}`;
        }
        const floatingCover = document.getElementById("floating-cover-preview");
        if (floatingCover) {
            floatingCover.src = getAbsolutePath(track.cover);
        }
    }
    
    // Sync Play/Pause UI icons
    const floatPlay = document.getElementById("floating-play-icon");
    const floatPause = document.getElementById("floating-pause-icon");
    if (isPlaying && !audio.paused) {
        document.body.classList.add("playing");
        if (playerContainer) playerContainer.classList.add("playing");
        if (playIcon) playIcon.classList.add("hidden");
        if (pauseIcon) pauseIcon.classList.remove("hidden");
        
        if (floatPlay) floatPlay.classList.add("hidden");
        if (floatPause) floatPause.classList.remove("hidden");
        
        // Show floating bar if music is playing on non-embedded-player pages
        const floatingIndicator = document.getElementById("floating-player-indicator");
        const lightbox = document.getElementById("player-lightbox");
        if (hasStartedPlaying && floatingIndicator && (!lightbox || !lightbox.classList.contains("active"))) {
            floatingIndicator.classList.add("show");
        }
    } else {
        document.body.classList.remove("playing");
        if (playerContainer) playerContainer.classList.remove("playing");
        if (playIcon) playIcon.classList.remove("hidden");
        if (pauseIcon) pauseIcon.classList.add("hidden");
        
        if (floatPlay) floatPlay.classList.remove("hidden");
        if (floatPause) floatPause.classList.add("hidden");
        
        // Let it stay visible if music has started playing
        const floatingIndicator = document.getElementById("floating-player-indicator");
        const lightbox = document.getElementById("player-lightbox");
        if (hasStartedPlaying && floatingIndicator && (!lightbox || !lightbox.classList.contains("active"))) {
            floatingIndicator.classList.add("show");
        }
    }
    
    // Sync repeat/shuffle highlight classes
    if (btnShuffle) btnShuffle.classList.toggle("active-mode", isShuffle);
    if (btnRepeat) btnRepeat.classList.toggle("active-mode", isRepeat);
    
    // Sync volume slider layout
    if (volumeBarFill) volumeBarFill.style.width = `${audio.volume * 100}%`;
    if (volumeHandle) volumeHandle.style.left = `${audio.volume * 100}%`;
    updateVolumeIcon();
    
    // Rebind sliders and forms
    bindSlidersAndControls();
    
    // Initialize slider layout logic if present
    initSliderLayout();
    
    // Trigger scroll reveals
    setupScrollReveal();
    
    // Trigger canvas visualizer resize
    setTimeout(resizeCanvas, 50);
}

// Slider interaction event handler functions
let isDraggingProgress = false;
let isDraggingVolume = false;

function onProgressMouseDown(e) {
    isDraggingProgress = true;
    seek(e);
}
function onProgressMouseMove(e) {
    if (isDraggingProgress) seek(e);
}
function onProgressMouseUp() {
    isDraggingProgress = false;
}

function onVolumeMouseDown(e) {
    isDraggingVolume = true;
    updateVolume(e);
}
function onVolumeMouseMove(e) {
    if (isDraggingVolume) updateVolume(e);
}
function onVolumeMouseUp() {
    isDraggingVolume = false;
}

function onNewsletterSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById("subscriber-email");
    const modal = document.getElementById("modal-success");
    if (emailInput && emailInput.value.trim() !== "") {
        if (modal) modal.classList.add("active");
        emailInput.value = "";
    }
}

function bindSlidersAndControls() {
    if (progressBarWrap) {
        progressBarWrap.removeEventListener("mousedown", onProgressMouseDown);
        progressBarWrap.addEventListener("mousedown", onProgressMouseDown);
    }
    window.removeEventListener("mousemove", onProgressMouseMove);
    window.addEventListener("mousemove", onProgressMouseMove);
    window.removeEventListener("mouseup", onProgressMouseUp);
    window.addEventListener("mouseup", onProgressMouseUp);
    
    if (volumeSliderWrap) {
        volumeSliderWrap.removeEventListener("mousedown", onVolumeMouseDown);
        volumeSliderWrap.addEventListener("mousedown", onVolumeMouseDown);
    }
    window.removeEventListener("mousemove", onVolumeMouseMove);
    window.addEventListener("mousemove", onVolumeMouseMove);
    window.removeEventListener("mouseup", onVolumeMouseUp);
    window.addEventListener("mouseup", onVolumeMouseUp);
    
    const form = document.getElementById("newsletter-form");
    if (form) {
        form.removeEventListener("submit", onNewsletterSubmit);
        form.addEventListener("submit", onNewsletterSubmit);
    }
}

// --- Web Audio Visualizer API Initialization ---
function initAudioContext() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        
        // Connect HTML Audio to Web Audio API
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        isAudioCtxInitialized = true;
    } catch (e) {
        console.warn("Web Audio API not fully supported or blocked. Using fallback visualizer: ", e);
    }
}

// Resize Canvas to fit wrapper
function resizeCanvas() {
    if (canvas && playerContainer) {
        canvas.width = playerContainer.clientWidth;
        canvas.height = playerContainer.clientHeight;
    }
}

// --- Dynamic Visualizer Animation loop ---
let waveOffset = 0;
function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if (!canvas || !canvasCtx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with translucent layer for trailing blur effect (sync background with theme mode)
    canvasCtx.fillStyle = document.documentElement.classList.contains('light-mode')
        ? 'rgba(247, 246, 250, 0.2)'
        : 'rgba(7, 6, 15, 0.2)';
    canvasCtx.fillRect(0, 0, width, height);
    
    const isActuallyPlaying = isPlaying && !audio.paused && !audio.seeking;
    
    // Theme colors from CSS
    const computedStyle = getComputedStyle(document.documentElement);
    const color1 = computedStyle.getPropertyValue('--accent-1').trim() || "#8a2be2";
    const color2 = computedStyle.getPropertyValue('--accent-2').trim() || "#ff007f";
    
    // We check if Web Audio API data is active
    let hasRealData = false;
    if (isAudioCtxInitialized && analyser && isActuallyPlaying) {
        analyser.getByteFrequencyData(dataArray);
        hasRealData = dataArray.some(val => val > 0);
    }
    
    if (hasRealData) {
        // REAL AUDIO DATA VISUALIZATION (Frequency Bars)
        const barWidth = (width / dataArray.length) * 1.5;
        let x = 0;
        
        canvasCtx.shadowBlur = 15;
        canvasCtx.shadowColor = color1;
        
        for (let i = 0; i < dataArray.length; i++) {
            const val = dataArray[i];
            const barHeight = (val / 255) * (height * 0.35);
            
            const grad = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);
            canvasCtx.fillStyle = grad;
            
            canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
            canvasCtx.fillRect(width - x - barWidth, height - barHeight, barWidth - 2, barHeight);
            
            x += barWidth;
        }
        canvasCtx.shadowBlur = 0;
    } else {
        // FALLBACK SYNCED GRAPHICAL WAVEFORM (Sine waves beat simulation)
        canvasCtx.shadowBlur = 10;
        canvasCtx.shadowColor = color2;
        
        const speed = isActuallyPlaying ? 0.08 : 0.01;
        waveOffset += speed;
        
        const baseAmp = isActuallyPlaying ? 35 : 8;
        const pulse = isActuallyPlaying ? (Math.sin(Date.now() / 300) * 10 + 25) : 0;
        const amplitude = baseAmp + pulse;
        
        drawSineWave(width, height, waveOffset, amplitude, color1, 0.005, height - 40);
        drawSineWave(width, height, waveOffset + 2, amplitude * 0.7, color2, 0.008, height - 30);
        drawSineWave(width, height, waveOffset - 2, amplitude * 0.4, '#ffffff', 0.01, height - 35);
        
        canvasCtx.shadowBlur = 0;
    }
}

// Sine wave drawing helper
function drawSineWave(width, height, offset, amp, color, freq, yBase) {
    canvasCtx.beginPath();
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = color;
    
    for (let x = 0; x < width; x++) {
        const y = yBase + Math.sin(x * freq + offset) * amp * Math.sin(x / width * Math.PI);
        if (x === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
    }
    canvasCtx.stroke();
}

// --- Slider Showcase Layout Engine ---
function initSliderLayout() {
    const trackGrid = document.querySelector(".track-grid");
    if (!trackGrid || !trackGrid.classList.contains("layout-slider")) return;
    
    const cards = trackGrid.querySelectorAll(".track-card");
    if (cards.length === 0) return;
    
    // Create dots in dots container
    const dotsContainer = document.querySelector(".slider-dots-container");
    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        cards.forEach((_, idx) => {
            const dot = document.createElement("div");
            dot.className = "slider-dot" + (idx === currentSlideIndex ? " active-dot" : "");
            dot.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(idx);
            });
            dotsContainer.appendChild(dot);
        });
    }
    
    // Ensure active slides classes are synchronized
    updateSlides();
    
    // Bind controls
    const prevBtn = document.querySelector(".btn-prev-slide");
    const nextBtn = document.querySelector(".btn-next-slide");
    
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            let prevIdx = currentSlideIndex - 1;
            if (prevIdx < 0) prevIdx = cards.length - 1;
            goToSlide(prevIdx, 'left');
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            let nextIdx = currentSlideIndex + 1;
            if (nextIdx >= cards.length) nextIdx = 0;
            goToSlide(nextIdx, 'right');
        };
    }
}

function goToSlide(index, direction) {
    const trackGrid = document.querySelector(".track-grid");
    if (!trackGrid) return;
    const cards = trackGrid.querySelectorAll(".track-card");
    if (cards.length === 0) return;
    
    currentSlideIndex = index;
    
    updateSlides();
}

function updateSlides() {
    const trackGrid = document.querySelector(".track-grid");
    if (!trackGrid) return;
    const cards = trackGrid.querySelectorAll(".track-card");
    if (cards.length === 0) return;
    
    // Bound check
    if (currentSlideIndex >= cards.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = cards.length - 1;
    
    cards.forEach((card, idx) => {
        card.classList.remove("active-slide", "slide-left", "slide-right");
        if (idx === currentSlideIndex) {
            card.classList.add("active-slide");
        } else if (idx < currentSlideIndex) {
            card.classList.add("slide-left");
        } else {
            card.classList.add("slide-right");
        }
    });
    
    // Sync dots highlight
    const dots = document.querySelectorAll(".slider-dot");
    dots.forEach((dot, idx) => {
        dot.classList.toggle("active-dot", idx === currentSlideIndex);
    });
}

// --- Scroll Reveal Animation ---
let observerInstance;
function setupScrollReveal() {
    const reveals = document.querySelectorAll(".reveal");
    
    if (observerInstance) {
        observerInstance.disconnect();
    }
    
    observerInstance = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });
    
    reveals.forEach(reveal => {
        observerInstance.observe(reveal);
    });
    
    // Add reveal class to main structural elements dynamically
    document.querySelectorAll(".hero-content, .hero-visual, .player-container, .track-card, .feature-card, .subscribe-card")
        .forEach(el => {
            el.classList.add("reveal");
            observerInstance.observe(el);
        });
}

// Start visualizer loop
drawVisualizer();

// Initialize application on load
window.addEventListener("DOMContentLoaded", initApp);
