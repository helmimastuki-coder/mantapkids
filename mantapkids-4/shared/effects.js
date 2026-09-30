/* ===== Kecil Ceria - Effects =====
   Small reusable feedback popups. Same visual language your
   original dashboard/game toasts used, just centralized.
   Exposes global: Effects
*/

const Effects = {
    toast(message, type = 'info', duration = 1200) {
        const styles = {
            success: 'bg-emerald-500 animate-bounce',
            error: 'bg-rose-500 animate-shake',
            info: 'bg-amber-500 animate-bounce'
        };

        const el = document.createElement('div');
        el.className = `fixed bottom-10 left-1/2 transform -translate-x-1/2 text-white px-8 py-3 rounded-full font-bold shadow-2xl z-50 text-lg ${styles[type] || styles.info}`;
        el.innerHTML = message;
        document.body.appendChild(el);

        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, duration);
    },

    correct(message = '🌟 Hebat! Betul!') {
        this.toast(message, 'success');
    },

    wrong(message = '❌ Cuba lagi!') {
        this.toast(message, 'error', 800);
    },

    info(message) {
        this.toast(message, 'info', 2500);
    }
};
