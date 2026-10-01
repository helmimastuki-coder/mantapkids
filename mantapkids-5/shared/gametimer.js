/* ===== MantapKids - Game Timer =====
   Wraps the setInterval countdown pattern from the original game page
   so any future timed game can reuse it. Exposes global: GameTimer
*/

const GameTimer = {
    _interval: null,

    // seconds = 0 means "no limit" (never calls onEnd automatically)
    start(seconds, onTick, onEnd) {
        this.stop();

        if (seconds <= 0) {
            if (onTick) onTick(null); // signal "unlimited" to the caller
            return;
        }

        let timeLeft = seconds;
        if (onTick) onTick(timeLeft);

        this._interval = setInterval(() => {
            timeLeft--;
            if (onTick) onTick(timeLeft);
            if (timeLeft <= 0) {
                this.stop();
                if (onEnd) onEnd();
            }
        }, 1000);
    },

    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
};
