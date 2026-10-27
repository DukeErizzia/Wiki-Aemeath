// Outfits page: clicking a card shows that outfit in the big viewer.
document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.outfit-card');
    const img = document.getElementById('outfit-img');
    const name = document.getElementById('outfit-name');
    const desc = document.getElementById('outfit-desc');
    if (!cards.length || !img || !name || !desc) return;

    function select(card) {
        cards.forEach(function (c) {
            const on = c === card;
            c.classList.toggle('selected', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        img.src = card.dataset.img;
        img.alt = card.dataset.name;
        name.textContent = card.dataset.name;
        desc.textContent = card.dataset.desc;
    }

    cards.forEach(function (card) {
        card.addEventListener('click', function () { select(card); });
    });
});
