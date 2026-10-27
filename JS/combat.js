// Combat page: expand / collapse all Resonance Chain nodes.
// (Skill tabs are handled by tabs.js.)
document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('chain-toggle');
    const cards = document.querySelectorAll('.chain-card');
    if (!button || !cards.length) return;

    function allOpen() {
        return Array.from(cards).every(function (c) { return c.open; });
    }
    function refreshLabel() {
        button.textContent = allOpen() ? 'Collapse all' : 'Expand all';
    }

    button.addEventListener('click', function () {
        const open = !allOpen();
        cards.forEach(function (c) { c.open = open; });
        refreshLabel();
    });

    // Keep the label right when a single node is opened by hand
    cards.forEach(function (c) { c.addEventListener('toggle', refreshLabel); });
});
