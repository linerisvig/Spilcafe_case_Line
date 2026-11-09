function filtrerProdukter() {

    // Lokal variabel som er en kopi af spillisten.
    let filteredProducts = [...products];

    // --------------------------- Håndtering af søgefelt ------------------------- //
    const searchText = document.getElementById("search-input").value.toLowerCase().trim();
    if (searchText) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchText) ||
            product.description.toLowerCase().includes(searchText) ||
            product.category.toLowerCase().includes(searchText)
        );
    }

    // ---------------------- Håndtering af filtreringspanel ---------------------- //

    const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
    const Players = parseFloat(document.getElementById('Players').value);
    const Playtime = parseFloat(document.getElementById('Playtime').value);
    const rating = document.querySelector('input[name="rating"]:checked')?.value || null;

    if (categories.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
            categories.includes(product.category)
        );
    }

    if (Players > 0) {
        filteredProducts = filteredProducts.filter(product =>
            product.Players === Players
        );
    }

    if (Playtime > 0) {
        filteredProducts = filteredProducts.filter(product =>
            product.Playtime === Playtime
        );
    }

    if (!isNaN(minPlayers)) {
        filteredProducts = filteredProducts.filter(product =>
            product.Players >= minPlayers
        );
    }

    if (!isNaN(maxPlayers)) {
        filteredProducts = filteredProducts.filter(product =>
            product.Players <= maxPlayers
        );
    }


    // -------------------- Håndtering af predefineret sortering ----------------- //
    const sorterEfter = document.getElementById("predefined-search").value;

    if (sorterEfter && sorterEfter === "category") {
        filteredProducts.sort((a, b) => b.rating - a.rating);
    }

    if (sorterEfter && sorterEfter === "Playtime-stigende") {
        filteredProducts.sort((a, b) => a.Playtime - b.Playtime);
    }

    if (sorterEfter && sorterEfter === "Playtime-faldende") {
        filteredProducts.sort((a, b) => b.Playtime - a.Playtime);
    }

    displayProducts(filteredProducts);
};

document.getElementById("search-input").addEventListener("input", filtrerProdukter);

document.getElementById("predefined-search").addEventListener("change", filtrerProdukter);

document.getElementById('apply-filters').addEventListener('click', function () {
    filtrerProdukter();
    closeFilterPanel();
});


