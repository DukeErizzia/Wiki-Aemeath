// Profiles page
//  1. Contents box        - [hide] / [show]
//  2. Infobox tabs        - School / Skills / Links
//  3. Project filter      - show only projects that use a chosen technology
//  4. Copy buttons        - copy phone / GitHub / email to the clipboard
document.addEventListener('DOMContentLoaded', function () {

    // ---- 1. Contents box ----
    const toc = document.getElementById('toc');
    const tocTitle = toc && toc.querySelector('.toc-title');
    if (tocTitle) {
        tocTitle.addEventListener('click', function () {
            toc.classList.toggle('toc-collapsed');
        });
    }

    // ---- 2. Infobox tabs ----
    const tabs = document.querySelectorAll('.profile-card__tab');
    const panels = document.querySelectorAll('.profile-card__table');

    function showTab(name) {
        tabs.forEach(function (t) {
            const on = t.dataset.tab === name;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', String(on));
        });
        panels.forEach(function (p) {
            p.hidden = p.dataset.panel !== name;
        });
    }

    tabs.forEach(function (t) {
        t.addEventListener('click', function () { showTab(t.dataset.tab); });
    });
    if (tabs.length) showTab(tabs[0].dataset.tab);

    // ---- 3. Project filter ----
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projects = document.querySelectorAll('.project-card');
    const emptyMessage = document.getElementById('project-empty');

    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const wanted = btn.dataset.filter;
            let shown = 0;

            filterButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });

            projects.forEach(function (card) {
                const techs = card.dataset.tech.split(' ');
                const match = wanted === 'all' || techs.includes(wanted);
                card.hidden = !match;
                if (match) shown++;
            });

            if (emptyMessage) emptyMessage.hidden = shown !== 0;
        });
    });

    // ---- 4. Copy buttons ----
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const source = document.querySelector(btn.dataset.copy);
            if (!source) return;
            const text = source.textContent.trim();

            function done() {
                const old = btn.textContent;
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(function () {
                    btn.textContent = old;
                    btn.classList.remove('copied');
                }, 1500);
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, function () {});
            } else {
                // Fallback for older browsers / file:// pages
                const box = document.createElement('textarea');
                box.value = text;
                document.body.appendChild(box);
                box.select();
                try { document.execCommand('copy'); done(); } catch (e) {}
                document.body.removeChild(box);
            }
        });
    });
});
