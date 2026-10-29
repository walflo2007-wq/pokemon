const API_URL = "https://pokeapi.co/api/v2/pokemon/";
const MAX_ID = 1025; // Pokémon in the national Pokédex

const $ = (id) => document.getElementById(id);
const cardEl = $("card");
const messageEl = $("status");
const formEl = $("search-form");
const inputEl = $("search-input");
const regenerateBtn = $("regenerate");

let latestRequest = 0; // lets us ignore outdated responses

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const prettify = (text) => text.split("-").map(capitalize).join(" ");
const randomId = () => Math.floor(Math.random() * MAX_ID) + 1;

// Returns the Pokémon data, or null if the API says it does not exist (404).
async function fetchPokemon(query) {
  const response = await fetch(API_URL + encodeURIComponent(query));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

function renderCard(pokemon) {
  const name = prettify(pokemon.name);
  const artwork =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.front_default;

  const img = $("card-img");
  img.hidden = !artwork;
  img.src = artwork || "";
  img.alt = "Artwork of " + name;

  $("card-id").textContent = "#" + String(pokemon.id).padStart(3, "0");
  $("card-name").textContent = name;
  $("card-height").textContent = (pokemon.height / 10).toFixed(1) + " m";  // API: decimetres
  $("card-weight").textContent = (pokemon.weight / 10).toFixed(1) + " kg"; // API: hectograms

  const abilities = $("card-abilities");
  abilities.replaceChildren(
    ...pokemon.abilities.map(({ ability }) => {
      const li = document.createElement("li");
      li.textContent = prettify(ability.name);
      return li;
    })
  );
  cardEl.hidden = false;
}

async function load(query, label = query) {
  const requestId = ++latestRequest;
  regenerateBtn.disabled = true;
  messageEl.textContent = "Loading…";

  try {
    const pokemon = await fetchPokemon(query);
    if (requestId !== latestRequest) return;
    if (pokemon) {
      renderCard(pokemon);
      messageEl.textContent = "";
    } else {
      cardEl.hidden = true;
      messageEl.textContent = `Pokémon “${label}” could not be found. Check the spelling or try its number.`;
    }
  } catch (error) {
    if (requestId !== latestRequest) return;
    cardEl.hidden = true;
    messageEl.textContent = "The PokéAPI could not be reached. Check your internet connection and try again.";
  } finally {
    if (requestId === latestRequest) regenerateBtn.disabled = false;
  }
}

regenerateBtn.addEventListener("click", () => {
  inputEl.value = "";
  load(randomId());
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const raw = inputEl.value.trim();
  if (!raw) return;
  let query = raw.toLowerCase().replace(/^#/, "").replace(/[.'’]/g, "").replace(/\s+/g, "-");
  if (/^\d+$/.test(query)) query = String(Number(query)); // "025" -> "25"
  load(query, raw);
});

load(randomId()); // random Pokémon on every page load
