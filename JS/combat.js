// Combat page:
//  - Ascension table: show / hide the materials column
//  - Resonance Chain: expand / collapse all nodes
// (The Forte skill tabs are handled by tabs.js.)
document.addEventListener('DOMContentLoaded', function () {
    // ---- Ascension materials toggle ----
    const ascButton = document.getElementById('asc-toggle');
    const statsTable = document.getElementById('asc-table');
    if (ascButton && statsTable) {
        ascButton.addEventListener('click', function () {
            const hidden = statsTable.classList.toggle('hide-costs');
            ascButton.textContent = hidden ? 'Show Ascension Materials' : 'Hide Ascension Materials';
            ascButton.setAttribute('aria-pressed', hidden ? 'false' : 'true');
        });
    }

    // ---- Contents box [hide] / [show] ----
    const toc = document.getElementById('toc');
    const tocTitle = toc && toc.querySelector('.toc-title');
    if (tocTitle) {
        tocTitle.addEventListener('click', function () {
            toc.classList.toggle('toc-collapsed');
        });
    }

    // ---- Resonance Chain expand / collapse all ----
    const chainButton = document.getElementById('chain-toggle');
    const cards = document.querySelectorAll('.chain-card');
    if (chainButton && cards.length) {
        const allOpen = function () {
            return Array.from(cards).every(function (c) { return c.open; });
        };
        const refreshLabel = function () {
            chainButton.textContent = allOpen() ? 'Collapse all' : 'Expand all';
        };

        chainButton.addEventListener('click', function () {
            const open = !allOpen();
            cards.forEach(function (c) { c.open = open; });
            refreshLabel();
        });
        // Keep the label right when a single node is opened or closed by hand
        cards.forEach(function (c) { c.addEventListener('toggle', refreshLabel); });
        refreshLabel();
    }
});