/* ===== Kecil Ceria - Storage (Player + Score) =====
   Every page includes this file BEFORE its own script.
   Exposes two globals: Player, Score
*/

const Player = {
    _key: 'kc_player_name',

    getName() {
        return localStorage.getItem(this._key) || 'Player One';
    },

    setName(name) {
        localStorage.setItem(this._key, name);
    }
};

const Score = {
    _key: 'kc_scores',

    _readAll() {
        try {
            return JSON.parse(localStorage.getItem(this._key)) || {};
        } catch (e) {
            return {};
        }
    },

    _writeAll(data) {
        localStorage.setItem(this._key, JSON.stringify(data));
    },

    // Call this at the end of a game round
    // gameId: e.g. 'isi-tempat-kosong', mode: 30 / 60 / 0 (unlimited)
    save(gameId, points, mode) {
        const all = this._readAll();
        if (!all[gameId]) {
            all[gameId] = { best: 0, timesPlayed: 0, history: [] };
        }
        all[gameId].best = Math.max(all[gameId].best, points);
        all[gameId].timesPlayed += 1;
        all[gameId].history.push({ score: points, mode, date: Date.now() });
        // Keep history from growing forever
        if (all[gameId].history.length > 20) {
            all[gameId].history = all[gameId].history.slice(-20);
        }
        this._writeAll(all);
    },

    getBest(gameId) {
        const all = this._readAll();
        return all[gameId] ? all[gameId].best : 0;
    },

    getGameStats(gameId) {
        const all = this._readAll();
        return all[gameId] || { best: 0, timesPlayed: 0, history: [] };
    },

    getAll() {
        return this._readAll();
    },

    getTotalStars() {
        const all = this._readAll();
        // Simple star rule: 1 star per game played to completion, capped per game at 3
        return Object.values(all).reduce((sum, g) => sum + Math.min(3, g.timesPlayed), 0);
    }
};
