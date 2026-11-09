// products er vores array af spil. De enkelte spil er objekter fra spil.js.
const products = spil;
const liste = document.getElementById("game-list");
const soegefelt = document.getElementById("game-search-field");
const spillerFilter = document.getElementById("player-filter");
const kategoriFilter = document.getElementById("category-filter");
const tidsFilter = document.getElementById("time-filter");
const tidsvalg = document.getElementById("time-enabled");
const filterDialog = document.getElementById("filter-dialog");
let forrigeSide = "opdag";

// forEach går gennem listen. includes forhindrer, at samme kategori tilføjes to gange.
function opretFiltervalg() {
  const kategorier = [];
  let laengsteTid = 15;
  products.forEach((product) => {
    if (product.maxTid > laengsteTid) laengsteTid = product.maxTid;
    product.kategorier.forEach((kategori) => {
      if (!kategorier.includes(kategori)) kategorier.push(kategori);
    });
  });
  tidsFilter.max = Math.ceil(laengsteTid / 5) * 5;
  for (let antal = 2; antal <= 18; antal++) {
    spillerFilter.add(new Option(antal, antal));
  }
  kategorier.sort().forEach((kategori) => {
    kategoriFilter.add(new Option(oversaetVaerdi(kategori), kategori));
    document.getElementById("category-options").innerHTML += `
      <label><input type="checkbox" name="kategori" value="${kategori}"><span>${oversaetVaerdi(kategori)}</span></label>`;
  });
}

// value er feltets indhold. toLowerCase gør bogstaverne små, og trim fjerner
// mellemrum i enderne. Array.from og map samler de afkrydsede felters værdier.
function hentFelter() {
  return {
    searchText: soegefelt.value.toLowerCase().trim(),
    categories: Array.from(
      document.querySelectorAll('input[name="kategori"]:checked'),
    ).map((cb) => cb.value),
    spillere: parseFloat(spillerFilter.value),
    maxTid: tidsvalg.checked ? parseFloat(tidsFilter.value) : null,
    niveau: document.getElementById("level-filter").value,
    plads: document.getElementById("space-filter").value,
    sorterEfter: document.getElementById("sort-order").value,
  };
}

// filter laver en ny liste med de spil, der består betingelsen.
// [...alleSpil] er en kopi, så sortering senere ikke ændrer originalens rækkefølge.
function filtrerSpil(alleSpil, valg) {
  let filteredProducts = [...alleSpil];
  if (valg.searchText) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        spilNavn(product).toLowerCase().includes(valg.searchText) ||
        product.navn.toLowerCase().includes(valg.searchText) ||
        spilBeskrivelse(product).toLowerCase().includes(valg.searchText) ||
        product.kategorier
          .map(oversaetVaerdi)
          .join(" ")
          .toLowerCase()
          .includes(valg.searchText),
    );
  }
  // some giver true, hvis mindst én kategori passer. includes tjekker, om
  // kategorien findes blandt valgene. Kortspil ELLER Strategispil er altså nok.
  if (valg.categories.length > 0) {
    filteredProducts = filteredProducts.filter((product) =>
      product.kategorier.some((kategori) => valg.categories.includes(kategori)),
    );
  }
  if (valg.spillere > 0) {
    filteredProducts = filteredProducts.filter((product) =>
      product.antalSpillere.includes(valg.spillere),
    );
  }
  // null betyder alle spilletider. Ved fx 30 sammenlignes spillets maxTid med 30.
  // Hvert filter arbejder videre på resultatet: spillet skal opfylde ALLE valgte filtre.
  if (valg.maxTid !== null) {
    filteredProducts = filteredProducts.filter(
      (product) => product.maxTid <= valg.maxTid,
    );
  }
  if (valg.niveau !== "") {
    filteredProducts = filteredProducts.filter((product) =>
      product.regelniveauer.includes(valg.niveau),
    );
  }
  if (valg.plads !== "") {
    filteredProducts = filteredProducts.filter(
      (product) => product.pladsbehov === valg.plads,
    );
  }
  return filteredProducts;
}

// sort sammenligner to spil ad gangen. localeCompare sammenligner navnene.
// Ved tal giver a - b den mindste værdi først, mens b - a giver den største først.
function sorterSpil(filteredProducts, sorterEfter) {
  if (sorterEfter === "titel-az")
    filteredProducts.sort((a, b) =>
      spilNavn(a).localeCompare(spilNavn(b), sprog),
    );
  if (sorterEfter === "titel-za")
    filteredProducts.sort((a, b) =>
      spilNavn(b).localeCompare(spilNavn(a), sprog),
    );
  if (sorterEfter === "tid-kort")
    filteredProducts.sort((a, b) => a.maxTid - b.maxTid);
  if (sorterEfter === "tid-lang")
    filteredProducts.sort((a, b) => b.maxTid - a.maxTid);
  return filteredProducts;
}

// ${...} indsætter en værdi i HTML-teksten. Det samme række-layout bruges
// til søgeresultater og gemte spil. true/false fortæller, om hjertet er valgt.
function spilRaekke(product) {
  return `<li class="game-row">
    <a href="#spil/${product.id}"><img class="row-cover" src="${product.billede}" alt="${spilNavn(product)}"></a>
    <a class="row-text" href="#spil/${product.id}"><h3>${spilNavn(product)}</h3><p>${spillerTekst(product)} · ${spilleTid(product)} min.</p><p>${product.kategorier.map(oversaetVaerdi).join(" · ")}</p></a>
    <div class="row-actions"><button class="heart" type="button" data-save="${product.id}" aria-label="${t("gemSpil")} ${spilNavn(product)}" aria-pressed="${gemteSpil.includes(product.id)}"><img src="billeder/hjerte.svg" alt=""></button><button class="book-small" type="button" data-book="${product.id}">${t("book")}</button></div>
  </li>`;
}

// innerHTML = "" fjerner de gamle resultater. forEach tilføjer derefter én række pr. spil.
function displayProducts(list) {
  liste.innerHTML = "";
  list.forEach((product) => {
    liste.innerHTML += spilRaekke(product);
  });
}

// textContent ændrer en tekst på siden. hidden skjuler elementet, når værdien er true.
function visFilterstatus(list, valg) {
  document.getElementById("results-count").textContent =
    list.length === products.length
      ? t("alle") + " " + products.length + " " + t("spil")
      : list.length + " " + t("af") + " " + products.length + " " + t("spil");
  document.getElementById("empty-state").hidden = list.length !== 0;
  document.getElementById("time-output").textContent =
    valg.maxTid === null
      ? t("alleTider")
      : t("hoejst") + " " + valg.maxTid + " min.";
  tidsFilter.disabled = !tidsvalg.checked;
  document
    .getElementById("quick-time")
    .setAttribute("aria-pressed", valg.maxTid === 30);
  document
    .getElementById("reset-all")
    .classList.toggle(
      "active",
      !valg.searchText &&
        !valg.categories.length &&
        !valg.spillere &&
        valg.maxTid === null &&
        !valg.niveau &&
        !valg.plads,
    );
  document.getElementById("sort-note").textContent =
    t("sorteret") +
    " · " +
    document.getElementById("sort-order").selectedOptions[0].textContent;
  document.getElementById("active-filters").textContent = valg.categories
    .map(oversaetVaerdi)
    .join(" · ");
  kategoriFilter.options[0].textContent =
    valg.categories.length > 1
      ? valg.categories.length + " " + t("typerValgt")
      : t("alleTyper");
  kategoriFilter.value = valg.categories.length === 1 ? valg.categories[0] : "";
}

// Funktionerne har hver deres opgave. filtrerProdukter sørger kun for rækkefølgen.
// return-værdien fra én funktion sendes videre som argument til den næste.
function filtrerProdukter() {
  const valg = hentFelter();
  let filteredProducts = filtrerSpil(products, valg);
  filteredProducts = sorterSpil(filteredProducts, valg.sorterEfter);
  displayProducts(filteredProducts);
  visFilterstatus(filteredProducts, valg);
}

function nulstil() {
  document.getElementById("filter-form").reset();
  soegefelt.value = "";
  spillerFilter.value = "0";
  kategoriFilter.value = "";
  filtrerProdukter();
}

// Figma har tre udvalgte spil pr. humør. De samme grupper står i spil.js.
function visHumoer(navn) {
  const billeder = {
    Sjov: "sjov",
    Hygge: "hygge",
    Svær: "svaer",
    Battle: "battle",
  };
  if (!billeder[navn]) navn = "Sjov";
  document.getElementById("mood-title").textContent = oversaetVaerdi(navn);
  document.getElementById("mood-image").src =
    "billeder/" + billeder[navn] + ".png";
  document.getElementById("mood-games").innerHTML = "";
  products
    .filter((product) => product.humoer.includes(navn))
    .forEach((product) => {
      document.getElementById("mood-games").innerHTML +=
        `<li class="mood-card"><a class="game-link" href="#spil/${product.id}"><img class="cover" src="${product.billede}" alt="${spilNavn(product)}"><img class="stars" src="billeder/stjerner.svg" alt=""><h2>${spilNavn(product)}</h2><p>${spilBeskrivelse(product)}</p></a><button type="button" class="heart" data-save="${product.id}" aria-label="${t("gemSpil")} ${spilNavn(product)}" aria-pressed="${gemteSpil.includes(product.id)}"><img src="billeder/hjerte.svg" alt=""></button></li>`;
    });
}

// find henter ét objekt ud fra dets id. Oplysningerne kommer fra samme array som søgningen.
function visSpil(id) {
  const product = products.find((product) => product.id === id);
  if (!product) {
    window.location.hash = "alle-spil";
    return;
  }
  document.getElementById("detail-back").href = "#" + forrigeSide;
  const fakta = [
    [t("spillere"), spillerTekst(product)],
    [t("spilletid"), spilleTid(product) + " min."],
    [t("alder"), oversaetVaerdi(product.alder)],
    [t("regelniveau"), product.regelniveauer.map(oversaetVaerdi).join("–")],
    [t("plads"), oversaetVaerdi(product.pladsbehov)],
    [
      t("stemning"),
      product.stemning.map(oversaetVaerdi).join(", ") || t("ikkeAngivet"),
    ],
  ];
  let felter = "";
  fakta.forEach((faktum) => {
    felter += `<div><dt>${faktum[0]}</dt><dd>${faktum[1]}</dd></div>`;
  });
  document.getElementById("game-detail").innerHTML =
    `<p class="detail-category">${product.kategorier.map(oversaetVaerdi).join(" · ")}</p><h1>${spilNavn(product)}</h1><div class="detail-image"><img src="${product.billede}" alt="${spilNavn(product)}"></div><p class="detail-description">${spilBeskrivelse(product)}</p><dl class="facts">${felter}</dl><div class="equipment"><strong>${t("udstyr")}</strong><p>${product.udstyr.map(oversaetVaerdi).join(", ") || t("ikkeAngivet")}</p></div><button type="button" class="button" data-book="${product.id}">${t("bookSpil")}</button><p class="data-note">${t("kortlaegning")}</p>`;
  document.getElementById("detail-heart").dataset.save = id;
  opdaterHjerter();
}

// hash er delen efter #. Kun sektionen til den valgte side bliver synlig.
function visSide() {
  // Uden en side efter # åbnes startsiden.
  const adresse =
    decodeURIComponent(window.location.hash.slice(1)) || "start";
  let side = adresse.split("/")[0];
  if (side === "spil") {
    visSpil(adresse.split("/")[1]);
    side = "spildetaljer";
  } else if (side === "humoer") visHumoer(adresse.split("/")[1]);
  else if (side === "profil") opdaterKonto();
  else if (side === "gemte") opdaterGemte();
  else if (side === "mine-bookinger" && typeof visBookinger === "function")
    visBookinger();
  if (!document.getElementById(side)?.classList.contains("page"))
    side = "opdag";
  document.querySelectorAll("main > .page").forEach((sektion) => {
    sektion.hidden = sektion.id !== side;
  });
  document.querySelectorAll(".bottom-nav a").forEach((link) => {
    const valgt =
      link.dataset.page === side ||
      (link.dataset.page === "opdag" && side === "humoer") ||
      (link.dataset.page === "gemte" &&
        ["profil", "mine-bookinger"].includes(side));
    if (valgt) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.getElementById("indhold").scrollTop = 0;
  if (["opdag", "alle-spil", "gemte", "proev-lykken", "humoer"].includes(side))
    forrigeSide = adresse;
}

// preventDefault stopper formularens normale genindlæsning. Enter og Søg bruger samme hændelse.
document
  .getElementById("game-search")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    filtrerProdukter();
  });
document
  .getElementById("home-search")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const tekst = document.getElementById("search-field").value;
    nulstil();
    soegefelt.value = tekst;
    filtrerProdukter();
    window.location.hash = "alle-spil";
  });
spillerFilter.addEventListener("change", filtrerProdukter);
kategoriFilter.addEventListener("change", function () {
  document.querySelectorAll('input[name="kategori"]').forEach((cb) => {
    cb.checked = cb.value === kategoriFilter.value;
  });
  filtrerProdukter();
});
document.getElementById("open-filters").addEventListener("click", function () {
  filterDialog.showModal();
});
document.getElementById("close-filters").addEventListener("click", function () {
  filterDialog.close();
});
document
  .getElementById("filter-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    filtrerProdukter();
    filterDialog.close();
  });
document.getElementById("clear-filters").addEventListener("click", nulstil);
document.getElementById("reset-all").addEventListener("click", nulstil);
document.getElementById("empty-reset").addEventListener("click", nulstil);
document.getElementById("quick-time").addEventListener("click", function () {
  tidsvalg.checked = !(tidsvalg.checked && tidsFilter.value === "30");
  tidsFilter.value = "30";
  filtrerProdukter();
});
// change kører, når et filter ændres. input opdaterer listen, mens skyderen flyttes.
filterDialog.addEventListener("change", filtrerProdukter);
tidsFilter.addEventListener("input", filtrerProdukter);
document.querySelectorAll(".mood").forEach((knap) => {
  knap.addEventListener("click", function () {
    window.location.hash = "humoer/" + knap.dataset.mood;
  });
});

// closest finder knappen, også når klikket rammer billedet inde i den.
// Denne lytter virker derfor også på de kort, som forEach først tilføjer senere.
document.addEventListener("click", function (event) {
  const hjerte = event.target.closest("[data-save]");
  const book = event.target.closest("[data-book]");
  if (hjerte) gemSpil(hjerte.dataset.save);
  if (book)
    kraeverBruger(function () {
      aabnBooking(book.dataset.book);
    });
});
window.addEventListener("hashchange", visSide);
document.addEventListener("sprogskift", function () {
  Array.from(kategoriFilter.options).forEach((option) => {
    if (option.value) option.textContent = oversaetVaerdi(option.value);
  });
  document.querySelectorAll("#category-options label").forEach((label) => {
    label.querySelector("span").textContent = oversaetVaerdi(
      label.querySelector("input").value,
    );
  });
  filtrerProdukter();
  opdaterGemte();
  opdaterKonto();
  visSide();
});
opretFiltervalg();
filtrerProdukter();
opdaterKonto();
visSide();