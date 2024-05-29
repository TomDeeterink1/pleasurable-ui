// Importeer het npm pakket express uit de node_modules map
import express from "express";

// Importeer de zelfgemaakte functie fetchJson uit de ./helpers map
import fetchJson from "./helpers/fetch-json.js";

// // Stel het basis endpoint in
const apiUrl = "https://fdnd-agency.directus.app/items/";
const apiFamily = apiUrl + "oba_family";
const apiProfile = apiUrl + "oba_profile";
const apiItem =
  apiUrl + "oba_item?fields=*,afbeelding.id,afbeelding.height,afbeelding.width";

// Maak een nieuwe express app aan
const app = express();

// Stel ejs in als template engine
app.set("view engine", "ejs");

// Stel de map met ejs templates in
app.set("views", "./views");

// Gebruik de map 'public' voor statische resources, zoals stylesheets, afbeeldingen en client-side JavaScript
app.use(express.static("public"));

// Zorg dat werken met request data makkelijker wordt
app.use(express.urlencoded({ extended: true }));

app.get("/", function (request, response) {
  fetchJson(apiFamily).then((apiFamily) => {
    response.render("index", {
      // apiUser: apiUser.data
    });
  });
});

app.get("/favorites", function (request, response) {
  let leeslijstFetch = `${apiUrl}oba_bookmarks?fields=*.*`;

  fetchJson(leeslijstFetch)
    .then(({ data }) => {
      return data.map((bookmark) => {
        return bookmark.item;
      });
    })
    .then((itemsOpLeeslijst) => {
      if (itemsOpLeeslijst.length) {
        const reversedItems = itemsOpLeeslijst.reverse();
        response.render("favorites", {
          items: reversedItems, 
        });
      } else {
        // Render lege staat (empty state)
        response.render("favorites_empty");
      }
    });
});


app.post("/favorites/delete/:id", function (request, response) {
  const itemId = request.params.id;

  // Eerst ophalen van alle ID's die aan de filter voldoen
  fetch(
    `https://fdnd-agency.directus.app/items/oba_bookmarks?filter[item][_eq]=${itemId}&fields=id`
  )
    .then((response) => response.json())
    .then((data) => {
      // Verkrijg het ID van het eerste item (aannemend dat er slechts één item is)
      const foundId = data.data[0].id;

      // Verwijder het item met het gevonden ID
      fetch(`https://fdnd-agency.directus.app/items/oba_bookmarks/${foundId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
      })
        .then((deleteResponse) => {
          if (request.body.favoriteclient) {
            response.render("favorites", { added: true });
          } else {
            response.redirect(303, "/favorites");
          }
        })
        .catch((error) => {
          // Handel eventuele fouten af
          console.error("Fout bij het verwijderen van het item:", error);
          response
            .status(500)
            .send("Er is een fout opgetreden bij het verwijderen van het item");
        });
    })
    .catch((error) => {
      // Handel eventuele fouten af
      console.error("Fout bij het ophalen van het ID:", error);
      response
        .status(500)
        .send("Er is een fout opgetreden bij het ophalen van het ID");
    });
});

// Stel het poortnummer in waar express op moet gaan luisteren
app.set("port", process.env.PORT || 8001);

// Start express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get("port"), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get("port")}`);
});
