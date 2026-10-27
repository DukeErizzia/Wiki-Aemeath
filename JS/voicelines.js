// Voicelines page: play buttons (one clip at a time) and a text filter.
// Language tabs are handled by tabs.js.
document.addEventListener('DOMContentLoaded', function () {
    let audio = null;
    let activeBtn = null;

    function stop() {
        if (audio) { audio.pause(); audio = null; }
        if (activeBtn) {
            activeBtn.classList.remove('playing');
            activeBtn.innerHTML = '&#9654; Play';
            activeBtn = null;
        }
    }

    document.querySelectorAll('.play-btn').forEach(function (btn) {
        if (!btn.dataset.src) btn.classList.add('no-audio');

        btn.addEventListener('click', function () {
            if (!btn.dataset.src) {
                btn.textContent = 'No audio set';
                setTimeout(function () { btn.innerHTML = '&#9654; Play'; }, 1500);
                return;
            }
            if (btn === activeBtn) { stop(); return; }

            stop();
            audio = new Audio(btn.dataset.src);
            activeBtn = btn;
            btn.classList.add('playing');
            btn.innerHTML = '&#9632; Stop';
            audio.addEventListener('ended', stop);
            audio.addEventListener('error', stop);
            audio.play().catch(stop);
        });
    });

    // Stop audio when switching language tabs
    document.querySelectorAll('[role="tab"]').forEach(function (t) { t.addEventListener('click', stop); });

    // Filter rows in every language panel
    const search = document.getElementById('voice-search');
    const empty = document.getElementById('voice-empty');
    if (search) {
        search.addEventListener('input', function () {
            const q = search.value.trim().toLowerCase();
            let shown = 0;
            document.querySelectorAll('.voice-table tbody tr').forEach(function (row) {
                const match = row.textContent.toLowerCase().indexOf(q) !== -1;
                row.classList.toggle('hidden-row', !match);
                // count only the visible (current language) panel
                if (match && !row.closest('[role="tabpanel"]').hidden) shown++;
            });
            if (empty) empty.hidden = shown > 0;
        });
        // Re-check the empty message when the language changes
        document.querySelectorAll('[role="tab"]').forEach(function (t) {
            t.addEventListener('click', function () { search.dispatchEvent(new Event('input')); });
        });
    }
});
