/** Onglet « Général » : identité, origines, caractéristiques, statistiques dérivées. */

import type { AbilityKey, Character } from "../types.js";
import { ABILITIES, ABILITY_LABELS, ALIGNMENTS, CLASSES, SPECIES } from "../data.js";
import { esc, fmtMod } from "../utils.js";
import { abilityMod, proficiencyBonus } from "../rules.js";
import { store } from "../state.js";

export function renderGeneral(character: Character): string {
  return `<div class="grid-3">
    <div class="col">
      ${identityCard(character)}
      ${originsCard(character)}
    </div>
    <div class="col">
      ${abilitiesCard(character)}
      ${derivedCard(character)}
    </div>
    <div class="col">
      ${portraitCard(character)}
      ${bioCard(character)}
      ${miscCard(character)}
    </div>
  </div>`;
}

/* ------------------------------ Cartes ------------------------------ */

function identityCard(c: Character): string {
  const g = c.general;
  return `<section class="card">
    <h2>Identité</h2>
    <label class="field"><span>Nom</span>
      <input type="text" data-bind="general.name" value="${esc(g.name)}" data-rerender="true"></label>
    <div class="field-row">
      <label class="field"><span>Prénom</span>
        <input type="text" data-bind="general.firstName" value="${esc(g.firstName)}"></label>
      <label class="field"><span>Surnom</span>
        <input type="text" data-bind="general.nickname" value="${esc(g.nickname)}"></label>
    </div>
    <label class="field"><span>Nom du joueur</span>
      <input type="text" data-bind="general.playerName" value="${esc(g.playerName)}"></label>
  </section>`;
}

function originsCard(c: Character): string {
  const g = c.general;
  const classes = g.classes
    .map(
      (k, i) => `<div style="display:grid;grid-template-columns:1fr 84px 32px;gap:6px;margin-bottom:6px">
        <input class="input" type="text" list="classes-list" data-bind="general.classes.${i}.name"
               value="${esc(k.name)}" placeholder="Classe">
        <input class="input" type="number" min="1" max="20" data-bind="general.classes.${i}.level"
               value="${k.level}" data-rerender="true">
        <button class="icon-btn" data-action="remove-class" data-id="${k.id}" title="Retirer">✕</button>
      </div>`
    )
    .join("");

  return `<section class="card">
    <h2>Origines</h2>
    <label class="field"><span>Espèce (race)</span>
      <input type="text" list="species-list" data-bind="general.species" value="${esc(g.species)}"></label>
    <span style="font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase;color:var(--muted);font-weight:600">
      Classe(s) et niveau(x)</span>
    <div style="margin:6px 0 4px">${classes}</div>
    <button class="btn btn-sm" data-action="add-class">＋ Ajouter une classe</button>

    <div class="field-row" style="margin-top:10px">
      <label class="field"><span>Historique</span>
        <input type="text" data-bind="general.background" value="${esc(g.background)}"></label>
      <label class="field"><span>Alignement</span>
        <input type="text" list="alignments-list" data-bind="general.alignment" value="${esc(g.alignment)}"></label>
    </div>

    <datalist id="classes-list">${CLASSES.map((c) => `<option value="${c}">`).join("")}</datalist>
    <datalist id="species-list">${SPECIES.map((s) => `<option value="${s}">`).join("")}</datalist>
    <datalist id="alignments-list">${ALIGNMENTS.map((a) => `<option value="${a}">`).join("")}</datalist>
  </section>`;
}

function abilitiesCard(c: Character): string {
  const rows = ABILITIES.map((key) => {
    const ability = c.general.abilities[key];
    return `<tr>
      <td style="width:42%">${ABILITY_LABELS[key]}</td>
      <td class="num">
        <input type="number" min="1" max="30" data-bind="general.abilities.${key}.score"
               value="${ability.score}" data-rerender="true">
      </td>
      <td class="num" style="font-weight:700;color:var(--accent)">${fmtMod(abilityMod(c, key))}</td>
      <td class="num">
        <input type="checkbox" data-bind="general.abilities.${key}.saveProficiency"
               ${ability.saveProficiency ? "checked" : ""} data-rerender="true"
               style="width:auto" title="Maîtrise du jet de sauvegarde">
      </td>
    </tr>`;
  }).join("");

  return `<section class="card">
    <h2>Caractéristiques principales</h2>
    <table class="table">
      <thead><tr>
        <th>Caractéristique</th><th class="num">Valeur</th><th class="num">Mod.</th><th class="num">JdS</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:var(--muted);margin:8px 0 0">
      Cochez la case « JdS » pour indiquer la maîtrise du jet de sauvegarde.
    </p>
  </section>`;
}

function derivedCard(c: Character): string {
  const k = c.general.combat;
  return `<section class="card">
    <h2>Statistiques dérivées</h2>
    <div class="field-row-3">
      <label class="field"><span>CA</span>
        <input type="number" data-bind="general.combat.ac" value="${k.ac}" data-rerender="true"></label>
      <label class="field"><span>Initiative</span>
        <input type="number" data-bind="general.combat.initiative" value="${k.initiative}" data-rerender="true"></label>
      <label class="field"><span>Vitesse (m)</span>
        <input type="number" data-bind="general.combat.speed" value="${k.speed}" data-rerender="true"></label>
    </div>
    <div class="field-row-3">
      <label class="field"><span>PV max</span>
        <input type="number" data-bind="general.combat.hpMax" value="${k.hpMax}" data-rerender="true"></label>
      <label class="field"><span>PV actuels</span>
        <input type="number" data-bind="general.combat.hpCurrent" value="${k.hpCurrent}" data-rerender="true"></label>
      <label class="field"><span>PV temp.</span>
        <input type="number" data-bind="general.combat.hpTemp" value="${k.hpTemp}" data-rerender="true"></label>
    </div>
    <div class="field-row-3">
      <label class="field"><span>Dés de vie</span>
        <input type="text" data-bind="general.combat.hitDice" value="${esc(k.hitDice)}" placeholder="5d8"></label>
      <label class="field"><span>Bonus maîtrise</span>
        <input type="number" min="2" max="9" data-bind="general.combat.proficiencyBonus"
               value="${proficiencyBonus(c)}" data-rerender="true"></label>
      <label class="field"><span>Perc. passive</span>
        <input type="number" data-bind="general.combat.passivePerception" value="${k.passivePerception}"></label>
    </div>
    <label class="field" style="flex-direction:row;align-items:center;gap:8px">
      <input type="checkbox" data-bind="general.combat.inspiration" ${k.inspiration ? "checked" : ""}
             data-rerender="true" style="width:auto">
      <span style="text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--ink)">Inspiration</span>
    </label>
  </section>`;
}

function portraitCard(c: Character): string {
  const g = c.general;
  return `<section class="card">
    <h2>Image de profil</h2>
    <div style="display:flex;gap:12px;align-items:center">
      <div class="sheet-portrait" style="width:78px;height:96px;flex-basis:78px;font-size:30px">
        ${g.imageBase64 ? `<img src="${g.imageBase64}" alt="">` : `<span>${esc((g.name || "?").charAt(0).toUpperCase())}</span>`}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn btn-sm" data-action="upload-image">Changer l'image</button>
        ${g.imageBase64 ? `<button class="btn btn-sm btn-danger" data-action="remove-image">Retirer</button>` : ""}
      </div>
    </div>
    <input id="portrait-input" type="file" accept="image/*" style="display:none">
  </section>`;
}

function bioCard(c: Character): string {
  const g = c.general;
  return `<section class="card">
    <h2>Données biographiques</h2>
    <div class="field-row">
      <label class="field"><span>Âge</span>
        <input type="text" data-bind="general.age" value="${esc(g.age)}"></label>
      <label class="field"><span>Genre</span>
        <input type="text" data-bind="general.gender" value="${esc(g.gender)}"></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Taille</span>
        <input type="text" data-bind="general.height" value="${esc(g.height)}" placeholder="1,78 m"></label>
      <label class="field"><span>Poids</span>
        <input type="text" data-bind="general.weight" value="${esc(g.weight)}" placeholder="72 kg"></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Yeux</span>
        <input type="text" data-bind="general.eyes" value="${esc(g.eyes)}"></label>
      <label class="field"><span>Cheveux</span>
        <input type="text" data-bind="general.hair" value="${esc(g.hair)}"></label>
    </div>
    <label class="field"><span>Peau</span>
      <input type="text" data-bind="general.skin" value="${esc(g.skin)}"></label>
  </section>`;
}

function miscCard(c: Character): string {
  const g = c.general;
  return `<section class="card">
    <h2>Autres informations</h2>
    <div class="field-row">
      <label class="field"><span>Divinité</span>
        <input type="text" data-bind="general.deity" value="${esc(g.deity)}"></label>
      <label class="field"><span>Langues</span>
        <input type="text" data-bind="general.languages" value="${esc(g.languages)}"></label>
    </div>
    <label class="field"><span>Outils maîtrisés</span>
      <input type="text" data-bind="general.tools" value="${esc(g.tools)}"></label>
    <label class="field"><span>Résistances / immunités</span>
      <input type="text" data-bind="general.resistances" value="${esc(g.resistances)}"></label>
    <label class="field"><span>Sens</span>
      <input type="text" data-bind="general.senses" value="${esc(g.senses)}"></label>
    <label class="field"><span>Notes générales</span>
      <textarea data-bind="general.notes" rows="3">${esc(g.notes)}</textarea></label>
  </section>`;
}
