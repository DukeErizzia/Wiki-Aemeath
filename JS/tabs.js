// Generic tab groups. Markup:
//   <div data-tabs>
//     <div class="wiki-tabs" role="tablist"><button role="tab" data-tab="a">A</button> ...</div>
//     <div role="tabpanel" data-panel="a">...</div> ...
//   </div>
// Don't nest one [data-tabs] group inside another.
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
        const buttons = Array.from(group.querySelectorAll('[role="tab"]'));
        const panels = Array.from(group.querySelectorAll('[role="tabpanel"]'));
        if (!buttons.length) return;

        function show(id, focus) {
            buttons.forEach(function (b) {
                const on = b.dataset.tab === id;
                b.classList.toggle('active', on);
                b.setAttribute('aria-selected', on ? 'true' : 'false');
                b.tabIndex = on ? 0 : -1;
                if (on && focus) b.focus();
            });
            panels.forEach(function (p) { p.hidden = p.dataset.panel !== id; });
        }

        buttons.forEach(function (b, i) {
            b.addEventListener('click', function () { show(b.dataset.tab); });
            b.addEventListener('keydown', function (e) {
                let next = null;
                if (e.key === 'ArrowRight') next = (i + 1) % buttons.length;
                if (e.key === 'ArrowLeft') next = (i - 1 + buttons.length) % buttons.length;
                if (e.key === 'Home') next = 0;
                if (e.key === 'End') next = buttons.length - 1;
                if (next !== null) { e.preventDefault(); show(buttons[next].dataset.tab, true); }
            });
        });

        show(buttons[0].dataset.tab);
    });
});
