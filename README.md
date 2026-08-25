# Vers le Ragnarök — module Foundry VTT (pour le système dnd5e)

Module de contenu (non officiel) pour jouer *Vers le Ragnarök* (Journey to Ragnarok, Mana Project Studio /
Black Book Éditions) avec le système **dnd5e** de Foundry VTT. Il ne remplace pas dnd5e : il vient s'y greffer.

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
- **Compendium Historiques** — les 8 historiques (Bondhi, Gothi, Huscarl, Jarlr, Skógarmaðr, Thrallr,
  Vaeringhi, Vikingr), avec compétences, outils et équipement de départ décrit dans leur description.
- **Compendium Équipement nordique** — les deux armes nordiques (hache à barbe courte, hache d'assaut) et
  les 6 objets signature de clan.
- **Compendium Grimoire runique & guide** — deux journaux : un guide de création de personnage en 7 étapes,
  et le grimoire runique (mécanisme de tirage + les 24 runes du Futhark classées par ætt).
- **Compendium Tables de divination runique** — 4 tables de jet (ætt d6, puis rune d8 par ætt).
- **Compendium Macros** — *Tirer une rune (Vers le Ragnarök)* : automatise le tirage complet (ætt, rune,
  sens) et poste un message de chat.
- **Compétence Ásatrú** — ajoutée automatiquement à la liste des compétences (liée à la Sagesse) sur toutes
  les fiches de personnage dès que le module est actif, avec sa propre valeur passive.

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
- **Dévotion runique** : le choix d'une rune personnelle est purement narratif (voir le Grimoire runique) ;
  notez-la dans la biographie du personnage, ou utilisez la macro pour un tirage en cours de partie.
- **Objets de clan** : glissez l'objet correspondant au clan du personnage (compendium Équipement nordique)
  quand il l'a mérité en jeu.

## Choix de conception (et limites connues)

- **Les clans n'ont pas de bonus de caractéristique** : c'est fidèle au livre, qui les traite comme une
  appartenance culturelle et recommande de jouer des personnages humains.
- Les bonus mécaniques décrits dans le livre pour les objets de clan (avantage à tel test tant que l'objet
  est en main, etc.) sont indiqués dans la **description** de chaque objet plutôt qu'automatisés par un
  effet actif — à appliquer manuellement en jeu, comme la plupart du contenu homebrew.
- Les **listes de sorts par ætt** (Maître des runes) sont données en toutes lettres dans la description de
  chaque sous-classe plutôt que liées objet par objet au compendium de sorts du SRD, pour éviter toute
  référence cassée vers des sorts qui ne sont pas fournis par ce module.
- La maîtrise des **outils de graveur de runes** (Maître des runes) et de certains outils d'historiques
  n'est pas reliée au système de maîtrises de dnd5e quand aucun outil correspondant n'existe nativement ;
  elle reste mentionnée en texte dans la description de l'objet ou de la classe.
- Ce module a été construit et validé hors ligne : le script `build/generate.mjs` produit les fichiers
  sources, compilés en compendiums LevelDB avec l'outil officiel `@foundryvtt/foundryvtt-cli`, et un
  aller-retour de compilation/décompilation a confirmé l'intégrité des 61 documents. Il n'a en revanche
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

Basé sur *Vers le Ragnarök* (*Journey to Ragnarok*), © Mana Project Studio 2022, édition française Black
Book Éditions. Module de contenu non officiel, réalisé pour l'usage personnel de table.
