/**
 * Vers le Ragnarök — content module for the dnd5e system.
 * - Registers the Ásatrú skill so it appears natively on every character sheet.
 * - Injects a "Rune personnelle / Ætt" widget on the character sheet's Details tab,
 *   storing the choice as actor flags so the rune-draw macro can read it back.
 */

const MODULE_ID = "vers-le-ragnarok";

const RUNES_BY_AETT = {
  "Freyja": ["Fehu", "Ūruz", "Thurisaz", "Ansuz", "Raido", "Kenaz", "Gebo", "Wunjo"],
  "Heimdallr": ["Hagalaz", "Nauthiz", "Isaz", "Jera", "Eihwaz", "Perth", "Algiz", "Sowilo"],
  "Týr": ["Teiwaz", "Berkana", "Ehwaz", "Mannaz", "Laguz", "Ingwaz", "Othila", "Dagaz"]
};

Hooks.once("init", () => {
  try {
    registerAsatruSkill();
    console.log(`${MODULE_ID} | Compétence Ásatrú enregistrée.`);
  } catch (err) {
    console.error(`${MODULE_ID} | Échec de l'enregistrement de la compétence Ásatrú.`, err);
  }
});

function registerAsatruSkill() {
  if (!CONFIG.DND5E?.skills) return;
  if (CONFIG.DND5E.skills.asa) return; // already registered (e.g. reload)
  CONFIG.DND5E.skills.asa = {
    label: "Ásatrú",
    ability: "wis",
    fullKey: "asatru",
    icon: "icons/magic/holy/prayer-hands-glowing-yellow.webp"
  };
}

/* -------------------------------------------- */
/*  Rune / Ætt widget on the character sheet     */
/* -------------------------------------------- */

Hooks.on("renderCharacterActorSheet", (app, html) => {
  try {
    injectRuneWidget(app, html);
  } catch (err) {
    console.error(`${MODULE_ID} | Échec de l'ajout du bloc Rune / Ætt sur la fiche.`, err);
  }
});

function injectRuneWidget(app, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  const anchor = root.querySelector('.tab[data-tab="details"] .right .top.flexrow');
  if (!anchor) return;

  const actor = app.actor;
  const currentAett = actor.getFlag(MODULE_ID, "aett") ?? "";
  const currentRune = actor.getFlag(MODULE_ID, "rune") ?? "";

  let block = root.querySelector(".vlr-rune-block");
  if (!block) {
    block = document.createElement("div");
    block.className = "vlr-rune-block";
    anchor.insertAdjacentElement("afterend", block);
  }
  block.innerHTML = "";

  const title = document.createElement("div");
  title.className = "vlr-rune-title";
  title.textContent = "Dévotion runique";
  block.appendChild(title);

  const row = document.createElement("div");
  row.className = "vlr-rune-row";
  block.appendChild(row);

  const aettField = document.createElement("label");
  aettField.className = "vlr-rune-field";
  aettField.innerHTML = `<span>Ætt</span>`;
  const aettSelect = document.createElement("select");
  aettSelect.name = "vlr-aett";
  aettSelect.appendChild(new Option("—", ""));
  for (const name of Object.keys(RUNES_BY_AETT)) aettSelect.appendChild(new Option(name, name));
  aettSelect.value = currentAett in RUNES_BY_AETT ? currentAett : "";
  aettField.appendChild(aettSelect);
  row.appendChild(aettField);

  const runeField = document.createElement("label");
  runeField.className = "vlr-rune-field";
  runeField.innerHTML = `<span>Rune personnelle</span>`;
  const runeSelect = document.createElement("select");
  runeSelect.name = "vlr-rune";
  runeField.appendChild(runeSelect);
  row.appendChild(runeField);

  function populateRunes(aett, selected) {
    runeSelect.innerHTML = "";
    runeSelect.appendChild(new Option("—", ""));
    for (const rune of RUNES_BY_AETT[aett] ?? []) runeSelect.appendChild(new Option(rune, rune));
    runeSelect.value = selected && (RUNES_BY_AETT[aett] ?? []).includes(selected) ? selected : "";
    runeSelect.disabled = !aett;
  }
  populateRunes(aettSelect.value, currentRune);

  aettSelect.addEventListener("change", async () => {
    populateRunes(aettSelect.value, "");
    await actor.setFlag(MODULE_ID, "aett", aettSelect.value || null);
    await actor.setFlag(MODULE_ID, "rune", null);
  });

  runeSelect.addEventListener("change", async () => {
    await actor.setFlag(MODULE_ID, "rune", runeSelect.value || null);
  });
}

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Vers le Ragnarök chargé — clans, historiques, Maître des runes, Ásatrú et divination runique disponibles dans les compendiums du module.`);
});
