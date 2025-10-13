const selectMois = document.getElementById("moisSelect");
const cases = document.querySelectorAll("td");
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupText = document.getElementById("popupText");
const closePopup = document.getElementById("closePopup");

/**
 * Met à jour le calendrier en fonction du mois sélectionné.
 */
function majCalendrier() {
    const mois = selectMois.value;
    const joursParMois = {
        janvier: 31,
        fevrier: 28,
        mars: 31,
        avril: 30,
        mai: 31,
        juin: 30,
        juillet: 31,
        aout: 31,
        septembre: 30,
        octobre: 31,
        novembre: 30,
        decembre: 31
    };

    let nbJours = joursParMois[mois];

    const annee = new Date().getFullYear();
    // Année bisextile
    if (mois === "fevrier" && annee % 4 === 0 && (annee % 100 !== 0 || annee % 400 === 0)) {
        nbJours = 29;
    }

    // Si y'a que 28 jours, on masque la 5ème semaine
    if (mois === "fevrier" && nbJours !== 29) {
        const semaine5 = document.getElementById("cinquiemeSemaine");
        semaine5.style.display = "none";
    } else {
        const semaine5 = document.getElementById("cinquiemeSemaine");
        semaine5.style.display = "";
    }

    cases.forEach((cellule, index) => {
        if (index < nbJours) {
            cellule.textContent = index + 1;
            cellule.style.visibility = "visible";
        } else {
            cellule.textContent = "";
            cellule.style.visibility = "hidden";
        }
    });
}

/**
 * Ajoute des écouteurs d'événements aux cases du calendrier pour faire apparaître une pop-up
 */
function ajouterEcouteursCases() {
    cases.forEach(cellule => {
        cellule.addEventListener("click", () => {
            const jour = cellule.textContent;
            if (jour) {
                popupTitle.textContent = `Jour ${jour}`;
                popupText.textContent = `Tu as cliqué sur le ${jour} ${selectMois.value}.`;
                popup.style.display = "flex"; // affiche la pop-up
            }

        });
    });
}

closePopup.addEventListener("click", () => {
    popup.style.display = "none";
});

popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.style.display = "none";
});

selectMois.addEventListener("change", majCalendrier);
ajouterEcouteursCases();
majCalendrier();
