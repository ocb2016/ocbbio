const DISCORD_USER_ID = "1268632081748197508";

const discordCard = document.getElementById("discordCard");
const discordButton = document.getElementById("discordCopyBtn");
const copyToast = document.getElementById("copyToast");
const scrollTopButton = document.getElementById("scrollTopBtn");
const hero = document.getElementById("hero");
const navIsland = document.getElementById("navIsland");
const closedToggle = document.getElementById("closedToggle");
const closedProjects = document.getElementById("closedProjects");

let toastTimer = null;
let lanyardSocket = null;
let lanyardHeartbeat = null;
let elapsedInterval = null;

function showCopyToast() {
    window.clearTimeout(toastTimer);
    copyToast.classList.add("show");
    toastTimer = window.setTimeout(() => copyToast.classList.remove("show"), 1800);
}

function fallbackCopy(text) {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
}

async function copyUsername() {
    const username = "ocbxvi";

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(username);
        } else {
            fallbackCopy(username);
        }
    } catch {
        fallbackCopy(username);
    }

    showCopyToast();
}

function updateActivity(data) {
    const dot = document.getElementById("dcStatusDot");
    const activityWrap = document.getElementById("dcActivity");
    const activityLabel = document.getElementById("dcActivityLabel");
    const activityName = document.getElementById("dcActivityName");
    const activityDetails = document.getElementById("dcActivityDetails");
    const activityState = document.getElementById("dcActivityState");
    const activityImage = document.getElementById("dcActivityImg");

    dot.className = `dc-status-dot ${data.discord_status || "offline"}`;
    window.clearInterval(elapsedInterval);
    elapsedInterval = null;

    const activity = data.spotify || data.activities?.find((item) => item.type !== 4);
    if (!activity) {
        activityWrap.classList.remove("active");
        return;
    }

    activityWrap.classList.add("active");

    if (data.spotify) {
        activityLabel.textContent = "Listening to";
        activityName.textContent = data.spotify.song || "";
        activityDetails.textContent = data.spotify.artist || "";
        activityDetails.style.display = data.spotify.artist ? "block" : "none";
        activityState.style.display = "none";
        activityImage.src = data.spotify.album_art_url || "";
        activityImage.style.display = data.spotify.album_art_url ? "block" : "none";
        return;
    }

    const labels = {
        0: "Playing",
        1: "Streaming",
        2: "Listening to",
        3: "Watching",
        5: "Competing in"
    };
    activityLabel.textContent = labels[activity.type] || "Playing";
    activityName.textContent = activity.type === 2 && activity.details ? activity.details : activity.name || "";

    const details = activity.type === 2 && activity.state ? activity.state : activity.details;
    activityDetails.textContent = details || "";
    activityDetails.style.display = details ? "block" : "none";

    const image = activity.assets?.large_image;
    if (image?.startsWith("mp:")) {
        activityImage.src = `https://media.discordapp.net/${image.slice(3)}`;
    } else if (image && activity.application_id) {
        activityImage.src = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png`;
    } else {
        activityImage.src = "";
    }
    activityImage.style.display = activityImage.src ? "block" : "none";

    if (!activity.timestamps?.start) {
        activityState.style.display = "none";
        return;
    }

    const updateElapsed = () => {
        const seconds = Math.max(0, Math.floor((Date.now() - activity.timestamps.start) / 1000));
        const minutes = Math.floor(seconds / 60);
        activityState.textContent = `${minutes}:${String(seconds % 60).padStart(2, "0")} elapsed`;
        activityState.style.display = "block";
    };

    updateElapsed();
    elapsedInterval = window.setInterval(updateElapsed, 1000);
}

function connectLanyard() {
    if (lanyardSocket) {
        lanyardSocket.close();
    }

    lanyardSocket = new WebSocket("wss://api.lanyard.rest/socket");
    lanyardSocket.onmessage = ({ data }) => {
        const message = JSON.parse(data);

        if (message.op === 1) {
            window.clearInterval(lanyardHeartbeat);
            lanyardHeartbeat = window.setInterval(() => {
                if (lanyardSocket.readyState === WebSocket.OPEN) {
                    lanyardSocket.send(JSON.stringify({ op: 3 }));
                }
            }, message.d.heartbeat_interval);

            lanyardSocket.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: DISCORD_USER_ID }
            }));
        }

        if (message.op === 0) {
            updateActivity(message.d);
        }
    };

    lanyardSocket.onclose = () => {
        window.clearInterval(lanyardHeartbeat);
        window.setTimeout(connectLanyard, 5000);
    };

    lanyardSocket.onerror = () => lanyardSocket.close();
}

discordButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    copyUsername();
});

discordCard?.addEventListener("click", copyUsername);

window.addEventListener("scroll", () => {
    scrollTopButton.classList.toggle("visible", window.scrollY > 480);
}, { passive: true });

scrollTopButton?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

/**
 * Hero-visible → island hidden (nav is static in header).
 * Hero gone → island slides in like a compact pill.
 */
function initNavIsland() {
    if (!hero || !navIsland) return;

    const setIsland = (visible) => {
        navIsland.classList.toggle("is-visible", visible);
        navIsland.setAttribute("aria-hidden", String(!visible));
    };

    if (!("IntersectionObserver" in window)) {
        const onScroll = () => setIsland(window.scrollY > hero.offsetHeight * 0.6);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return;
    }

    const observer = new IntersectionObserver(([entry]) => {
        // Hide island while any of the hero is still on screen
        setIsland(!entry.isIntersecting);
    }, {
        threshold: 0,
        rootMargin: "-12px 0px 0px 0px"
    });

    observer.observe(hero);
}

initNavIsland();

function groupTimelineByYear() {
    const timeline = document.querySelector(".timeline");
    if (!timeline) return;

    const groups = document.createDocumentFragment();
    let currentEvents = null;

    [...timeline.children].forEach((item) => {
        if (item.classList.contains("timeline-line")) return;

        if (item.classList.contains("timeline-year")) {
            const group = document.createElement("section");
            group.className = "timeline-group";
            currentEvents = document.createElement("div");
            currentEvents.className = "timeline-events";
            group.append(item, currentEvents);
            groups.append(group);
            return;
        }

        if (item.classList.contains("timeline-item") && currentEvents) {
            currentEvents.append(item);
        }
    });

    timeline.replaceChildren(groups);
}

groupTimelineByYear();

/** Featured stays open; closed list is collapsed by default. */
function initClosedProjectsToggle() {
    if (!closedToggle || !closedProjects) return;

    const label = closedToggle.querySelector(".projects-toggle-label");

    closedToggle.addEventListener("click", () => {
        const open = closedToggle.getAttribute("aria-expanded") === "true";
        const next = !open;
        closedToggle.setAttribute("aria-expanded", String(next));
        closedProjects.hidden = !next;
        if (label) {
            label.textContent = next ? "Hide closed" : "Show closed";
        }

        // Hidden cards never hit IntersectionObserver — force-reveal on open
        if (next) {
            closedProjects.querySelectorAll(".project-card").forEach((card, i) => {
                if (!card.classList.contains("is-visible")) {
                    paintReveal(card, Math.min(i, 8) * 40);
                }
            });
        }
    });
}

initClosedProjectsToggle();

/** Highlight the section currently in view. */
function initNavSpy() {
    const links = [...document.querySelectorAll(".nav-link")];
    if (!links.length) return;

    const sections = links
        .map((link) => {
            const id = link.getAttribute("href")?.slice(1);
            const el = id ? document.getElementById(id) : null;
            return el ? { link, el } : null;
        })
        .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    const setActive = (id) => {
        links.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
            setActive(visible[0].target.id);
        }
    }, {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5]
    });

    sections.forEach(({ el }) => observer.observe(el));
}

initNavSpy();

const revealTargets = [
    ...document.querySelectorAll(".physics-element, .skill-category, .project-card, .setup-grid")
];

function paintReveal(target, delayMs) {
    target.style.setProperty("--reveal-delay", `${delayMs}ms`);
    target.classList.add("is-visible");
}

/**
 * IntersectionObserver delivers entries in arbitrary order. Batch them per frame,
 * sort by real DOM order, then stagger — so later cards never animate before earlier ones.
 */
function createRevealController() {
    const pending = new Set();
    let flushScheduled = false;

    const byDocumentOrder = (a, b) => {
        if (a === b) return 0;
        const pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
    };

    const flush = () => {
        flushScheduled = false;
        const batch = [...pending].sort(byDocumentOrder);
        pending.clear();

        batch.forEach((target, i) => {
            const delayMs = Math.min(i, 8) * 50;
            paintReveal(target, delayMs);
        });
    };

    return {
        enqueue(target) {
            if (target.classList.contains("is-visible")) return;
            pending.add(target);
            if (flushScheduled) return;
            flushScheduled = true;
            requestAnimationFrame(flush);
        },
        revealAll(targets) {
            [...targets].sort(byDocumentOrder).forEach((target, i) => {
                paintReveal(target, Math.min(i, 8) * 50);
            });
        }
    };
}

const reveal = createRevealController();

if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            revealObserver.unobserve(entry.target);
            reveal.enqueue(entry.target);
        });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    revealTargets.forEach((target) => revealObserver.observe(target));
} else {
    reveal.revealAll(revealTargets);
}

connectLanyard();
