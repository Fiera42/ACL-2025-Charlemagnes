const selectMois = document.getElementById("moisSelect");
const cases = document.querySelectorAll("td");
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupText = document.getElementById("popupText");
const closePopup = document.getElementById("closePopup");

const btnAdd = document.getElementById("btnAdd");
const popupForm = document.getElementById("popupForm");
const formAdd = document.getElementById("formAdd");

const btnEdit = document.getElementById("btnEdit");
const btnDelete = document.getElementById("btnDelete");

let selectedAppointment = null; // pour garder en mémoire le rendez-vous affiché

const moisNumero = {
    janvier: 0,
    fevrier: 1,
    mars: 2,
    avril: 3,
    mai: 4,
    juin: 5,
    juillet: 6,
    aout: 7,
    septembre: 8,
    octobre: 9,
    novembre: 10,
    decembre: 11
}

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

let appointments = []

/**
 * Récupère les rendez-vous depuis l'API et met à jour le calendrier.
 * @returns {Promise<void>} Promesse de la liste des rendez-vous
 */
async function getRendezVous() {
    try {
        const res = await fetch("http://localhost:3000/api/calendar/1/appointments");

        if (!res.ok) {
            throw new Error(`Erreur API (${res.status}) : ${res.statusText}`);
        }

        const data = await res.json();
        appointments = data.appointments;
        majCalendrier();
    } catch (err) {
        console.error("Erreur de chargement des rendez-vous :", err);
    }
}

/**
 * Met à jour le calendrier en fonction du mois sélectionné.
 */
function majCalendrier() {
    const mois = selectMois.value;
    const moisIndex = moisNumero[mois];

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
        cellule.innerHTML = ""; // efface le contenu précédent
        if (index < nbJours) {
            cellule.style.visibility = "visible";
            const jourDiv = document.createElement("div");
            jourDiv.classList.add("jour");
            jourDiv.textContent = index + 1;
            cellule.appendChild(jourDiv);
        } else {
            cellule.style.visibility = "hidden";
        }
    });

    // On affiche les rendez-vous
    if (!appointments || appointments.length === 0) return;
    appointments.forEach(rdv => {
        const start = new Date(rdv.startDate);
        if (start.getMonth() === moisIndex) {
            const jour = start.getDate();
            const cellule = cases[jour - 1];
            if (cellule) {

                const rdvDiv = document.createElement("div");
                rdvDiv.classList.add("rdv");
                rdvDiv.textContent = rdv.title;

                rdvDiv.addEventListener("click", (e) => {
                    e.stopPropagation();
                    selectedAppointment = rdv;
                    popupTitle.textContent = rdv.title;
                    popupText.innerHTML = `
            <strong>Description :</strong> ${rdv.description}<br>
            <strong>Début :</strong> ${start.toLocaleString()}<br>
            <strong>Fin :</strong> ${new Date(rdv.endDate).toLocaleString()}
          `;
                    popup.style.display = "flex";
                });

                cellule.appendChild(rdvDiv);
            }
        }
    });
}

// Mettre le mois actuel comme sélectionné par défaut
const moisActuel = new Date().getMonth();
selectMois.selectedIndex = moisActuel;

closePopup.addEventListener("click", () => {
    popup.style.display = "none";
});

popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.style.display = "none";
});

// Ouvre le formulaire
btnAdd.addEventListener("click", () => {
    popupForm.style.display = "flex";
});

// Ferme en cliquant en dehors du formulaire
popupForm.addEventListener("click", (e) => {
    if (e.target === popupForm) popupForm.style.display = "none";
});

btnDelete.addEventListener("click", async () => {
    if (!selectedAppointment) return;

    const confirmDelete = confirm(`Supprimer "${selectedAppointment.title}" ?`);
    if (!confirmDelete) return;

    try {
        const res = await fetch(`http://localhost:3000/api/calendar/appointments/${selectedAppointment.id}`, {
            method: "DELETE"
        });

        if (!res.ok) throw new Error("Erreur lors de la suppression");

        popup.style.display = "none";
        await getRendezVous();

    } catch (err) {
        alert("Erreur de suppression : " + err.message);
    }
});

formAdd.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Récupération des données du formulaire
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);

    // Création de l’objet rendez-vous
    const newAppointment = {
        title,
        description,
        startDate,
        endDate
    };

    try {
        let res;

        if (formAdd.dataset.mode === "edit" && selectedAppointment) {
            // Mode édition → PUT
            res = await fetch(`http://localhost:3000/api/calendar/appointments/${selectedAppointment.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAppointment)
            });
        } else {
            // Mode ajout → POST
            res = await fetch("http://localhost:3000/api/calendar/1/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAppointment)
            });
        }

        if (!res.ok) throw new Error("Erreur d’enregistrement du rendez-vous");

        popupForm.style.display = "none";
        formAdd.reset();
        delete formAdd.dataset.mode;
        selectedAppointment = null;

        await getRendezVous();

    } catch (err) {
        alert("Erreur : " + err.message);
    }
});

btnEdit.addEventListener("click", () => {
    if (!selectedAppointment) return;

    popup.style.display = "none";
    popupForm.style.display = "flex";

    // Remplir les champs avec les valeurs actuelles
    document.getElementById("title").value = selectedAppointment.title;
    document.getElementById("description").value = selectedAppointment.description;
    document.getElementById("startDate").value = new Date(selectedAppointment.startDate).toISOString().slice(0, 16);
    document.getElementById("endDate").value = new Date(selectedAppointment.endDate).toISOString().slice(0, 16);

    formAdd.dataset.mode = "edit";
});


(async function init() {
    selectMois.addEventListener("change", majCalendrier);
    await getRendezVous(); // attend les données avant le premier affichage
})();