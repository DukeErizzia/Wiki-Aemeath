// Gallery page: category filter + lightbox with prev/next and keyboard support.
document.addEventListener('DOMContentLoaded', function () {
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    const chips = document.querySelectorAll('[data-filter]');
    const box = document.getElementById('lightbox');
    const boxImg = document.getElementById('lb-img');
    const boxCap = document.getElementById('lb-caption');
    if (!items.length || !box) return;

    let current = -1;
    let lastFocus = null;

    // ---- Filter ----
    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            const f = chip.dataset.filter;
            chips.forEach(function (c) { c.classList.toggle('active', c === chip); });
            items.forEach(function (item) {
                item.hidden = !(f === 'all' || item.dataset.cat === f);
            });
        });
    });

    // ---- Lightbox ----
    function visibleItems() { return items.filter(function (i) { return !i.hidden; }); }

    function show(index) {
        const list = visibleItems();
        if (!list.length) return;
        current = (index + list.length) % list.length;
        const link = list[current].querySelector('a');
        boxImg.src = link.dataset.full || link.href;
        boxImg.alt = link.dataset.caption || '';
        boxCap.textContent = link.dataset.caption || '';
    }

    function open(item) {
        lastFocus = document.activeElement;
        box.hidden = false;
        document.body.style.overflow = 'hidden';
        show(visibleItems().indexOf(item));
        document.getElementById('lb-close').focus();
    }

    function close() {
        box.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    items.forEach(function (item) {
        item.querySelector('a').addEventListener('click', function (e) {
            e.preventDefault();
            open(item);
        });
    });

    document.getElementById('lb-close').addEventListener('click', close);
    document.getElementById('lb-prev').addEventListener('click', function () { show(current - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
        if (box.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });
});
