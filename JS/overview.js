document.addEventListener('DOMContentLoaded', function () {
    // ---- Infobox tabs: Bio / Family / Voice Actors ----
    let tabs = document.querySelectorAll('.wiki-infobox__sub-tab');
    let panels = document.querySelectorAll('.wiki-infobox__data-table[data-panel]');

    function showTab(name) {
        tabs.forEach(function (tab) {
            let on = tab.dataset.tab === name;
            tab.classList.toggle('active', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function (panel) {
            panel.hidden = panel.dataset.panel !== name;
        });
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () { showTab(tab.dataset.tab); });
        tab.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showTab(tab.dataset.tab);
            }
        });
    });

    showTab('bio');

    // ---- Contents box: [hide] / [show] toggle ----
    let toc = document.getElementById('toc'); 
    let tocTitle = toc && toc.querySelector('.toc-title');
    if (tocTitle) {
        tocTitle.addEventListener('click', function () {
            toc.classList.toggle('toc-collapsed');
        });
    }
});