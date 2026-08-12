(() => {
    // Idle pose rotateY(+40°) shows LEFT + FRONT + TOP.
    // Screen-left = left, screen-right = front, top = top
    const CUBE_MAP = {
        hero: {
            letters: { left: "O", front: "B", top: "C", right: "B", back: "O", bottom: "C" }
        },
        skills: {
            letters: { left: "S", front: "L", top: "K", right: "L", back: "S", bottom: "K" }
        },
        timeline: {
            letters: { left: "T", front: "L", top: "M", right: "L", back: "T", bottom: "M" }
        },
        projects: {
            letters: { left: "P", front: "J", top: "R", right: "J", back: "P", bottom: "R" }
        },
        setup: {
            letters: { left: "S", front: "P", top: "T", right: "P", back: "S", bottom: "T" }
        }
    };

    // left Х, top У, right Й
    const EASTER_LETTERS = {
        left: "Х",
        front: "Й",
        top: "У",
        right: "Й",
        back: "Х",
        bottom: "У"
    };

    const SECTION_KEYS = [
        { selector: "header.hero", key: "hero" },
        { selector: ".skills-section", key: "skills" },
        { selector: ".timeline-section", key: "timeline" },
        { selector: ".projects-section", key: "projects" },
        { selector: ".setup-section", key: "setup" }
    ];

    const rail = document.getElementById("cubeRail");
    const cssFlipper = document.getElementById("cube3dFlipper");
    const cubeHit = document.getElementById("cubeHit");

    if (!rail || !cssFlipper) return;

    /** What is currently painted on the cube faces */
    let displayedKey = "hero";
    let busy = false;
    let easterActive = false;
    let clickCount = 0;
    let clickResetTimer = null;
    let sectionTargets = [];
    /** Bumped to abort an in-flight flip when we need an instant snap */
    let flipGen = 0;
    let lastSectionChangeAt = 0;

    function waitTransition(el) {
        return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                el.removeEventListener("transitionend", done);
                resolve();
            };
            const done = (event) => {
                if (event.target !== el || event.propertyName !== "transform") return;
                finish();
            };
            el.addEventListener("transitionend", done);
            window.setTimeout(finish, 280);
        });
    }

    function delay(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    function applyLetters(letters) {
        cssFlipper.querySelectorAll(".cube-face").forEach((face) => {
            const role = face.dataset.face;
            face.textContent = letters[role] || "";
        });
    }

    /** Single source of truth: which section the viewport is on right now */
    function resolveActiveKey() {
        if (!sectionTargets.length) return "hero";

        const doc = document.documentElement;
        const scrollBottom = window.scrollY + window.innerHeight;
        const pageBottom = doc.scrollHeight;

        if (scrollBottom >= pageBottom - 48) {
            return sectionTargets[sectionTargets.length - 1].key;
        }

        const focusY = window.innerHeight * 0.32;

        for (const { el, key } of sectionTargets) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= focusY && rect.bottom > focusY) {
                return key;
            }
        }

        let bestKey = sectionTargets[0].key;
        let bestDist = Infinity;
        for (const { el, key } of sectionTargets) {
            const rect = el.getBoundingClientRect();
            const dist = Math.abs(rect.top - focusY);
            if (dist < bestDist) {
                bestDist = dist;
                bestKey = key;
            }
        }
        return bestKey;
    }

    async function flipToLetters(letters) {
        const gen = ++flipGen;

        cssFlipper.classList.remove("is-enter", "is-enter-prep");
        cssFlipper.classList.add("is-exit");
        await waitTransition(cssFlipper);
        if (gen !== flipGen) return false;

        applyLetters(letters);
        cssFlipper.classList.remove("is-exit");
        cssFlipper.classList.add("is-enter-prep");
        void cssFlipper.offsetWidth;
        cssFlipper.classList.remove("is-enter-prep");
        cssFlipper.classList.add("is-enter");
        await waitTransition(cssFlipper);
        if (gen !== flipGen) return false;

        cssFlipper.classList.remove("is-enter");
        return true;
    }

    /** Instant face change — aborts any flip in progress. */
    function snapToKey(key) {
        const conf = CUBE_MAP[key];
        flipGen += 1;
        busy = false;

        if (!conf) {
            rail.classList.add("is-hidden");
            displayedKey = key;
            return;
        }

        rail.classList.remove("is-hidden");
        applyLetters(conf.letters);
        cssFlipper.className = "cube-3d-flipper";
        displayedKey = key;
    }

    /**
     * Match cube to the section under the viewport.
     * animate:true → flip (slow browsing). animate:false / busy / rapid → snap.
     */
    async function syncCube({ animate = true } = {}) {
        const key = resolveActiveKey();
        const conf = CUBE_MAP[key];

        if (!conf) {
            snapToKey(key);
            return;
        }

        // Easter owns the faces until it finishes — then it will sync again
        if (easterActive) return;

        // Already showing the right section
        if (displayedKey === key) return;

        // Mid-flip or forced snap: update immediately, no queue
        if (!animate || busy) {
            snapToKey(key);
            return;
        }

        busy = true;
        try {
            const finished = await flipToLetters(conf.letters);
            if (finished) {
                displayedKey = key;
            }
        } finally {
            busy = false;
            // Catch up without starting another flip chain
            const latest = resolveActiveKey();
            if (!easterActive && latest !== displayedKey) {
                snapToKey(latest);
            }
        }
    }

    async function triggerEasterEgg() {
        if (easterActive || busy) return;

        easterActive = true;
        busy = true;
        rail.classList.add("is-easter");

        try {
            await flipToLetters(EASTER_LETTERS);
            // Not a real section key — forces restore path to treat faces as dirty
            displayedKey = "__easter__";
            await delay(2500);
        } finally {
            easterActive = false;
            busy = false;
            rail.classList.remove("is-easter");
            // Flip back to whatever section is on screen now
            await syncCube({ animate: true });
        }
    }

    function onCubeClick(event) {
        event.preventDefault();
        clickCount += 1;
        window.clearTimeout(clickResetTimer);
        clickResetTimer = window.setTimeout(() => {
            clickCount = 0;
        }, 1400);

        if (clickCount >= 5) {
            clickCount = 0;
            triggerEasterEgg();
        }
    }

    /**
     * Park the cube in the left gutter of .container.
     * If gutter is too small (zoom / narrow), collapse so it never overlaps content.
     */
    function placeCubeRail() {
        const container = document.querySelector(".container");
        if (!container || !rail) return;

        const rect = container.getBoundingClientRect();
        const gap = 28;
        const cubeW = rail.offsetWidth || 196;
        const gutter = rect.left;
        const minGutter = cubeW + gap + 8;

        if (gutter < minGutter || window.innerWidth < 1280) {
            rail.classList.add("is-collapsed");
            return;
        }

        rail.classList.remove("is-collapsed");
        const left = Math.max(8, rect.left - cubeW - gap);
        rail.style.left = `${left}px`;
        rail.style.top = `${Math.min(Math.max(96, window.innerHeight * 0.16), 168)}px`;
    }

    function initSectionTracking() {
        sectionTargets = SECTION_KEYS
            .map(({ selector, key }) => {
                const el = document.querySelector(selector);
                if (!el || key == null) return null;
                return { el, key };
            })
            .filter(Boolean);

        if (!sectionTargets.length) return;

        let ticking = false;
        /** Section changes closer than this → snap instead of flip (avoids lag queue). */
        const RAPID_MS = 260;

        const onScrollOrResize = (fromResize = false) => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                placeCubeRail();

                const key = resolveActiveKey();
                if (key === displayedKey || easterActive) return;

                const now = performance.now();
                const rapid = !fromResize && (now - lastSectionChangeAt) < RAPID_MS;
                lastSectionChangeAt = now;

                // Immediate: flip when browsing slowly, snap when scrubbing fast / resize
                syncCube({ animate: !fromResize && !rapid });
            });
        };

        window.addEventListener("scroll", () => onScrollOrResize(false), { passive: true });
        window.addEventListener("resize", () => onScrollOrResize(true), { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", () => onScrollOrResize(true), { passive: true });
            window.visualViewport.addEventListener("scroll", () => onScrollOrResize(false), { passive: true });
        }

        // Initial paint — place first, then unhide (avoids left:fallback → real jump)
        const key = resolveActiveKey();
        if (CUBE_MAP[key]) {
            applyLetters(CUBE_MAP[key].letters);
            displayedKey = key;
        }
        placeCubeRail();

        requestAnimationFrame(() => {
            rail.classList.remove("is-booting");
            if (CUBE_MAP[key] && !rail.classList.contains("is-collapsed")) {
                rail.classList.remove("is-hidden");
            }
        });
    }

    (cubeHit || cssFlipper).addEventListener("click", onCubeClick);
    initSectionTracking();
})();
