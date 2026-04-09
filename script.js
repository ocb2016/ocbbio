history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ========== PRELOADER ==========
(function() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const minShowTime = 1200;
    const startTime = Date.now();

    window.addEventListener('load', function() {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minShowTime - elapsed);

        setTimeout(function() {
            preloader.classList.add('hidden');
            setTimeout(function() {
                preloader.remove();
            }, 600);
            // Start typing tagline after preloader fades
            setTimeout(function() {
                if (typeof typeTagline === 'function') typeTagline();
            }, 800);
        }, remaining);
    });
})();


// ========== CUSTOM CURSOR ==========
const cursor = document.createElement('div');
cursor.classList.add('custom-cursor');
document.body.appendChild(cursor);

let cursorX = -100, cursorY = -100;
let cursorVisible = false;

document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    if (!cursorVisible) { cursor.style.opacity = '1'; cursorVisible = true; }
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
});

document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    cursorVisible = false;
});

// Hover grow on interactive elements
const hoverTargets = 'a, button, .social-btn, .moon-btn, .sound-toggle, .skill-card, .project-card, .discord-card';
document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.add('hover');
});
document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.remove('hover');
});


// ========== PARTICLE / STAR FIELD ==========
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: -9999, y: -9999 };
let width, height;
let constellationMode = false;
let currentConstellation = null; // active constellation being animated
let constellationQueue = [];     // shuffled list of constellation indices to cycle through
let constellationQueueIdx = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Use same mouse tracking for particles
document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
document.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

// Touch support for mobile
document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    mouse.x = t.clientX;
    mouse.y = t.clientY;
}, { passive: true });
document.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

class Star {
    constructor() { this.reset(true); }

    reset(initial) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -10;
        this.size = Math.random() * 2 + 0.5;
        this.baseSize = this.size;
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.speedY = Math.random() * 0.3 + 0.1;
        this.baseSpeedX = this.speedX;
        this.baseSpeedY = this.speedY;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.twinkleIntensity = Math.random() * 0.3 + 0.1;
        this.targetX = null;
        this.targetY = null;
        this.anchored = false;
    }

    update(time) {
        if (this.anchored && this.targetX !== null) {
            // Плавно притягиваемся к цели, замедляя дрейф
            this.x += (this.targetX - this.x) * 0.025;
            this.y += (this.targetY - this.y) * 0.025;
            this.speedX *= 0.97;
            this.speedY *= 0.97;
            this.size += (this.baseSize * 1.6 - this.size) * 0.03;
        } else {
            // Восстанавливаем скорость после отпускания
            this.speedX += (this.baseSpeedX - this.speedX) * 0.01;
            this.speedY += (this.baseSpeedY - this.speedY) * 0.01;
            this.size += (this.baseSize - this.size) * 0.03;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y > height + 10) this.reset(false);

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
            const force = (100 - dist) / 100;
            this.x += (dx / dist) * force * 1.5;
            this.y += (dy / dist) * force * 1.5;
        }

        this.currentOpacity = this.opacity + Math.sin(time * this.pulseSpeed + this.pulseOffset) * this.twinkleIntensity;
    }

    draw() {
        const o = Math.max(0, Math.min(1, this.currentOpacity));
        // Glow
        ctx.save();
        ctx.globalAlpha = o * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 220, 230, 1)';
        ctx.fill();
        ctx.restore();
        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 240, 245, ${o})`;
        ctx.fill();
    }
}

function initParticles() {
    const count = Math.min(Math.floor((width * height) / 7000), 220);
    particles = [];
    for (let i = 0; i < count; i++) particles.push(new Star());
}
initParticles();
window.addEventListener('resize', initParticles);

function drawConnections() {
    const maxDist = 90;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(180, 180, 190, ${(1 - dist / maxDist) * 0.04})`;
                ctx.lineWidth = 0.4;
                ctx.stroke();
            }
        }
    }

    // Constellation lines
    if (currentConstellation && currentConstellation.lineOpacity > 0) {
        const c = currentConstellation;
        const edges = c.edges;
        const stars = c.stars;
        edges.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(stars[a].x, stars[a].y);
            ctx.lineTo(stars[b].x, stars[b].y);
            ctx.strokeStyle = `rgba(200, 200, 215, ${c.lineOpacity * 0.3})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });
        // Glow on anchor stars
        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 220, 235, ${c.lineOpacity * 0.2})`;
            ctx.fill();
        });
    }
}

let time = 0;
function animate() {
    ctx.clearRect(0, 0, width, height);
    time++;
    particles.forEach(p => { p.update(time); p.draw(); });
    updateConstellations();
    drawConnections();
    requestAnimationFrame(animate);
}
animate();


// ========== DISCORD PRESENCE (Lanyard WebSocket) ==========
const DISCORD_USER_ID = '1268632081748197508';

let lanyardWs = null;
let lanyardHeartbeat = null;

function connectLanyard() {
    if (lanyardWs) { try { lanyardWs.close(); } catch (_) {} }

    lanyardWs = new WebSocket('wss://api.lanyard.rest/socket');

    lanyardWs.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.op === 1) {
            // Hello — start heartbeat and subscribe
            const interval = msg.d.heartbeat_interval;
            if (lanyardHeartbeat) clearInterval(lanyardHeartbeat);
            lanyardHeartbeat = setInterval(() => {
                if (lanyardWs.readyState === WebSocket.OPEN) {
                    lanyardWs.send(JSON.stringify({ op: 3 }));
                }
            }, interval);

            lanyardWs.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: DISCORD_USER_ID }
            }));
        }

        if (msg.op === 0) {
            // INIT_STATE or PRESENCE_UPDATE
            const data = msg.t === 'INIT_STATE' ? msg.d : msg.d;
            document.getElementById('dcHint').textContent = '';
            updateDiscordCard(data);
        }
    };

    lanyardWs.onclose = () => {
        if (lanyardHeartbeat) { clearInterval(lanyardHeartbeat); lanyardHeartbeat = null; }
        setTimeout(connectLanyard, 5000);
    };

    lanyardWs.onerror = () => { lanyardWs.close(); };
}

let elapsedInterval = null;

function updateDiscordCard(data) {
    const dot = document.getElementById('dcStatusDot');
    const statusText = document.getElementById('dcStatusText');
    const activityWrap = document.getElementById('dcActivity');
    const activityName = document.getElementById('dcActivityName');
    const activityDetails = document.getElementById('dcActivityDetails');
    const activityState = document.getElementById('dcActivityState');
    const activityLabel = document.getElementById('dcActivityLabel');
    const activityImg = document.getElementById('dcActivityImg');
    const card = document.getElementById('discordCard');

    dot.className = 'dc-status-dot ' + data.discord_status;
    statusText.style.display = 'none';

    // Status glow
    card.setAttribute('data-status', data.discord_status);

    // Clear elapsed timer
    if (elapsedInterval) { clearInterval(elapsedInterval); elapsedInterval = null; }

    // Reset activity image
    activityImg.style.display = 'none';
    activityImg.src = '';

    // Only show non-custom-status activities (type 4 = custom status, skip it)
    const activity = data.activities ? data.activities.find(a => a.type !== 4) : null;

    if (activity) {
        activityWrap.classList.add('active');
        activityLabel.textContent = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' }[activity.type] || 'Playing';
        activityName.textContent = activity.name;

        // Activity image (Rich Presence)
        const largeImage = activity.assets?.large_image;
        if (largeImage) {
            if (largeImage.startsWith('mp:')) {
                activityImg.src = 'https://media.discordapp.net/' + largeImage.slice(3);
                activityImg.style.display = 'block';
            } else if (activity.application_id) {
                activityImg.src = 'https://cdn.discordapp.com/app-assets/' + activity.application_id + '/' + largeImage + '.png';
                activityImg.style.display = 'block';
            }
        }

        // Details line
        if (activity.details) {
            activityDetails.textContent = activity.details;
            activityDetails.style.display = 'block';
        } else {
            activityDetails.style.display = 'none';
        }

        // Elapsed time
        if (activity.timestamps?.start) {
            const startTs = activity.timestamps.start;
            const updateElapsed = () => {
                const diff = Math.floor((Date.now() - startTs) / 1000);
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                activityState.textContent = (h > 0 ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0') + ' elapsed';
                activityState.style.display = 'block';
            };
            updateElapsed();
            elapsedInterval = setInterval(updateElapsed, 1000);
        } else {
            activityState.style.display = 'none';
        }
    } else {
        activityWrap.classList.remove('active');
    }

    // Spotify from Lanyard — overrides activity display
    if (data.spotify) {
        activityWrap.classList.add('active');
        activityLabel.textContent = 'Listening to';
        activityName.textContent = data.spotify.song || '';
        activityDetails.textContent = data.spotify.artist || '';
        activityDetails.style.display = data.spotify.artist ? 'block' : 'none';
        activityState.style.display = 'none';

        // Spotify album art
        if (data.spotify.album_art_url) {
            activityImg.src = data.spotify.album_art_url;
            activityImg.style.display = 'block';
        }

        // Clear elapsed for spotify (has its own timing)
        if (elapsedInterval) { clearInterval(elapsedInterval); elapsedInterval = null; }
    }
}

connectLanyard();


// ========== DISCORD COPY ==========
let toastTimer = null;
function copyUsername() {
    const text = 'ocb2016';
    const toast = document.getElementById('copyToast');

    const showToast = () => {
        if (toastTimer) clearTimeout(toastTimer);
        toast.classList.remove('show');
        void toast.offsetWidth;
        toast.classList.add('show');
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showToast).catch(() => {
            fallbackCopy(text, showToast);
        });
    } else {
        fallbackCopy(text, showToast);
    }
}

function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
    cb();
}

const discordBtn = document.getElementById('discordCopyBtn');
if (discordBtn) {
    discordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        copyUsername();
    });
}

const discordCard = document.getElementById('discordCard');
if (discordCard) {
    discordCard.addEventListener('click', function() {
        copyUsername();
    });
}


// ========== SCROLL REVEAL ==========
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const delay = parseFloat(entry.target.style.transitionDelay) || 0;
            if (delay > 0) {
                setTimeout(() => { entry.target.style.transitionDelay = ''; }, delay * 1000 + 600);
            }
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.skill-category').forEach(el => observer.observe(el));
document.querySelectorAll('.projects-section .project-card').forEach(el => observer.observe(el));
document.querySelectorAll('.timeline-item').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.05) + 's';
    observer.observe(el);
});
document.querySelectorAll('.timeline-year').forEach(el => observer.observe(el));
document.querySelectorAll('.skill-card').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.04) + 's';
    observer.observe(el);
});
document.querySelectorAll('.setup-grid').forEach(el => observer.observe(el));


// ========== SKILL BAR ANIMATION ==========
const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-fill').forEach((fill, i) => {
                setTimeout(() => { fill.style.width = fill.dataset.level + '%'; }, i * 80);
            });
        }
    });
}, { threshold: 0.2 });
document.querySelectorAll('.skill-cards').forEach(el => barObserver.observe(el));


// ========== TILT EFFECT ==========
document.querySelectorAll('.skill-card').forEach(card => {
    card.style.perspective = '600px';
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -4;
        const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 4;
        card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});


// ========== SCROLL INDICATOR ==========
const hero = document.querySelector('.hero');
const scrollIndicator = document.createElement('div');
scrollIndicator.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>';
scrollIndicator.style.cssText = 'position:absolute;bottom:40px;left:50%;transform:translateX(-50%);color:rgba(82,82,91,0.6);animation:bounce-down 2.5s ease-in-out infinite;cursor:none;transition:opacity 0.5s ease;';
hero.appendChild(scrollIndicator);

const bounceStyle = document.createElement('style');
bounceStyle.textContent = '@keyframes bounce-down{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}';
document.head.appendChild(bounceStyle);

window.addEventListener('scroll', () => { scrollIndicator.style.opacity = Math.max(0, 1 - window.scrollY / 200); }, { passive: true });
scrollIndicator.addEventListener('click', () => { document.querySelector('.skills-section').scrollIntoView({ behavior: 'smooth' }); });


// ========== TAGLINE TYPING ==========
const tagline = document.querySelector('.tagline');
const cursorSpan = document.createElement('span');
cursorSpan.textContent = '_';
cursorSpan.style.cssText = 'color:var(--text-dim);-webkit-text-fill-color:var(--text-dim);animation:blink-cursor 1s step-end infinite;margin-left:2px;';
const cursorStyleEl = document.createElement('style');
cursorStyleEl.textContent = '@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}';
document.head.appendChild(cursorStyleEl);

// Clear tagline content, keep only cursor
tagline.innerHTML = '';
tagline.appendChild(cursorSpan);
// Disable shimmer during typing
tagline.style.animation = 'fade-up 0.8s 0.6s ease forwards';

function typeTagline() {
    const fullText = 'developer / 3d artist / creator';
    let i = 0;

    function typeChar() {
        if (i >= fullText.length) {
            // Re-enable shimmer after typing completes
            tagline.style.animation = 'shimmer-subtle 8s ease-in-out infinite';
            tagline.style.opacity = '1';
            return;
        }

        const char = fullText[i];

        // Check if we're at a separator '/'
        if (char === '/') {
            const sep = document.createElement('span');
            sep.className = 'separator';
            sep.textContent = '/';
            tagline.insertBefore(sep, cursorSpan);
        } else {
            tagline.insertBefore(document.createTextNode(char), cursorSpan);
        }

        i++;
        setTimeout(typeChar, 70);
    }

    typeChar();
}


// ========== AMBIENT SOUND ==========
const audio = document.getElementById('ambient');
const soundBtn = document.getElementById('soundToggle');
const soundOn = soundBtn.querySelector('.sound-on');
const soundOff = soundBtn.querySelector('.sound-off');
let isPlaying = false;
audio.volume = 0.3;

soundBtn.addEventListener('click', () => {
    if (isPlaying) {
        audio.pause(); soundOn.style.display = 'none'; soundOff.style.display = 'block'; soundBtn.classList.remove('active');
    } else {
        audio.play().catch(() => {}); soundOn.style.display = 'block'; soundOff.style.display = 'none'; soundBtn.classList.add('active');
    }
    isPlaying = !isPlaying;
});


// ========== CONSTELLATION MODE ==========
const moonBtn = document.getElementById('moonBtn');

// Real constellation patterns — normalized coords [0..1] and edges
const CONSTELLATIONS = [
    { // Ursa Major (Big Dipper)
        name: 'Ursa Major',
        points: [[0,0],[0.18,0.05],[0.35,0.02],[0.5,0.08],[0.58,0.25],[0.48,0.4],[0.62,0.48]],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,5]]
    },
    { // Orion
        name: 'Orion',
        points: [[0.2,0],[0.45,0.05],[0.05,0.35],[0.25,0.38],[0.35,0.38],[0.55,0.35],[0.15,0.7],[0.5,0.75]],
        edges: [[0,2],[0,3],[1,5],[1,4],[2,6],[5,7],[3,4]]
    },
    { // Cassiopeia (W shape)
        name: 'Cassiopeia',
        points: [[0,0.3],[0.22,0],[0.42,0.35],[0.62,0.05],[0.85,0.3]],
        edges: [[0,1],[1,2],[2,3],[3,4]]
    },
    { // Leo
        name: 'Leo',
        points: [[0,0.45],[0.12,0.2],[0.25,0.08],[0.38,0.15],[0.35,0.35],[0.55,0.5],[0.75,0.45]],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[4,5],[5,6]]
    },
    { // Cygnus (Northern Cross)
        name: 'Cygnus',
        points: [[0.5,0],[0.35,0.3],[0.5,0.45],[0.65,0.3],[0.5,0.85]],
        edges: [[0,2],[1,3],[2,4],[1,2],[2,3]]
    },
    { // Lyra
        name: 'Lyra',
        points: [[0.4,0],[0.2,0.35],[0.35,0.6],[0.65,0.6],[0.8,0.35]],
        edges: [[0,1],[0,4],[1,2],[2,3],[3,4]]
    },
    { // Gemini
        name: 'Gemini',
        points: [[0.15,0],[0.45,0.05],[0.1,0.3],[0.4,0.35],[0.05,0.65],[0.35,0.7],[0.2,0.9],[0.5,0.95]],
        edges: [[0,2],[2,4],[4,6],[1,3],[3,5],[5,7],[0,1]]
    }
];

function shuffleQueue() {
    constellationQueue = CONSTELLATIONS.map((_, i) => i);
    for (let i = constellationQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [constellationQueue[i], constellationQueue[j]] = [constellationQueue[j], constellationQueue[i]];
    }
    constellationQueueIdx = 0;
}

function getNextConstellation() {
    if (constellationQueueIdx >= constellationQueue.length) shuffleQueue();
    return CONSTELLATIONS[constellationQueue[constellationQueueIdx++]];
}

function spawnConstellation() {
    if (!constellationMode) return;

    const template = getNextConstellation();
    const starCount = template.points.length;

    // Random placement — scale and position on screen
    const scale = 120 + Math.random() * 140; // constellation size in px
    const offsetX = 100 + Math.random() * (width - 200);
    const offsetY = 80 + Math.random() * (height - 160);

    // Map template points to screen coords
    const targets = template.points.map(([nx, ny]) => ({
        x: offsetX + (nx - 0.4) * scale,
        y: offsetY + (ny - 0.4) * scale
    }));

    // For each target, pick the closest free particle
    const used = new Set();
    const stars = [];
    targets.forEach(t => {
        let best = null, bestDist = Infinity;
        particles.forEach(p => {
            if (used.has(p)) return;
            const d = Math.hypot(p.x - t.x, p.y - t.y);
            if (d < bestDist) { bestDist = d; best = p; }
        });
        if (best) {
            used.add(best);
            best.anchored = true;
            best.targetX = t.x;
            best.targetY = t.y;
            stars.push(best);
        }
    });

    currentConstellation = {
        stars,
        edges: template.edges,
        name: template.name,
        phase: 'gather', // gather → lines_in → hold → lines_out → release → pause
        timer: 0,
        lineOpacity: 0
    };
}

function releaseConstellation() {
    if (!currentConstellation) return;
    currentConstellation.stars.forEach(s => {
        s.anchored = false;
        s.targetX = null;
        s.targetY = null;
    });
    currentConstellation = null;
}

// Phases (in frames at ~60fps):
// gather: 120 (~2s) — stars move to positions
// lines_in: 75 (~1.25s) — lines fade in
// hold: 240 (~4s) — visible
// lines_out: 120 (~2s) — lines fade out
// release: 90 (~1.5s) — stars drift back
// pause: 360 (~6s) — gap before next

function updateConstellations() {
    if (!currentConstellation) {
        if (constellationMode) spawnConstellation();
        return;
    }

    const c = currentConstellation;
    c.timer++;

    switch (c.phase) {
        case 'gather':
            if (c.timer >= 120) { c.phase = 'lines_in'; c.timer = 0; }
            break;
        case 'lines_in':
            c.lineOpacity = Math.min(1, c.timer / 75);
            if (c.timer >= 75) { c.phase = 'hold'; c.timer = 0; }
            break;
        case 'hold':
            c.lineOpacity = 1;
            if (c.timer >= 240) { c.phase = 'lines_out'; c.timer = 0; }
            break;
        case 'lines_out':
            c.lineOpacity = Math.max(0, 1 - c.timer / 120);
            if (c.timer >= 120) { c.phase = 'release'; c.timer = 0; }
            break;
        case 'release':
            c.lineOpacity = 0;
            if (c.timer === 1) {
                c.stars.forEach(s => { s.anchored = false; s.targetX = null; s.targetY = null; });
            }
            if (c.timer >= 90) { c.phase = 'pause'; c.timer = 0; }
            break;
        case 'pause':
            if (c.timer >= 360) {
                currentConstellation = null;
                // Next one will spawn on next frame via updateConstellations
            }
            break;
    }
}

moonBtn.addEventListener('click', () => {
    if (constellationMode) {
        constellationMode = false;
        moonBtn.classList.remove('active');
        releaseConstellation();
    } else {
        constellationMode = true;
        moonBtn.classList.add('active');
        shuffleQueue();
    }
});


// ========== PARALLAX GLOW ==========
document.addEventListener('mousemove', (e) => {
    const glow = document.querySelector('.hero-glow');
    if (!glow) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    glow.style.transform = `translate(calc(-50% + ${x}px), calc(-55% + ${y}px))`;
});


// ========== PROJECT CARDS ==========
// Mobile tap toggle (touch devices only)
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            card.classList.toggle('expanded');
        });
    });
}

// Tilt effect for project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.style.perspective = '600px';
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -4;
        const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 4;
        card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});


// ========== SCROLL TO TOP ==========
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
}, { passive: true });
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


