# Vers le Ragnarök — module Foundry VTT (pour le système dnd5e)

Module de contenu (non officiel) pour jouer *Vers le Ragnarök* (Journey to Ragnarok, Mana Project Studio /
Black Book Éditions) et son supplément *Battle Beyond the Sea* avec le système **dnd5e** de Foundry VTT.
Il ne remplace pas dnd5e : il vient s'y greffer.

Ciblé pour Foundry **v12 à v14**, avec le système **dnd5e 4.0 ou supérieur**.

## Contenu

- **Compendium Classes & archétypes nordiques** — la classe *Maître des runes* (progression complète niveau
  1 à 20, cercle de futhark, incantation runique…) et ses trois sous-classes (ættir de Freyja, Heimdallr et
  Týr), plus les **12 archétypes nordiques** des classes standards de la 5e, chacun comme une vraie
  sous-classe attachable dans Foundry : Voie de l'orageur (Barbare), Collège de Valhalla (Barde), Domaine
  du sacrifice (Clerc), Cercle d'Yggdrasill (Druide), Origine jötunn (Ensorceleur), Archétype martial :
  Gardien (Guerrier), École du vagabond (Magicien), Voie de la glíma (Moine), Serment de l'élu (Paladin),
  Meute de loups (Rôdeur), L'informe (Roublard), et les deux protecteurs d'outre-monde du Sorcier — Celui
  qui apporte l'apocalypse et Les Nornes.
- **Compendium Fonctionnalités** — les 6 clans de Miðgarðr (fiches culturelles), les 8 aptitudes de
  privilège d'historique, les 8 aptitudes de classe du Maître des runes, les 12 aptitudes d'ætt, et les
  aptitudes de niveau des 12 archétypes nordiques ci-dessus.
- **Compendium Historiques** — les 8 historiques du livre de base (Bondhi, Gothi, Huscarl, Jarlr,
  Skógarmaðr, Thrallr, Vaeringhi, Vikingr) plus le **Skipasmidhr** (charpentier de marine, tiré de *Battle
  Beyond the Sea*), avec compétences, outils et équipement de départ décrit dans leur description.
- **Compendium Équipement nordique** — les deux armes nordiques (hache à barbe courte, hache d'assaut),
  les 6 objets signature de clan, et deux navires (**Karve**, **Snekkja**) avec leurs statistiques
  complètes (points d'intégrité, équipage, coût, vitesse).
- **Compendium Objets magiques légendaires** — les 19 objets nommés de l'annexe du livre de base : Mjöllnir
  (le marteau de Thor), Gungnir (la lance d'Odhinn), Draupnir, Skíðblaðnir (le bateau de Freyr), Týrfing,
  Svalinn, Gramr, Skofnung, l'anneau maudit d'Andvari (Andvaranautr), la cape de Freyja, et 9 autres,
  plus 4 objets tirés de *Battle Beyond the Sea* : Dyrnwyn, la Main de justice, le Pendentif de quartz
  solaire et l'Orbe murmurant — rareté, harmonisation et règles complètes (bonus, malédictions) telles
  que décrites dans les livres.
- **Compendium Bestiaire du Ragnarök** — 5 fiches de créature complètes (caractéristiques, PV, CA,
  résistances, aptitudes, actions et actions légendaires) pour les grandes figures du chapitre final :
  Fenrir, Jörmungandr, Sköll, Hati et Hrimgrimnir.
- **Compendium Grimoire runique, guide & navigation** — trois journaux : un guide de création de personnage
  en 7 étapes, le grimoire runique complet (mécanisme de tirage + les 24 runes du Futhark classées par
  ætt, avec leur divinité, leur effet d'ætt et leur effet mécanique complet à l'endroit comme à l'envers),
  et les **règles de navigation** de *Battle Beyond the Sea* (rôles à bord, tour de navigation, DD de
  traversée, points d'intégrité des navires, nourriture et eau).
- **Compendium Tables de divination & rencontres** — 4 tables de jet pour la divination runique (ætt d6,
  puis rune d8 par ætt) et 3 tables de **rencontres aléatoires régionales** (Jutland continental, Frankland,
  Midgardr en haute mer), tirées de *Battle Beyond the Sea* et rejouant le même mécanisme ætt/sens que la
  divination runique.
- **Compendium Macros** — *Tirer une rune (Vers le Ragnarök)* : automatise le tirage complet (ætt, rune,
  sens) et poste un message de chat.
- **Compétence Ásatrú** — ajoutée automatiquement à la liste des compétences (liée à la Sagesse) sur toutes
  les fiches de personnage dès que le module est actif, avec sa propre valeur passive.
- **Thème visuel nordique** — reskin complet de la fiche de personnage (uniquement les fiches d'Acteur de
  type personnage joueur, aucune autre fiche n'est touchée) : palette braise/bronze sur fond de fer sombre,
  typographies runiques et gravées, bordures et arrière-plans thématiques. Activé automatiquement, aucun
  réglage requis.

## Installation

Ce module n'est pas hébergé publiquement : installez-le en copiant son dossier directement dans vos
données Foundry.

1. Repérez votre dossier de données Foundry (`Data/`), généralement affiché en bas de l'écran d'accueil de
   Foundry, ou dans `%localappdata%/FoundryVTT/Data` sous Windows.
2. Copiez tout le dossier `foundry-vers-le-ragnarok` dans `Data/modules/`, en le renommant `vers-le-ragnarok`.
3. Relancez Foundry (ou rafraîchissez la liste des modules).
4. Dans votre monde (qui doit utiliser le système **dnd5e**), ouvrez *Paramètres de partie* → *Gérer les
   modules*, cochez **Vers le Ragnarök**, puis relancez le monde.
5. Les compendiums apparaissent dans l'onglet Compendiums, préfixés « VLR — ».

## Utilisation

- **Créer un personnage** : ouvrez le journal *Guide rapide de création* (compendium Grimoire runique &
  guide) pour les 7 étapes. Glissez le clan choisi (compendium Fonctionnalités) et l'historique choisi
  (compendium Historiques) sur la fiche ; glissez la classe *Maître des runes* (ou une classe standard de
  dnd5e) depuis vos compendiums habituels.
- **Ásatrú** apparaît directement dans la liste de compétences de la fiche de personnage dès que le module
  est actif — aucune manipulation supplémentaire n'est nécessaire.
- **Dévotion runique** : réglez l'Ætt et la rune personnelle du personnage directement sur sa fiche, dans
  l'onglet *Détails* (bloc « Dévotion runique », sous le type de créature et l'historique). Ce choix est
  enregistré sur le personnage — la macro *Tirer une rune* le relit automatiquement à chaque tirage pour
  indiquer qui est concerné (et si c'est sa rune personnelle, effet doublé).
- **Objets de clan** : glissez l'objet correspondant au clan du personnage (compendium Équipement nordique)
  quand il l'a mérité en jeu.

## Choix de conception (et limites connues)

- **Le bestiaire** donne des fiches de créature entièrement jouables (caractéristiques, PV, CA, résistances,
  immunités, aptitudes et actions en texte complet), mais les actions ne sont pas câblées comme des
  « activités » dnd5e cliquables (pas de bouton auto-jet d'attaque/dégâts) — la MJ lit et lance les
  attaques manuellement à partir du texte fourni, exactement comme pour les autres aptitudes du module.
  Par ailleurs, l'immunité aux dégâts contondants/perforants/tranchants *infligés par des armes non
  magiques* (une nuance courante des monstres de haut niveau) n'est pas automatisée dans les résistances
  de la fiche — elle est rappelée dans la biographie de chaque créature, à appliquer manuellement.
- **Le bloc « Dévotion runique »** (`scripts/vers-le-ragnarok.js`) est injecté dans l'onglet Détails de la
  fiche via le hook `renderCharacterActorSheet`, et stocke l'Ætt et la rune sous forme de flags sur
  l'Acteur (`flags.vers-le-ragnarok.aett` / `.rune`) — c'est la technique standard pour ajouter un champ à
  une fiche dnd5e sans modifier le système. Comme pour le thème visuel, je n'ai pas pu vérifier en direct
  que le nom de hook est le bon pour votre version exacte de dnd5e ; si le bloc n'apparaît pas du tout,
  dites-le, je l'ajusterai en fonction de la version installée.
- **Le thème visuel** (`styles/vers-le-ragnarok.css`) fonctionne en redéfinissant les variables CSS que le
  système dnd5e expose déjà pour son propre thème clair/sombre (`--dnd5e-color-*`, `--color-text-*`,
  `--dnd5e-border-*`…), plutôt qu'en réécrivant sa mise en page. C'est l'approche la plus robuste aux mises
  à jour du système : si dnd5e renomme une variable, ce détail cesse simplement de se redessiner (pas de
  fiche cassée) — mais je n'ai pas pu vérifier son rendu dans un Foundry réel. Pour le désactiver sans
  désinstaller le module, videz le tableau `"styles"` dans `module.json` ou supprimez la ligne
  correspondante.
- **Les clans n'ont pas de bonus de caractéristique** : c'est fidèle au livre, qui les traite comme une
  appartenance culturelle et recommande de jouer des personnages humains.
- Les bonus mécaniques décrits dans le livre pour les objets de clan (avantage à tel test tant que l'objet
  est en main, etc.) sont indiqués dans la **description** de chaque objet plutôt qu'automatisés par un
  effet actif — à appliquer manuellement en jeu, comme la plupart du contenu homebrew.
- **Le Karve et le Snekkja** sont représentés comme des objets d'équipement à statistiques descriptives
  (longueur, coût, points d'intégrité, équipage), et non comme des Acteurs de type Véhicule : dnd5e gère
  les véhicules avec un schéma d'acteur dédié (cargaison, actions d'équipage, etc.) qui ne correspond pas
  au concept de « points d'intégrité » de *Battle Beyond the Sea* ; plutôt que de forcer une conversion
  incertaine, les points d'intégrité, l'équipage et les règles de réparation par un Skipasmidhr sont
  documentés en toutes lettres dans l'objet et dans le journal *Règles de navigation*, à suivre
  manuellement par la table — comme pour le bestiaire, aucun automatisme de dégâts/PV n'est câblé.
- Les **listes de sorts par ætt** (Maître des runes) sont données en toutes lettres dans la description de
  chaque sous-classe plutôt que liées objet par objet au compendium de sorts du SRD, pour éviter toute
  référence cassée vers des sorts qui ne sont pas fournis par ce module.
- La maîtrise des **outils de graveur de runes** (Maître des runes) et de certains outils d'historiques
  n'est pas reliée au système de maîtrises de dnd5e quand aucun outil correspondant n'existe nativement ;
  elle reste mentionnée en texte dans la description de l'objet ou de la classe.
- Ce module a été construit et validé hors ligne : le script `build/generate.mjs` produit les fichiers
  sources, compilés en compendiums LevelDB avec l'outil officiel `@foundryvtt/foundryvtt-cli`, et un
  aller-retour de compilation/décompilation a confirmé l'intégrité des 178 documents. Il n'a en revanche
  pas pu être testé dans une session Foundry réelle — si un document refuse de s'importer ou qu'une
  fonctionnalité ne s'affiche pas comme prévu, dites-le : c'est réparable rapidement une fois le symptôme
  connu.

## Pour les mainteneurs : reconstruire les compendiums

Tout le contenu est généré depuis un seul script, `build/generate.mjs` — c'est la source de vérité ; ne
modifiez pas les fichiers dans `packs-source/*` à la main sans regénérer, ou vos changements seront écrasés.
Le dossier `packs/` ne contient que les compendiums compilés (LevelDB) réellement chargés par Foundry.

```bash
npm install @foundryvtt/foundryvtt-cli   # une fois
node build/generate.mjs                   # régénère packs-source/*/*.json

# puis, pour chaque pack (adapter le type : Item / JournalEntry / RollTable / Macro) :
npx fvtt package pack --type Module --id vers-le-ragnarok \
  -n classes -t Item --in packs-source/classes --out packs
```

## Source

Basé sur *Vers le Ragnarök* (*Journey to Ragnarok*) et son supplément *Journey to Ragnarok: Battle Beyond
the Sea*, © Mana Project Studio 2022, édition française Black Book Éditions. Module de contenu non
officiel, réalisé pour l'usage personnel de table.
