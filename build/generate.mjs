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

function weapon({ name, img, html, damage, damageType, properties = [], weaponType = "simpleM", price = 0, weight = 1 }) {
  return baseItem({
    name, type: "weapon", img,
    system: {
      description: desc(html),
      identifier: slugify(name),
      source: "Vers le Ragnarök",
      quantity: 1,
      weight: { value: weight, units: "kg" },
      price: { value: price, denomination: "gp" },
      rarity: "",
      type: { value: weaponType, subtype: "" },
      properties,
      proficient: null,
      damage: { base: { number: 1, denomination: damage, bonus: "", types: [damageType], custom: { enabled: false } }, versatile: { number: null, denomination: null, bonus: "", types: [], custom: { enabled: false } } },
      range: { value: null, long: null, reach: null, units: "ft" },
      activities: {}
    }
  });
}

function equipment({ name, img, html, armorValue = null, armorType = "trinket", price = 0, weight = 1 }) {
  const system = {
    description: desc(html),
    identifier: slugify(name),
    source: "Vers le Ragnarök",
    quantity: 1,
    weight: { value: weight, units: "kg" },
    price: { value: price, denomination: "gp" },
    rarity: "",
    type: { value: armorType },
    properties: [],
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
    damage: "d6", damageType: "slashing", properties: ["fin", "lgt", "thr"], weaponType: "simpleM", price: 6, weight: 1
  }),
  weapon({
    name: "Hache d'assaut", img: "icons/weapons/axes/axe-double-worn-steel.webp",
    html: `<p>Hache lourde à deux mains, taillée pour l'assaut plutôt que le travail du bois.</p>`,
    damage: "d8", damageType: "slashing", properties: ["fin"], weaponType: "simpleM", price: 12, weight: 2
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
    damage: "d6", damageType: "bludgeoning", properties: ["hvy", "two"], weaponType: "martialM", price: 0, weight: 4
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
  })
];

// ---------------------------------------------------------------------------
// Content: Historiques (backgrounds)
// ---------------------------------------------------------------------------

const BACKGROUND_IMG = "icons/environment/people/commoner.webp";

const BACKGROUNDS = [
  {
    name: "Bondhi", skills: ["ani", "prc"], tool: null,
    privilege: "Un foyer où revenir",
    privilegeHtml: `<p>En choisissant un lieu à Miðgarðr, votre personnage y possède une maison et une terre (et une famille, si vous le souhaitez). La communauté locale l'apprécie et l'aide dans les moments difficiles.</p>
      <p><em>Variante « hersir » : membre plus influent, participant aux débats du þing. Privilège remplacé par <strong>grande propriété</strong> : +5 po de départ et 2 po/jour récupérables au retour chez soi, au risque d'une usurpation en cas d'absence prolongée.</em></p>`,
    html: `<p><strong>Le paysan libre.</strong> Cultivateur et guerrier occasionnel, propriétaire de son lopin de terre.</p>
      <p><strong>Compétences :</strong> Dressage, Perception. <strong>Outils :</strong> un ensemble d'outils d'artisan au choix.</p>
      <p><strong>Équipement de départ :</strong> habits courants, un ensemble d'outils d'artisan, un bracelet orné d'une rune, une arme courante, un récipient en terre cuite, une sacoche de cuir et 15 po.</p>`
  },
  {
    name: "Gothi", skills: ["asa", "med"], tool: "art",
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
      { level: 2, name: "Sceau d'Algiz", html: `<p>Vous pouvez dépenser un dé de cercle de futhark en réaction pour forcer une créature à relancer un jet d'attaque d'opportunité qu'elle vient de réussir contre une cible se trouvant dans votre cercle.</p>` },
      { level: 7, name: "Cercle de Heimdallr", html: `<p>Les alliés se trouvant dans votre cercle réduisent les dégâts qu'ils subissent d'un montant égal à la moitié de votre modificateur de Sagesse, avant application des résistances et vulnérabilités. En maintenant le cercle par une action bonus, vous pouvez le déplacer de 1,50 m.</p>` },
      { level: 9, name: "Tours de magie de Heimdallr", html: `<p>Les tours de magie <em>rayon de givre</em> et <em>résistance</em> s'ajoutent à votre liste de tours de magie runiques (voir Incantation runique).</p>` },
      { level: 11, name: "Vigilance d'Eihwaz", html: `<p>Vous et votre marqué n'avez besoin que d'une heure de sommeil lors d'un repos long pour être considérés comme reposés, et pouvez consacrer le reste du temps à des activités mineures. Vous êtes tous deux avantagés aux tests de Sagesse (Perception).</p>` }
    ]
  },
  {
    name: "Ætt de Freyja", theme: "l'abondance, la guérison et la prospérité", img: "icons/magic/life/heart-cross-strong-flame-purple.webp",
    features: [
      { level: 2, name: "Bénédiction d'Ansuz", html: `<p>Par une action, vous pouvez dépenser un dé de cercle de futhark pour soigner une créature se trouvant dans votre cercle d'un nombre de points de vie égal au résultat du dé plus votre modificateur de Sagesse.</p>` },
      { level: 7, name: "Cercle de Freyja", html: `<p>Les alliés se trouvant dans votre cercle sont avantagés aux jets de sauvegarde contre la mort ; un allié récupère 1 point de vie s'il obtient 19 ou 20 à ce jet. En maintenant le cercle par une action bonus, vous pouvez augmenter son rayon de 1,50 m, jusqu'à un maximum de 9 m.</p>` },
      { level: 9, name: "Tours de magie de Freyja", html: `<p>Les tours de magie <em>lumières dansantes</em> et <em>réparation</em> s'ajoutent à votre liste de tours de magie runiques (voir Incantation runique).</p>` },
      { level: 11, name: "Confiance de Wunjo", html: `<p>Vous et votre marqué pouvez effectuer l'action Aider par le biais d'une action bonus.</p>` }
    ]
  },
  {
    name: "Ætt de Týr", theme: "la justice et le châtiment", img: "icons/magic/lightning/bolt-strike-sky-blue.webp",
    features: [
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
        { name: "Rituel de l'offrande honorable", html: `<p>Lors d'un repos long, vous pouvez vous infliger un nombre de blessures permanentes égal à votre modificateur de Sagesse (œil, oreille, membre… à l'appréciation du MJ) ; chaque blessure offerte accorde un avantage durable (chance, endurance ou savoir) jusqu'au prochain repos long.</p>` },
        { name: "Maîtrise supplémentaire", html: `<p>Vous gagnez la maîtrise des armures lourdes.</p>` },
        { name: "Balafres sacrées", html: `<p>Quand vous êtes touché alors que vous n'êtes pas à vos points de vie maximum (et sans PV temporaires), vous gagnez des points de vie temporaires égaux à votre modificateur de Charisme.</p>` }
      ] },
      { level: 2, features: [{ name: "Canalisation d'énergie divine", html: `<p>Vous gagnez deux options de canalisation d'énergie divine, en plus de celles offertes par votre classe.</p>
        <p><strong>Contrepoids au combat.</strong> Modifiez de ±1d4 un jet d'attaque (le vôtre, celui d'un allié ou d'un ennemi), après avoir vu le résultat mais avant de savoir s'il touche (jet de sauvegarde de Charisme pour un ennemi).</p>
        <p><strong>Vigueur surnaturelle.</strong> Dépensez 10 points de vie de vos sorts de soin plus une utilisation de canalisation pour retirer un niveau d'épuisement.</p>` }] },
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
      { level: 1, features: [{ name: "Fils de Jötunheimr", html: `<p>Quand vous épuisez tous vos emplacements de sort d'un niveau donné, vous vous transformez pendant 1 minute : vous récupérez des points de vie égaux au niveau de l'emplacement plus votre niveau de personnage (le triple en points de vie temporaires), gagnez une résistance au froid, et une attaque de contact glacial (1d6 + Charisme + niveau de l'emplacement, jusqu'à 4d6 au niveau 17). Se recharge par niveau d'emplacement à un repos long.</p>` }] },
      { level: 6, features: [{ name: "Peau du froid éternel", html: `<p>En réaction, pour 2 points de sorcellerie, quand vous êtes touché en mêlée vous neutralisez ou ralentissez votre attaquant (jet de sauvegarde de Dextérité).</p>` }] },
      { level: 14, features: [{ name: "Cœur gelé", html: `<p>Vous êtes avantagé contre l'intimidation, être charmé et être terrorisé.</p>` }] },
      { level: 18, features: [{ name: "Les os d'Ymir", html: `<p>Vous déclenchez une tempête de neige en rayon 750 m ; en rayon 9 m, dégâts de froid égaux à votre niveau d'emplacement plus Charisme et invocation d'élémentaires de la glace. Dure 1 minute, un repos long est nécessaire pour réutiliser cette aptitude.</p>` }] }
    ]
  },
  {
    name: "Archétype martial : Gardien", classIdentifier: "fighter", img: "icons/equipment/shield/heater-crest-cross-blue.webp",
    theme: `<p>Le protecteur de la ligne, bouclier levé pour les autres plutôt que pour lui-même — la « vierge au bouclier » en est une incarnation narrative.</p>`,
    levels: [
      { level: 3, features: [{ name: "Tactiques du gardien", html: `<p>Choisissez deux tactiques parmi : <strong>Interposer</strong>, <strong>Tir préventif</strong>, <strong>Double réaction</strong>, <strong>Violentes représailles</strong>, <strong>Mur de bouclier</strong>.</p>` }] },
      { level: 7, features: [{ name: "Porteur de bouclier", html: `<p>Vous pouvez changer d'arme ou de bouclier librement, et accorder +1 à la classe d'armure d'un allié adjacent.</p>` }] },
      { level: 10, features: [{ name: "Tactiques améliorées", html: `<p>Choisissez deux tactiques supplémentaires parmi : <strong>Double réaction améliorée</strong>, <strong>Frappe revigorante</strong>, <strong>Posture de protection</strong>, <strong>Riposte puissante</strong>.</p>` }] },
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
        { name: "Monde du savoir", html: `<p>Vous pouvez oublier un sort préparé de niveau 2 ou plus pour apprendre temporairement (8 heures) un sort proposé par le MJ ; 3 utilisations, une minute de récupération entre chaque, repos long pour tout récupérer.</p>` }
      ] },
      { level: 10, features: [
        { name: "Premières impressions", html: `<p>Vous êtes avantagé au premier test social avec un inconnu.</p>` },
        { name: "Magie persistante", html: `<p>En réaction, après avoir subi au moins 10 dégâts, améliorez d'un niveau un emplacement de sort du même type d'énergie.</p>` }
      ] },
      { level: 14, features: [
        { name: "Créer des liens", html: `<p>Vous pouvez effacer ou renforcer le souvenir de vous chez une créature (jet de sauvegarde de Charisme).</p>` },
        { name: "Liens partagés", html: `<p>Si une cible rate une sauvegarde contre l'un de vos sorts, elle ne peut plus lancer de sorts ni bénéficier d'objets magiques jusqu'à son prochain tour ; 3 fois par repos long.</p>` }
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
      { level: 6, features: [{ name: "Lancer destructeur", html: `<p>Pour 1 point de ki, vous pouvez lancer un objet ou une créature que vous tenez (jusqu'à taille Grande) comme une arme de jet (portée 3 m/9 m).</p>` }] },
      { level: 11, features: [{ name: "Poigne de fer", html: `<p>Pour 2 points de ki, vous réussissez automatiquement un test d'empoignade que vous étiez sur le point de perdre, au prix de quelques dégâts.</p>` }] },
      { level: 17, features: [{ name: "Victoire éclair", html: `<p>Pour 4 points de ki, vous tentez une empoignade avant même le jet d'initiative, avec avantage, et pouvez utiliser Lancer destructeur par une action bonus.</p>` }] }
    ]
  },
  {
    name: "Serment de l'élu", classIdentifier: "paladin", img: "icons/magic/holy/angel-winged-humanoid-blue.webp",
    theme: `<p>Honneur au combat, position à faire respecter, et générosité rendue au centuple : les préceptes de l'Élu.</p>`,
    levels: [
      { level: 3, features: [{ name: "Canalisation d'énergie divine", html: `<p>Vous gagnez deux options de canalisation d'énergie divine, en plus de celles offertes par votre classe.</p>
        <p><strong>Contrepoids au combat.</strong> Modifiez de ±1d4 un jet d'attaque après en avoir vu le résultat (jet de sauvegarde de Charisme pour un ennemi).</p>
        <p><strong>Vigueur surnaturelle.</strong> Dépensez 10 points de vie de vos sorts de soin plus une utilisation de canalisation pour retirer un niveau d'épuisement.</p>` }] },
      { level: 7, features: [
        { name: "Aura de vaillance", html: `<p>Après une sauvegarde réussie, vous et les alliés à 6 m (12 m au niveau 18) êtes avantagés à votre prochain test ou attaque.</p>` },
        { name: "Festin d'Odhinn", html: `<p>Une boisson alcoolisée vous nourrit comme un repas complet.</p>` }
      ] },
      { level: 15, features: [{ name: "Récupération du fidèle", html: `<p>En réaction, en tombant à 0 point de vie, vous pouvez vous imposer les mains à vous-même.</p>` }] },
      { level: 20, features: [{ name: "Valkyrja, l'Einherji", html: `<p>Vous n'avez plus besoin de boire ni de manger. Une fois par repos long, vous vous transformez pendant 1 minute : vous n'avez pas besoin de respirer, êtes immunisé aux sorts de Sagesse et de Charisme, et pouvez vous téléporter et attaquer ou lancer un sort en bonus si une créature meurt dans votre aura.</p>` }] }
    ]
  },
  {
    name: "Meute de loups", classIdentifier: "ranger", img: "icons/creatures/mammals/wolf-howl-moon-blue.webp",
    theme: `<p>Le rôdeur chasse et combat comme un membre à part entière d'une meute de loups.</p>`,
    levels: [
      { level: 3, features: [{ name: "Guerrier de la meute de loups", html: `<p>Une attaque de mêlée réussie donne l'avantage à la prochaine attaque d'un allié contre la même cible. Une attaque à distance réussie désavantage les attaques d'opportunité de la cible. En réaction, quand un allié est blessé, vous pouvez hurler pour infliger 1d6 dégâts psychiques.</p>` }] },
      { level: 7, features: [{ name: "Chef de la meute de loups", html: `<p>Vous avez un sens de l'orientation aiguisé. Vous voyagez discrètement à vitesse normale, ou sans malus à la perception passive du groupe (pas les deux à la fois). En réaction, vous pouvez déplacer vous-même ou un allié de 3 m quand un ennemi se déplace (communication requise).</p>` }] },
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
        { name: "Cruelles blessures", html: `<p>Après une attaque sournoise, la vitesse de la cible est réduite de moitié et ses attaques d'opportunité sont désavantagées ; si un ennemi réussit une sauvegarde contre un de vos sorts de méthode, il subit des dégâts psychiques (1d4 par dé d'attaque sournoise).</p>` }
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
        { name: "Rancœur", html: `<p>Sans armure, votre classe d'armure est égale à 13 + Dextérité. En réaction, une attaque de mêlée reçue vous inflige des dégâts de force égaux à votre modificateur de Charisme (+1d8 au niveau 5, +2d8 au niveau 11, +3d8 au niveau 17) à votre agresseur.</p>` },
        { name: "Méchanceté éternelle", html: `<p>Vous récupérez 1 point de vie chaque fois qu'un dé de dégâts de l'un de vos sorts ou tours de magie tombe sur 1 ; cet effet s'étend à votre arme de pacte ou à votre familier selon le pacte choisi.</p>` }
      ] },
      { level: 6, features: [{ name: "Implacable", html: `<p>Les attaques d'opportunité contre vous sont désavantagées, vous relever ne coûte que 1,50 m de mouvement, et votre vitesse n'est jamais réduite (l'entrave et la paralysie restent possibles).</p>` }] },
      { level: 10, features: [{ name: "Dernier assaut", html: `<p>En réaction, à 0 point de vie, vous pouvez lancer un sort ou effectuer une attaque.</p>` }] },
      { level: 14, features: [{ name: "Dévoreur de vie", html: `<p>Vous « dévorez » un attaquant qui vous a touché : il est entravé ou neutralisé ; en cas d'échec à une sauvegarde de Force, il subit 3d10 dégâts d'acide. Un repos long est nécessaire pour réutiliser cette aptitude.</p>` }] }
    ]
  },
  {
    name: "Les Nornes", classIdentifier: "warlock", img: "icons/magic/divination/crystal-ball-blue.webp",
    theme: `<p>Un pacte avec les trois Nornes — Urðr, Verðandi et Skuld — tisseuses du destin des hommes et des dieux.</p>`,
    levels: [
      { level: 1, features: [{ name: "Urðr, Verðandi et Skuld", html: `<p>En réaction, vous pouvez modifier de ±1d6 un jet (attaque, test ou sauvegarde) d'une créature visible. Une utilisation par catégorie de créature (humanoïde/mort-vivant/bête ; aberration/géant/monstrueuse ; céleste/dragon/élémentaire/fiélon), rechargée à un repos court ou long.</p>` }] },
      { level: 6, features: [{ name: "De l'argile pour les affaiblis", html: `<p>Vous retirez un état (aveuglé, charmé, assourdi, paralysé, pétrifié ou empoisonné) et accordez l'immunité à cet état pendant 1 minute. Rechargé à un repos court ou long.</p>` }] },
      { level: 10, features: [{ name: "Briser Gungnir", html: `<p>Vous redirigez une attaque à distance réussie contre vous vers une autre cible (jet d'attaque de sort opposé). Une minute de récupération.</p>` }] },
      { level: 14, features: [{ name: "Tisser votre propre destin", html: `<p>Tout test, attaque ou sauvegarde obtenant 3 ou moins doit être relancé.</p>` }] }
    ]
  }
];

// ---------------------------------------------------------------------------
// Build documents
// ---------------------------------------------------------------------------

const docs = { classes: [], features: [], backgrounds: [], equipment: [], journals: [], tables: [], macros: [] };

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

const RUNES = {
  "Ætt de Freyja": [
    ["Fehu", "Fortune, succès mérité", "jalousie, envie", "+1 aux tests de caractéristique ; un 20 naturel est toujours un succès.", "−1 aux tests de caractéristique ; un 1 naturel est toujours un échec."],
    ["Ūruz", "Force brute, vitalité", "faiblesse", ""],
    ["Thurisaz", "Conflit, force réactive", "danger, agression subie", ""],
    ["Ansuz", "Message, inspiration divine", "malentendu", ""],
    ["Raido", "Voyage, mouvement juste", "stagnation", ""],
    ["Kenaz", "Torche, savoir-faire", "instabilité", ""],
    ["Gebo", "Don, échange, partenariat", ""],
    ["Wunjo", "Gloire, harmonie", "dépression, solitude, pessimisme", "Quand vous faites un jet de sauvegarde, vous pouvez utiliser le bonus d'un allié adjacent s'il est supérieur au vôtre.", "Quand vous faites un jet de sauvegarde, vous devez utiliser le bonus d'un allié adjacent s'il est inférieur au vôtre."]
  ],
  "Ætt de Heimdallr": [
    ["Hagalaz", "Grêle, perturbation", ""],
    ["Nauthiz", "Besoin, contrainte", ""],
    ["Isaz", "Glace, immobilité", ""],
    ["Jera", "Récolte, cycle accompli", ""],
    ["Eihwaz", "L'if, endurance", ""],
    ["Perth", "Mystère, destin caché", ""],
    ["Algiz", "Protection, défense", ""],
    ["Sowilo", "Soleil, victoire", ""]
  ],
  "Ætt de Týr": [
    ["Teiwaz", "Harmonie des opposés (présidée par Sleipnir)", "précipitation, inhibition, désaccord", "", "Effet négatif supérieur : pour chaque dé de vie dépensé, vous gagnez un bonus au jet d'initiative égal à votre modificateur de Sagesse (1 au minimum)."],
    ["Berkana", "Fertilité, amour (présidée par Frigg)", "immaturité, anxiété, abandon", "Action : soignez chaque créature à 3 m ou moins de vous (vous y compris) de 1d6 + votre modificateur de Charisme, jusqu'à la moitié de votre maximum de points de vie. Un repos court recharge ce pouvoir.", "Action bonus : dépensez et lancez un dé de vie comme lors d'un repos court, mais le résultat est réduit de moitié."],
    ["Ehwaz", "Amélioration, coopération, union (présidée par Sleipnir)", "précipitation, inhibition, désaccord", "Lors d'un repos court, vous et jusqu'à six alliés pouvez méditer ensemble une heure : chaque dé de vie dépensé rend des points de vie supplémentaires égaux à votre modificateur de Sagesse à un allié, et vous récupérez des points de vie supplémentaires égaux au nombre de participants.", "Pour chaque dé de vie dépensé, vous gagnez un bonus au jet d'initiative égal à votre modificateur de Sagesse (1 au minimum)."],
    ["Mannaz", "L'homme cosmique (présidée par Heimdallr)", "préjudice, rigidité, fanatisme", "Quand vous faites un jet de sauvegarde contre un effet invisible, vous pouvez utiliser votre réaction pour être avantagé au jet (un repos court est requis pour réutiliser ce pouvoir).", "Chaque fois que vous infligez des dégâts à une cible dont les points de vie actuels sont supérieurs aux vôtres, vous infligez 1 dégât supplémentaire du même type (2 au niveau 11, 3 au niveau 20). Vous ne pouvez pas terminer votre tour à 6 m ou moins d'une telle créature."],
    ["Laguz", "Le puits du savoir (présidée par Mimir)", "manque de créativité, confusion, peur", "Vous pouvez lancer <em>augure</em> en rituel sans composant matériel (à partir du niveau 11, <em>divination</em>).", "Au début de chaque combat, vous êtes terrorisé par toutes les créatures hostiles perçues, jusqu'au début de votre deuxième tour."],
    ["Ingwaz", "L'avenir de la lignée (présidée par Freyr)", "", "Action bonus : dépensez et lancez un dé de vie pour soigner un nombre de points de vie égal au résultat plus votre modificateur de Charisme (1 au minimum), divisé entre toute créature à 3 m ou moins de vous. Vous gagnez des points de vie temporaires égaux à la moitié du montant soigné."],
    ["Othila", "L'honneur des ancêtres (présidée par Njörðr)", "esclavage, racisme, avidité", "Quand vous faites un jet d'attaque ou un test de caractéristique avec avantage, vous pouvez relancer le dé le moins bon (le nouveau résultat est gardé). Un repos court est requis pour réutiliser ce pouvoir."],
    ["Dagaz", "La nouvelle ère (présidée par Dagr)", "", "Quand cette rune est tirée, vous récupérez tous vos points de vie et gagnez des points de vie temporaires égaux à la moitié de votre maximum."]
  ]
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
  const rows = runes.map(([name, up, down = "", eff = "", effInv = ""]) => `
    <h3>${name}</h3>
    <p><strong>À l'endroit :</strong> ${up}${down ? ` — <strong>À l'envers :</strong> ${down}` : ""}</p>
    ${eff ? `<p><em>Effet :</em> ${eff}</p>` : ""}
    ${effInv ? `<p><em>Effet inverse :</em> ${effInv}</p>` : ""}
  `).join("\n");
  journalPages.push({
    _id: sid("rune-page-" + aett),
    name: aett,
    type: "text",
    title: { show: true, level: 1 },
    text: { format: 1, content: `<p>Huit runes du Futhark ancien.</p>${rows}
      <p style="opacity:.7"><em>Mots-clés et effets tels que retranscrits dans Vers le Ragnarök, p. 308 à 319 ; en cas de doute, référez-vous au livre.</em></p>` },
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
    results: runes.map((r, i) => tableResult(tid, i + 1, r[0], [i + 1, i + 1])),
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
