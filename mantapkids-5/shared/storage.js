/* ===== MantapKids - Storage (Player + Score) =====
   Every page includes this file BEFORE its own script.
   Exposes two globals: Player, Score
*/

/* ===== MantapKids - Storage (Profiles + Score) =====
   Every page includes this file BEFORE its own script.
   Exposes two globals: Profiles, Score

   MODEL: "1 browser = 1 parent". A parent can create up to
   MAX_PROFILES kid profiles, stored locally. One profile is "active"
   at a time; Score automatically saves against whichever profile is
   active, so individual games never need to know profiles exist.
*/

const Profiles = {
    _key: 'mk_profiles',
    _activeKey: 'mk_active_profile',
    MAX_PROFILES: 3,

    _readAll() {
        try {
            return JSON.parse(localStorage.getItem(this._key)) || [];
        } catch (e) {
            return [];
        }
    },

    _writeAll(list) {
        localStorage.setItem(this._key, JSON.stringify(list));
    },

    list() {
        return this._readAll();
    },

    hasAny() {
        return this._readAll().length > 0;
    },

    canAddMore() {
        return this._readAll().length < this.MAX_PROFILES;
    },

    create(name, avatar = '😊') {
        if (!this.canAddMore()) return null;
        const all = this._readAll();
        const profile = {
            id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name.trim(),
            avatar,
            createdAt: Date.now()
        };
        all.push(profile);
        this._writeAll(all);
        if (!this.getActiveId()) this.setActive(profile.id);
        return profile;
    },

    rename(id, newName) {
        const all = this._readAll();
        const p = all.find(p => p.id === id);
        if (p) {
            p.name = newName.trim();
            this._writeAll(all);
        }
    },

    setAvatar(id, avatar) {
        const all = this._readAll();
        const p = all.find(p => p.id === id);
        if (p) {
            p.avatar = avatar;
            this._writeAll(all);
        }
    },

    delete(id) {
        const all = this._readAll().filter(p => p.id !== id);
        this._writeAll(all);
        localStorage.removeItem(`mk_scores_${id}`); // clean up that profile's scores too
        if (this.getActiveId() === id) {
            this.setActive(all.length > 0 ? all[0].id : null);
        }
    },

    getActiveId() {
        return localStorage.getItem(this._activeKey);
    },

    setActive(id) {
        if (id) {
            localStorage.setItem(this._activeKey, id);
        } else {
            localStorage.removeItem(this._activeKey);
        }
    },

    getActive() {
        const id = this.getActiveId();
        return this._readAll().find(p => p.id === id) || null;
    }
};

const Score = {
    _keyFor(profileId) {
        return `mk_scores_${profileId}`;
    },

    _readAll(profileId) {
        if (!profileId) return {};
        try {
            return JSON.parse(localStorage.getItem(this._keyFor(profileId))) || {};
        } catch (e) {
            return {};
        }
    },

    _writeAll(profileId, data) {
        localStorage.setItem(this._keyFor(profileId), JSON.stringify(data));
    },

    // Called by games. Always saves against the CURRENT active profile,
    // so games never need to pass a profile id.
    save(gameId, points, mode) {
        const profileId = Profiles.getActiveId();
        if (!profileId) return; // no profile selected yet, nothing to save against

        const all = this._readAll(profileId);
        if (!all[gameId]) {
            all[gameId] = { best: 0, timesPlayed: 0, history: [] };
        }
        all[gameId].best = Math.max(all[gameId].best, points);
        all[gameId].timesPlayed += 1;
        all[gameId].history.push({ score: points, mode, date: Date.now() });
        if (all[gameId].history.length > 20) {
            all[gameId].history = all[gameId].history.slice(-20);
        }
        this._writeAll(profileId, all);
    },

    // All read methods accept an optional profileId (for the parent area
    // viewing a profile that isn't the active one); defaults to active.
    getBest(gameId, profileId = null) {
        const pid = profileId || Profiles.getActiveId();
        const all = this._readAll(pid);
        return all[gameId] ? all[gameId].best : 0;
    },

    getGameStats(gameId, profileId = null) {
        const pid = profileId || Profiles.getActiveId();
        const all = this._readAll(pid);
        return all[gameId] || { best: 0, timesPlayed: 0, history: [] };
    },

    getAll(profileId = null) {
        const pid = profileId || Profiles.getActiveId();
        return this._readAll(pid);
    },

    getTotalStars(profileId = null) {
        const all = this.getAll(profileId);
        return Object.values(all).reduce((sum, g) => sum + Math.min(3, g.timesPlayed), 0);
    }
};

