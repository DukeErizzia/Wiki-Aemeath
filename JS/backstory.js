// Backstory page: build the "On this page" list from the headings,
// and highlight the section currently being read.
document.addEventListener('DOMContentLoaded', function () {
    const list = document.getElementById('backstory-toc-list');
    const headings = document.querySelectorAll('.backstory-article h2[id], .backstory-article h3[id]');
    if (!list || !headings.length) return;

    const links = new Map();

    headings.forEach(function (h) {
        const li = document.createElement('li');
        if (h.tagName === 'H3') li.className = 'sub';
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        list.appendChild(li);
        links.set(h.id, a);
    });

    function setCurrent(id) {
        links.forEach(function (a, key) { a.classList.toggle('current', key === id); });
    }

    if ('IntersectionObserver' in window) {
        // A heading counts as "current" once it passes the top quarter of the screen
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) setCurrent(entry.target.id);
            });
        }, { rootMargin: '0px 0px -75% 0px', threshold: 0 });
        headings.forEach(function (h) { observer.observe(h); });
    }

    setCurrent(headings[0].id);
});
