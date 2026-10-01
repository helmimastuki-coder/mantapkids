/* ===== MantapKids - Effects =====
   Tiered feedback system: Joy1/2/3 for correct answers (scales with streak),
   Sad1/2/3 for wrong answers (scales with consecutive misses).
   Exposes globals: Effects, EffectsConfig

   HOW IT WORKS:
   - Effects.correct() / Effects.wrong() are what games already call.
   - Internally, Effects tracks a streak (consecutive correct) and a miss
     count (consecutive wrong), and picks a tier automatically.
   - A game can also force a specific tier, e.g. for "all correct" bonus:
       Effects.correct('Semua Betul!', { tier: 3 })
   - Tune the thresholds/intensity below without touching any game code.
*/

const EffectsConfig = {
    // How many in a row triggers each joy tier (tier 1 is the default/base)
    joyThresholds: { tier2: 3, tier3: 5 },
    // How many consecutive misses triggers each sad tier
    sadThresholds: { tier2: 2, tier3: 3 },
    // Confetti particle count per tier
    confettiCounts: { 1: 10, 2: 30, 3: 50 }
};

const Effects = {
    _streak: 0,
    _misses: 0,

    toast(message, type = 'info', duration = 1200) {
        const styles = {
            success: 'bg-emerald-500',
            error: 'bg-rose-500',
            info: 'bg-amber-500'
        };

        const animStyles = {
            success: 'animate-bounce',
            error: 'animate-shake',
            info: 'animate-bounce'
        };

        // Outer wrapper controls position (centering)
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.bottom = '2.5rem';
        wrapper.style.left = '50%';
        wrapper.style.transform = 'translateX(-50%)';
        wrapper.style.zIndex = '50';
        wrapper.style.whiteSpace = 'nowrap';

        // Inner element handles look & animation (so the animation's own
        // transform doesn't fight the centering transform above)
        const el = document.createElement('div');
        el.className = `text-white px-8 py-3 rounded-full font-bold shadow-2xl text-lg ${styles[type] || styles.info} ${animStyles[type] || animStyles.info}`;
        el.style.textAlign = 'center';
        el.innerHTML = message;

        wrapper.appendChild(el);
        document.body.appendChild(wrapper);

        setTimeout(() => {
            if (wrapper.parentNode) wrapper.remove();
        }, duration);
    },

    // Confetti burst — silently does nothing if canvas-confetti isn't loaded
    // on this page, so it never breaks a game that skips the script tag.
    confettiBurst(count) {
        if (typeof confetti !== 'function') return;
        confetti({
            particleCount: count,
            spread: 55 + count * 3,
            origin: { y: 0.6 },
            startVelocity: 22 + count
        });
    },

    shakeScreen() {
        const el = document.getElementById('game-content') || document.body;
        el.classList.remove('animate-shake');
        void el.offsetWidth; // restart the CSS animation
        el.classList.add('animate-shake');
    },

    _resolveJoyTier() {
        if (this._streak >= EffectsConfig.joyThresholds.tier3) return 3;
        if (this._streak >= EffectsConfig.joyThresholds.tier2) return 2;
        return 1;
    },

    _resolveSadTier() {
        if (this._misses >= EffectsConfig.sadThresholds.tier3) return 3;
        if (this._misses >= EffectsConfig.sadThresholds.tier2) return 2;
        return 1;
    },

    _playJoy(tier) {
        const count = EffectsConfig.confettiCounts[tier] || EffectsConfig.confettiCounts[1];
        this.confettiBurst(count);
        // Note: tier 3 used to also shake the screen here. Removed — a shake
        // read as a "bad" signal even in a happy context, so correct streaks
        // now just get bigger confetti, no shake.
    },

    _playSad(tier) {
        // Tier 1: just the toast (already shakes itself via the 'error' style above)
        if (tier >= 2) this.shakeScreen();
    },

    // ===== Public API used by games =====

    correct(message = '🌟 Hebat! Betul!', options = {}) {
        this._streak += 1;
        this._misses = 0;
        this.toast(message, 'success');

        const tier = options.tier || this._resolveJoyTier();
        this._playJoy(tier);
    },

    wrong(message = '❌ Cuba lagi!', options = {}) {
        this._misses += 1;
        this._streak = 0;
        this.toast(message, 'error', 800);

        const tier = options.tier || this._resolveSadTier();
        this._playSad(tier);
    },

    // For round/game-complete moments — always the biggest celebration,
    // regardless of the current streak.
    celebrate(message = '🎉 Tahniah!') {
        this.toast(message, 'success', 2000);
        this._playJoy(3);
    },

    info(message) {
        this.toast(message, 'info', 2500);
    },

    // Call when starting a fresh round/game so an old streak doesn't carry over
    resetStreak() {
        this._streak = 0;
        this._misses = 0;
    }
};
