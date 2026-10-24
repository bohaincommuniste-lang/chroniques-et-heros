/** Onglet « Inventaire » : objets, armes, monnaie, capacité de charge. */

import type { Character, InventoryItem, ItemCategory, Weapon } from "../types.js";
import { ITEM_CATEGORIES } from "../data.js";
import { carriesCapacityKg, inventoryWeight } from "../rules.js";
import { esc, fmtMod, uid } from "../utils.js";
import { store } from "../state.js";
import { closeModal, collectFields, modalRoot, openModal, progressBar, textField, toast, emptyState } from "../ui.js";
import { renderApp } from "../app.js";

export const INVENTORY_UI = {
  tab: "Tout" as "Tout" | ItemCategory | "Armes",
  selectedItemId: null as string | null,
  selectedWeaponId: null as string | null,
};

export function renderInventory(c: Character): string {
  const tabs: (typeof INVENTORY_UI.tab)[] = ["Tout", "armes", "armures", "consommables", "autres"] as never;
  const tabDefs: { id: typeof INVENTORY_UI.tab; label: string }[] = [
    { id: "Tout", label: "Tout" },
    { id: "Armes", label: "Armes" },
    { id: "armure", label: "Armures" },
    { id: "consommable", label: "Consommables" },
    { id: "divers", label: "Autres" },
  ];

  const tabsHtml = tabDefs
    .map(
      (t) =>
        `<button class="tab${INVENTORY_UI.tab === t.id ? " active" : ""}" data-action="inventory-tab"
                 data-tab="${esc(t.id)}">${t.label}</button>`
    )
    .join("");

  const isWeaponsTab = INVENTORY_UI.tab === "Armes";

  return `
    <div class="tabs">${tabsHtml}</div>
    <div class="grid-2" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)">
      <section class="card">
        ${isWeaponsTab ? weaponsTable(c) : itemsTable(c)}
        <div style="margin-top:10px">
          <button class="btn btn-sm" data-action="${isWeaponsTab ? "add-weapon" : "add-item"}">
            ＋ Ajouter ${isWeaponsTab ? "une arme" : "un objet"}
          </button>
        </div>
      </section>
      <section class="card detail-pane">
        ${isWeaponsTab ? weaponDetail(c) : itemDetail(c)}
      </section>
    </div>
    <div class="grid-2" style="margin-top:14px">
      ${capacityCard(c)}
      ${currencyCard(c)}
    </div>`;
}

/* ------------------------------ Objets ------------------------------ */

function filteredItems(c: Character): InventoryItem[] {
  const items = c.inventory.items;
  if (INVENTORY_UI.tab === "Tout") return items;
  return items.filter((it) => it.category === INVENTORY_UI.tab);
}

function itemsTable(c: Character): string {
  const items = filteredItems(c);

  if (INVENTORY_UI.selectedItemId && !items.some((i) => i.id === INVENTORY_UI.selectedItemId)) {
    INVENTORY_UI.selectedItemId = items[0]?.id ?? null;
  }

  const rows = items
    .map(
      (item) => `<tr class="${item.id === INVENTORY_UI.selectedItemId ? "is-selected" : ""}"
                     data-action="select-item" data-id="${item.id}" style="cursor:pointer">
        <td>${esc(item.name)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${item.weight} kg</td>
        <td class="num">${item.value} PO</td>
        <td class="num"><span class="badge">${esc(item.category)}</span></td>
      </tr>`
    )
    .join("");

  return `<h2>Objets</h2>
    <table class="table">
      <thead><tr><th>Nom</th><th class="num">Qté</th><th class="num">Poids</th><th class="num">Valeur</th><th class="num">Catégorie</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="empty">Aucun objet dans cette catégorie.</td></tr>`}</tbody>
    </table>`;
}

function itemDetail(c: Character): string {
  const index = c.inventory.items.findIndex((i) => i.id === INVENTORY_UI.selectedItemId);
  if (index < 0) return emptyState("Sélectionnez un objet pour afficher sa fiche détaillée.");

  const item = c.inventory.items[index];
  const p = `inventory.items.${index}`;

  return `
    <div class="detail-head">
      <div class="detail-icon">🎒</div>
      <div>
        <h3>${esc(item.name || "Objet sans nom")}</h3>
        <small style="color:var(--muted)">${esc(item.category)}${item.equipped ? " · équipé" : ""}</small>
      </div>
    </div>
    <label class="field"><span>Nom</span>
      <input type="text" data-bind="${p}.name" value="${esc(item.name)}"></label>
    <div class="field-row-3">
      <label class="field"><span>Quantité</span>
        <input type="number" min="0" data-bind="${p}.quantity" value="${item.quantity}" data-rerender="true"></label>
      <label class="field"><span>Poids (kg)</span>
        <input type="number" step="0.1" min="0" data-bind="${p}.weight" value="${item.weight}" data-rerender="true"></label>
      <label class="field"><span>Valeur (PO)</span>
        <input type="number" step="0.1" min="0" data-bind="${p}.value" value="${item.value}"></label>
    </div>
    <label class="field"><span>Catégorie</span>
      <select data-bind="${p}.category" data-rerender="true">
        ${ITEM_CATEGORIES.map(
          (cat) => `<option value="${cat}"${cat === item.category ? " selected" : ""}>${cat}</option>`
        ).join("")}
      </select></label>
    <label class="field"><span>Propriétés mécaniques</span>
      <textarea data-bind="${p}.properties" rows="2"
                placeholder="1d8 tranchant, finesse, portée 24/96 m…">${esc(item.properties)}</textarea></label>
    <label class="field"><span>Description</span>
      <textarea data-bind="${p}.description" rows="4">${esc(item.description)}</textarea></label>
    <label class="field" style="flex-direction:row;align-items:center;gap:8px">
      <input type="checkbox" data-bind="${p}.equipped" ${item.equipped ? "checked" : ""} style="width:auto">
      <span style="text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--ink)">Équipé</span>
    </label>
    <div class="detail-actions">
      <button class="btn btn-sm" data-action="duplicate-item" data-id="${item.id}">⧉ Dupliquer</button>
      <button class="btn btn-sm btn-danger" data-action="delete-item" data-id="${item.id}">🗑 Supprimer</button>
    </div>`;
}

/* ------------------------------ Armes ------------------------------ */

function weaponsTable(c: Character): string {
  const weapons = c.inventory.weapons;
  if (INVENTORY_UI.selectedWeaponId && !weapons.some((w) => w.id === INVENTORY_UI.selectedWeaponId)) {
    INVENTORY_UI.selectedWeaponId = weapons[0]?.id ?? null;
  }

  const rows = weapons
    .map(
      (w) => `<tr class="${w.id === INVENTORY_UI.selectedWeaponId ? "is-selected" : ""}"
                    data-action="select-weapon" data-id="${w.id}" style="cursor:pointer">
        <td>${esc(w.name)}</td>
        <td class="num">${fmtMod(w.attackBonus)}</td>
        <td class="num">${esc(w.damage)}</td>
        <td class="num">${esc(w.damageType)}</td>
        <td class="num">${esc(w.range)}</td>
      </tr>`
    )
    .join("");

  return `<h2>Armes &amp; attaques</h2>
    <table class="table">
      <thead><tr><th>Arme</th><th class="num">Attaque</th><th class="num">Dégâts</th><th class="num">Type</th><th class="num">Portée</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="empty">Aucune arme enregistrée.</td></tr>`}</tbody>
    </table>`;
}

function weaponDetail(c: Character): string {
  const index = c.inventory.weapons.findIndex((w) => w.id === INVENTORY_UI.selectedWeaponId);
  if (index < 0) return emptyState("Sélectionnez une arme pour afficher sa fiche détaillée.");

  const weapon = c.inventory.weapons[index];
  const p = `inventory.weapons.${index}`;

  return `
    <div class="detail-head">
      <div class="detail-icon">⚔️</div>
      <div><h3>${esc(weapon.name || "Arme")}</h3>
        <small style="color:var(--muted)">${esc(weapon.damage || "—")} ${esc(weapon.damageType || "")}</small></div>
    </div>
    <label class="field"><span>Nom</span>
      <input type="text" data-bind="${p}.name" value="${esc(weapon.name)}"></label>
    <div class="field-row">
      <label class="field"><span>Bonus d'attaque</span>
        <input type="number" data-bind="${p}.attackBonus" value="${weapon.attackBonus}"></label>
      <label class="field"><span>Dégâts</span>
        <input type="text" data-bind="${p}.damage" value="${esc(weapon.damage)}" placeholder="1d8+3"></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Type de dégâts</span>
        <input type="text" data-bind="${p}.damageType" value="${esc(weapon.damageType)}"></label>
      <label class="field"><span>Portée</span>
        <input type="text" data-bind="${p}.range" value="${esc(weapon.range)}" placeholder="Contact / 24-96 m"></label>
    </div>
    <label class="field"><span>Propriétés</span>
      <textarea data-bind="${p}.properties" rows="3">${esc(weapon.properties)}</textarea></label>
    <div class="detail-actions">
      <button class="btn btn-sm btn-danger" data-action="delete-weapon" data-id="${weapon.id}">🗑 Supprimer</button>
    </div>`;
}

/* ------------------------------ Capacité & monnaie ------------------------------ */

function capacityCard(c: Character): string {
  const weight = inventoryWeight(c);
  const capacity = carriesCapacityKg(c);
  const ratio = capacity > 0 ? weight / capacity : 0;
  return `<section class="card">
    <h2>Capacité de charge</h2>
    <p style="font-size:13.5px;margin:0 0 8px">
      <strong>${weight} kg</strong> / ${capacity} kg
      ${ratio > 1 ? `<span class="badge" style="margin-left:6px">Surchargé</span>` : ""}
    </p>
    ${progressBar(ratio, ratio > 1)}
    <p style="font-size:12px;color:var(--muted);margin:8px 0 0">
      Capacité = Force × 7,5 kg (règle optionnelle d'encombrement).
    </p>
  </section>`;
}

function currencyCard(c: Character): string {
  const cur = c.inventory.currency;
  const coin = (key: keyof typeof cur, label: string, cls: string) => `
    <div class="coin ${cls}">
      <i></i>
      <label class="field" style="margin:0">
        <span>${label}</span>
        <input type="number" min="0" data-bind="inventory.currency.${key}" value="${cur[key]}">
      </label>
    </div>`;

  return `<section class="card">
    <h2>Monnaie</h2>
    <div class="coins">
      ${coin("cp", "PC", "cp")}
      ${coin("sp", "PA", "sp")}
      ${coin("ep", "PE", "ep")}
      ${coin("gp", "PO", "gp")}
      ${coin("pp", "PP", "pp")}
    </div>
  </section>`;
}

/* ------------------------------ Actions ------------------------------ */

document.addEventListener("click", (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  if (action === "inventory-tab") {
    INVENTORY_UI.tab = el.dataset.tab as never;
    INVENTORY_UI.selectedItemId = null;
    INVENTORY_UI.selectedWeaponId = null;
    renderApp();
  }

  if (action === "select-item") {
    INVENTORY_UI.selectedItemId = el.dataset.id ?? null;
    renderApp();
  }

  if (action === "select-weapon") {
    INVENTORY_UI.selectedWeaponId = el.dataset.id ?? null;
    renderApp();
  }

  if (action === "add-item") {
    openModal({
      title: "Nouvel objet",
      body: `
        ${textField("Nom", "name", "", { placeholder: "Épée courte, Potion de soin…" })}
        <div class="field-row-3">
          ${textField("Quantité", "quantity", "1")}
          ${textField("Poids (kg)", "weight", "0")}
          ${textField("Valeur (PO)", "value", "0")}
        </div>
        <label class="field"><span>Catégorie</span>
          <select data-field="category">
            ${ITEM_CATEGORIES.map((cat) => `<option value="${cat}">${cat}</option>`).join("")}
          </select></label>
        <label class="field"><span>Description</span>
          <textarea data-field="description" rows="3"></textarea></label>`,
      actions: [
        { label: "Annuler", action: "modal-close" },
        { label: "Ajouter", action: "add-item-apply", primary: true },
      ],
    });
  }

  if (action === "add-item-apply") {
    const character = store.current();
    const root = modalRoot();
    if (!character || !root) return;
    const data = collectFields(root);
    const name = String(data.name ?? "").trim();
    if (!name) return toast("Le nom est obligatoire", "error");

    const item: InventoryItem = {
      id: uid(),
      name,
      quantity: Number(data.quantity) || 1,
      weight: Number(data.weight) || 0,
      value: Number(data.value) || 0,
      category: (data.category as ItemCategory) || "divers",
      description: String(data.description ?? ""),
      properties: "",
      equipped: false,
    };
    character.inventory.items.push(item);
    INVENTORY_UI.selectedItemId = item.id;
    store.touch();
    closeModal();
    renderApp();
  }

  if (action === "duplicate-item") {
    const character = store.current();
    if (!character) return;
    const index = character.inventory.items.findIndex((i) => i.id === el.dataset.id);
    if (index < 0) return;
    const copy = { ...character.inventory.items[index], id: uid(), name: character.inventory.items[index].name + " (copie)" };
    character.inventory.items.splice(index + 1, 0, copy);
    INVENTORY_UI.selectedItemId = copy.id;
    store.touch();
    renderApp();
  }

  if (action === "delete-item") {
    const character = store.current();
    if (!character) return;
    character.inventory.items = character.inventory.items.filter((i) => i.id !== el.dataset.id);
    INVENTORY_UI.selectedItemId = null;
    store.touch();
    renderApp();
  }

  if (action === "add-weapon") {
    openModal({
      title: "Nouvelle arme",
      body: `
        ${textField("Nom", "name", "", { placeholder: "Épée longue" })}
        <div class="field-row-3">
          ${textField("Bonus d'attaque", "attackBonus", "0")}
          ${textField("Dégâts", "damage", "1d8+3")}
          ${textField("Type", "damageType", "tranchant")}
        </div>
        ${textField("Portée", "range", "Contact")}
        <label class="field"><span>Propriétés</span>
          <textarea data-field="properties" rows="3"></textarea></label>`,
      actions: [
        { label: "Annuler", action: "modal-close" },
        { label: "Ajouter", action: "add-weapon-apply", primary: true },
      ],
    });
  }

  if (action === "add-weapon-apply") {
    const character = store.current();
    const root = modalRoot();
    if (!character || !root) return;
    const data = collectFields(root);
    const name = String(data.name ?? "").trim();
    if (!name) return toast("Le nom est obligatoire", "error");

    const weapon: Weapon = {
      id: uid(),
      name,
      attackBonus: Number(data.attackBonus) || 0,
      damage: String(data.damage ?? ""),
      damageType: String(data.damageType ?? ""),
      range: String(data.range ?? ""),
      properties: String(data.properties ?? ""),
    };
    character.inventory.weapons.push(weapon);
    INVENTORY_UI.selectedWeaponId = weapon.id;
    store.touch();
    closeModal();
    renderApp();
  }

  if (action === "delete-weapon") {
    const character = store.current();
    if (!character) return;
    character.inventory.weapons = character.inventory.weapons.filter((w) => w.id !== el.dataset.id);
    INVENTORY_UI.selectedWeaponId = null;
    store.touch();
    renderApp();
  }
});