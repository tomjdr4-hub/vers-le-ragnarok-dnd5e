// Generator for the "Vers le Ragnarök" Foundry VTT module compendium source files.
// Produces per-document JSON files under packs/<pack>/_source/, later compiled to
// LevelDB compendiums with `fvtt package pack`.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PACKS_DIR = path.join(ROOT, "packs-source");
const MODULE_ID = "vers-le-ragnarok";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic 16-char alphanumeric id (Foundry DocumentIdField format). */
function sid(name) {
  return createHash("md5").update(name).digest("hex").slice(0, 16);
}

function uuidItem(pack, name) {
  return `Compendium.${MODULE_ID}.${pack}.Item.${sid(name)}`;
}

function nowStats() {
  const t = Date.now();
  return {
    coreVersion: "14",
    systemId: "dnd5e",
    systemVersion: "5.3.3",
    createdTime: t,
    modifiedTime: t,
    lastModifiedBy: null,
    duplicateSource: null,
    compendiumSource: null,
    exportSource: null
  };
}

function slugify(name) {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function desc(html) {
  return { value: html.trim(), chat: "" };
}

/** Base envelope shared by every Item document we author. */
function baseItem({ name, type, img, system, effects = [] }) {
  return {
    _id: sid(name),
    name,
    type,
    img,
    system,
    effects,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: nowStats(),
    _key: `!items!${sid(name)}`
  };
}

function feat({ name, img, html, requirements = "", featureType = "", identifier, advancement = {} }) {
  return baseItem({
    name,
    type: "feat",
    img,
    system: {
      description: desc(html),
      identifier: identifier ?? slugify(name),
      source: "Vers le Ragnarök",
      requirements,
      type: { value: featureType, subtype: "" },
      properties: [],
      prerequisites: { items: [], level: null, repeatable: false },
      activities: {},
      advancement
    }
  });
}

function itemGrant({ id, level, title, items, classRestriction }) {
  const entry = {
    _id: id,
    type: "ItemGrant",
    configuration: {
      items: items.map(uuid => ({ uuid, optional: false })),
      optional: false,
      spell: null
    },
    value: {},
    level,
    title
  };
  if (classRestriction) entry.classRestriction = classRestriction;
  return entry;
}

function traitAdv({ id, level = 0, title, grants = [], choices = [], classRestriction }) {
  const entry = {
    _id: id,
    type: "Trait",
    configuration: { mode: "default", allowReplacements: false, grants, choices },
    value: { chosen: [] },
    level,
    title
  };
  if (classRestriction) entry.classRestriction = classRestriction;
  return entry;
}

function hitPointsAdv(id) {
  return { _id: id, type: "HitPoints", configuration: {}, value: {} };
}

function abilityScoreImprovementAdv({ id, level }) {
  return {
    _id: id,
    type: "AbilityScoreImprovement",
    configuration: {
      points: 2,
      fixed: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      cap: 2,
      locked: []
    },
    value: {},
    level,
    title: ""
  };
}

function subclassAdv(id, level) {
  return { _id: id, type: "Subclass", configuration: {}, value: { document: null, uuid: null }, level, title: "", hint: "" };
}

function scaleValueNumber({ id, title, identifier, scale }) {
  const s = {};
  for (const [lvl, value] of Object.entries(scale)) s[lvl] = { value };
  return {
    _id: id, type: "ScaleValue", title, hint: "",
    configuration: { identifier, type: "number", distance: { units: "" }, scale: s },
    value: {}
  };
}

function scaleValueDice({ id, title, identifier, scale }) {
  const s = {};
  for (const [lvl, [number, faces]] of Object.entries(scale)) s[lvl] = { number, faces, modifiers: [] };
  return {
    _id: id, type: "ScaleValue", title, hint: "",
    configuration: { identifier, type: "dice", distance: { units: "" }, scale: s },
    value: {}
  };
}

function advMap(list) {
  const obj = {};
  for (const a of list) obj[a._id] = a;
  return obj;
}

// Equipment / weapon items -----------------------------------------------------

function weapon({ name, img, html, damage, damageType, diceCount = 1, properties = [], weaponType = "simpleM", price = 0, weight = 1, rarity = "", attunement = "" }) {
  const finalProperties = rarity ? [...properties, "mgc"] : properties;
  return baseItem({
    name, type: "weapon", img,
    system: {
      description: desc(html),
      identifier: slugify(name),
      source: "Vers le Ragnarök",
      quantity: 1,
      weight: { value: weight, units: "kg" },
      price: { value: price, denomination: "gp" },
      rarity,
      attunement,
      type: { value: weaponType, subtype: "" },
      properties: finalProperties,
      proficient: null,
      damage: { base: { number: diceCount, denomination: damage, bonus: "", types: [damageType], custom: { enabled: false } }, versatile: { number: null, denomination: null, bonus: "", types: [], custom: { enabled: false } } },
      range: { value: null, long: null, reach: null, units: "ft" },
      activities: {}
    }
  });
}

function equipment({ name, img, html, armorValue = null, armorType = "trinket", price = 0, weight = 1, rarity = "", attunement = "" }) {
  const system = {
    description: desc(html),
    identifier: slugify(name),
    source: "Vers le Ragnarök",
    quantity: 1,
    weight: { value: weight, units: "kg" },
    price: { value: price, denomination: "gp" },
    rarity,
    attunement,
    type: { value: armorType },
    properties: rarity ? ["mgc"] : [],
    proficient: null,
    activities: {}
  };
  if (armorValue !== null) system.armor = { value: armorValue, magicalBonus: "", dex: armorType === "shield" ? 0 : null };
  return baseItem({ name, type: "equipment", img, system });
}

// ---------------------------------------------------------------------------
// Content: Clans
// ---------------------------------------------------------------------------

const CLAN_IMG = "icons/environment/people/group.webp";

const CLANS = [
  {
    name: "Clan : Corbeaux de glace", region: "Svitjod",
    html: `<p><em>Cercle de voyants, d'ermites et de skalds voués à l'ordre divin, plus qu'un clan à proprement parler.</em></p>
      <p>Basé au temple d'Uppsala, ce cercle sert de conseillers, de juges (løgsøgumaður) et d'enseignants aux autres clans. Sa hiérarchie va du <strong>rót</strong> (« racine », nouvelle recrue) au <strong>mímistafr</strong> (« pilier de sagesse »), jusqu'au <strong>léradhr</strong> et au <strong>mímaneidhr</strong> (« arbre de sagesse »), le conseil de trois membres qui tranche en dernier ressort.</p>
      <p>Un personnage de ce clan a droit à l'objet de clan <strong>Branche runique</strong> s'il s'en montre digne.</p>`
  },
  {
    name: "Clan : Cornes de Gjallar", region: "Jutland",
    html: `<p><em>Peuple fier et pragmatique, gardien du grand mur du Danevirke, se disant issu d'Heimdallr.</em></p>
      <p>Le royaume le plus riche et le plus stable du Nord, dirigé par la reine Thorunn Horiksdóttir. Le clan tire son nom d'une corne gigantesque conservée dans sa capitale, utilisée pour alerter tout Miðgarðr en cas d'invasion.</p>
      <p>Un personnage de ce clan a droit à l'objet de clan <strong>Cor retentissant</strong> s'il s'en montre digne.</p>`
  },
  {
    name: "Clan : Fils de jötunn", region: "Fenmark",
    html: `<p><em>Clan de parias — bannis, voleurs, porteurs du « sang bleu » — cachés dans les marais de Fínnbol.</em></p>
      <p>Seul clan à rejeter ouvertement les Neuf vertus, ses membres se surnomment eux-mêmes <strong>gargans</strong> (« serpents ») et vénèrent Loki plutôt que les autres Æsir. Fondé par le demi-géant Hrókr Fjalson, un ancien mímistafr des Corbeaux de glace banni.</p>
      <p>Un personnage de ce clan a droit à l'objet de clan <strong>Dent de la sorcière</strong> s'il s'en montre digne.</p>`
  },
  {
    name: "Clan : Guerriers ours", region: "Norðrvegr, montagnes Enneigées",
    html: `<p><em>Berserkir des montagnes, aussi appelés hommes-ours ou sauvages ; la force y est la seule loi.</em></p>
      <p>Nominalement dirigés par la famille Snjallrson, mais tout chef peut être défié par la force. Chaque village a un prêtre communiant avec « l'esprit de la Montagne », vénérée comme une divinité en plus des Æsir et des Vanir.</p>
      <p>Un personnage de ce clan a droit à l'objet de clan <strong>Griffe de la Montagne</strong> s'il s'en montre digne.</p>`
  },
  {
    name: "Clan : Loups de l'ombre", region: "Svitjod, grande forêt",
    html: `<p><em>Chasseurs nomades, maîtres des tactiques de groupe, comptant de nombreux úlfheðnar.</em></p>
      <p>Fidèles aux Neuf vertus et vivant en harmonie avec la nature, ils s'opposent farouchement à toute réunification des clans sous un seul souverain. Dirigés par Koltønn Ginnungason.</p>
      <p>Un personnage de ce clan a droit à l'objet de clan <strong>Ombre du feuillage</strong> s'il s'en montre digne.</p>`
  },
  {
    name: "Clan : Yeux d'Odhinn", region: "Norðrvegr, côte",
    html: `<p><em>Le clan le plus puissant et le plus craint des vikingar, marins et conquérants se disant descendants d'Odhinn.</em></p>
      <p>Capitale : Heill Hofn, dirigée par le roi Asbjørn le Rouge. Le clan est secoué par un schisme religieux : la reine Sknaht, prêtresse d'un culte étranger d'Hibernia, gagne en influence face aux fidèles d'Odhinn.</p>
      <p>Un personnage de ce clan a droit à l'objet de clan <strong>Épée Ulfberht</strong> s'il s'en montre digne.</p>`
  }
];

// ---------------------------------------------------------------------------
// Content: Equipment (clan items + nordic weapons)
// ---------------------------------------------------------------------------

const EQUIPMENT_DOCS = [
  weapon({
    name: "Hache à barbe courte", img: "icons/weapons/axes/axe-broad-brown.webp",
    html: `<p>Petite hache nordique à lame élargie, aussi maniable au corps à corps qu'au lancer.</p>`,
    damage: "d6", damageType: "slashing", properties: ["fin", "lgt", "thr"], weaponType: "martialM", price: 6, weight: 1
  }),
  weapon({
    name: "Hache d'assaut", img: "icons/weapons/axes/axe-double-worn-steel.webp",
    html: `<p>Hache lourde à deux mains, taillée pour l'assaut plutôt que le travail du bois.</p>`,
    damage: "d8", damageType: "slashing", properties: ["fin"], weaponType: "martialM", price: 12, weight: 2
  }),
  weapon({
    name: "Branche runique", img: "icons/weapons/staves/staff-simple.webp",
    html: `<p><strong>Objet de clan des Corbeaux de glace.</strong> Bâton noueux obtenu sur un frêne sacré, gravé de runes, incrusté d'un morceau de quartz blanc. Statistiques d'un bâton.</p>
      <p><em>Avantage aux tests de Sagesse (Ásatrú) tant que le personnage la tient en main. Peut servir de focaliseur divin ou arcanique pour un lanceur de sorts.</em></p>
      <p>Réservé aux membres ou alliés du clan, obtenu en récompense d'un haut fait ou remis par un chef de clan.</p>`,
    damage: "d6", damageType: "bludgeoning", properties: ["ver"], weaponType: "simpleM", price: 0, weight: 2
  }),
  equipment({
    name: "Cor retentissant", img: "icons/tools/instruments/horn-drinking-white.webp",
    html: `<p><strong>Objet de clan des Cornes de Gjallar.</strong> Cor de bataille taillé dans les cornes des meilleurs bovins de la famille royale gardant le mur de la Danevirke.</p>
      <p><em>Avantage aux tests de Charisme (Persuasion) lors de transactions commerciales tant qu'il est porté. Audible jusqu'à 3 km. Soufflé en signal, il donne l'avantage aux jets de sauvegarde contre la peur (soi et alliés) pendant 1 minute.</em></p>
      <p>Réservé aux membres ou alliés du clan, obtenu en récompense d'un haut fait ou remis par un chef de clan.</p>`,
    armorType: "trinket", price: 0, weight: 1
  }),
  weapon({
    name: "Dent de la sorcière", img: "icons/weapons/daggers/dagger-bone.webp",
    html: `<p><strong>Objet de clan des Fils de jötunn.</strong> Couteau en corne de renne à lame en alliage spécial, permettant d'allumer un feu par étincelles même en conditions défavorables. Une petite crécelle est insérée dans la poignée en os, censée éloigner les mauvais esprits.</p>
      <p><em>Avantage aux tests de Sagesse (Survie) pour son possesseur.</em></p>
      <p>Réservé aux membres ou alliés du clan, obtenu en récompense d'un haut fait ou remis par un chef de clan.</p>`,
    damage: "d4", damageType: "piercing", properties: ["fin", "lgt", "thr"], weaponType: "simpleM", price: 0, weight: 1
  }),
  weapon({
    name: "Griffe de la Montagne", img: "icons/weapons/hammers/hammer-double-stone.webp",
    html: `<p><strong>Objet de clan des Guerriers ours.</strong> Maillet d'armes dont la tête a été taillée dans une roche froide extraite du cœur de la Montagne. Statistiques d'un maillet d'armes.</p>
      <p><em>Avantage aux tests de Force (Athlétisme) pour briser un objet. Sur un coup critique contre un adversaire tenant un bouclier, possibilité de briser le bouclier au lieu d'infliger les dégâts.</em></p>
      <p>Réservé aux membres ou alliés du clan, obtenu en récompense d'un haut fait ou remis par un chef de clan.</p>`,
    damage: "d6", diceCount: 2, damageType: "bludgeoning", properties: ["hvy", "two"], weaponType: "martialM", price: 0, weight: 4
  }),
  equipment({
    name: "Ombre du feuillage", img: "icons/equipment/shield/round-wooden-boss-steel.webp",
    html: `<p><strong>Objet de clan des Loups de l'ombre.</strong> Bouclier de bois léger mais résistant, recouvert de feuillage persistant tissé.</p>
      <p><em>Avantage aux tests de Dextérité (Discrétion) en se cachant dans la végétation, tout en conservant le bonus de classe d'armure du bouclier.</em></p>
      <p>Réservé aux membres ou alliés du clan, obtenu en récompense d'un haut fait ou remis par un chef de clan.</p>`,
    armorValue: 2, armorType: "shield", price: 0, weight: 3
  }),
  weapon({
    name: "Épée Ulfberht", img: "icons/weapons/swords/greatsword-crossguard.webp",
    html: `<p><strong>Objet de clan des Yeux d'Odhinn.</strong> Longue épée très aiguisée forgée avec le meilleur acier de Miðgarðr, réputée briser facilement les armes ordinaires.</p>
      <p><em>Avantage aux tests de Charisme (Intimidation) contre les habitants de Miðgarðr pour qui la brandit.</em></p>
      <p>Réservé aux membres ou alliés du clan, obtenu en récompense d'un haut fait ou remis par un chef de clan.</p>`,
    damage: "d8", damageType: "slashing", properties: ["ver"], weaponType: "martialM", price: 0, weight: 1.5
  }),
  equipment({
    name: "Karve", img: "icons/svg/item-bag.svg",
    html: `<p><em>Navire polyvalent, comparable à un Snekkja de la taille d'un Knarr, utilisé aussi bien pour la guerre que pour le commerce. Sa structure lui permet de naviguer en eaux peu profondes, donnant l'avantage à tous les tests effectués à proximité du rivage.</em></p>
      <table><tr><th>Longueur</th><td>17 m</td></tr>
      <tr><th>Largeur</th><td>3 m</td></tr>
      <tr><th>Coût</th><td>5 000 po</td></tr>
      <tr><th>Temps de construction</th><td>50 jours</td></tr>
      <tr><th>Vitesse</th><td>19 km/h (env. 300 km/jour)</td></tr>
      <tr><th>Points d'intégrité</th><td>8</td></tr>
      <tr><th>Équipage minimum</th><td>10 (dont 8 marins)</td></tr>
      <tr><th>Équipage maximum</th><td>18</td></tr></table>
      <p>Voir <em>Règles de navigation</em> (compendium Grimoire runique & guide) pour les points d'intégrité, la réparation par un Skipasmidhr et les tests de traversée.</p>`,
    price: 5000, weight: 0
  }),
  equipment({
    name: "Snekkja", img: "icons/svg/item-bag.svg",
    html: `<p><em>Navire de guerre majestueux et richement décoré, capable d'entreprendre de longs voyages. Le Snekkja est un vaisseau léger et effilé, qui n'a pas besoin de port pour accoster et peut être échoué avec un test de groupe de Force (Athlétisme) DD 15.</em></p>
      <table><tr><th>Longueur</th><td>28 m</td></tr>
      <tr><th>Largeur</th><td>4,5 m</td></tr>
      <tr><th>Coût</th><td>10 000 po</td></tr>
      <tr><th>Temps de construction</th><td>100 jours</td></tr>
      <tr><th>Vitesse</th><td>19 km/h (env. 300 km/jour)</td></tr>
      <tr><th>Points d'intégrité</th><td>12</td></tr>
      <tr><th>Équipage minimum</th><td>28 (dont 26 marins)</td></tr>
      <tr><th>Équipage maximum</th><td>40</td></tr></table>
      <p>Voir <em>Règles de navigation</em> (compendium Grimoire runique & guide) pour les points d'intégrité, la réparation par un Skipasmidhr et les tests de traversée.</p>`,
    price: 10000, weight: 0
  })
];

// ---------------------------------------------------------------------------
// Content: Objets magiques légendaires (Annexe, p. 296-304)
// ---------------------------------------------------------------------------

const MAGIC_ITEMS = [
  weapon({
    name: "Angurvadal", img: "icons/weapons/swords/sword-guard-runes.webp", rarity: "rare", attunement: "required",
    damage: "d8", damageType: "slashing", properties: ["ver"], weaponType: "martialM",
    html: `<p>Épée viking avec des runes magiques gravées sur la lame (n'importe quel type d'épée). Vous gagnez un bonus de +1 aux jets d'attaques et de dégâts effectués avec cette arme.</p>
      <p><strong>Intelligente.</strong> Angurvadal est une arme magique intelligente Loyale Honorable, Intelligence 8, Sagesse 12, Charisme 10. Elle ne peut pas parler, mais communique avec son porteur en faisant luire les runes sur sa lame dès qu'un ennemi approche dans un rayon de 18 m.</p>
      <p><strong>Personnalité.</strong> N'ayant été utilisée qu'en combat, elle inspire une joie féroce lors des batailles.</p>`
  }),
  equipment({
    name: "Andvaranautr, anneau d'Andvari", img: "icons/equipment/finger/ring-gold-worn.webp", rarity: "artifact", attunement: "required",
    html: `<p>Cet anneau maudit augmente la durée de vie de son porteur, mais aussi sa convoitise de richesses et de trésors. Une créature qui le voit doit réussir un jet de sauvegarde de Sagesse DD 15 ou est fascinée par l'objet et souhaite le posséder à tout prix.</p>
      <p><strong>Le trésor de son maître.</strong> On ne peut tenter d'enlever l'anneau, de le jeter, de le céder ou d'annuler l'harmonisation qu'une fois par jour en réussissant un jet de sauvegarde de Sagesse DD 15 (le DD augmente de 1 à chaque tentative).</p>
      <p><strong>Voleur.</strong> Tant que vous êtes harmonisé, vous maîtrisez Discrétion si ce n'était pas déjà le cas et êtes avantagé aux tests de Dextérité (Discrétion) pour dérober de l'or ou des objets précieux.</p>
      <p><strong>Longue vie et prospérité.</strong> Tant que vous êtes harmonisé : immunisé contre les maladies ; vous ne pouvez plus être charmé ou terrorisé ; vous vieillissez et vous sustentez dix fois moins vite ; +1 à la CA.</p>
      <p><strong>Malédiction (progressive).</strong> Un mois : votre corps se couvre d'écailles luisantes (+2 CA naturelle supplémentaire, DD pour retirer l'anneau 18, convoitise accrue). Trois mois : dents et ongles deviennent crocs et griffes (morsure 1d4+For, griffe 1d6+For ; DD pour retirer 20). Six mois : vous soufflez la mort — cône de poison 9 m, 12d6 dégâts de poison, DD 16 pour moitié dégâts ; DD pour retirer 25. Un an : jet de sauvegarde de Sagesse DD 30 chaque jour ou votre corps se transforme définitivement en dragon vert adulte ; DD pour retirer 30.</p>
      <p><strong>Destruction.</strong> L'anneau doit être jeté dans les flammes de Múspellsheimr après un jet de sauvegarde de Sagesse DD 30 réussi (sinon le porteur est charmé par l'anneau). Toute autre tentative de destruction inflige 4d8 dégâts psychiques à son auteur, qui doit réussir un jet de sauvegarde de Sagesse DD 30 pour ne pas être charmé.</p>`
  }),
  equipment({
    name: "Anneau du chasseur silencieux", img: "icons/equipment/finger/ring-band-simple-gold.webp", rarity: "rare", attunement: "required",
    html: `<p>Cet anneau contient trois charges et récupère 1d3 charges à l'aube. Le porteur peut dépenser une charge par une action pour lancer le sort <em>silence</em> sans composant matériel, en rayon de 1,5 m centré sur un point situé à 36 m ou moins du porteur ou de l'anneau lui-même.</p>`
  }),
  equipment({
    name: "Cape à plumes de Freyja", img: "icons/equipment/back/cape-collared-white.webp", rarity: "legendary", attunement: "required",
    html: `<p>Cette cape de plumes de faucon tressées appartient à la déesse Freyja. Vous gagnez un bonus de +2 aux jets de sauvegarde et à la CA. Vous pouvez utiliser votre action pour vous transformer en faucon ou reprendre votre forme normale. Si vous mourez sous forme de faucon, vous reprenez votre forme d'origine en subissant tout le surplus de dégâts.</p>`
  }),
  equipment({
    name: "Corne à boire d'Ægir gravée d'un arbre", img: "icons/tools/instruments/horn-drinking-white.webp", rarity: "veryRare", attunement: "",
    html: `<p>Cette corne magique permet de boire deux fois plus rapidement, sans en subir les effets d'ivresse. Tant que vous la transportez, vous êtes avantagé aux tests de Charisme (Persuasion) pour convaincre quelqu'un de participer à un concours de boisson ou lors d'interactions sociales avec des gens alcoolisés.</p>
      <p>Boire à cette corne vous rend avantagé aux jets de sauvegarde contre l'état terrorisé pendant 24 h.</p>`
  }),
  equipment({
    name: "Draupnir", img: "icons/equipment/finger/ring-gold-red.webp", rarity: "legendary", attunement: "",
    html: `<p>Toutes les neuf nuits, huit nouveaux anneaux apparaissent à côté de celui-ci, identiques à l'original hormis cet effet. Déterminer lequel des simples anneaux d'or est l'original nécessite la réussite d'un test d'Intelligence (Investigation) DD 15.</p>`
  }),
  weapon({
    name: "Épée de Skallfoss", img: "icons/weapons/swords/sword-guard-gold.webp", rarity: "uncommon", attunement: "",
    damage: "d8", damageType: "slashing", properties: ["ver"], weaponType: "martialM",
    html: `<p>Chef-d'œuvre du légendaire forgeron Skallfoss (n'importe quel type d'épée), réservée aux Æsir et aux Vanir, léguée de génération en génération de héros de Miðgarðr. Bonus de +1 aux jets d'attaque et de dégâts.</p>
      <p>Tant que vous la portez de manière ostentatoire, vous êtes avantagé aux tests de Charisme (Persuasion) quand vous interagissez avec des Æsir ou des Vanir.</p>`
  }),
  weapon({
    name: "Gramr", img: "icons/weapons/swords/greatsword-crossguard-glowing.webp", rarity: "legendary", attunement: "required",
    damage: "d6", damageType: "slashing", properties: ["hvy", "two"], weaponType: "martialM",
    html: `<p>Épée à deux mains. Bonus de +3 aux jets d'attaque et de dégâts. Quand vous frappez avec succès un objet, une créature portant une armure ou bénéficiant d'un bonus d'armure naturelle à la CA, vous infligez les dégâts maximaux.</p>
      <p>Sur un 20 naturel contre un objet, vous le brisez automatiquement. Sur un 20 naturel contre une créature portant une armure, son armure est automatiquement détruite et elle ne peut plus l'utiliser.</p>`
  }),
  weapon({
    name: "Gungnir, la lance d'Odhinn", img: "icons/weapons/polearms/spear-heavy-guard.webp", rarity: "artifact", attunement: "required",
    damage: "d12", damageType: "piercing", properties: ["thr", "ver"], weaponType: "martialM",
    html: `<p>Lance légendaire forgée pour Odhinn par les fils du nain Ivaldi, guidés par le forgeron Dvalinn.</p>
      <p><strong>Arme magique.</strong> Gungnir inflige 1d12 dégâts. Bonus de +2 aux jets d'attaque et de dégâts, et inflige 3d8 dégâts radiants supplémentaires.</p>
      <p><strong>Aura divine.</strong> Tant qu'harmonisé, votre taille augmente à Grande si ce n'était pas déjà le cas et votre peau émet un halo de lumière faible en rayon de 3 m.</p>
      <p><strong>Implacable.</strong> Toutes les attaques effectuées avec Gungnir touchent automatiquement et ignorent toute résistance ou immunité.</p>
      <p><strong>Influence divine.</strong> Tant qu'harmonisé, vos valeurs de caractéristique s'élèvent à 20 si elles ne sont pas déjà supérieures.</p>
      <p><strong>Le pouvoir du temps.</strong> Tant qu'harmonisé, vous pouvez utiliser votre action pour lancer <em>arrêt du temps</em> ou <em>projectile magique</em> sans composant, comme avec un emplacement de sort de niveau 9. Après l'un ou l'autre, lancez 1d6 : sur 1-5, vous devez attendre l'aube prochaine avant de pouvoir relancer ce sort.</p>
      <p><strong>Destruction.</strong> Arme parfaite en acier, il est impossible de détruire Gungnir.</p>`
  }),
  weapon({
    name: "Hache du conquérant", img: "icons/weapons/axes/axe-double-bearded-worn.webp", rarity: "veryRare", attunement: "required",
    damage: "d8", damageType: "slashing", properties: ["hvy", "two"], weaponType: "martialM",
    html: `<p>Bonus de +2 aux jets d'attaque et de dégâts, et 2d6 dégâts supplémentaires contre les morts-vivants.</p>
      <p>Tant que vous la maniez, vous êtes avantagé aux jets d'attaque pour bousculer et empoigner, aux tests opposés pour maintenir votre prise sur une créature empoignée et aux tests de Force (Athlétisme) pour escalader.</p>`
  }),
  equipment({
    name: "Járngreipr, gantelets nains", img: "icons/equipment/hand/gauntlet-armored-steel.webp", rarity: "legendary", attunement: "required",
    html: `<p>Chefs-d'œuvre nains conçus pour les plus grands guerriers : ils augmentent la Force de leur porteur selon leur rareté, empêchent d'être désarmé et avantagent aux tests pour empoigner et bousculer. Seul le dieu Thor possède l'unique version légendaire.</p>
      <table><tr><th>Rareté</th><th>Bonus à la Force</th></tr>
      <tr><td>Peu courant</td><td>+1</td></tr><tr><td>Rare</td><td>+2</td></tr><tr><td>Très rare</td><td>+3</td></tr><tr><td>Légendaire (Thor)</td><td>+4</td></tr></table>`
  }),
  equipment({
    name: "Médaillon du cœur de Múspellsheimr", img: "icons/equipment/neck/pendant-red-gem.webp", rarity: "rare", attunement: "",
    html: `<p>Tant que vous portez ce médaillon, vous pouvez supporter la chaleur de l'environnement quelle que soit son intensité, et les feux naturels ne vous infligent aucune blessure.</p>`
  }),
  equipment({
    name: "Megingjörð, ceinture de force naine", img: "icons/equipment/waist/belt-leather-brown.webp", rarity: "legendary", attunement: "required",
    html: `<p>Ceinture dans laquelle les nains ont insufflé la force des géants. Tant que vous la portez, votre valeur de Force devient celle correspondant à la rareté de la ceinture (sans effet si votre valeur est déjà égale ou supérieure). Vous êtes avantagé aux tests de Force (Athlétisme) et pour éviter d'être jeté à terre ou garder l'équilibre. Il existe quatre variantes ; seul Thor possède l'unique version légendaire.</p>
      <table><tr><th>Rareté</th><th>Valeur de Force</th></tr>
      <tr><td>Peu courant</td><td>20</td></tr><tr><td>Rare</td><td>22</td></tr><tr><td>Très rare</td><td>24</td></tr><tr><td>Légendaire (Thor)</td><td>26</td></tr></table>`
  }),
  weapon({
    name: "Mjöllnir, le marteau de Thor", img: "icons/weapons/hammers/hammer-double-heavy.webp", rarity: "artifact", attunement: "required",
    damage: "d8", damageType: "bludgeoning", properties: ["thr", "ver"], weaponType: "martialM",
    html: `<p>On ne peut soulever Mjöllnir ou s'harmoniser avec lui qu'en portant une megingjörð ou des járngreipr.</p>
      <p><strong>Arme magique.</strong> Bonus de +3 aux jets d'attaque et de dégâts. Cibles subissent 2d6 dégâts de foudre et 2d6 dégâts de tonnerre supplémentaires. Propriété lancer, portée 6/18 m, revient dans votre main après avoir été lancé.</p>
      <p><strong>Aura d'orage.</strong> Tant qu'harmonisé, taille Grande si ce n'était pas déjà le cas ; votre peau crépite d'électricité — quand on vous frappe au corps à corps, l'agresseur subit 2d6 dégâts de foudre.</p>
      <p><strong>Fléau des géants.</strong> Attaque réussie contre un géant : 4d8 dégâts supplémentaires.</p>
      <p><strong>Père de la foudre.</strong> Tant qu'harmonisé, action pour lancer <em>chaîne d'éclairs</em> sans composant. Ensuite, 1d6 : sur 1-5, attendre l'aube prochaine pour relancer.</p>
      <p><strong>Médaillon du tonnerre.</strong> Sur mot de commande, Mjöllnir prend la forme d'un petit pendentif.</p>
      <p><strong>Infusion de force.</strong> Tant qu'harmonisé, Force fixée à 30.</p>
      <p><strong>Destruction.</strong> Seules des décennies dans les forges où il fut créé peuvent mettre à mal sa résistance.</p>`
  }),
  weapon({
    name: "Kuttnir, réplique de Mjöllnir", img: "icons/weapons/hammers/hammer-double-simple.webp", rarity: "veryRare", attunement: "required",
    damage: "d8", damageType: "slashing", properties: ["ver"], weaponType: "martialM",
    html: `<p>Épée (n'importe quel type). Bonus de +2 aux jets d'attaque et de dégâts ; attaque réussie inflige 1d8 dégâts de foudre supplémentaires. Sur un 19 ou 20 au jet d'attaque, un éclair instable jaillit et inflige 2d8 dégâts de foudre supplémentaires à trois ennemis au maximum à 6 m ou moins de vous.</p>`
  }),
  equipment({
    name: "Skíðblaðnir, le bateau de Freyr", img: "icons/tools/navigation/pouch-drawstring-brown.webp", rarity: "legendary", attunement: "",
    html: `<p>Le plus extraordinaire des bateaux magiques nains, sous la forme d'un sac de cuir d'un demi-kilo qui peut flotter. Trois mots de commande (une action chacun) :</p>
      <p><strong>1er mot :</strong> convoque un bateau de 9 m × 3 m × 1,5 m (barre, deux paires de rames, ancre, mât et voile), transportant jusqu'à 5 créatures de taille Moyenne, naviguant toujours par vent favorable sauf effet magique contraire.</p>
      <p><strong>2e mot :</strong> convoque un bateau de 36 m × 12 m × 4,5 m (gouvernail, cinq paires de rames, ancre, deux mâts et voiles), transportant jusqu'à 30 créatures de Grande taille, même conditions de vent favorable.</p>
      <p><strong>3e mot :</strong> le bateau retourne dans le sac s'il n'y a personne à bord.</p>`
  }),
  weapon({
    name: "Skofnung", img: "icons/weapons/swords/sword-guard-worn.webp", rarity: "legendary", attunement: "required",
    damage: "d8", damageType: "slashing", properties: ["ver"], weaponType: "martialM",
    html: `<p>Épée (n'importe quel type). Bonus de +1 aux jets d'attaque et de dégâts.</p>
      <p>Action pour prononcer le mot de commande : convoque les esprits de douze berserkir en rayon de 18 m autour de vous. Si vous n'avez pas un alignement Honorable, les berserkir vous attaquent ; sinon, ils sont amicaux envers vous et vos alliés et obéissent à vos ordres.</p>`
  }),
  equipment({
    name: "Svalinn, le bouclier du soleil", img: "icons/equipment/shield/heater-crest-sun.webp", rarity: "artifact", attunement: "required", armorType: "shield", armorValue: 6,
    html: `<p>Bouclier légendaire qui protège Sól du soleil lorsqu'elle conduit son chariot.</p>
      <p><strong>Bouclier magique.</strong> Bonus total de +6 à la CA au lieu du bonus normal de bouclier.</p>
      <p><strong>Protection solaire.</strong> Tant qu'harmonisé et manié : immunisé aux dégâts de froid et de feu et à l'aise quelle que soit la température ; vous ne pouvez plus être charmé ou terrorisé ; vous ne pouvez plus être aveuglé, assourdi ou étourdi.</p>
      <p><strong>Aura glaciale.</strong> Tant qu'harmonisé, taille Grande si ce n'était pas déjà le cas, peau couverte de givre scintillant. Attaque de corps à corps réussie : +1d6 dégâts de froid. Agresseur au corps à corps réussi contre vous : subit 2d6 dégâts de froid.</p>
      <p><strong>Source de froid.</strong> Tant qu'harmonisé, action pour lancer <em>cône de froid</em> sans composant. Ensuite 1d6 : sur 1-5, attendre l'aube prochaine pour relancer.</p>
      <p><strong>Destruction.</strong> Seul un effet de désintégration extrêmement puissant peut détruire Svalinn.</p>`
  }),
  weapon({
    name: "Týrfing", img: "icons/weapons/swords/sword-worn-black.webp", rarity: "veryRare", attunement: "required",
    damage: "d8", damageType: "slashing", properties: ["ver"], weaponType: "martialM",
    html: `<p>Épée maudite (n'importe quel type). Bonus de +2 aux jets d'attaque et de dégâts.</p>
      <p>Il est impossible de récupérer les points de vie perdus à cause de cette arme en se reposant : seules la régénération ou la magie peuvent soigner ces blessures. Une fois Týrfing dégainée, il est impossible de la rengainer avant d'avoir tué une créature consciente.</p>`
  }),
  weapon({
    name: "Dyrnwyn", img: "icons/weapons/swords/sword-guard-gold.webp", rarity: "legendary", attunement: "required",
    damage: "d8", damageType: "slashing", properties: ["ver"], weaponType: "martialM",
    html: `<p><strong>Arme prodigieuse (épée longue).</strong> Bonus de +2 aux jets d'attaque et de dégâts effectués avec cette arme magique, ou, alternativement, un bonus égal à votre modificateur de Charisme.</p>
      <p>Quand Dyrnwyn est dégainée, chaque créature hostile à son porteur à 9 m ou moins doit réussir un jet de sauvegarde de Charisme DD 15 ou être aveuglée jusqu'à la fin d'un repos long.</p>
      <p>Dyrnwyn émet une lumière vive dans un rayon de 12 m et une lumière faible sur 12 m supplémentaires.</p>
      <p>Dyrnwyn possède 7 charges. Quand son porteur touche un ennemi avec elle, il peut dépenser jusqu'à deux charges pour infliger 1d10 dégâts de force supplémentaires par charge dépensée. À l'aube, Dyrnwyn récupère 1d6+1 charges dépensées. Quand sa dernière charge est dépensée, lancez 1d20 : sur un 1, l'arme disparaît dans un éclair de lumière.</p>`
  }),
  equipment({
    name: "Main de justice", img: "icons/weapons/wands/wand-gold-brown.webp", rarity: "rare", attunement: "required",
    html: `<p><strong>Baguette prodigieuse</strong> (harmonisation réservée à un clerc, un ensorceleur, un magicien ou un sorcier). Ce sceptre doré d'environ 60 cm se termine par une main sculptée dont les trois premiers doigts sont tendus. Autrefois remis en insigne de charge à ceux qui agissaient au nom des empereurs francs, il est aujourd'hui offert par l'antique et puissant Draugr qui règne sur ces terres à ses champions, comme pour railler l'ancienne tradition.</p>
      <p>La Main de justice ajoute 2 au DD de sauvegarde des sorts lancés par son porteur harmonisé et lui accorde un bonus de +2 aux jets d'attaque de sort.</p>
      <p><strong>Malédiction.</strong> Tant que l'objet reste sur Miðgarðr, son porteur harmonisé fait des cauchemars terribles chaque fois qu'il s'endort : il doit réussir un jet de sauvegarde de Sagesse pour bénéficier des soins d'un repos ; en cas d'échec, hanté par des visions d'une armée de morts-vivants, il se réveille trempé de sueur, ne récupère aucun point de vie et ne peut se rendormir avant 6 heures (sauf sous l'effet du sort <em>sommeil</em> ou d'un autre sommeil magique).</p>`
  }),
  equipment({
    name: "Pendentif de quartz solaire", img: "icons/equipment/neck/pendant-gold-yellow.webp", rarity: "veryRare", attunement: "",
    html: `<p>Ce pendentif de quartz porte la rune Sowilo gravée à sa surface, représentant la chaleur apaisante du soleil.</p>
      <p>Cet objet émet une lumière vive dans un rayon de 36 m et une lumière faible sur 36 m supplémentaires. La lumière émise par le Quartz solaire compte comme lumière du soleil : les créatures qui y sont vulnérables en subissent les effets comme si elles se trouvaient exposées au soleil.</p>
      <p>Les créatures à portée du pendentif ressentent une chaleur apaisante et sont immunisées contre les conditions climatiques extrêmes, comme le Fimbulvetr ou le froid glacial de Niflheimr.</p>
      <p>La chaleur qui émane de la pierre suffit à faire fondre les icebergs des mers de Miðgarðr, facilitant la navigation.</p>`
  }),
  equipment({
    name: "Orbe murmurant", img: "icons/magic/perception/orb-eye-purple-red.webp", rarity: "rare", attunement: "required",
    html: `<p>Quiconque tient cet orbe de laiton dépourvu de trait distinctif entend surtout des murmures incompréhensibles — certains pensent que la sphère prodigue de précieux conseils, d'autres qu'elle ne mène qu'à la folie.</p>
      <p>Le porteur harmonisé à l'Orbe murmurant est occasionnellement prévenu d'un danger imminent par les murmures sombres que la sphère instille dans son esprit : il est avantagé aux jets de sauvegarde de Dextérité et gagne un bonus de +1 à la CA.</p>
      <p>Cependant, entendre sans cesse ces paroles et ces voix affolantes ronge la raison de son porteur, qui est désavantagé aux jets de sauvegarde de Sagesse tant qu'il reste harmonisé.</p>
      <p><strong>Intelligente.</strong> L'Orbe murmurant est un objet magique intelligent Chaotique Neutre, Intelligence 10, Sagesse 8, Charisme 14. Il communique par télépathie avec son porteur harmonisé, la plupart du temps par un charabia murmuré.</p>
      <p><strong>Personnalité.</strong> La personnalité de l'Orbe, tout comme sa véritable finalité, reste un mystère.</p>`
  })
];

// ---------------------------------------------------------------------------
// Content: Historiques (backgrounds)
// ---------------------------------------------------------------------------

const BACKGROUND_IMG = "icons/environment/people/commoner.webp";

const BACKGROUNDS = [
  {
    name: "Bondhi", skills: ["ani", "prc"], tool: "art",
    privilege: "Un foyer où revenir",
    privilegeHtml: `<p>En choisissant un lieu à Miðgarðr, votre personnage y possède une maison et une terre (et une famille, si vous le souhaitez). La communauté locale l'apprécie et l'aide dans les moments difficiles.</p>
      <p><em>Variante « hersir » : membre plus influent, participant aux débats du þing. Privilège remplacé par <strong>grande propriété</strong> : +5 po de départ et 2 po/jour récupérables au retour chez soi, au risque d'une usurpation en cas d'absence prolongée.</em></p>`,
    html: `<p><strong>Le paysan libre.</strong> Cultivateur et guerrier occasionnel, propriétaire de son lopin de terre.</p>
      <p><strong>Compétences :</strong> Dressage, Perception. <strong>Outils :</strong> un ensemble d'outils d'artisan au choix.</p>
      <p><strong>Équipement de départ :</strong> habits courants, un ensemble d'outils d'artisan, un bracelet orné d'une rune, une arme courante, un récipient en terre cuite, une sacoche de cuir et 15 po.</p>`
  },
  {
    name: "Gothi", skills: ["asa", "med"], tool: "herb",
    privilege: "Témoignage de sympathie et hospitalité",
    privilegeHtml: `<p>Un accueil (nourriture, abri) est garanti dans toute communauté respectant les anciens dieux, en échange de rituels — un accueil qui s'étend à ses compagnons.</p>`,
    html: `<p><strong>L'officiant des rites du quotidien.</strong> Sans être un prêtre au sens strict, il accomplit les rituels courants et fait le lien entre sa communauté et les esprits ; fonction souvent héréditaire, interdite aux esclaves et aux renégats.</p>
      <p><strong>Compétences :</strong> Ásatrú, Médecine. <strong>Outils :</strong> matériel d'herboriste.</p>
      <p><strong>Équipement de départ :</strong> robe de cérémonie, matériel d'herboriste, talisman de pierre gravé d'une rune, cinq morceaux d'écorce aromatique, une sacoche de cuir et 15 po.</p>`
  },
  {
    name: "Huscarl", skills: ["inv", "ins"], tool: null,
    privilege: "Compétences de huscarl",
    privilegeHtml: `<p>Statut reconnu à vie, sauf déshonneur ou crime. Soutien garanti d'autres huscarlar, même loin de chez soi, sur preuve d'appartenance — sauf hostilité manifeste.</p>`,
    html: `<p><strong>Le garde du corps professionnel.</strong> Engagé pour défendre une maison, une personne ou un seigneur, au prix de sa propre sécurité.</p>
      <p><strong>Compétences :</strong> Investigation, Perspicacité.</p>
      <p><strong>Équipement de départ :</strong> habits courants, uniforme d'huscarl, une grande cape, un casque orné d'une rune, une arme de guerre, une sacoche de cuir et 20 po.</p>`
  },
  {
    name: "Jarlr", skills: ["asa", "his"], tool: null,
    privilege: "Le sang des héros",
    privilegeHtml: `<p>Dans le lieu choisi à la création du personnage, celui-ci est reconnu comme le chef de la région.</p>`,
    html: `<p><strong>Le chef de lignée.</strong> Issu d'une lignée prestigieuse, à la tête d'une armée régionale, juge lors des procès, souvent élu par le þing.</p>
      <p><strong>Compétences :</strong> Ásatrú, Histoire.</p>
      <p><strong>Équipement de départ :</strong> beaux habits, une cape brodée, un anneau précieux gravé d'une rune, une broche à symbole familial, une sacoche de cuir et 25 po.</p>`
  },
  {
    name: "Skógarmaðr", skills: ["ste", "sur"], tool: null,
    privilege: "Fausse identité",
    privilegeHtml: `<p>Après avoir survécu seul à l'hiver, le personnage s'est reconstruit une nouvelle identité dans une région lointaine (oracle mendiant, esclave affranchi, seul survivant d'une tragédie…). Il peut croiser d'autres skógarmenn dans des refuges cachés en forêt.</p>`,
    html: `<p><strong>Le banni des bois.</strong> Déchu de tous droits, condamné à mort à vue, contraint de survivre seul en forêt.</p>
      <p><strong>Compétences :</strong> Discrétion, Survie.</p>
      <p><strong>Équipement de départ :</strong> vêtements en lambeaux, un bracelet de serment à la rune brisée, un couteau en silex et 5 po.</p>`
  },
  {
    name: "Thrallr", skills: ["ani", "prf"], tool: null,
    privilege: "Protégé par le maître",
    privilegeHtml: `<p>Nourriture et abri garantis chez son maître (sauf fuite ou déshonneur), un soutien possible même après le rachat de la liberté.</p>
      <p><em>Variante « esclave étranger » : origine lointaine (butin de raid, achat, capture). Privilège remplacé par <strong>connaissances étrangères</strong> : avantage aux tests d'Arcanes, Religion et Histoire sur les cultures étrangères ; peut interroger son maître sur son pays d'origine.</em></p>`,
    html: `<p><strong>L'esclave.</strong> Condamné par dette ou capture, soumis à un maître, mais nourri, logé, et pouvant racheter sa liberté par le travail ou de bonnes actions.</p>
      <p><strong>Compétences :</strong> Dressage, Représentation.</p>
      <p><strong>Équipement de départ :</strong> vêtements de piètre qualité, des outils de travail, une rune gravée sur bois donnée par le maître, un bol de bois et 5 po.</p>`
  },
  {
    name: "Vaeringhi", skills: ["ins", "per"], tool: "art",
    privilege: "Serment sacré",
    privilegeHtml: `<p>Le serment de confrérie prime sur tout autre engagement. Il garantit toujours une place à bord d'un bateau ou un travail, et l'aide d'autres vaeringjar non hostiles.</p>`,
    html: `<p><strong>Le marchand-guerrier.</strong> Voyage par fleuves et mers pour commercer, organisé en confréries jurées par serment sur l'épée.</p>
      <p><strong>Compétences :</strong> Perspicacité, Persuasion. <strong>Outils :</strong> un ensemble d'outils d'artisan au choix.</p>
      <p><strong>Équipement de départ :</strong> habits courants, une balance portable rudimentaire, un poids métallique gravé d'une rune, un petit bijou étranger, une sacoche de cuir et 15 po.</p>`
  },
  {
    name: "Vikingr", skills: ["ath", "itm"], tool: "navg",
    privilege: "Fraternité de sang",
    privilegeHtml: `<p>Le pacte de sang scellé avec ses frères pillards (rite du Fòstbroedhralagr) prime sur les liens familiaux. Il garantit un soutien inconditionnel de ces frères, même contre un supérieur.</p>`,
    html: `<p><strong>Le pillard indépendant.</strong> « Fara í víkingu » — pirate, raider ou mercenaire cherchant gloire et richesse loin de sa terre natale.</p>
      <p><strong>Compétences :</strong> Athlétisme, Intimidation. <strong>Outils :</strong> instruments de navigateur.</p>
      <p><strong>Équipement de départ :</strong> vêtements tape-à-l'œil, un cadran solaire en pierre gravé d'une rune (faisant office d'instruments de navigateur), une arme de guerre, une canule de tatouage pointue, une sacoche de cuir et 20 po.</p>`
  },
  {
    name: "Skipasmidhr", skills: ["ath", "prc"], tool: "carpenter",
    privilege: "Compétences de charpentier",
    privilegeHtml: `<p>Le personnage maîtrise les techniques traditionnelles de construction navale. Chaque fois qu'il effectue un test d'outils de charpentier pour construire ou réparer un navire, son bonus de maîtrise est doublé. Il peut ainsi réparer 1 point d'intégrité à un navire, voire en construire un nouveau, s'il dispose des ressources adéquates.</p>`,
    html: `<p><strong>Le charpentier de marine.</strong> Les Skipasmidhr comptent parmi les artisans les plus estimés et renommés de Miðgarðr, car les navires sont la sève de l'économie des gens du Nord : pêche, commerce et raids au long cours seraient impossibles sans leur savoir-faire. Les techniques permettant de construire des vaisseaux capables de s'aventurer loin des rivages nordiques sont des secrets jalousement gardés, transmis de père en fils ou enseignés par un maître charpentier à une poignée d'apprentis triés sur le volet. Toujours respectés, ils négocient d'égal à égal avec les seigneurs et dames les plus puissants pour leur fournir les meilleurs bateaux de raid.</p>
      <p><strong>Compétences :</strong> Athlétisme, Perception. <strong>Outils :</strong> outils d'artisan (outils de charpentier).</p>
      <p><strong>Équipement de départ :</strong> habits courants, des outils de charpentier, une corde épaisse, une arme courante, un pendentif gravé d'une rune façonné dans le bois d'un antique navire, une sacoche de cuir avec 20 po.</p>`
  }
];

// ---------------------------------------------------------------------------
// Content: Maître des runes (class, subclasses, features)
// ---------------------------------------------------------------------------

const RUNE_IMG = "icons/sundries/scrolls/scroll-bound-rune-brown.webp";

const CLASS_FEATURES = [
  feat({
    name: "Cercle de futhark", img: RUNE_IMG, requirements: "Maître des runes 1",
    featureType: "class",
    html: `<p>Par une action, vous désignez un point au sol que vous pouvez voir à 18 m ou moins : cela crée un <strong>cercle de futhark</strong> de 3 m de rayon centré sur ce point. Pour le maintenir actif, vous devez utiliser une action bonus à chaque tour et le cercle doit rester dans votre champ de vision.</p>
      <p>Quand une créature dans votre champ de vision attaque une cible se trouvant dans le cercle (autre que vous-même), vous pouvez dépenser un <strong>dé de cercle de futhark</strong> en réaction pour soustraire le résultat obtenu au jet d'attaque de cette créature.</p>
      <p>Vous disposez d'un nombre de dés de cercle de futhark égal à votre modificateur de Sagesse (1 au minimum), récupérés à la fin d'un repos long. Le dé est un <strong>d6</strong>, qui devient un <strong>d8</strong> au niveau 5, un <strong>d10</strong> au niveau 10 et un <strong>d12</strong> au niveau 15 (voir la valeur mise à l'échelle sur cette aptitude).</p>`
  }),
  feat({
    name: "Incantation runique", img: RUNE_IMG, requirements: "Maître des runes 1",
    featureType: "class",
    html: `<p>À la fin d'un repos long, choisissez un tour de magie parmi la liste suivante : <em>message, bouffée de poison, partager le sang, produire une flamme</em>. Vous connaissez et pouvez lancer ce tour de magie jusqu'à la fin de votre prochain repos long, où vous pourrez en choisir un différent.</p>`
  }),
  feat({
    name: "Protéger le marqué", img: RUNE_IMG, requirements: "Maître des runes 3",
    featureType: "class",
    html: `<p>Lors d'un repos long, vous peignez une combinaison runique sur un allié consentant qui devient votre <strong>marqué</strong>. Il compte toujours comme se trouvant à l'intérieur de votre cercle de futhark, et la portée de vos sorts est doublée pour déterminer s'il en est une cible valide (même hors de votre champ de vision).</p>
      <p>Vous ne pouvez avoir qu'un seul marqué à la fois ; en marquer un nouveau retire tous les bénéfices au précédent.</p>`
  }),
  feat({
    name: "Expertise (Maître des runes)", img: RUNE_IMG, requirements: "Maître des runes 3",
    featureType: "class",
    html: `<p>Choisissez deux de vos compétences maîtrisées, ou l'une d'elles et votre maîtrise des outils de graveur de runes. Votre bonus de maîtrise est doublé pour tout test de caractéristique que vous effectuez avec l'une ou l'autre.</p>`
  }),
  feat({
    name: "Restauration runique", img: RUNE_IMG, requirements: "Maître des runes 6",
    featureType: "class",
    html: `<p>Vous récupérez tous vos dés de cercle de futhark dépensés à la fin d'un repos court ou long.</p>`
  }),
  feat({
    name: "Tisseur du destin", img: RUNE_IMG, requirements: "Maître des runes 14",
    featureType: "class",
    html: `<p>Quand une attaque ou un sort visant une seule créature visible dans votre cercle de futhark réussit, vous pouvez dépenser un dé de cercle de futhark en réaction pour reproduire cet effet contre une autre créature du cercle. Le jet d'attaque d'origine doit rester suffisant contre la classe d'armure de la nouvelle cible ; celle-ci effectue les mêmes jets de sauvegarde que la cible d'origine.</p>
      <p>Vous ne pouvez utiliser cette aptitude qu'une fois entre chaque repos long.</p>`
  }),
  feat({
    name: "Tisseur du destin amélioré", img: RUNE_IMG, requirements: "Maître des runes 18",
    featureType: "class",
    html: `<p>Vous pouvez désormais utiliser Tisseur du destin deux fois entre chaque repos long.</p>`
  }),
  feat({
    name: "Prophétie persistante", img: RUNE_IMG, requirements: "Maître des runes 20",
    featureType: "class",
    html: `<p>Quand vous faites un jet d'initiative et qu'il ne vous reste plus de dé de cercle de futhark, vous en récupérez un.</p>`
  })
];

// Ætt subclass features: 3 ætts x 4 levels (2, 7, 9, 11)
const AETTS = [
  {
    name: "Ætt de Heimdallr", theme: "la protection et l'adversité", img: "icons/magic/defensive/shield-barrier-blue.webp",
    features: [
      { level: 2, name: "Sorts de l'ætt de Heimdallr", html: `<p>Au niveau approprié (dès que vous disposez d'un emplacement de sort du niveau correspondant), vous ajoutez les sorts suivants à votre liste de sorts de maître des runes :</p>
        <table><tr><th>Niveau de sort</th><th>Sorts</th></tr>
        <tr><td>1er</td><td>Bouclier de la foi, héroïsme</td></tr>
        <tr><td>2e</td><td>Peau d'écorce, protection contre le poison</td></tr>
        <tr><td>3e</td><td>Esprits gardiens, glyphe de protection</td></tr>
        <tr><td>4e</td><td>Peau de pierre, sanctuaire privé</td></tr>
        <tr><td>5e</td><td>Coquille antivie, mur de force</td></tr>
        <tr><td>6e</td><td>Protections et sceaux</td></tr>
        <tr><td>7e</td><td>Manoir somptueux</td></tr>
        <tr><td>8e</td><td>Mot de pouvoir étourdissant</td></tr>
        <tr><td>9e</td><td>Emprisonnement</td></tr></table>` },
      { level: 2, name: "Sceau d'Algiz", html: `<p>Vous pouvez dépenser un dé de cercle de futhark en réaction pour forcer une créature à relancer un jet d'attaque d'opportunité qu'elle vient de réussir contre une cible se trouvant dans votre cercle.</p>` },
      { level: 7, name: "Cercle de Heimdallr", html: `<p>Les alliés se trouvant dans votre cercle réduisent les dégâts qu'ils subissent d'un montant égal à la moitié de votre modificateur de Sagesse, avant application des résistances et vulnérabilités. En maintenant le cercle par une action bonus, vous pouvez le déplacer de 1,50 m.</p>` },
      { level: 9, name: "Tours de magie de Heimdallr", html: `<p>Les tours de magie <em>rayon de givre</em> et <em>résistance</em> s'ajoutent à votre liste de tours de magie runiques (voir Incantation runique).</p>` },
      { level: 11, name: "Vigilance d'Eihwaz", html: `<p>Vous et votre marqué n'avez besoin que d'une heure de sommeil lors d'un repos long pour être considérés comme reposés, et pouvez consacrer le reste du temps à des activités mineures. Vous êtes tous deux avantagés aux tests de Sagesse (Perception).</p>` }
    ]
  },
  {
    name: "Ætt de Freyja", theme: "l'abondance, la guérison et la prospérité", img: "icons/magic/life/heart-cross-strong-flame-purple.webp",
    features: [
      { level: 2, name: "Sorts de l'ætt de Freyja", html: `<p>Au niveau approprié (dès que vous disposez d'un emplacement de sort du niveau correspondant), vous ajoutez les sorts suivants à votre liste de sorts de maître des runes :</p>
        <table><tr><th>Niveau de sort</th><th>Sorts</th></tr>
        <tr><td>1er</td><td>Baies nourricières, création ou destruction d'eau</td></tr>
        <tr><td>2e</td><td>Aide, restauration inférieure</td></tr>
        <tr><td>3e</td><td>Respiration aquatique, revigorer</td></tr>
        <tr><td>4e</td><td>Fabrication, protection contre la mort</td></tr>
        <tr><td>5e</td><td>Création, relever les morts</td></tr>
        <tr><td>6e</td><td>Festin des héros</td></tr>
        <tr><td>7e</td><td>Régénération</td></tr>
        <tr><td>8e</td><td>Répulsion/attirance</td></tr>
        <tr><td>9e</td><td>Résurrection suprême</td></tr></table>` },
      { level: 2, name: "Bénédiction d'Ansuz", html: `<p>Par une action, vous pouvez dépenser un dé de cercle de futhark pour soigner une créature se trouvant dans votre cercle d'un nombre de points de vie égal au résultat du dé plus votre modificateur de Sagesse.</p>` },
      { level: 7, name: "Cercle de Freyja", html: `<p>Les alliés se trouvant dans votre cercle sont avantagés aux jets de sauvegarde contre la mort ; un allié récupère 1 point de vie s'il obtient 19 ou 20 à ce jet. En maintenant le cercle par une action bonus, vous pouvez augmenter son rayon de 1,50 m, jusqu'à un maximum de 9 m.</p>` },
      { level: 9, name: "Tours de magie de Freyja", html: `<p>Les tours de magie <em>lumières dansantes</em> et <em>réparation</em> s'ajoutent à votre liste de tours de magie runiques (voir Incantation runique).</p>` },
      { level: 11, name: "Confiance de Wunjo", html: `<p>Vous et votre marqué pouvez effectuer l'action Aider par le biais d'une action bonus.</p>` }
    ]
  },
  {
    name: "Ætt de Týr", theme: "la justice et le châtiment", img: "icons/magic/lightning/bolt-strike-sky-blue.webp",
    features: [
      { level: 2, name: "Sorts de l'ætt de Týr", html: `<p>Au niveau approprié (dès que vous disposez d'un emplacement de sort du niveau correspondant), vous ajoutez les sorts suivants à votre liste de sorts de maître des runes :</p>
        <table><tr><th>Niveau de sort</th><th>Sorts</th></tr>
        <tr><td>1er</td><td>Balisage, bouclier</td></tr>
        <tr><td>2e</td><td>Arme magique, arme spirituelle</td></tr>
        <tr><td>3e</td><td>Éclair, tempête de neige</td></tr>
        <tr><td>4e</td><td>Bannissement, tempête de grêle</td></tr>
        <tr><td>5e</td><td>Colonne de flamme, immobiliser un monstre</td></tr>
        <tr><td>6e</td><td>Chaîne d'éclairs</td></tr>
        <tr><td>7e</td><td>Épée magique</td></tr>
        <tr><td>8e</td><td>Nuage incendiaire</td></tr>
        <tr><td>9e</td><td>Tempête vengeresse</td></tr></table>` },
      { level: 2, name: "Châtiment de Teiwaz", html: `<p>Quand vous ou un allié dans votre cercle subissez une attaque réussie, vous pouvez dépenser un dé de cercle de futhark en réaction : chaque ennemi se trouvant dans le cercle subit alors des dégâts radiants égaux au résultat du dé.</p>` },
      { level: 7, name: "Cercle de Týr", html: `<p>Les ennemis se trouvant dans votre cercle perdent leurs résistances aux dégâts contondants, perforants et tranchants non magiques. En maintenant le cercle par une action bonus, vous créez un second cercle de 1,50 m de rayon centré sur vous, qui vous suit dans vos déplacements et dure jusqu'au début de votre tour suivant.</p>` },
      { level: 9, name: "Tours de magie de Týr", html: `<p>Les tours de magie <em>flamme sacrée</em> et <em>viser juste</em> s'ajoutent à votre liste de tours de magie runiques (voir Incantation runique).</p>` },
      { level: 11, name: "Devoir de justice", html: `<p>Vous et votre marqué êtes avantagés aux tests d'Intelligence (Perspicacité) et d'Intelligence (Investigation).</p>` }
    ]
  }
];

// ---------------------------------------------------------------------------
// Content: the 12 (13, en comptant les deux protecteurs du Sorcier) archétypes
// nordiques des classes standards de la 5e.
// ---------------------------------------------------------------------------

const ARCHETYPES = [
  {
    name: "Voie de l'orageur", classIdentifier: "barbarian", img: "icons/magic/lightning/bolt-strike-blue.webp",
    theme: `<p>Une rage chargée de foudre : le barbare noue un lien dangereux avec l'orage, accumulant des <strong>charges d'orage</strong> (maximum égal à son niveau de barbare) au fil du combat.</p>`,
    levels: [
      { level: 3, features: [
        { name: "Coup de tonnerre", html: `<p>Tant que vous êtes en rage, chaque attaque réussie inflige 1d6 dégâts de tonnerre supplémentaires (1d8 au niveau 10) et vous gagnez 1 charge d'orage (2 sur un coup critique). Si vos charges atteignent votre niveau de barbare, ou à la fin de votre rage, vous perdez toutes vos charges et subissez 1d6 dégâts de tonnerre.</p>` },
        { name: "Exutoire calamiteux", html: `<p>Sur une attaque réussie, vous pouvez libérer toutes vos charges d'orage : 1 dégât de tonnerre par charge en rayon 1,50 m (3 m au niveau 10) autour de la cible. Si l'attaque rate, vous gagnez à la place des charges égales aux dégâts de rage.</p>` }
      ] },
      { level: 6, features: [
        { name: "Déclencher la tempête", html: `<p>Vous êtes avantagé contre les effets qui vous déplacent, vous poussent ou vous mettent à terre ; quand vous êtes touché en mêlée, vous ripostez pour 1d6 dégâts de tonnerre et gagnez 1 charge d'orage.</p>` },
        { name: "Imprégnation nuageuse", html: `<p>Vous pouvez convertir les dégâts de vos attaques d'arme en dégâts de froid ou de foudre, et gagnez 1 charge d'orage à chaque fois.</p>` }
      ] },
      { level: 10, features: [{ name: "En harmonie avec les vents", html: `<p>Vous pouvez lancer <em>contrôle du climat</em> en rituel.</p>` }] },
      { level: 14, features: [{ name: "Démarche du tonnerre", html: `<p>Par une action bonus, vous gagnez 5 charges d'orage puis les libérez aussitôt en une explosion de 5d6 dégâts de foudre (jet de sauvegarde de Constitution, DD = 8 + bonus de maîtrise + modificateur de Constitution) en rayon 1,50 m autour de vous.</p>` }] }
    ]
  },
  {
    name: "Collège de Valhalla", classIdentifier: "bard", img: "icons/magic/holy/prayer-glowing-gold.webp",
    theme: `<p>Un collège de skalds qui font résonner leur inspiration bardique comme un chant de guerre partagé.</p>`,
    levels: [
      { level: 3, features: [
        { name: "Refrain", html: `<p>À chaque fois que vous donnez une inspiration bardique, un nombre de créatures amicales égal à votre modificateur de Charisme peuvent réagir en chantant en chœur : +3 m de vitesse et +1 à leur prochain test ou jet d'attaque.</p>` },
        { name: "Témoignage", html: `<p>Vous gagnez des points de vie temporaires égaux au résultat du dé d'inspiration bardique utilisé par un allié.</p>` }
      ] },
      { level: 6, features: [{ name: "Dræplingr", html: `<p>Vous conférez à une créature une maîtrise doublée dans une compétence, un outil, une arme ou un instrument de votre choix ; les témoins de la scène peuvent être « envoûtés » (jet de sauvegarde de Charisme).</p>` }] },
      { level: 14, features: [{ name: "Convocation de héros", html: `<p>En dépensant une inspiration bardique, vous invoquez un esprit combattant (profil de gladiateur) pendant 1 minute. Utilisable une fois par repos long, renouvelé si un allié meurt sous vos yeux.</p>` }] }
    ]
  },
  {
    name: "Domaine du sacrifice", classIdentifier: "cleric", img: "icons/magic/death/skull-humanoid-crown-white.webp",
    theme: `<p>Les blessures et les sacrifices volontaires deviennent une source de pouvoir divin.</p>`,
    levels: [
      { level: 1, features: [
        { name: "Rituel de l'offrande honorable", html: `<p>Lors d'un repos long, vous pouvez infliger un nombre de blessures permanentes (œil, oreille, membre… à l'appréciation du MJ) égal à votre modificateur de Sagesse parmi les créatures consentantes dans votre champ de vision.</p>
          <p>Pour chaque blessure offerte durant le rituel, le participant qui l'a livrée choisit l'un des avantages suivants, qui dure jusqu'au prochain repos long :</p>
          <p><strong>Avantage de chance.</strong> Refaire un unique test de caractéristique, jet de sauvegarde ou jet d'attaque.</p>
          <p><strong>Avantage d'endurance.</strong> Par une action bonus, dépenser et jeter l'un de ses dés de vie pour récupérer un nombre de points de vie égal au résultat (cumulable en dépensant plusieurs dés lors d'une même action bonus si l'avantage a été choisi plusieurs fois).</p>
          <p><strong>Avantage de savoir.</strong> Choisir un sort de niveau 1 non connu ou non préparable ; en choisissant cet avantage plusieurs fois, apprendre un sort de plus haut niveau à condition de disposer d'un emplacement de sort du niveau correspondant.</p>` },
        { name: "Maîtrise supplémentaire", html: `<p>Vous gagnez la maîtrise des armures lourdes.</p>` },
        { name: "Balafres sacrées", html: `<p>Quand vous êtes touché alors que vous n'êtes pas à vos points de vie maximum (et sans PV temporaires), vous gagnez des points de vie temporaires égaux à votre modificateur de Charisme, et vous ajoutez ce même montant au prochain jet d'attaque d'arme et jet de dégâts que vous effectuez lors de votre prochain tour.</p>` }
      ] },
      { level: 2, features: [{ name: "Canalisation d'énergie divine : gloire du martyr", html: `<p>Vous pouvez sacrifier une partie de la vie d'un volontaire sur l'autel de la guerre. Par une action, vous ou une créature consentante dans votre champ de vision réduisez tous les dégâts subis de 2 (avant application des résistances et vulnérabilités) et êtes avantagé sur les jets de sauvegarde, mais les effets de guérison dont vous bénéficiez sont réduits de moitié. Ces effets durent 1 minute.</p>` }] },
      { level: 6, features: [{ name: "Perte sacrée", html: `<p>Par une réaction, vous pouvez donner l'effet de Balafres sacrées à un allié touché, à 9 m ou moins de vous.</p>` }] },
      { level: 8, features: [{ name: "Frappe divine", html: `<p>Une fois par tour, une attaque d'arme réussie inflige 1d8 dégâts radiants supplémentaires (2d8 au niveau 14).</p>` }] },
      { level: 17, features: [{ name: "Voilà qui satisfait les dieux", html: `<p>Vous choisissez l'avantage ou le désavantage aux jets de sauvegarde contre la mort d'une créature. Vous pouvez transférer une résistance physique et une annulation de dégâts à une créature que vous venez de soigner.</p>` }] }
    ]
  },
  {
    name: "Cercle d'Yggdrasill", classIdentifier: "druid", img: "icons/magic/nature/tree-icy-green.webp",
    theme: `<p>Un lien avec les Neuf mondes tout entiers, plutôt qu'avec un unique territoire natal.</p>`,
    levels: [
      { level: 2, features: [{ name: "L'âme sous l'écorce", html: `<p>À chaque repos long, choisissez un type d'énergie favori (radiant ou nécrotique). Sur votre monde natal, vous bénéficiez d'avantages renforcés liés à ce type (dégâts de sorts, résistance, avantage aux sauvegardes, forme sauvage) ; ailleurs, le MJ peut vous assigner un autre type.</p>` }] },
      { level: 6, features: [{ name: "Explorateur des ramures", html: `<p>Sur votre monde natal, vous détectez les créatures non natives à 18 m ou moins. Ailleurs, vous êtes avantagé aux jets de sauvegarde liés à l'environnement.</p>` }] },
      { level: 10, features: [{ name: "Feuille de l'Arbre-Monde", html: `<p>Vous créez une zone de 12 m qui applique les lois d'un autre monde pendant 1 minute.</p>` }] },
      { level: 14, features: [{ name: "Agitateur des racines", html: `<p>Un coup critique ou un sort de niveau 1 ou plus déclenche une explosion de 2d6 dégâts (de votre type favori) en rayon 3 m.</p>` }] }
    ]
  },
  {
    name: "Origine jötunn", classIdentifier: "sorcerer", img: "icons/magic/water/orb-ice-web.webp",
    theme: `<p>Le sang froid d'Ymir coule dans vos veines et se réveille lorsque vous puisez à sec dans votre magie.</p>`,
    levels: [
      { level: 1, features: [{ name: "Fils de Jötunheimr", html: `<p>Quand vous épuisez tous vos emplacements de sort d'un niveau donné, vous vous transformez pendant 1 minute : vous récupérez des points de vie égaux au niveau de l'emplacement plus votre niveau de personnage (le triple en points de vie temporaires), gagnez une résistance au froid, et une attaque de contact glacial en 1d6 + Charisme + niveau de l'emplacement (2d6 au niveau 5, 3d6 au niveau 11, 4d6 au niveau 17). Une fois utilisée pour un niveau d'emplacement donné, cette aptitude ne peut être réutilisée pour ce même niveau qu'après un repos long.</p>` }] },
      { level: 6, features: [{ name: "Peau du froid éternel", html: `<p>En réaction, pour 2 points de sorcellerie, quand vous êtes touché en mêlée vous neutralisez ou ralentissez votre attaquant (jet de sauvegarde de Dextérité).</p>` }] },
      { level: 14, features: [{ name: "Cœur gelé", html: `<p>Vous êtes avantagé contre l'intimidation, être charmé et être terrorisé.</p>` }] },
      { level: 18, features: [{ name: "Les os d'Ymir", html: `<p>Par une action, vous dépensez un emplacement de sort pour déclencher une tempête de neige en rayon 750 m (la neige ne vous atteint pas si vous êtes sous terre ou sous l'eau). Chaque créature à 9 m ou moins de vous subit, au début de son tour, des dégâts de froid égaux au niveau de l'emplacement plus votre modificateur de Charisme (moitié en cas de réussite d'un jet de sauvegarde de Constitution).</p>
        <p>Tant que cette aptitude est active, vous pouvez dépenser une action pour convoquer un élémentaire de la glace qui apparaît à 1,50 m de vous, agit à votre tour et vous obéit — vous pouvez le faire un nombre de fois égal au niveau de l'emplacement utilisé.</p>
        <p>Ces effets durent 1 minute (les élémentaires invoqués disparaissent alors). Un repos long est nécessaire pour réutiliser cette aptitude.</p>` }] }
    ]
  },
  {
    name: "Archétype martial : Gardien", classIdentifier: "fighter", img: "icons/equipment/shield/heater-crest-cross-blue.webp",
    theme: `<p>Le protecteur de la ligne, bouclier levé pour les autres plutôt que pour lui-même — la « vierge au bouclier » en est une incarnation narrative.</p>`,
    levels: [
      { level: 3, features: [{ name: "Tactiques du gardien", html: `<p>Choisissez deux tactiques parmi : <strong>Interposer</strong>, <strong>Tir préventif</strong>, <strong>Double réaction</strong>, <strong>Violentes représailles</strong>, <strong>Mur de bouclier</strong>.</p>` }] },
      { level: 7, features: [{ name: "Porteur de bouclier", html: `<p>Vous pouvez changer d'arme ou de bouclier librement, et accorder +1 à la classe d'armure d'un allié à 1,50 m ou moins de vous jusqu'au début de votre prochain tour.</p>` }] },
      { level: 10, features: [{ name: "Tactiques améliorées", html: `<p>Choisissez deux tactiques supplémentaires parmi : <strong>Double réaction améliorée</strong>, <strong>Frappe revigorante</strong>, <strong>Posture de protection</strong>, <strong>Riposte puissante</strong>, <strong>Couvrir la retraite</strong> (les alliés dans votre zone d'allonge, ou jusqu'à 6 m si vous maniez une arme à distance, peuvent se désengager par une action bonus).</p>` }] },
      { level: 15, features: [{ name: "Tactiques supérieures", html: `<p>Choisissez une tactique supplémentaire, par exemple <strong>Expert des manœuvres</strong> (résistance aux dégâts d'attaque d'opportunité).</p>` }] },
      { level: 18, features: [{ name: "Tactiques légendaires", html: `<p>Choisissez une dernière tactique, par exemple <strong>Inévitable</strong> ou <strong>Bastion</strong> (réduit de moitié les dégâts d'une attaque dont le résultat est inférieur ou égal à votre CA, 3 fois par repos long).</p>` }] }
    ]
  },
  {
    name: "École du vagabond", classIdentifier: "wizard", img: "icons/sundries/scrolls/scroll-worn-tan.webp",
    theme: `<p>Un savoir porté sur soi plutôt que relié à un grimoire relié — runes, dessins ou fétiches remplacent la tradition écrite à Miðgarðr.</p>`,
    levels: [
      { level: 2, features: [
        { name: "Avec le cœur", html: `<p>Test de Sagesse (Perspicacité) opposé pour deviner le désir principal d'un interlocuteur.</p>` },
        { name: "Avec la terre", html: `<p>Vous pouvez faire apparaître l'origine d'un sort à 4,50 m de vous ; vous êtes alors limité aux tours de magie jusqu'à votre tour suivant.</p>` }
      ] },
      { level: 6, features: [
        { name: "Savoir du monde", html: `<p>Vous gagnez une maîtrise temporaire (jusqu'au prochain repos long) de deux compétences, armes ou outils.</p>` },
        { name: "Monde du savoir", html: `<p>Par une action, vous pouvez oublier un sort préparé de niveau 2 ou plus. Le MJ choisit alors deux sorts de magicien que vous ne connaissez pas, d'un niveau égal à celui que vous avez oublié moins 1 ; vous en choisissez un qui devient un sort préparé pendant 8 heures. Vous n'avez pas mémorisé ce sort et il n'apparaît pas dans votre grimoire : vous ne pouvez ni l'y inscrire ni l'utiliser pour créer un parchemin magique.</p>
          <p>Vous pouvez utiliser cette aptitude jusqu'à trois fois, en attendant au moins une minute entre chaque utilisation ; une fois vos utilisations dépensées, il faut terminer un repos long pour les récupérer. Chaque fois que vous utilisez cette aptitude, vous ne pouvez plus lancer que des tours de magie jusqu'à la fin de votre prochain tour.</p>` }
      ] },
      { level: 10, features: [
        { name: "Premières impressions", html: `<p>Vous êtes avantagé au premier test social avec un inconnu. Cette aptitude ne fonctionne pas sur les créatures immunisées contre l'état charmé.</p>` },
        { name: "Magie persistante", html: `<p>Par une réaction effectuée quand une ou plusieurs cibles à 4,50 m ou moins de vous subissent 10 dégâts d'énergie ou plus, vous puisez dans les résidus de cette énergie : jusqu'à la fin de votre prochain tour, les sorts que vous lancez qui infligent ce type de dégâts sont considérés comme lancés avec un emplacement d'un niveau de plus que la normale. Après avoir lancé un sort ainsi amélioré, vous ne pouvez plus lancer que des tours de magie jusqu'à la fin de votre prochain tour.</p>` }
      ] },
      { level: 14, features: [
        { name: "Créer des liens", html: `<p>Quand vous conversez pendant au moins dix minutes avec une créature dans votre champ de vision, vous pouvez renforcer ou effacer le souvenir de vous dans son esprit (jet de sauvegarde de Charisme contre votre DD de sauvegarde des sorts). En cas d'échec, vous décidez si la créature vous oublie dès que vous sortez de son champ de vision ou si elle se rappelle parfaitement de votre apparence et du sujet de votre conversation. En cas de réussite, la créature est immunisée contre cette aptitude pendant un mois. Cette aptitude ne fonctionne pas sur les créatures immunisées contre l'état charmé.</p>` },
        { name: "Liens partagés", html: `<p>Si la cible de l'un de vos sorts rate un jet de sauvegarde contre celui-ci, vous pouvez également rompre son lien avec la magie : elle ne peut plus lancer de sorts, bénéficier des effets d'objets magiques, et toutes les attaques magiques qu'elle porte sont considérées comme non magiques. Ces effets durent jusqu'à la fin de son prochain tour.</p>
          <p>Vous pouvez utiliser cette aptitude trois fois avant un repos long. Une fois cette aptitude utilisée, vous ne pouvez plus lancer que des tours de magie jusqu'à la fin de votre prochain tour.</p>` }
      ] }
    ]
  },
  {
    name: "Voie de la glíma", classIdentifier: "monk", img: "icons/skills/melee/unarmed-punch-fist-white.webp",
    theme: `<p>La lutte traditionnelle islandaise (glíma) élevée au rang d'art martial.</p>`,
    levels: [
      { level: 3, features: [
        { name: "Lausatok", html: `<p>Vous êtes maîtrisé en Athlétisme, et pouvez utiliser votre Force à la place de votre Dextérité pour votre classe d'armure sans armure.</p>` },
        { name: "La main sur la nuque", html: `<p>Les créatures que vous empoignez sont désavantagées à leurs jets d'attaque. Sur une empoignade réussie ou rompue, vous pouvez dépenser 1 point de ki pour infliger des dégâts (dé d'arts martiaux + Force ou Dextérité).</p>` }
      ] },
      { level: 6, features: [{ name: "Lancer destructeur", html: `<p>Pour 1 point de ki, vous pouvez lancer un objet ou une créature que vous tenez (jusqu'à taille Grande) comme une arme de jet simple improvisée (portée 3 m/9 m), infligeant votre dé d'arts martiaux + votre modificateur de Force ou de Dextérité. Si vous lancez une créature de la sorte, elle subit le même montant de dégâts, que l'attaque soit réussie ou non.</p>` }] },
      { level: 11, features: [{ name: "Poigne de fer", html: `<p>Si vous êtes sur le point de perdre un test d'empoignade opposé, vous pouvez dépenser 2 points de ki pour resserrer votre prise : vous réussissez automatiquement le test, mais vous subissez des dégâts égaux à votre niveau + la différence entre votre résultat et celui de votre adversaire. Ces dégâts ne peuvent être annulés par quelque moyen que ce soit.</p>` }] },
      { level: 17, features: [{ name: "Victoire éclair", html: `<p>Pour 4 points de ki, vous tentez une empoignade avant même le jet d'initiative, avec avantage, et pouvez utiliser Lancer destructeur par une action bonus.</p>` }] }
    ]
  },
  {
    name: "Serment de l'élu", classIdentifier: "paladin", img: "icons/magic/holy/angel-winged-humanoid-blue.webp",
    theme: `<p>Honneur au combat, position à faire respecter, et générosité rendue au centuple : les préceptes de l'Élu.</p>`,
    levels: [
      { level: 3, features: [{ name: "Canalisation d'énergie divine", html: `<p>Vous gagnez deux options de canalisation d'énergie divine, en plus de celles offertes par votre classe.</p>
        <p><strong>Contrepoids au combat.</strong> Par une action, désignez une créature hostile et une créature amicale situées à 9 m ou moins de vous. La créature hostile fait un jet de sauvegarde de Charisme. En cas d'échec, chaque fois qu'elle effectue un jet d'attaque, elle lance également 1d4 et soustrait le résultat à son jet d'attaque, tandis que la créature amicale lance 1d4 et l'ajoute au sien ; ces effets durent 1 minute. En cas de réussite, seule la créature amicale bénéficie de l'effet.</p>
        <p><strong>Vigueur surnaturelle.</strong> Quand vous utilisez l'imposition des mains, vous pouvez dépenser 10 points de guérison et votre canalisation d'énergie divine pour supprimer un niveau d'épuisement (un seul par utilisation).</p>` }] },
      { level: 7, features: [
        { name: "Aura de vaillance", html: `<p>Après une sauvegarde réussie, vous et les alliés à 6 m (12 m au niveau 18) êtes avantagés à votre prochain test ou attaque.</p>` },
        { name: "Festin d'Odhinn", html: `<p>Une boisson alcoolisée vous nourrit comme un repas complet.</p>` }
      ] },
      { level: 15, features: [{ name: "Récupération du fidèle", html: `<p>En réaction, en tombant à 0 point de vie, vous pouvez vous imposer les mains à vous-même.</p>` }] },
      { level: 20, features: [{ name: "Valkyrja, l'Einherji", html: `<p>Vous n'avez plus besoin de boire ni de manger. Par une action, vous vous transformez en émissaire divin pendant 1 minute : vous n'avez pas besoin de respirer, êtes immunisé contre tous les sorts nécessitant un jet de sauvegarde de Sagesse ou de Charisme, et si une créature meurt dans votre aura de vaillance vous pouvez vous téléporter sur son emplacement par une réaction et effectuer immédiatement une unique attaque d'arme ou lancer un sort dont la durée d'incantation est une action ou une action bonus.</p>` }] }
    ]
  },
  {
    name: "Meute de loups", classIdentifier: "ranger", img: "icons/creatures/mammals/wolf-howl-moon-blue.webp",
    theme: `<p>Le rôdeur chasse et combat comme un membre à part entière d'une meute de loups.</p>`,
    levels: [
      { level: 3, features: [{ name: "Guerrier de la meute de loups", html: `<p>Une attaque de mêlée réussie donne l'avantage à la prochaine attaque d'un allié contre la même cible. Une attaque à distance ou de jet réussie désavantage les attaques d'opportunité de la cible jusqu'au début de votre prochain tour. En réaction, quand un allié est blessé, vous pouvez hurler pour infliger 1d6 dégâts psychiques.</p>` }] },
      { level: 7, features: [{ name: "Chef de la meute de loups", html: `<p>Vous avez un sens de l'orientation aiguisé. Vous et vos alliés pouvez voyager discrètement à un rythme rapide, ou sans malus à la perception passive, mais pas les deux à la fois. En réaction, vous pouvez déplacer vous-même ou un allié conscient de 3 m au maximum quand un ennemi se déplace (communication ou signe visuel requis, et l'allié doit pouvoir vous entendre ou vous voir).</p>` }] },
      { level: 11, features: [{ name: "Frappe rapide", html: `<p>Tuer une créature vous accorde une attaque supplémentaire immédiate.</p>` }] },
      { level: 15, features: [{ name: "Endurance du loup", html: `<p>Une fois par round, sans action, vous pouvez dépenser un dé de vie pour récupérer 1d8 + votre modificateur de Constitution en points de vie.</p>` }] }
    ]
  },
  {
    name: "L'informe", classIdentifier: "rogue", img: "icons/magic/control/debuff-energy-hold-purple.webp",
    theme: `<p>Une magie innée d'illusion et de tromperie, façon pacte, réveillée par le roublard (DD = 8 + bonus de maîtrise + modificateur de Charisme).</p>`,
    levels: [
      { level: 3, features: [
        { name: "Méthode de l'escroc", html: `<p>Vous gagnez le tour de magie <em>illusion mineure</em>, et les sorts <em>déguisement</em> et <em>charme-personne</em> via des emplacements de sort dédiés.</p>` },
        { name: "Cruelles blessures", html: `<p>Après une attaque sournoise réussie, vous pouvez remuer l'arme (ou le projectile) enfoncée dans le corps de la cible : sa vitesse de déplacement est réduite de moitié et elle est désavantagée à ses attaques d'opportunité jusqu'à ce qu'elle utilise une action pour retirer l'arme ou le projectile.</p>
          <p>De plus, si un ennemi réussit une sauvegarde contre l'un de vos sorts de méthode de l'escroc, il subit des dégâts psychiques (1d4 par dé d'attaque sournoise).</p>
          <p>Une créature qui a subi une cruelle blessure (par un sort ou une attaque) est immunisée à ces effets pendant 1 heure.</p>` }
      ] },
      { level: 6, features: [{ name: "Fumée et miroirs", html: `<p>Une réussite en Supercherie ou en déguisement devient incontestable pendant 1 heure.</p>` }] },
      { level: 9, features: [{ name: "Méthode améliorée", html: `<p>Vous gagnez <em>modifier son apparence</em>, <em>amélioration de caractéristique</em> et <em>image miroir</em>.</p>` }] },
      { level: 13, features: [{ name: "Méthode supérieure", html: `<p>Vous gagnez <em>image majeure</em> et <em>monture fantôme</em>.</p>` }] },
      { level: 17, features: [
        { name: "Riposte miroir", html: `<p>En réaction, échangez magiquement de place avec une autre créature à 9 m ou moins pour rediriger une attaque réussie (jet de sauvegarde de Charisme possible).</p>` },
        { name: "Maîtrise de l'escroc", html: `<p>Vous gagnez <em>confusion</em> et <em>invisibilité supérieure</em>.</p>` }
      ] }
    ]
  },
  {
    name: "Celui qui apporte l'apocalypse", classIdentifier: "warlock", img: "icons/creatures/reptiles/wyrm-serpent-teal.webp",
    theme: `<p>Un protecteur d'outre-monde parmi Níðhöggr, Fenrir ou Jörmungandr, présage vivant du Ragnarök.</p>`,
    levels: [
      { level: 1, features: [
        { name: "Rancœur", html: `<p>Sans armure, votre classe d'armure est égale à 13 + Dextérité. En réaction, une attaque de mêlée reçue vous inflige des dégâts de force égaux à votre modificateur de Charisme (minimum 1) à votre agresseur (+1d8 au niveau 5, +2d8 au niveau 11, +3d8 au niveau 17).</p>` },
        { name: "Méchanceté éternelle", html: `<p>Vous récupérez 1 point de vie chaque fois qu'un dé de dégâts de l'un de vos sorts ou tours de magie tombe sur 1 ; cet effet s'étend à votre arme de pacte si vous avez choisi le pacte de la lame, ou aux dégâts infligés par votre familier si vous avez choisi le pacte de la chaîne (auquel cas votre familier bénéficie aussi du soin octroyé).</p>` }
      ] },
      { level: 6, features: [{ name: "Implacable", html: `<p>Les attaques d'opportunité contre vous sont désavantagées, vous relever ne coûte que 1,50 m de mouvement, et votre vitesse n'est jamais réduite (l'entrave et la paralysie restent possibles).</p>` }] },
      { level: 10, features: [{ name: "Dernier assaut", html: `<p>Quand vos points de vie sont réduits à 0, vous pouvez utiliser votre réaction pour lancer un sort de sorcier, faire une attaque avec votre arme de pacte, ou permettre à votre familier de porter une attaque. Une fois cette aptitude utilisée, vous ne pouvez plus y faire appel avant d'avoir terminé un repos long ou court.</p>` }] },
      { level: 14, features: [{ name: "Dévoreur de vie", html: `<p>Quand une créature réussit une attaque contre vous, vous pouvez utiliser cette aptitude pour la dévorer : elle rapetisse par magie et se retrouve à l'intérieur de votre corps, entravée et neutralisée.</p>
        <p>Au début de son tour, elle peut faire un jet de sauvegarde de Force ; en cas de réussite, elle se libère en s'extirpant de votre corps dans l'emplacement inoccupé le plus proche. En cas d'échec, elle subit 3d10 dégâts d'acide tandis que votre corps la dissout peu à peu.</p>
        <p>Si une créature est tuée par ces dégâts, son enveloppe charnelle est complètement désintégrée, mais vous pouvez régurgiter les objets qu'elle portait ou transportait sans les abîmer. Une fois cette aptitude utilisée, vous ne pouvez plus y faire appel avant d'avoir terminé un repos long.</p>` }] }
    ]
  },
  {
    name: "Les Nornes", classIdentifier: "warlock", img: "icons/magic/divination/crystal-ball-blue.webp",
    theme: `<p>Un pacte avec les trois Nornes — Urðr, Verðandi et Skuld — tisseuses du destin des hommes et des dieux.</p>`,
    levels: [
      { level: 1, features: [{ name: "Urðr, Verðandi et Skuld", html: `<p>En réaction, vous pouvez modifier de ±1d6 un jet (attaque, test ou sauvegarde) d'une créature visible. Une utilisation par catégorie de créature (humanoïde/mort-vivant/bête ; aberration/géant/monstrueuse ; céleste/dragon/élémentaire/fiélon), rechargée à un repos court ou long.</p>` }] },
      { level: 6, features: [{ name: "De l'argile pour les affaiblis", html: `<p>Vous retirez un état (aveuglé, charmé, assourdi, paralysé, pétrifié ou empoisonné) et accordez l'immunité à cet état pendant 1 minute. Rechargé à un repos court ou long.</p>` }] },
      { level: 10, features: [{ name: "Briser Gungnir", html: `<p>Vous redirigez une attaque à distance réussie contre vous vers une autre cible (jet d'attaque de sort opposé). Une minute de récupération.</p>` }] },
      { level: 14, features: [{ name: "Tisser votre propre destin", html: `<p>Tout test de caractéristique, jet d'attaque ou jet de sauvegarde obtenant 3 ou moins doit être relancé ; vous devez accepter le second résultat, même s'il est moins bon. Si le jet est avantagé ou désavantagé, vous ne pouvez relancer que l'un des deux dés.</p>` }] }
    ]
  }
];

// ---------------------------------------------------------------------------
// Build documents
// ---------------------------------------------------------------------------

const docs = { classes: [], features: [], backgrounds: [], equipment: [], magicitems: [], bestiary: [], journals: [], tables: [], macros: [] };

// -- Clan feature items (pack: features)
for (const clan of CLANS) {
  docs.features.push(feat({ name: clan.name, img: CLAN_IMG, html: `<p><strong>${clan.region}</strong></p>${clan.html}` }));
}

// -- Historique privilege feature items (pack: features) + background items (pack: backgrounds)
for (const bg of BACKGROUNDS) {
  const privName = `Privilège : ${bg.privilege} (${bg.name})`;
  docs.features.push(feat({
    name: privName, img: BACKGROUND_IMG, featureType: "background",
    requirements: bg.name,
    html: bg.privilegeHtml
  }));

  const grants = [];
  const choices = [];
  for (const sk of bg.skills) grants.push(`skills:${sk}`);
  if (bg.tool === "art") choices.push({ count: 1, pool: ["tool:art:*"] });
  else if (bg.tool) grants.push(`tool:${bg.tool}`);

  const advancement = advMap([
    traitAdv({ id: sid(bg.name + "-trait"), level: 0, title: "Compétences d'historique", grants, choices }),
    itemGrant({ id: sid(bg.name + "-grant"), level: 0, title: "Privilège", items: [uuidItem("features", privName)] })
  ]);

  docs.backgrounds.push(baseItem({
    name: bg.name, type: "background", img: BACKGROUND_IMG,
    system: {
      description: desc(bg.html),
      identifier: slugify(bg.name),
      source: "Vers le Ragnarök",
      startingEquipment: [],
      wealth: "",
      advancement
    }
  }));
}

// -- Maître des runes class features
docs.features.push(...CLASS_FEATURES);

// -- Ætt subclasses + their feature items
const subclassUuidsByAett = {};
for (const aett of AETTS) {
  const featureIds = [];
  const aettAdvancementItems = [];
  for (const f of aett.features) {
    const fullName = `${f.name} (${aett.name})`;
    docs.features.push(feat({
      name: fullName, img: aett.img, featureType: "class",
      requirements: `Maître des runes ${f.level} (${aett.name})`,
      html: f.html
    }));
    aettAdvancementItems.push({ level: f.level, uuid: uuidItem("features", fullName) });
  }

  const advancement = advMap(
    aettAdvancementItems.map(({ level, uuid }) =>
      itemGrant({ id: sid(aett.name + "-lvl" + level), level, title: "Aptitudes de l'ætt", items: [uuid] }))
  );

  docs.classes.push(baseItem({
    name: aett.name, type: "subclass", img: aett.img,
    system: {
      description: desc(`<p>Vous vous vouez à ${aett.theme}.</p>`),
      identifier: slugify(aett.name),
      source: "Vers le Ragnarök",
      classIdentifier: "maitre-des-runes",
      spellcasting: { progression: "none", ability: "", preparation: { formula: "" } },
      advancement
    }
  }));
  subclassUuidsByAett[aett.name] = uuidItem("classes", aett.name);
}

// -- The 12 (13) nordic archetypes for the standard classes
for (const arch of ARCHETYPES) {
  const grantsByLevel = [];
  for (const lvl of arch.levels) {
    const uuids = [];
    for (const f of lvl.features) {
      const fullName = `${f.name} (${arch.name})`;
      docs.features.push(feat({
        name: fullName, img: arch.img, featureType: "class",
        requirements: `${arch.name} — niveau ${lvl.level}`,
        html: f.html
      }));
      uuids.push(uuidItem("features", fullName));
    }
    grantsByLevel.push({ level: lvl.level, uuids });
  }

  const advancement = advMap(
    grantsByLevel.map(({ level, uuids }) =>
      itemGrant({ id: sid(arch.name + "-lvl" + level), level, title: "Aptitudes d'archétype", items: uuids }))
  );

  docs.classes.push(baseItem({
    name: arch.name, type: "subclass", img: arch.img,
    system: {
      description: desc(arch.theme),
      identifier: slugify(arch.name),
      source: "Vers le Ragnarök",
      classIdentifier: arch.classIdentifier,
      spellcasting: { progression: "none", ability: "", preparation: { formula: "" } },
      advancement
    }
  }));
}

// -- Maître des runes class item
{
  const classAdvancement = advMap([
    hitPointsAdv(sid("mdr-hp")),
    traitAdv({ id: sid("mdr-saves"), level: 1, title: "Jets de sauvegarde", classRestriction: "primary", grants: ["saves:str", "saves:wis"] }),
    traitAdv({
      id: sid("mdr-skills"), level: 1, title: "Compétences", classRestriction: "primary",
      choices: [{ count: 2, pool: ["skills:arc", "skills:his", "skills:ins", "skills:nat", "skills:prc", "skills:rel", "skills:sur"] }]
    }),
    traitAdv({ id: sid("mdr-weapon"), level: 1, title: "Armes", classRestriction: "primary", grants: ["weapon:sim"] }),
    traitAdv({ id: sid("mdr-armor"), level: 1, title: "Armures", classRestriction: "primary", grants: ["armor:lgt"] }),
    traitAdv({
      id: sid("mdr-languages"), level: 1, title: "Langues", classRestriction: "primary",
      choices: [{ count: 1, pool: ["languages:standard:*", "languages:exotic:*"] }]
    }),
    itemGrant({ id: sid("mdr-lvl1"), level: 1, title: "Aptitudes de classe", items: [uuidItem("features", "Cercle de futhark"), uuidItem("features", "Incantation runique")] }),
    subclassAdv(sid("mdr-subclass"), 2),
    itemGrant({ id: sid("mdr-lvl3"), level: 3, title: "Aptitudes de classe", items: [uuidItem("features", "Protéger le marqué"), uuidItem("features", "Expertise (Maître des runes)")] }),
    abilityScoreImprovementAdv({ id: sid("mdr-asi4"), level: 4 }),
    itemGrant({ id: sid("mdr-lvl6"), level: 6, title: "Aptitudes de classe", items: [uuidItem("features", "Restauration runique")] }),
    abilityScoreImprovementAdv({ id: sid("mdr-asi8"), level: 8 }),
    abilityScoreImprovementAdv({ id: sid("mdr-asi12"), level: 12 }),
    itemGrant({ id: sid("mdr-lvl14"), level: 14, title: "Aptitudes de classe", items: [uuidItem("features", "Tisseur du destin")] }),
    abilityScoreImprovementAdv({ id: sid("mdr-asi16"), level: 16 }),
    itemGrant({ id: sid("mdr-lvl18"), level: 18, title: "Aptitudes de classe", items: [uuidItem("features", "Tisseur du destin amélioré")] }),
    abilityScoreImprovementAdv({ id: sid("mdr-asi19"), level: 19 }),
    itemGrant({ id: sid("mdr-lvl20"), level: 20, title: "Aptitudes de classe", items: [uuidItem("features", "Prophétie persistante")] }),
    scaleValueNumber({
      id: sid("mdr-spells-known"), title: "Sorts connus", identifier: "spells-known",
      scale: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 11: 14, 12: 15, 13: 16, 14: 17, 15: 18, 16: 19, 17: 20, 18: 22, 19: 22, 20: 22 }
    }),
    scaleValueNumber({
      id: sid("mdr-cantrips-known"), title: "Tours de magie connus", identifier: "cantrips-known",
      scale: { 1: 1, 4: 2, 10: 3 }
    }),
    scaleValueDice({
      id: sid("mdr-die"), title: "Dé de cercle de futhark", identifier: "futhark-die",
      scale: { 1: [1, 6], 5: [1, 8], 10: [1, 10], 15: [1, 12] }
    })
  ]);

  docs.classes.push(baseItem({
    name: "Maître des runes", type: "class", img: RUNE_IMG,
    system: {
      description: desc(`<h3>Traits fondamentaux</h3>
        <p><strong>Caractéristique principale :</strong> Sagesse. <strong>Dé de vie :</strong> d8 par niveau. <strong>Jets de sauvegarde :</strong> Force, Sagesse.</p>
        <p><strong>Compétences :</strong> deux au choix parmi Arcanes, Histoire, Perspicacité, Nature, Perception, Religion, Survie.</p>
        <p><strong>Armes :</strong> armes courantes. <strong>Armures :</strong> armures légères. <strong>Outils :</strong> outils de graveur de runes.</p>
        <p><strong>Équipement de départ :</strong> un bâton ou une fronde ; un jeu de runes ; un paquetage d'ecclésiastique ou d'exploration souterraine ; une armure de cuir et deux dagues.</p>
        <p>Un incantateur du Futhark qui trace un <strong>cercle de futhark</strong> au sol et se voue à l'un des trois ætts (Freyja, Heimdallr ou Týr) pour infléchir le sort de la bataille en faveur de ses alliés — ou au détriment de ses ennemis.</p>
        <p>Au niveau 2, choisissez votre ætt de dévotion en ajoutant le sous-type de classe (subclass) correspondant.</p>`),
      identifier: "maitre-des-runes",
      source: "Vers le Ragnarök",
      startingEquipment: [],
      wealth: "",
      levels: 1,
      hd: { denomination: "d8", spent: 0, additional: "" },
      primaryAbility: { value: ["wis"], all: true },
      properties: [],
      spellcasting: { progression: "full", ability: "wis", preparation: { formula: "" } },
      advancement: classAdvancement
    }
  }));
}

// ---------------------------------------------------------------------------
// Runes journal + roll tables
// ---------------------------------------------------------------------------

const RUNES_RAW = [
  { numero: 1, nom: "Fehu", aett: "Freyja", endroit: "Fortune, succès et bien-être mérités.", envers: "Mal, jalousie, envie.", divinite: "Le don de la vie, présidé par Auðhumla, Freyr et Freyja.", effetAett: "Vous sentez un brusque regain d'optimisme, tout semble se dérouler de la bonne manière.", effetRune: "Vous gagnez un bonus de +1 aux tests de caractéristique et un 20 naturel est toujours considéré comme un succès.", effetAettInverse: "Tout semble se dérouler de la bonne manière pour tout le monde, sauf pour vous. Vous êtes jaloux de leurs réussites et anticipez vos propres échecs.", effetRuneInverse: "Vous subissez un malus de −1 aux tests de caractéristique et un 1 naturel est toujours considéré comme un échec." },
  { numero: 2, nom: "Ūruz", aett: "Freyja", endroit: "Force, courage, initiative.", envers: "Férocité, agression, addiction.", divinite: "L'instinct de survie, présidé par Ymir.", effetAett: "Rien dans les Neuf mondes ne peut vous arrêter, vous vivrez pour voir un nouveau jour se lever.", effetRune: "Vous appliquez votre bonus de maîtrise à vos jets d'initiative.", effetAettInverse: "La force n'est qu'apparente lorsqu'on la compare à la faiblesse, vous pressentez l'oppression et les abus de pouvoir.", effetRuneInverse: "Vous êtes avantagé lors des tests de Charisme (Intimidation) et des jets d'attaque contre des créatures dont la valeur de Force est inférieure à la vôtre. Vous êtes également désavantagé contre les créatures dont la valeur de Force est supérieure à la vôtre." },
  { numero: 3, nom: "Thurisaz", aett: "Freyja", endroit: "Résistance, protection, bonnes décisions.", envers: "Fragilité, confusion, évènement imprévu.", divinite: "La rencontre, présidée par Thor.", effetAett: "Quand éclate le plus violent des orages, il faut s'abriter derrière des murs solides et concevoir de meilleures stratégies.", effetRune: "Chaque fois que vous subissez des dégâts d'une source unique, vous les réduisez de 1. Si le total des dégâts est réduit à 0 ou moins, vous n'en subissez aucun.", effetAettInverse: "Vous vous sentez abattu, incertain, sans défense, à la merci des évènements, toutes vos certitudes s'effondrent comme un mur sans fondations.", effetRuneInverse: "Chaque fois que vous subissez des dégâts d'une source unique, vous les augmentez de 1." },
  { numero: 4, nom: "Ansuz", aett: "Freyja", endroit: "Guérison, sagesse, inspiration.", envers: "Tromperie, trahison, égoïsme.", divinite: "L'appel, présidé par Odhinn.", effetAett: "Vous pressentez que de nouvelles idées surgiront au cours de la journée, que des solutions seront trouvées et que chaque nœud sera dénoué.", effetRune: "Vous gagnez immédiatement de l'inspiration.", effetAettInverse: "Vous ne pouvez faire confiance à personne, la trahison et la tromperie vous attendent à chaque tournant.", effetRuneInverse: "Vous ne pouvez pas bénéficier de l'action aider ni être avantagé grâce à d'autres créatures." },
  { numero: 5, nom: "Raido", aett: "Freyja", endroit: "Voyage, recherche, nouveaux défis.", envers: "Ralentissement, renonciation, échec.", divinite: "Le voyage du héros, présidé par les Valkyrjur.", effetAett: "Aujourd'hui, le monde s'étend devant vous, prêt à être exploré, allez simplement où vos pas vous mènent.", effetRune: "Vous ignorez les terrains difficiles.", effetAettInverse: "Vous pressentez que la route sera ardue, pleine d'obstacles, de dangers et d'incertitudes. Cela en vaut-il vraiment la peine ? Vous songez à abandonner devant le premier véritable problème.", effetRuneInverse: "Vous ne pouvez pas faire l'action se précipiter ni bénéficier de bonus à votre vitesse de déplacement de base." },
  { numero: 6, nom: "Kenaz", aett: "Freyja", endroit: "Renaissance, compréhension, révélation.", envers: "Ignorance, superficialité, arrogance.", divinite: "Le feu de la transformation, présidé par Surtr.", effetAett: "Tout se passera bien aujourd'hui, tous les problèmes deviendront une opportunité et toutes les épreuves, une chance de s'améliorer.", effetRune: "Chaque fois que vous ratez un jet de sauvegarde, un jet d'attaque ou un test de caractéristique, vous serez avantagé lors du prochain jet du même type.", effetAettInverse: "Aujourd'hui, vous vous sentez bien trop sûr de vous. À cause de cela, vous serez confronté à de nombreux problèmes normalement évitables.", effetRuneInverse: "Chaque fois que vous réussissez un jet de sauvegarde, un jet d'attaque ou un test de caractéristique, vous serez désavantagé lors du prochain jet du même type." },
  { numero: 7, nom: "Gebo", aett: "Freyja", endroit: "Amitié, fraternité, partage, échange, gratitude.", envers: null, divinite: "L'échange équitable, présidé par Freyr.", effetAett: "Ce présage vous rappelle que la nature est une seule et même entité, comme une toile de relations et de liens englobant aussi les humains.", effetRune: "Vous êtes avantagé lors des tests de Charisme, mais quand un allié près de vous subit des dégâts, vous subissez vous-même un quart de ces dégâts (qui ne peuvent être réduits d'aucune manière).", effetAettInverse: null, effetRuneInverse: null },
  { numero: 8, nom: "Wunjo", aett: "Freyja", endroit: "Gloire, espoir, harmonie.", envers: "Dépression, solitude, pessimisme.", divinite: "L'émanation divine, présidée par Freyr et Freyja.", effetAett: "Le soleil est plus radieux aujourd'hui. Il remplit de joie le cœur des hommes, qui se motivent les uns les autres pour en faire davantage.", effetRune: "Quand vous faites un jet de sauvegarde, vous pouvez utiliser le bonus d'un allié adjacent s'il est supérieur au vôtre.", effetAettInverse: "Des nuages gris assombrissent le ciel. Ils cachent le soleil et font naître l'effroi dans le cœur des hommes. Les gens se sentent seuls et tristes.", effetRuneInverse: "Quand vous faites un jet de sauvegarde, vous devez utiliser le bonus d'un allié adjacent s'il est inférieur au vôtre." },

  { numero: 9, nom: "Hagalaz", aett: "Heimdallr", endroit: "Purification, épreuve, chemin connu, libération, reconstruction.", envers: null, divinite: "S'écarter du plan, présidé par Urðr.", effetAett: "Vous pressentez que le chemin devant vous mène à la fin de tout ce que vous êtes, pour le meilleur ou pour le pire. La mort n'est pourtant pas la fin, mais une simple étape avant la renaissance.", effetRune: "Vous êtes désavantagé lors du premier jet de sauvegarde contre la mort que vous faites chaque fois que vos points de vie sont réduits à 0. Cependant, chaque fois que vous réussissez un jet de sauvegarde contre la mort, vous pouvez lancer l'un de vos dés de vie, comme si vous aviez fini un repos court, et vous récupérez un nombre de points de vie égal au résultat obtenu plus votre modificateur de Sagesse. Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: null, effetRuneInverse: null },
  { numero: 10, nom: "Nauthiz", aett: "Heimdallr", endroit: "Résistance, vertu, détermination, force intérieure.", envers: null, divinite: "Affronter la douleur, présidé par Heimdallr.", effetAett: "Vous pressentez une grande adversité sur votre route, mais au plus profond de votre âme, vous êtes prêt à affronter tous les défis que le destin vous réserve.", effetRune: "Chaque fois qu'un allié, dans votre champ de vision et à 9 m ou moins de vous, voit ses points de vie réduits à 0, vous gagnez un nombre de points de vie temporaires égal à la moitié de votre niveau de personnage et vous êtes avantagé lors du prochain jet de sauvegarde que vous faites avant la fin de votre prochain tour. Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: null, effetRuneInverse: null },
  { numero: 11, nom: "Isaz", aett: "Heimdallr", endroit: "Moment de réflexion, se concentrer sur les objectifs, séparation, limitation.", envers: null, divinite: "L'esprit sans entraves, présidé par Búri.", effetAett: "Vous réalisez brusquement que nous sommes seuls au monde. Vous devez prendre un moment pour bien réfléchir au sens de votre vie.", effetRune: "Quand vous tombez à 0 point de vie, vous pouvez faire un jet de sauvegarde de Sagesse au lieu du jet de sauvegarde contre la mort habituel, avec un DD normal (10 le plus souvent).", effetAettInverse: null, effetRuneInverse: null },
  { numero: 12, nom: "Jera", aett: "Heimdallr", endroit: "Nature cyclique du temps, patience, contrôle, récolte, processus.", envers: null, divinite: "La voie du cosmos, présidée par Sif.", effetAett: "Vous vous représentez la nature cyclique du monde et comprenez que chaque fleur qui dépérit permet la naissance d'une vie nouvelle.", effetRune: "Quand vous tombez à 0 point de vie, vous êtes désavantagé lors de votre premier jet de sauvegarde contre la mort, mais chaque allié à 9 m ou moins de vous récupère immédiatement 1d6 points de vie (2d6 au niveau 6, 3d6 au niveau 10, 4d6 au niveau 17 et 5d6 au niveau 20). Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: null, effetRuneInverse: null },
  { numero: 13, nom: "Eihwaz", aett: "Heimdallr", endroit: "Capacité défensive, fiabilité, intelligence, capacité préventive.", envers: null, divinite: "Le voyage spirituel, présidé par Hel et Ullr.", effetAett: "Le temps et l'espace sont peu de chose pour ceux capables de voyager avec leur esprit plutôt qu'avec leur corps.", effetRune: "Quand vous subissez des dégâts, vous pouvez décider de les ignorer un bref instant. Vous pouvez utiliser votre réaction pour retarder ces dégâts afin de ne les subir qu'à la fin de votre prochain tour. À la fin de votre prochain tour, vous subirez ces dégâts et réduirez de moitié votre vitesse de déplacement pendant un round. Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: null, effetRuneInverse: null },
  { numero: 14, nom: "Perth", aett: "Heimdallr", endroit: "Joie, destinée, chance.", envers: "Tristesse, illusion, découragement.", divinite: "Le jeu du destin, présidé par Vé.", effetAett: "Une profonde méditation vous a permis de véritablement comprendre le sens de la vie et les plus intimes secrets du monde. Cet éveil et cette compréhension des flux du destin vous procurent un véritable et profond sentiment de joie.", effetRune: "Quand vous obtenez un 1 naturel sur l'un de vos jets d'attaque, jets de sauvegarde ou tests de caractéristique, vous pouvez le changer et considérer que vous avez obtenu un 10. Ceci peut changer l'effet.", effetAettInverse: "Votre méditation n'a pas donné les résultats attendus, peut-être que vous avez mal interprété les signes et les symboles ou que votre esprit n'était pas prêt. Vous avez mal compris leur signification et vous vous sentez à présent abattu et triste.", effetRuneInverse: "Quand vous obtenez un 20 naturel sur l'un de vos jets d'attaque, jets de sauvegarde ou tests de caractéristique, vous devez le changer et considérer que vous avez obtenu un 10. Ceci peut changer l'effet. Si vous avez changé un jet d'attaque, l'attaque n'est pas une réussite garantie, mais vous infligez toujours des dégâts critiques." },
  { numero: 15, nom: "Algiz", aett: "Heimdallr", endroit: "Connexion divine, éveil, succès.", envers: "Perte de faveur, vulnérabilité, danger.", divinite: "L'espace sacré, présidé par Baldr.", effetAett: "Votre esprit et votre âme s'ouvrent pour atteindre un état de conscience supérieur et entrent en contact avec les entités qui contrôlent le sort de l'humanité. Elles sont contentes de vous et récompensent votre foi.", effetRune: "Quand vous subissez un coup critique, vous bénéficiez d'une résistance contre cette attaque en particulier. Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: "Vous tentez de toutes vos forces d'élever votre esprit vers des plans supérieurs, ceux où vivent les dieux. Malheureusement, ceux-ci n'apprécient pas votre intrusion et vous savez qu'ils vous châtieront pour cette transgression.", effetRuneInverse: "Quand une créature vous attaque et qu'elle est avantagée, cette attaque vous inflige 1d6 dégâts supplémentaires." },
  { numero: 16, nom: "Sowilo", aett: "Heimdallr", endroit: "Pouvoir, précipitation, énergie, colère, feu purificateur.", envers: null, divinite: "Le pouvoir, présidé par Sól.", effetAett: "Votre périple était ardu, avec plein de croisements, mais vous devez à présent faire le choix ultime, celui qui fera pencher votre âme vers le bien ou le mal. Vous tremblez, mais vous savez quel sera le bon choix.", effetRune: "Quand vous subissez des dégâts infligés par une créature, vous pouvez utiliser votre réaction pour lancer un certain nombre de vos dés de vie. Vous réduisez les dégâts d'un montant égal au résultat obtenu plus votre modificateur de Sagesse (s'il est positif) et infligez à l'agresseur ce même montant en dégâts radiants ou nécrotiques. Vous pouvez utiliser jusqu'à la moitié de vos dés de vie restants de cette façon (1 au minimum). Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: null, effetRuneInverse: null },

  { numero: 17, nom: "Teiwaz", aett: "Týr", endroit: "Bonne direction, victoire, vertu.", envers: "Sanction, malhonnêteté, défaite.", divinite: "L'ordre universel, présidé par Týr.", effetAett: "Aujourd'hui, vous savez que vous allez avancer comme un père qui protège ses enfants, comme un guerrier qui défend sa patrie, comme un homme vertueux qui affronte le mal.", effetRune: "Quand vous obtenez un coup critique, vous pouvez utiliser votre réaction pour faire une unique attaque d'arme ou pour lancer un tour de magie nécessitant un jet d'attaque.", effetAettInverse: "La bravoure peut très vite devenir de l'arrogance, la volonté de protéger ce que vous aimez de la suffisance, et la force des atermoiements.", effetRuneInverse: "Quand vous subissez un coup critique, vous devez réussir un jet de sauvegarde de Charisme (DD égal à la moitié des dégâts que vous venez de subir) ou vous êtes neutralisé jusqu'à la fin de votre prochain tour." },
  { numero: 18, nom: "Berkana", aett: "Týr", endroit: "Fertilité, désir, amour.", envers: "Immaturité, anxiété, abandon.", divinite: "Le lien des mondes, présidé par Frigg.", effetAett: "Aujourd'hui, partout où vous regardez, vous voyez se répandre une nouvelle vie pleine de fertilité, subtile, mais irrépressible, comme un nouvel éveil des sens.", effetRune: "Vous pouvez utiliser votre action pour soigner chaque créature dans un rayon de 3 m autour de vous (vous y compris) d'un nombre de points de vie égal à 1d6 + votre modificateur de Charisme, jusqu'à un maximum égal à la moitié de votre maximum de points de vie. Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: "Vous constatez à quel point vous êtes incompétent et vous vous sentez comme un fruit vert face à la vie forte et florissante qui vous entoure.", effetRuneInverse: "Vous pouvez utiliser votre action bonus pour dépenser un dé de vie comme si vous veniez de terminer un repos court. Cependant, vous devez réduire de moitié le résultat de tous les dés de vie que vous lancez." },
  { numero: 19, nom: "Ehwaz", aett: "Týr", endroit: "Amélioration, coopération, union.", envers: "Précipitation, inhibition, désaccord.", divinite: "L'harmonie des opposés, présidée par Sleipnir.", effetAett: "Vous voyez les liens et relations invisibles entre chaque chose, chaque créature, ainsi que les forces de la nature elles-mêmes. Le monde est plus grand que la somme de ses parties... tout comme vous.", effetRune: "Lors d'un repos court, vous et jusqu'à six de vos alliés peuvent se prendre la main et méditer ensemble pendant une heure. Ceux qui participent à cette méditation sont désavantagés lors des tests de Sagesse (Perception) et ne peuvent surveiller efficacement les environs. Pour chaque dé de vie dépensé à la fin du repos court, l'un de vos alliés récupère un nombre supplémentaire de points de vie égal à votre modificateur de Sagesse (1 au minimum). En même temps, vous récupérez un nombre supplémentaire de points de vie égal au nombre de participants formant le cercle de méditation.", effetAettInverse: "Même si vous tentez autant que possible de voir les choses différemment, vous devez accepter le fait que toute chose dans la nature s'oppose à une multitude d'autres choses. Pour chaque lien nouveau, beaucoup d'autres disparaissent. La nature est en perpétuel conflit. L'harmonie est une illusion.", effetRuneInverse: "Effet négatif supérieur : chaque fois que vous déterminez l'initiative, vous pouvez dépenser un certain nombre de dés de vie. Pour chaque dé de vie dépensé, vous gagnez un bonus au jet d'initiative égal à votre modificateur de Sagesse (1 au minimum)." },
  { numero: 20, nom: "Mannaz", aett: "Týr", endroit: "Ouverture d'esprit, conscience, fraternité.", envers: "Préjudice, rigidité, fanatisme.", divinite: "L'homme cosmique, présidé par Heimdallr.", effetAett: "Dans un moment de totale lucidité, vous comprenez votre place dans le monde et savez à quel point celui-ci est en adéquation avec vous-même. Vous êtes le centre, mais vous êtes aussi tout ce qui gravite autour. L'univers s'autoanalyse et votre conscience fait de même.", effetRune: "Quand vous faites un jet de sauvegarde contre un effet invisible, vous pouvez utiliser votre réaction pour être avantagé lors du jet. Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser.", effetAettInverse: "Qui êtes-vous ? Quel est le sens de VOTRE vie ? La réalité est-elle aussi insignifiante qu'il y paraît ? Peut-être que non, peut-être qu'elle n'est pas aussi futile et dénuée de sens... peut-être est-ce vous qui l'êtes. Vous ne pouvez qu'observer ceux qui découvrent, ravis, la place glorieuse qu'ils occupent dans le grand ordre des choses et vous avez l'impression d'être un mauvais vers dans le grand poème du cosmos.", effetRuneInverse: "Chaque fois que vous infligez des dégâts, vous infligez 1 dégât supplémentaire du même type si le nombre de points de vie actuels de la cible est supérieur au vôtre. Vous infligez 2 dégâts supplémentaires au niveau 11 et 3 au niveau 20. Vous ne pouvez pas terminer votre tour volontairement à 6 m ou moins d'une créature dont le nombre de points de vie actuels est supérieur au vôtre." },
  { numero: 21, nom: "Laguz", aett: "Týr", endroit: "Intuition, rêve, fantasme.", envers: "Manque de créativité, confusion, peur.", divinite: "Le puits du savoir, présidé par Mimir.", effetAett: "Vous voyez la réalité sous-jacente du monde matériel connu et habité par les mortels. Tout est signe ou symbole, rien n'est ce qu'il paraît si l'on se contente de ne regarder que la surface des choses, et seuls les dieux peuvent connaître et comprendre la vérité. Mais vous pouvez aujourd'hui entrapercevoir cette vérité.", effetRune: "Vous pouvez lancer le sort augure en tant que rituel sans composant matériel. À partir du niveau 11, vous pouvez lancer à la place le sort divination en tant que rituel sans composant matériel.", effetAettInverse: "Vous avez tenté de projeter votre conscience au-delà du monde matériel pour comprendre sa véritable essence, mais vous n'avez rien appris. Tout semble morne, superficiel, sans aucune signification cachée. Ceci vous effraie, vous plonge dans l'incertitude, ternit les tréfonds de votre âme et vous décourage.", effetRuneInverse: "Au début de chaque combat, vous êtes considéré comme terrorisé par toutes les créatures hostiles que vous percevez. Cet état dure jusqu'au début de votre deuxième tour de combat." },
  { numero: 22, nom: "Ingwaz", aett: "Týr", endroit: "Sexualité, fertilité, agriculture, chaleur humaine, abondance.", envers: null, divinite: "L'avenir de la lignée, présidé par Freyr.", effetAett: "Vous sentez une puissante force vitale vous traverser, une vive énergie primordiale, telle une chaleur qui accélère votre rythme cardiaque comme si vous étiez une source d'espoir prête à donner la vie.", effetRune: "Par une action bonus, vous pouvez dépenser et lancer l'un de vos dés de vie pour soigner un nombre de points de vie égal au résultat obtenu plus votre modificateur de Charisme (1 au minimum) que vous divisez parmi n'importe quel nombre de créatures à 3 m ou moins de vous. Vous gagnez un nombre de points de vie temporaires égal à la moitié du montant soigné.", effetAettInverse: null, effetRuneInverse: null },
  { numero: 23, nom: "Othila", aett: "Týr", endroit: "Propriété, famille, héritage.", envers: "Esclavage, racisme, avidité.", divinite: "L'honneur des ancêtres, présidé par Njörðr.", effetAett: "Vous voyez clairement, mais brièvement le présent, l'avenir et tout ce qu'il y a entre les deux. Vous voyez ce qu'il adviendra de ce que vous êtes en train de bâtir actuellement, ce que vos efforts produiront et votre contribution au monde.", effetRune: "Quand vous faites un jet d'attaque ou un test de caractéristique avec un avantage, vous pouvez relancer le dé ayant obtenu le moins bon résultat. Vous devez garder le nouveau résultat, même s'il est moins bon. Une fois ce pouvoir utilisé, vous devez terminer un repos court avant de pouvoir le réutiliser. Vous ne pouvez utiliser ce pouvoir qu'une seule fois par tour.", effetAettInverse: "Une vision de l'avenir trompeuse et pervertie vous remplit de doutes et de suspicions. Vous ne savez pas à qui vous pouvez accorder votre confiance, vous voyez vos soi-disant amis tenter de vous maltraiter et de vous dominer, vous vous méfiez de tout et tous... La seule réponse raisonnable consiste à vous préparer au pire et être le tueur et non la victime le moment venu.", effetRuneInverse: "Quand vous faites un jet d'attaque ou un test de caractéristique avec un avantage, vous ajoutez votre modificateur de Charisme au résultat final (1 au minimum), mais vous soustrayez votre modificateur de Charisme si vous êtes désavantagé lors du jet ou du test (1 au minimum)." },
  { numero: 24, nom: "Dagaz", aett: "Týr", endroit: "Nouveau départ, espoir, croissance, sécurité, illumination.", envers: null, divinite: "La nouvelle ère, présidée par Dagr.", effetAett: "Votre voyage à travers les mondes et la réalité, sur les ailes de la conscience et les vents de l'illumination, vous mène au sommet du monde, là où tout paraît simple, petit, et parfaitement agencé dans le grand ordre des choses. Vous êtes à présent prêt à reprendre votre voyage vers l'illumination, mais l'atteinte de ce niveau de compréhension vous a renforcé.", effetRune: "Quand cette rune est tirée, vous récupérez tous vos points de vie et gagnez un nombre de points de vie temporaires égal à la moitié de votre maximum. Chaque fois que vous finissez un repos court, vous gagnez un nombre de points de vie temporaires égal à la moitié de votre modificateur de Charisme (1 au minimum).", effetAettInverse: null, effetRuneInverse: null }
];

const RUNES = {
  "Ætt de Freyja": RUNES_RAW.filter(r => r.aett === "Freyja"),
  "Ætt de Heimdallr": RUNES_RAW.filter(r => r.aett === "Heimdallr"),
  "Ætt de Týr": RUNES_RAW.filter(r => r.aett === "Týr")
};

const JOURNAL_ID = sid("journal-runes");
const journalPages = [];
journalPages.push({
  _id: sid("rune-page-intro"),
  name: "Mécanisme de la dévotion runique",
  type: "text",
  title: { show: true, level: 1 },
  text: { format: 1, content: `<p>Tout personnage peut se vouer à une rune du Futhark ancien (24 runes réparties en trois ættir de huit) et, dans une moindre mesure, à l'ætt qui la contient. C'est un choix du joueur — portée en talisman, gravée ou tatouée — et non un tirage imposé à la création.</p>
    <h3>Tirer une rune sans matériel dédié</h3>
    <ol>
      <li><strong>1d6</strong> pour l'ætt : 1–2 Freyja, 3–4 Heimdallr, 5–6 Týr.</li>
      <li><strong>1d8</strong> pour la rune au sein de cet ætt.</li>
      <li><strong>1d6</strong> pour le sens (runes bidirectionnelles uniquement) : 1–3 à l'endroit, 4–6 à l'envers.</li>
    </ol>
    <p>En cours de partie, un maître des runes peut tirer une rune par personnage présent à chaque repos long : si elle correspond à l'ætt d'un personnage, elle produit un effet — doublé si c'est sa rune personnelle — jusqu'à la fin du prochain repos long.</p>
    <p>La macro <strong>Tirer une rune (Vers le Ragnarök)</strong> fournie par ce module automatise ce tirage.</p>` },
  sort: 0, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
  _key: `!journal.pages!${JOURNAL_ID}.${sid("rune-page-intro")}`
});

let pageSort = 100000;
for (const [aett, runes] of Object.entries(RUNES)) {
  const rows = runes.map(r => `
    <h3>${r.numero}. ${r.nom}</h3>
    <p><strong>À l'endroit :</strong> ${r.endroit}${r.envers ? ` — <strong>À l'envers :</strong> ${r.envers}` : " (aucun sens inversé)"}</p>
    <p style="opacity:.75"><em>${r.divinite}</em></p>
    <p><strong>Effet de l'${aett} :</strong> ${r.effetAett}</p>
    <p><strong>Effet de la rune ${r.nom} :</strong> ${r.effetRune}</p>
    ${r.effetAettInverse ? `<p><strong>Effet inverse de l'${aett} :</strong> ${r.effetAettInverse}</p>` : ""}
    ${r.effetRuneInverse ? `<p><strong>Effet inverse de la rune ${r.nom} :</strong> ${r.effetRuneInverse}</p>` : ""}
  `).join("\n<hr>\n");
  journalPages.push({
    _id: sid("rune-page-" + aett),
    name: aett,
    type: "text",
    title: { show: true, level: 1 },
    text: { format: 1, content: `<p>Huit runes du Futhark ancien.</p>${rows}` },
    sort: pageSort, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
    _key: `!journal.pages!${JOURNAL_ID}.${sid("rune-page-" + aett)}`
  });
  pageSort += 100000;
}

docs.journals.push({
  _id: JOURNAL_ID,
  name: "Grimoire runique",
  pages: journalPages,
  folder: null,
  sort: 0,
  ownership: { default: -1 },
  flags: {},
  _stats: nowStats(),
  _key: `!journal!${JOURNAL_ID}`
});

const GUIDE_ID = sid("journal-guide");
docs.journals.push({
  _id: GUIDE_ID,
  name: "Guide rapide de création",
  pages: [{
    _id: sid("guide-page-1"),
    name: "Créer un héros de Miðgarðr",
    type: "text",
    title: { show: true, level: 1 },
    text: { format: 1, content: `<ol>
      <li><strong>Choisissez un clan</strong> (compendium Objets/Fonctionnalités) — culturel, sans bonus de caractéristique.</li>
      <li><strong>Race humaine recommandée</strong>, et un alignement : Loyal Honorable, Chaotique Honorable, Loyal Peu honorable, ou Chaotique Peu honorable.</li>
      <li><strong>Choisissez un historique</strong> parmi les huit du compendium Historiques.</li>
      <li><strong>Choisissez une classe</strong>, dont la nouvelle classe <em>Maître des runes</em>.</li>
      <li><strong>Ajoutez la compétence Ásatrú</strong> (Sagesse) — automatiquement disponible sur la fiche grâce à ce module.</li>
      <li><strong>Dévouez-vous à une rune</strong> (facultatif) — voir le Grimoire runique.</li>
      <li><strong>Équipez votre héros</strong> avec l'équipement de classe et d'historique, plus un objet de clan mérité en jeu.</li>
    </ol>` },
    sort: 0, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
    _key: `!journal.pages!${GUIDE_ID}.${sid("guide-page-1")}`
  }],
  folder: null, sort: 100000, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
  _key: `!journal!${GUIDE_ID}`
});

// -- Journal: Règles de navigation (d'après « Battle Beyond the Sea »)
const SAILING_ID = sid("journal-sailing");
docs.journals.push({
  _id: SAILING_ID,
  name: "Règles de navigation",
  pages: [
    {
      _id: sid("sailing-page-roles"),
      name: "Rôles et tour de navigation",
      type: "text",
      title: { show: true, level: 1 },
      text: { format: 1, content: `<h2>Les rôles à bord</h2>
        <p><strong>Capitaine.</strong> Par un test de Charisme (Représentation) ou de Sagesse (Ásatrú) réussi, l'équipage effectue tous ses tests de navigation de la journée avec avantage. Le capitaine peut aussi utiliser son tour de navigation pour aider un membre d'équipage et lui donner l'avantage à son propre test du jour. Ce rôle est facultatif pour les groupes de 4 joueurs ou moins.</p>
        <p><strong>Timonier.</strong> Barre le navire sur sa route par un test de Dextérité (Escamotage) ou de Sagesse (Perspicacité) réussi.</p>
        <p><strong>Vigie.</strong> Prévient des dangers imminents (pillards, hauts-fonds, rochers, tempêtes) par un test de Sagesse (Perception) réussi.</p>
        <p><strong>Navigateur.</strong> Trace la route vers la destination et aide le timonier à ne pas s'en écarter par un test de Sagesse (Survie) réussi.</p>
        <p><strong>Marin.</strong> Manœuvre les rames et règle les voiles par un test de Force (Athlétisme) réussi. Chaque personnage assumant ce rôle réduit le DD des tests de marins de 1 ; à partir de trois marins, leurs tests peuvent être traités comme un test de groupe.</p>
        <h2>Tour de navigation</h2>
        <p>Capitaine &gt; Navigateur &gt; Marins &gt; Vigie &gt; Timonier.</p>` },
      sort: 0, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
      _key: `!journal.pages!${SAILING_ID}.${sid("sailing-page-roles")}`
    },
    {
      _id: sid("sailing-page-voyage"),
      name: "Voyager en mer",
      type: "text",
      title: { show: true, level: 1 },
      text: { format: 1, content: `<h2>Moins d'une journée de navigation</h2>
        <p>Un seul test de groupe. En cas de réussite, le trajet se déroule sans incident. En cas d'échec, le groupe doit retenter le test et le navire perd 1 point d'intégrité.</p>
        <h2>Affronter le large</h2>
        <p>Pour un trajet de plus d'une journée, un test doit être réussi chaque jour (arrondi au supérieur), avec un DD fixé par le type de traversée :</p>
        <table><tr><th>Type de traversée</th><th>DD</th></tr>
        <tr><td>Longer la côte</td><td>12</td></tr>
        <tr><td>Haute mer</td><td>13</td></tr>
        <tr><td>Eaux agitées</td><td>15</td></tr></table>
        <h2>Échecs</h2>
        <table><tr><th>Rôle en échec</th><th>Conséquence</th></tr>
        <tr><td>Navigateur, Marins ou Vigie</td><td>Le trajet prend un jour de plus.</td></tr>
        <tr><td>Timonier</td><td>L'effort épuise l'équipage : 1 niveau d'Épuisement, et le trajet prend un jour de plus.</td></tr>
        <tr><td>Vigie qui ne détecte pas une menace à temps</td><td>Le navire perd 1 point d'intégrité.</td></tr>
        <tr><td>Timonier qui ne parvient pas à éviter un obstacle ou garder le cap</td><td>Le navire perd 1 point d'intégrité.</td></tr></table>
        <p><em>Si le timonier et la vigie échouent tous deux le même jour, le navire ne perd qu'1 point d'intégrité au lieu de 2.</em></p>
        <h2>Points d'intégrité</h2>
        <p>Chaque navire dispose d'un nombre de points d'intégrité représentant la solidité de sa construction ; à 0, il coule. Seul un Skipasmidhr (voir l'historique du même nom, compendium Historiques) peut le réparer, à raison d'1 point tous les 10 jours de travail avec les bons outils et les matières premières nécessaires — plusieurs Skipasmidhr peuvent se répartir la tâche pour diviser ce délai (arrondi au supérieur). Faire appel à un Skipasmidhr professionnel coûte 300 po par point d'intégrité, sans jamais dépasser le plafond du navire.</p>
        <h2>Se déplacer à bord</h2>
        <p>Un personnage qui se déplace sur le pont pendant une tempête doit réussir un jet de sauvegarde de Dextérité DD 13 à la fin de son mouvement, sous peine d'être mis à terre.</p>
        <h2>Le gel de Fimbulvetr</h2>
        <p>Un personnage jeté par-dessus bord doit réussir un jet de sauvegarde de Constitution DD 12 chaque minute jusqu'à être remonté à bord, sous peine de subir 1 niveau d'Épuisement et 1d4 dégâts de froid.</p>
        <h2>Rencontres aléatoires</h2>
        <p>Pour déterminer les rencontres aléatoires en mer ou dans les terres traversées, consultez les tables de rencontres régionales (compendium Tables) : Jutland (continent), Frankland et Midgardr (haute mer). Le MJ peut y jouer un d6, ou tirer une rune dont l'effet influence le résultat.</p>` },
      sort: 100000, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
      _key: `!journal.pages!${SAILING_ID}.${sid("sailing-page-voyage")}`
    },
    {
      _id: sid("sailing-page-supplies"),
      name: "Vivres et eau",
      type: "text",
      title: { show: true, level: 1 },
      text: { format: 1, content: `<h2>Nourriture</h2>
        <p>Un personnage a besoin d'une livre de nourriture par jour, mais peut se contenter d'une demi-ration, comptant alors comme une demi-journée sans manger. Un personnage peut rester sans manger, sans conséquence, un nombre de jours égal à 3 + son modificateur de Constitution (1 au minimum) ; au-delà, il subit 1 niveau d'Épuisement à la fin de chaque jour passé sans nourriture. Le compteur est remis à zéro dès qu'il mange à nouveau.</p>
        <h2>Eau</h2>
        <p>Un personnage a besoin d'un gallon d'eau par jour (2 par temps chaud). S'il n'en boit que la moitié, il doit réussir un jet de sauvegarde de Constitution DD 15 ou subir 1 niveau d'Épuisement en fin de journée. S'il en boit encore moins, il subit automatiquement 1 niveau d'Épuisement en fin de journée (2 s'il souffrait déjà d'Épuisement).</p>
        <h2>Manquer de vivres</h2>
        <p>Si l'équipage manque de vivres, il doit s'arrêter et consacrer une heure à chercher de la nourriture. Un test de Sagesse (Survie) DD 15 réussi permet de trouver assez de nourriture pour la journée ; un test de Sagesse (Médecine) DD 17 réussi couvre les besoins en eau. Les personnages qui ne mangent ni ne boivent souffrent d'Épuisement jusqu'à ce qu'ils se nourrissent à nouveau.</p>` },
      sort: 200000, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
      _key: `!journal.pages!${SAILING_ID}.${sid("sailing-page-supplies")}`
    }
  ],
  folder: null, sort: 200000, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
  _key: `!journal!${SAILING_ID}`
});

// -- Roll tables for the divination mechanism
function tableResult(parentId, i, text, range) {
  const rid = sid("res-" + parentId + text + i);
  return { _id: rid, type: "text", text, weight: 1, range, drawn: false, _key: `!tables.results!${parentId}.${rid}` };
}

const aettNames = Object.keys(RUNES);
const AETT_TABLE_ID = sid("table-aett");
docs.tables.push({
  _id: AETT_TABLE_ID, name: "Divination runique — Ætt (d6)", img: RUNE_IMG,
  description: "Déterminez l'ætt tiré, puis lancez 1d8 sur la table de runes correspondante.",
  formula: "1d6", replacement: true, displayRoll: true,
  results: [
    tableResult(AETT_TABLE_ID, 1, "Ætt de Freyja", [1, 2]),
    tableResult(AETT_TABLE_ID, 2, "Ætt de Heimdallr", [3, 4]),
    tableResult(AETT_TABLE_ID, 3, "Ætt de Týr", [5, 6])
  ],
  folder: null, sort: 0, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
  _key: `!tables!${AETT_TABLE_ID}`
});

for (const aett of aettNames) {
  const runes = RUNES[aett];
  const tid = sid("table-" + aett);
  docs.tables.push({
    _id: tid, name: `Divination runique — ${aett} (d8)`, img: RUNE_IMG,
    description: "Lancez ensuite 1d6 pour le sens si la rune a un envers (1-3 endroit, 4-6 envers).",
    formula: "1d8", replacement: true, displayRoll: true,
    results: runes.map((r, i) => tableResult(tid, i + 1, r.nom, [i + 1, i + 1])),
    folder: null, sort: 0, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
    _key: `!tables!${tid}`
  });
}

// -- Regional random-encounter tables (d'après « Battle Beyond the Sea »)
const REGION_TABLE_IMG = "icons/environment/settlement/way-marker-stone.webp";
const REGIONS = [
  {
    name: "Jutland (continent)",
    rows: [
      { row: "Ætt de Freyja — endroit", foes: "1d4 Serpents corrompus (basilic)", encounter: "Une bouclière (maîtresse-bouclière) montée sur un fier destrier", weather: "Le soleil perce faiblement à travers de fins nuages, vent fort" },
      { row: "Ætt de Freyja — envers", foes: "1d4 Insectes aberrants (chuul)", encounter: "Les restes d'un camp détruit. Un groupe de gardes du Danevirke en route vers le Mur", weather: "Ciel couvert, mais sans pluie" },
      { row: "Ætt de Heimdallr — endroit", foes: "1 Sanglier corrompu (bulette)", encounter: "Des réfugiés en route vers une forteresse pour s'y protéger", weather: "Brume fine et éparse, pluie torrentielle" },
      { row: "Ætt de Heimdallr — envers", foes: "2d6 Poules corrompues (cocatrix)", encounter: "Un rebelle blessé. Un homme blessé et terrifié qui divague sur des morts qui se réveillent", weather: "Un orage sombre s'annonce, venant du sud" },
      { row: "Ætt de Týr — endroit", foes: "1 Arbre éveillé (tertre errant)", encounter: "—", weather: "—" },
      { row: "Ætt de Týr — envers", foes: "1 Crapaud corrompu (otyugh)", encounter: "—", weather: "—" }
    ]
  },
  {
    name: "Frankland",
    rows: [
      { row: "Ætt de Freyja — endroit", foes: "3 Spectres (wight)", encounter: "Un petit établissement avec quelques survivants", weather: "Gel et neige" },
      { row: "Ætt de Freyja — envers", foes: "2d6 Loups funestes", encounter: "Les restes d'un camp attaqué", weather: "Vent fort" },
      { row: "Ætt de Heimdallr — endroit", foes: "1d6 Feux follets", encounter: "Un groupe de gardes du Danevirke en route vers le Mur", weather: "Ciel nuageux mais stable" },
      { row: "Ætt de Heimdallr — envers", foes: "2d12 Zombis", encounter: "Des réfugiés francs en route vers une forteresse pour s'y protéger", weather: "Brouillard épars" },
      { row: "Ætt de Týr — endroit", foes: "1 Arbre éveillé (tertre errant)", encounter: "Un soldat franc survivant", weather: "Pluie torrentielle et battante" },
      { row: "Ætt de Týr — envers", foes: "2 Spectres évanescents (wraith)", encounter: "Un homme terrifié qui divague sur des morts qui se réveillent", weather: "Un sombre orage avance depuis le sud" }
    ]
  },
  {
    name: "Midgardr — haute mer",
    rows: [
      { row: "Ætt de Freyja — endroit", foes: "1d6 Orques ou requins chasseurs", encounter: "Des bateaux de pêche", weather: "Le ciel est dégagé, vent modérément fort" },
      { row: "Ætt de Freyja — envers", foes: "1d6 Spectres (wight)", encounter: "Un navire sans pavillon", weather: "Le vent est calme, mais glacial" },
      { row: "Ætt de Heimdallr — endroit", foes: "2d6 Pirates (capitaine bandit)", encounter: "Un navire approche, arborant la bannière d'un clan", weather: "Le ciel est en partie dégagé et le temps est stable" },
      { row: "Ætt de Heimdallr — envers", foes: "1 Élémentaire d'eau", encounter: "La voie est bloquée par des icebergs et le gel", weather: "Il neige abondamment et le froid est extrême" },
      { row: "Ætt de Týr — endroit", foes: "2 Requins géants", encounter: "Les survivants d'un naufrage, en détresse", weather: "Brouillard épais et mer agitée" },
      { row: "Ætt de Týr — envers", foes: "1 Aboleth (sans actions légendaires ni asservissement)", encounter: "Les débris d'un puissant navire de guerre détruit", weather: "Une terrible tempête se lève depuis la mer" }
    ]
  }
];

for (const region of REGIONS) {
  const tid = sid("table-region-" + region.name);
  docs.tables.push({
    _id: tid, name: `Rencontres aléatoires — ${region.name}`, img: REGION_TABLE_IMG,
    description: "Lancez 1d6 (ou tirez une rune, dont l'effet peut influencer le résultat). Chaque colonne (Adversaires, Rencontre, Météo) peut être tirée séparément selon les besoins de la scène.",
    formula: "1d6", replacement: true, displayRoll: true,
    results: region.rows.map((r, i) => tableResult(tid, i + 1, `${r.row} — Adversaires : ${r.foes} — Rencontre : ${r.encounter} — Météo : ${r.weather}`, [i + 1, i + 1])),
    folder: null, sort: 0, ownership: { default: -1 }, flags: {}, _stats: nowStats(),
    _key: `!tables!${tid}`
  });
}

// -- Macro
const macroCommand = `// Tirer une rune — Vers le Ragnarök
// Lit les flags "vers-le-ragnarok" (ætt / rune) posés sur chaque PJ via le bloc
// "Dévotion runique" de la fiche de personnage, et rapporte automatiquement qui
// est concerné par le tirage (ætt correspondant, doublé si c'est la rune propre).
const MODULE_ID = "vers-le-ragnarok";
const AETTS = {
  "Freyja": ["Fehu","Ūruz","Thurisaz","Ansuz","Raido","Kenaz","Gebo","Wunjo"],
  "Heimdallr": ["Hagalaz","Nauthiz","Isaz","Jera","Eihwaz","Perth","Algiz","Sowilo"],
  "Týr": ["Teiwaz","Berkana","Ehwaz","Mannaz","Laguz","Ingwaz","Othila","Dagaz"]
};
const aettNames = Object.keys(AETTS);

const aettRoll = await new Roll("1d6").roll();
const aettIndex = aettRoll.total <= 2 ? 0 : (aettRoll.total <= 4 ? 1 : 2);
const aettName = aettNames[aettIndex];

const runeRoll = await new Roll("1d8").roll();
const rune = AETTS[aettName][runeRoll.total - 1];

const senseRoll = await new Roll("1d6").roll();
const sense = senseRoll.total <= 3 ? "à l'endroit" : "à l'envers";

const party = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
const rows = party.map(actor => {
  const actorAett = actor.getFlag(MODULE_ID, "aett");
  const actorRune = actor.getFlag(MODULE_ID, "rune");
  if (actorAett !== aettName) return \`<li style="opacity:.5;">\${actor.name} — aucun effet (\${actorAett || "aucune dévotion"})</li>\`;
  if (actorRune === rune) return \`<li><strong>\${actor.name}</strong> — <strong>rune personnelle</strong> : effet doublé !</li>\`;
  return \`<li><strong>\${actor.name}</strong> — concerné (dévoué à l'ætt de \${aettName})</li>\`;
}).join("");

const content = \`
  <div style="text-align:center;">
    <h2 style="margin-bottom:0;">\${rune}</h2>
    <p style="opacity:.75; margin-top:0;">Ætt de \${aettName} — \${sense}</p>
    <p style="font-size:.85em;">Ætt : d6 = \${aettRoll.total} · Rune : d8 = \${runeRoll.total} · Sens : d6 = \${senseRoll.total}</p>
  </div>
  \${party.length ? \`<ul style="text-align:left; margin-top:.5em;">\${rows}</ul>\` : \`<p style="font-size:.85em; opacity:.75;">Aucun personnage joueur trouvé dans ce monde.</p>\`}
  <p style="font-size:.85em; opacity:.75;">Consultez le <em>Grimoire runique</em> (compendium Journaux) pour l'effet complet. La dévotion de chaque personnage se règle dans l'onglet Détails de sa fiche.</p>
\`;

ChatMessage.create({ content, speaker: ChatMessage.getSpeaker() });
`;

docs.macros.push({
  _id: sid("macro-rune"), name: "Tirer une rune (Vers le Ragnarök)",
  type: "script", author: null, img: RUNE_IMG,
  command: macroCommand, scope: "global",
  folder: null, sort: 0, ownership: { default: 0 }, flags: {}, _stats: nowStats(),
  _key: `!macros!${sid("macro-rune")}`
});

// -- Equipment docs
docs.equipment.push(...EQUIPMENT_DOCS);
docs.magicitems.push(...MAGIC_ITEMS);

// ---------------------------------------------------------------------------
// Content: Bestiaire — grandes figures du Ragnarök (chapitre 13, p. 288-295)
// ---------------------------------------------------------------------------

function npcFeat({ name, img, html, actorId }) {
  const item = baseItem({
    name, type: "feat", img,
    system: {
      description: desc(html),
      identifier: slugify(name),
      source: "Vers le Ragnarök",
      requirements: "",
      type: { value: "", subtype: "" },
      properties: [],
      prerequisites: { items: [], level: null, repeatable: false },
      activities: {},
      advancement: {}
    }
  });
  // Embedded items live under a different LevelDB key than standalone compendium
  // items: !actors.items!<actorId>.<itemId>, not !items!<itemId>.
  item._key = `!actors.items!${actorId}.${item._id}`;
  return item;
}

const SIZE_MAP = { "Gigantesque": "grg", "Très Grande": "huge", "Grande": "lg" };
const TYPE_MAP = { "Bête": "beast", "Géant": "giant", "Dragon": "dragon", "Monstruosité": "monstrosity" };
const DAMAGE_MAP = { "acide": "acid", "feu": "fire", "froid": "cold", "nécrotiques": "necrotic", "nécrotique": "necrotic", "poison": "poison", "foudre": "lightning", "tonnerre": "thunder", "radiants": "radiant", "psychiques": "psychic", "force": "force", "contondants": "bludgeoning", "perforants": "piercing", "tranchants": "slashing" };
const CONDITION_MAP = { "charmé": "charmed", "épuisé": "exhausted", "terrorisé": "frightened", "paralysé": "paralyzed", "empoisonné": "poisoned", "aveuglé": "blinded", "assourdi": "deafened", "étourdi": "stunned", "inconscient": "unconscious" };

function npc({ name, img, size, type, alignment, ac, hp, hpFormula, movement, abilities, saves = [], skills = [], skillExpertise = [], damageImmunities = [], damageResistances = [], conditionImmunities = [], languages = "", cr, legendary = false, biography, aptitudes = [], actions = [], legendaryActions = [], reactions = [] }) {
  const abilityBlock = {};
  for (const [k, v] of Object.entries(abilities)) {
    abilityBlock[k] = { value: v, proficient: saves.includes(k) ? 1 : 0, bonuses: { check: "", save: "" }, max: null };
  }
  const skillBlock = {};
  for (const s of skills) skillBlock[s] = { value: skillExpertise.includes(s) ? 2 : 1, ability: { prc: "wis", ins: "wis", itm: "cha", per: "cha" }[s] ?? "wis", bonuses: { check: "", passive: "" }, roll: { min: null, max: null, mode: 0 } };

  const actorId = sid("npc-" + name);
  const items = [];
  for (const a of aptitudes) items.push(npcFeat({ name: a.nom, img, html: `<p>${a.texte}</p>`, actorId }));
  for (const a of actions) items.push(npcFeat({ name: a.nom, img, html: `<p>${a.texte}</p>`, actorId }));
  for (const a of legendaryActions) items.push(npcFeat({ name: `${a.nom} (action légendaire)`, img, html: `<p>${a.texte}</p>`, actorId }));
  for (const a of reactions) items.push(npcFeat({ name: `${a.nom} (réaction)`, img, html: `<p>${a.texte}</p>`, actorId }));

  return {
    _id: actorId, name, type: "npc", img,
    system: {
      abilities: abilityBlock,
      attributes: {
        ac: { flat: ac, calc: "flat", formula: "" },
        hp: { value: hp, max: hp, temp: null, tempmax: null, formula: hpFormula },
        init: { ability: "", bonus: "0", roll: { min: null, max: null, mode: 0 } },
        movement: { walk: movement.walk ?? 0, swim: movement.swim ?? 0, fly: movement.fly ?? 0, climb: movement.climb ?? 0, burrow: movement.burrow ?? 0, units: "m", hover: false },
        senses: { darkvision: movement.darkvision ?? 0, blindsight: 0, tremorsense: 0, truesight: 0, units: "m", special: "" },
        exhaustion: 0
      },
      details: {
        biography: { value: `<p>${biography}</p>`, public: "" },
        alignment,
        type: { value: TYPE_MAP[type] ?? "", subtype: "", swarm: "", custom: type },
        cr,
        spellLevel: 0
      },
      traits: {
        size: SIZE_MAP[size] ?? "lg",
        di: { value: damageImmunities.map(d => DAMAGE_MAP[d] ?? d).filter(Boolean), bypasses: [], custom: "" },
        dr: { value: damageResistances.map(d => DAMAGE_MAP[d] ?? d).filter(Boolean), bypasses: [], custom: "" },
        dv: { value: [], bypasses: [], custom: "" },
        ci: { value: conditionImmunities.map(c => CONDITION_MAP[c] ?? c).filter(Boolean), custom: "" },
        languages: { value: [], custom: languages }
      },
      skills: skillBlock,
      resources: legendary
        ? { legact: { value: 3, max: 3 }, legres: { value: 3, max: 3 }, lair: { value: false, initiative: null } }
        : {},
      source: "Vers le Ragnarök"
    },
    items,
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    prototypeToken: {
      name, displayName: 20, actorLink: false, disposition: -1, displayBars: 20,
      bar1: { attribute: "attributes.hp" }, bar2: legendary ? { attribute: "resources.legact" } : { attribute: null },
      sight: { enabled: true }, texture: { src: img }
    },
    _stats: nowStats(),
    _key: `!actors!${sid("npc-" + name)}`
  };
}

const NPCS = [
  npc({
    name: "Fenrir", img: "icons/creatures/mammals/wolf-shadow-forest-green.webp",
    size: "Gigantesque", type: "Bête", alignment: "Chaotique Peu honorable",
    ac: 24, hp: 580, hpFormula: "34d12 + 340", movement: { walk: 36, darkvision: 36 },
    abilities: { str: 30, dex: 26, con: 28, int: 18, wis: 10, cha: 14 },
    saves: ["str", "con"], skills: ["prc"], skillExpertise: ["prc"],
    damageResistances: ["contondants", "perforants", "tranchants"],
    damageImmunities: ["acide", "feu", "froid", "nécrotiques", "poison"],
    conditionImmunities: ["charmé", "épuisé", "terrorisé", "paralysé", "empoisonné"],
    cr: 26,
    biography: "Également appelé Hróðvitnir, le loup Fenrir est le résultat de l'union entre Loki et la géante Angrboða. Piégé sur l'île de Lyngvi avec la chaîne Gleipnir par les Æsir, il bout de haine envers les dieux et attend le Ragnarök pour briser ses chaînes. <em>Immunisé de plus aux dégâts contondants, perforants et tranchants infligés par des armes non magiques (à configurer manuellement).</em>",
    legendary: true,
    aptitudes: [
      { nom: "Immunité à la magie", texte: "Fenrir est immunisé contre les sorts et les effets magiques." },
      { nom: "Résistance légendaire (3/jour)", texte: "Si Fenrir rate un jet de sauvegarde, il peut choisir à la place de le réussir." },
      { nom: "Faim insatiable", texte: "La faim insatiable de Fenrir le fait continuellement baver. Le sol dans un rayon de 6 m autour de lui est considéré comme un terrain difficile à cause de l'extrême viscosité de sa bave." },
      { nom: "Descendance divine", texte: "Les attaques de Fenrir sont magiques." },
      { nom: "Vue et odorat aiguisés", texte: "Fenrir est avantagé lors de ses tests de Sagesse (Perception) basés sur la vue et l'odorat." }
    ],
    actions: [
      { nom: "Attaques multiples", texte: "Fenrir peut utiliser sa présence terrifiante. Il effectue ensuite quatre attaques : une attaque de coup, deux attaques de griffe et une attaque de morsure. Il peut utiliser l'action engloutir à la place de l'attaque de morsure." },
      { nom: "Griffe", texte: "Attaque d'arme au corps à corps : +18 pour toucher, allonge 6 m, une cible. Touché : 45 (6d10+10) dégâts tranchants plus 27 (8d6) dégâts de force." },
      { nom: "Morsure", texte: "Attaque d'arme au corps à corps : +18 pour toucher, allonge 6 m, une cible. Touché : 55 (10d8+10) dégâts perforants plus 27 (8d6) dégâts de force. Si la cible est une créature, elle doit réussir un jet de sauvegarde de Force DD 21 ou être empoignée et entravée. Fenrir ne peut pas mordre une autre cible." },
      { nom: "Coup", texte: "Attaque d'arme au corps à corps : +18 pour toucher, allonge 6 m, une cible. Touché : 45 (5d12+10) dégâts tranchants plus 27 (8d6) dégâts de force. Si la cible est une créature, elle doit réussir un jet de sauvegarde de Force DD 21 ou tomber à terre." },
      { nom: "Engloutir", texte: "Fenrir fait une attaque de morsure contre une créature de taille Grande ou inférieure qu'il empoigne. En cas d'attaque réussie, la cible subit les dégâts normaux, elle est engloutie et l'empoignade prend fin. Une créature engloutie est aveuglée, entravée, bénéficie d'un abri total contre les attaques et effets provenant de l'extérieur de Fenrir et subit 42 (12d6) dégâts nécrotiques au début du tour de Fenrir. Si Fenrir subit 70 dégâts ou plus d'une créature qu'il a engloutie, il doit réussir un jet de sauvegarde de Constitution DD 20 à la fin de son tour ou régurgiter toutes les créatures qu'il a englouties, qui se retrouvent à terre dans un emplacement à 9 m ou moins de Fenrir. S'il meurt, une créature engloutie n'est plus entravée et peut sortir de son corps avec une vitesse de 15 m en terminant son tour à terre." },
      { nom: "Présence terrifiante", texte: "Toutes les créatures désignées par Fenrir, dans un rayon de 36 m et conscientes de sa présence, doivent réussir un jet de sauvegarde de Sagesse DD 20 ou être terrorisées pendant une minute. Une créature peut retenter le jet à la fin de chacun de ses tours (désavantagé si Fenrir est dans son champ de vision) et met fin à l'effet en cas de réussite ; elle est alors immunisée contre la présence terrifiante de Fenrir pendant 24 h." },
      { nom: "Hurlement puissant (recharge 5-6)", texte: "Fenrir rugit de rage, déchaînant les éléments en tornade. Chaque créature dans un cône de 36 m doit réussir un jet de sauvegarde de Force DD 21. En cas d'échec, elle tombe à terre à 9 m ou moins et subit 27 (8d6) dégâts de force et 80 (12d12) dégâts de tonnerre. En cas de réussite, elle n'est pas déplacée et subit la moitié des dégâts de tonnerre." }
    ],
    legendaryActions: [
      { nom: "Détecter", texte: "Fenrir fait un test de Sagesse (Perception)." },
      { nom: "Bave dégoûtante", texte: "Fenrir rugit sur une créature à 18 m ou moins, la recouvrant de bave. Elle doit réussir un jet de sauvegarde de Dextérité DD 21 ou être désavantagée sur toutes ses attaques jusqu'à la fin de son prochain tour." },
      { nom: "Griffe", texte: "Fenrir effectue une attaque de griffe." }
    ]
  }),
  npc({
    name: "Sköll", img: "icons/creatures/mammals/wolf-white-yellow.webp",
    size: "Très Grande", type: "Bête", alignment: "Chaotique Peu honorable",
    ac: 18, hp: 204, hpFormula: "16d12 + 96", movement: { walk: 18, darkvision: 36 },
    abilities: { str: 25, dex: 26, con: 22, int: 14, wis: 12, cha: 14 },
    saves: ["str", "dex"], skills: ["prc"],
    damageResistances: ["contondants", "perforants", "tranchants"],
    damageImmunities: ["feu"],
    conditionImmunities: ["charmé", "épuisé", "terrorisé", "paralysé", "empoisonné"],
    cr: 15,
    biography: "Sköll et Hati sont des loups géants de la forêt de Járnviðr. Les jötnar l'ont chargé de suivre Sól, le soleil, détourné par les Æsir. <em>Immunisé de plus aux dégâts contondants, perforants et tranchants infligés par des armes non magiques (à configurer manuellement).</em>",
    legendary: true,
    aptitudes: [
      { nom: "Résistance à la magie", texte: "Sköll est avantagé lors des jets de sauvegarde contre les sorts et les effets magiques." },
      { nom: "Résistance légendaire (3/jour)", texte: "Si Sköll rate un jet de sauvegarde, il peut choisir à la place de le réussir." },
      { nom: "Descendance divine", texte: "Les attaques de Sköll sont magiques." },
      { nom: "Tactique de meute", texte: "Sköll est avantagé lors des jets d'attaque contre une créature si au moins un allié se trouve à 3 m ou moins de cette créature et n'est pas neutralisé." },
      { nom: "Vue et odorat aiguisés", texte: "Sköll est avantagé lors de ses tests de Sagesse (Perception) basés sur la vue et l'odorat." }
    ],
    actions: [
      { nom: "Attaques multiples", texte: "Sköll effectue trois attaques : deux attaques de griffe et une attaque de morsure. Il peut utiliser l'action engloutir à la place de l'attaque de morsure." },
      { nom: "Griffe", texte: "Attaque d'arme au corps à corps : +12 pour toucher, allonge 3 m, une cible. Touché : 19 (2d10+7) dégâts tranchants." },
      { nom: "Morsure", texte: "Attaque d'arme au corps à corps : +12 pour toucher, allonge 3 m, une cible. Touché : 30 (4d8+10) dégâts perforants plus 16 (4d6) dégâts de feu. Si la cible est une créature, elle doit réussir un jet de sauvegarde de Force DD 18 ou être empoignée et entravée. Sköll ne peut pas mordre une autre cible." },
      { nom: "Engloutir", texte: "Sköll fait une attaque de morsure contre une créature de taille Grande ou inférieure qu'il empoigne. En cas d'attaque réussie, elle est engloutie, l'empoignade prend fin, elle est aveuglée, entravée, bénéficie d'un abri total et subit 30 (8d6) dégâts de feu au début du tour de Sköll. Si Sköll subit 50 dégâts ou plus d'une créature engloutie, il doit réussir un jet de sauvegarde de Constitution DD 20 en fin de tour ou régurgiter toutes les créatures englouties à 9 m ou moins de lui. S'il meurt, une créature engloutie n'est plus entravée et peut sortir avec une vitesse de 15 m en terminant son tour à terre." },
      { nom: "Cône de feu (recharge 5-6)", texte: "Sköll rugit, faisant jaillir un cône de feu de 18 m. Chaque créature dans la zone doit réussir un jet de sauvegarde de Dextérité DD 18 ou subir 66 (12d10) dégâts de feu (moitié en cas de réussite)." }
    ],
    legendaryActions: [
      { nom: "Détecter", texte: "Sköll fait un test de Sagesse (Perception)." },
      { nom: "Griffe", texte: "Sköll effectue une attaque de griffe." },
      { nom: "Flamboiement explosif", texte: "Sköll crache une sphère explosive sur une créature à 15 m ou moins dans son champ de vision. Elle doit réussir un jet de sauvegarde de Dextérité DD 16 ou subir 11 (2d10) dégâts de feu et se retrouver à terre à 3 m de distance (dégâts réduits de moitié et pas de déplacement en cas de réussite)." }
    ]
  }),
  npc({
    name: "Hati", img: "icons/creatures/mammals/wolf-gray-white.webp",
    size: "Très Grande", type: "Bête", alignment: "Chaotique Peu honorable",
    ac: 16, hp: 234, hpFormula: "16d12 + 128", movement: { walk: 15, darkvision: 36 },
    abilities: { str: 25, dex: 22, con: 26, int: 11, wis: 14, cha: 14 },
    saves: ["str", "dex"], skills: ["prc"],
    damageResistances: ["contondants", "perforants", "tranchants"],
    damageImmunities: ["froid"],
    conditionImmunities: ["charmé", "épuisé", "terrorisé", "paralysé", "empoisonné"],
    cr: 15,
    biography: "Sköll et Hati sont des loups géants de la forêt de Járnviðr. Les jötnar l'ont chargé de suivre Máni, la lune, détournée par les Æsir. <em>Immunisé de plus aux dégâts contondants, perforants et tranchants infligés par des armes non magiques (à configurer manuellement).</em>",
    legendary: true,
    aptitudes: [
      { nom: "Résistance à la magie", texte: "Hati est avantagé lors des jets de sauvegarde contre les sorts et les effets magiques." },
      { nom: "Résistance légendaire (3/jour)", texte: "Si Hati rate un jet de sauvegarde, il peut choisir à la place de le réussir." },
      { nom: "Descendance divine", texte: "Les attaques de Hati sont magiques." },
      { nom: "Vue et odorat aiguisés", texte: "Hati est avantagé lors de ses tests de Sagesse (Perception) basés sur la vue et l'odorat." },
      { nom: "Tactique de meute", texte: "Hati est avantagé lors des jets d'attaque contre une créature si au moins un allié se trouve à 3 m ou moins de cette créature et n'est pas neutralisé." }
    ],
    actions: [
      { nom: "Attaques multiples", texte: "Hati effectue trois attaques : deux attaques de griffe et une attaque de morsure. Il peut utiliser l'action engloutir à la place de l'attaque de morsure." },
      { nom: "Griffe", texte: "Attaque d'arme au corps à corps : +12 pour toucher, allonge 3 m, une cible. Touché : 19 (2d10+7) dégâts tranchants." },
      { nom: "Morsure", texte: "Attaque d'arme au corps à corps : +12 pour toucher, allonge 3 m, une cible. Touché : 30 (4d8+10) dégâts perforants plus 16 (4d6) dégâts de froid. Si la cible est une créature, elle doit réussir un jet de sauvegarde de Force DD 18 ou être empoignée et entravée. Hati ne peut pas mordre une autre cible." },
      { nom: "Engloutir", texte: "Hati fait une attaque de morsure contre une créature de taille Grande ou inférieure qu'il empoigne. En cas d'attaque réussie, elle est engloutie, l'empoignade prend fin, elle est aveuglée, entravée, bénéficie d'un abri total et subit 30 (8d6) dégâts de froid au début du tour de Hati. Si Hati subit 50 dégâts ou plus d'une créature engloutie, il doit réussir un jet de sauvegarde de Constitution DD 20 en fin de tour ou régurgiter toutes les créatures englouties à 9 m ou moins de lui. S'il meurt, une créature engloutie n'est plus entravée et peut sortir avec une vitesse de 15 m en terminant son tour à terre." },
      { nom: "Cône de froid (recharge 5-6)", texte: "Hati rugit, faisant jaillir un cône de froid de 18 m. Chaque créature dans la zone doit réussir un jet de sauvegarde de Dextérité DD 18 ou subir 66 (12d10) dégâts de froid (moitié en cas de réussite)." }
    ],
    legendaryActions: [
      { nom: "Détecter", texte: "Hati fait un test de Sagesse (Perception)." },
      { nom: "Griffe", texte: "Hati effectue une attaque de griffe." },
      { nom: "Bave glaciale", texte: "Hati crache sur une créature à 15 m ou moins dans son champ de vision. Elle doit réussir un jet de sauvegarde de Dextérité DD 16 ou subir 11 (2d10) dégâts de froid et voir sa Vitesse réduite à 0 jusqu'à la fin de son prochain tour (dégâts réduits de moitié et Vitesse non réduite en cas de réussite)." }
    ]
  }),
  npc({
    name: "Hrimgrimnir", img: "icons/creatures/magical/humanoid-giant-storm.webp",
    size: "Très Grande", type: "Géant", alignment: "Chaotique Peu honorable",
    ac: 15, hp: 280, hpFormula: "20d12 + 160", movement: { walk: 15, darkvision: 36 },
    abilities: { str: 30, dex: 9, con: 26, int: 20, wis: 13, cha: 13 },
    saves: ["str", "con", "wis", "cha"], skills: ["itm", "prc"], skillExpertise: ["itm", "prc"],
    damageImmunities: ["froid"],
    conditionImmunities: [],
    languages: "commun",
    cr: 19,
    biography: "Considéré comme « l'effrayant épouvantail » de Jötunheimr, le plus terrifiant de tous les jötnar. Né du pied d'Ymir, il a six têtes, apprécie la violence et adore terroriser les jötnar. Il tire sa puissance du froid et de l'obscurité ; sociopathes, fous et assassins de Miðgarðr lui vouent un culte. <em>Immunisé de plus aux dégâts contondants, perforants et tranchants infligés par des armes non magiques (à configurer manuellement).</em>",
    legendary: true,
    aptitudes: [
      { nom: "Têtes multiples", texte: "Hrimgrimnir est avantagé lors des tests de Sagesse (Perception) et des jets de sauvegarde contre les états aveuglé, charmé, assourdi, terrorisé, étourdi et inconscient." },
      { nom: "Régénération", texte: "Hrimgrimnir récupère 20 points de vie au début de son tour (sauf s'il a subi des dégâts d'acide ou de feu depuis son dernier tour). Il meurt uniquement s'il débute son tour à 0 point de vie et ne se régénère pas." },
      { nom: "Fureur sadique (rechargement après un repos, ou en tuant un ennemi)", texte: "S'il a blessé un ennemi, Hrimgrimnir peut entrer en fureur martiale pendant une minute ou jusqu'à être neutralisé : avantagé aux tests de Force et jets de sauvegarde de Force, bonus de +4 aux dégâts, résistance aux dégâts contondants, tranchants et perforants." }
    ],
    actions: [
      { nom: "Attaques multiples", texte: "Hrimgrimnir effectue deux attaques de hache à deux mains et une attaque de maillet d'armes." },
      { nom: "Hache à deux mains", texte: "Attaque d'arme au corps à corps : +15 pour toucher, allonge 3 m, une cible. Touché : 37 (4d12+10) dégâts tranchants." },
      { nom: "Maillet d'armes", texte: "Attaque d'arme au corps à corps : +15 pour toucher, allonge 3 m, une cible. Touché : 34 (6d6+10) dégâts contondants. La cible doit réussir un jet de sauvegarde de Force DD 20 ou tomber à terre à 3 m ou moins de Hrimgrimnir." },
      { nom: "Rocher", texte: "Attaque d'arme à distance : +15 pour toucher, portée 9/75 m, une cible. Touché : 37 (4d12+10) dégâts contondants." },
      { nom: "Vague de froid (recharge 5-6)", texte: "Un vent froid forme une sphère de 9 m de rayon autour de Hrimgrimnir. Chaque créature dans la zone doit réussir un jet de sauvegarde de Constitution DD 18. En cas d'échec : 60 (12d8) dégâts de froid et Vitesse réduite de moitié jusqu'à la fin de son prochain tour. En cas de réussite, dégâts réduits de moitié et Vitesse non réduite." },
      { nom: "Ténèbres", texte: "Les multiples bouches de Hrimgrimnir vomissent des ténèbres. Fonctionne comme le sort ténèbres, centré sur Hrimgrimnir, rayon 18 m." }
    ],
    legendaryActions: [
      { nom: "Détecter", texte: "Hrimgrimnir fait un test de Sagesse (Perception)." },
      { nom: "Maillet d'armes", texte: "Hrimgrimnir effectue une attaque de maillet d'armes." },
      { nom: "Grognement terrifiant (2 actions)", texte: "Les têtes de Hrimgrimnir hurlent. Chaque créature qui l'entend à 18 m ou moins doit réussir un jet de sauvegarde de Sagesse DD 20 ou être terrorisée jusqu'à la fin de son prochain tour." }
    ]
  }),
  npc({
    name: "Jörmungandr", img: "icons/creatures/reptiles/snake-water-swirl-green.webp",
    size: "Gigantesque", type: "Dragon", alignment: "Chaotique Peu honorable",
    ac: 24, hp: 580, hpFormula: "34d12 + 340", movement: { walk: 18, swim: 36, darkvision: 36 },
    abilities: { str: 30, dex: 10, con: 30, int: 7, wis: 10, cha: 11 },
    saves: ["str", "con"], skills: ["prc"],
    damageImmunities: ["acide", "poison"],
    conditionImmunities: ["charmé", "épuisé", "terrorisé", "paralysé", "empoisonné"],
    cr: 25,
    biography: "Jörmungandr (« démon de puissance cosmique »), aussi appelé Miðgarðsormr, est un énorme serpent vivant dans les abysses de la mer de Miðgarðr, si long qu'il peut s'enrouler autour du monde et se mordre la queue. Engeance de Loki et d'Angrboða, il fut jeté dans la mer par Thor, son ennemi juré depuis. <em>Immunisé de plus aux dégâts contondants, perforants et tranchants infligés par des armes non magiques (à configurer manuellement).</em>",
    legendary: true,
    aptitudes: [
      { nom: "Résistance à la magie", texte: "Jörmungandr est avantagé lors des jets de sauvegarde contre les sorts et les effets magiques." },
      { nom: "Résistance légendaire (3/jour)", texte: "Si Jörmungandr rate un jet de sauvegarde, il peut choisir à la place de le réussir." },
      { nom: "Descendance divine", texte: "Les attaques de Jörmungandr sont magiques." }
    ],
    actions: [
      { nom: "Attaques multiples", texte: "Jörmungandr peut utiliser sa présence terrifiante. Il fait ensuite trois attaques : deux attaques de queue et une attaque de morsure. Il peut utiliser l'action engloutir à la place de l'attaque de morsure." },
      { nom: "Queue", texte: "Attaque d'arme au corps à corps : +18 pour toucher, allonge 21 m, une cible. Touché : 42 (6d8+10) dégâts contondants. Si la cible est une créature, elle doit réussir un jet de sauvegarde de Force DD 20 ou se retrouver à terre à 9 m de l'endroit où elle a été touchée." },
      { nom: "Morsure", texte: "Attaque d'arme au corps à corps : +18 pour toucher, allonge 15 m, une cible. Touché : 32 (4d12+10) dégâts perforants plus 21 (6d6) dégâts de poison. Si la cible est une créature, elle doit réussir un jet de sauvegarde de Force DD 20 ou être empoignée et entravée. Jörmungandr ne peut pas mordre une autre cible." },
      { nom: "Engloutir", texte: "Jörmungandr fait une attaque de morsure contre une créature de taille Grande ou inférieure qu'il empoigne. En cas d'attaque réussie, elle est engloutie, l'empoignade prend fin, elle est aveuglée, entravée, bénéficie d'un abri total et subit 58 (15d6) dégâts nécrotiques au début du tour de Jörmungandr. Si Jörmungandr subit 50 dégâts ou plus d'une créature engloutie, il doit réussir un jet de sauvegarde de Constitution DD 20 en fin de tour ou régurgiter toutes les créatures englouties à 9 m ou moins de lui. S'il meurt, une créature engloutie n'est plus entravée et peut sortir avec une vitesse de 15 m en terminant son tour à terre." },
      { nom: "Présence terrifiante", texte: "Toutes les créatures choisies par Jörmungandr, dans un rayon de 36 m et conscientes de sa présence, doivent réussir un jet de sauvegarde de Sagesse DD 20 ou être terrorisées pendant une minute. Une créature peut retenter le jet à la fin de chacun de ses tours (désavantagée si Jörmungandr est dans son champ de vision) et met fin à l'effet en cas de réussite ; elle est alors immunisée contre la présence terrifiante de Jörmungandr pendant 24 h." },
      { nom: "Grognement empoisonné (recharge 5-6)", texte: "Jörmungandr souffle de la bile dans un cône de 36 m. Chaque créature dans la zone doit effectuer un jet de sauvegarde de Constitution DD 21. En cas d'échec, elle subit 80 (20d6) dégâts de poison et est empoisonnée pendant 1 h (moitié des dégâts et pas empoisonnée en cas de réussite)." }
    ],
    legendaryActions: [
      { nom: "Détecter", texte: "Jörmungandr fait un test de Sagesse (Perception)." },
      { nom: "Crachat empoisonné", texte: "Jörmungandr crache une matière visqueuse et empoisonnée sur une créature à 18 m ou moins dans son champ de vision. Elle doit réussir un jet de sauvegarde de Constitution DD 20 ou subir 24 (6d6) dégâts de poison et être empoisonnée pendant 1 h." },
      { nom: "Queue", texte: "Jörmungandr effectue une attaque de queue." }
    ]
  })
];

docs.bestiary.push(...NPCS);

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------

for (const [pack, list] of Object.entries(docs)) {
  const dir = path.join(PACKS_DIR, pack);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const document of list) {
    const file = path.join(dir, `${slugify(document.name)}.json`);
    writeFileSync(file, JSON.stringify(document, null, 2), "utf8");
  }
  console.log(`${pack}: ${list.length} document(s)`);
}
