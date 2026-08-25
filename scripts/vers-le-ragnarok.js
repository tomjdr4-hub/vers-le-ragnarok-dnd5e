/**
 * Vers le Ragnarök — content module for the dnd5e system.
 * Registers the Ásatrú skill so it appears natively on every character sheet,
 * alongside its own passive score, without touching any sheet template.
 */

const MODULE_ID = "vers-le-ragnarok";

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

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Vers le Ragnarök chargé — clans, historiques, Maître des runes, Ásatrú et divination runique disponibles dans les compendiums du module.`);
});
