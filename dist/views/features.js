/** Onglet « Capacités » : traits, dons, aptitudes de classe / espèce / background. */
import { FEATURE_SOURCES, FEATURE_TYPES } from "../data.js";
import { esc, uid } from "../utils.js";
import { store } from "../state.js";
import { closeModal, collectFields, emptyState, modalRoot, openModal, textField, toast } from "../ui.js";
import { renderApp } from "../app.js";
import { pips } from "./widgets.js";
export const FEATURES_UI = {
    filter: "Tous",
    selectedId: null,
    query: "",
};
export function renderFeatures(c) {
    const tabs = ["Tous", ...FEATURE_SOURCES]
        .map((source) => `<button class="tab${FEATURES_UI.filter === source ? " active" : ""}" data-action="features-filter"
                 data-filter="${esc(source)}">${esc(source)}</button>`)
        .join("");
    const list = c.features
        .filter((f) => FEATURES_UI.filter === "Tous" || f.source === FEATURES_UI.filter)
        .filter((f) => !FEATURES_UI.query || f.name.toLowerCase().includes(FEATURES_UI.query.toLowerCase()));
    if (FEATURES_UI.selectedId && !c.features.some((f) => f.id === FEATURES_UI.selectedId)) {
        FEATURES_UI.selectedId = c.features[0]?.id ?? null;
    }
    const rows = list
        .map((f) => `<tr class="${f.id === FEATURES_UI.selectedId ? "is-selected" : ""}"
                    data-action="select-feature" data-id="${f.id}" style="cursor:pointer">
        <td>${esc(f.name)}</td>
        <td>${esc(f.source)}</td>
        <td><span class="badge">${esc(f.type)}</span></td>
      </tr>`)
        .join("");
    return `
    <div class="tabs">${tabs}</div>
    <div class="grid-2" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)">
      <section class="card">
        <div class="toolbar" style="margin-bottom:10px">
          <label class="search" style="flex:1">
            <span>🔍</span>
            <input type="search" id="feature-search" placeholder="Rechercher une capacité…"
                   value="${esc(FEATURES_UI.query)}" data-feature-search>
          </label>
        </div>
        <table class="table">
          <thead><tr><th>Nom</th><th>Source</th><th>Type</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="3" class="empty">Aucune capacité enregistrée.</td></tr>`}</tbody>
        </table>
        <div style="margin-top:10px">
          <button class="btn btn-sm" data-action="add-feature">＋ Ajouter une capacité</button>
        </div>
      </section>
      <section class="card detail-pane">${featureDetail(c)}</section>
    </div>`;
}
function featureDetail(c) {
    const index = c.features.findIndex((f) => f.id === FEATURES_UI.selectedId);
    if (index < 0)
        return emptyState("Sélectionnez une capacité pour afficher sa sous-fiche.");
    const feature = c.features[index];
    const p = `features.${index}`;
    return `
    <div class="detail-head">
      <div class="detail-icon">✨</div>
      <div><h3>${esc(feature.name || "Capacité")}</h3>
        <small style="color:var(--muted)">${esc(feature.source)} · ${esc(feature.type)}</small></div>
    </div>
    <label class="field"><span>Nom</span>
      <input type="text" data-bind="${p}.name" value="${esc(feature.name)}"></label>
    <div class="field-row">
      <label class="field"><span>Source</span>
        <select data-bind="${p}.source" data-rerender="true">
          ${FEATURE_SOURCES.map((s) => `<option value="${s}"${s === feature.source ? " selected" : ""}>${s}</option>`).join("")}
        </select></label>
      <label class="field"><span>Type</span>
        <select data-bind="${p}.type">
          ${FEATURE_TYPES.map((t) => `<option value="${t}"${t === feature.type ? " selected" : ""}>${t}</option>`).join("")}
        </select></label>
    </div>
    <label class="field"><span>Description</span>
      <textarea data-bind="${p}.description" rows="5">${esc(feature.description)}</textarea></label>
    <div class="field-row">
      <label class="field"><span>Charges max</span>
        <input type="number" min="0" data-bind="${p}.usesMax" value="${feature.usesMax}" data-rerender="true"></label>
      <label class="field"><span>Recharge</span>
        <input type="text" data-bind="${p}.recharge" value="${esc(feature.recharge)}" placeholder="1×/repos long"></label>
    </div>
    <div>
      <span style="font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase;color:var(--muted);font-weight:600">
        Charges (${feature.usesCurrent}/${feature.usesMax})</span>
      <div class="pips" style="margin-top:6px">
        ${pips(feature.usesCurrent, feature.usesMax, "toggle-feature-charge", feature.id)}
      </div>
    </div>
    <div class="detail-actions">
      <button class="btn btn-sm" data-action="reset-feature-charges" data-id="${feature.id}">↺ Recharger</button>
      <button class="btn btn-sm btn-danger" data-action="delete-feature" data-id="${feature.id}">🗑 Supprimer</button>
    </div>`;
}
/* ------------------------------ Actions ------------------------------ */
document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el)
        return;
    const action = el.dataset.action;
    if (action === "features-filter") {
        FEATURES_UI.filter = el.dataset.filter ?? "Tous";
        renderApp();
    }
    if (action === "select-feature") {
        FEATURES_UI.selectedId = el.dataset.id ?? null;
        renderApp();
    }
    if (action === "toggle-feature-charge") {
        const character = store.current();
        if (!character)
            return;
        const feature = character.features.find((f) => f.id === el.dataset.id);
        if (!feature)
            return;
        const index = Number(el.dataset.index) + 1;
        feature.usesCurrent = feature.usesCurrent === index ? index - 1 : index;
        store.touch();
        renderApp();
    }
    if (action === "reset-feature-charges") {
        const character = store.current();
        if (!character)
            return;
        const feature = character.features.find((f) => f.id === el.dataset.id);
        if (!feature)
            return;
        feature.usesCurrent = feature.usesMax;
        store.touch();
        renderApp();
    }
    if (action === "delete-feature") {
        const character = store.current();
        if (!character)
            return;
        character.features = character.features.filter((f) => f.id !== el.dataset.id);
        FEATURES_UI.selectedId = null;
        store.touch();
        renderApp();
    }
    if (action === "add-feature") {
        openModal({
            title: "Nouvelle capacité",
            body: `
        ${textField("Nom", "name", "", { placeholder: "Rage, Châtiment divin…" })}
        <div class="field-row">
          <label class="field"><span>Source</span>
            <select data-field="source">
              ${FEATURE_SOURCES.map((s) => `<option value="${s}">${s}</option>`).join("")}
            </select></label>
          <label class="field"><span>Type</span>
            <select data-field="type">
              ${FEATURE_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("")}
            </select></label>
        </div>
        ${textField("Charges max", "usesMax", "0")}
        ${textField("Recharge", "recharge", "", { placeholder: "1×/repos court" })}
        <label class="field"><span>Description</span>
          <textarea data-field="description" rows="4"></textarea></label>`,
            actions: [
                { label: "Annuler", action: "modal-close" },
                { label: "Ajouter", action: "add-feature-apply", primary: true },
            ],
        });
    }
    if (action === "add-feature-apply") {
        const character = store.current();
        const root = modalRoot();
        if (!character || !root)
            return;
        const data = collectFields(root);
        const name = String(data.name ?? "").trim();
        if (!name)
            return toast("Le nom est obligatoire", "error");
        const feature = {
            id: uid(),
            name,
            source: data.source || "Autre",
            type: data.type || "Passif",
            description: String(data.description ?? ""),
            usesMax: Number(data.usesMax) || 0,
            usesCurrent: Number(data.usesMax) || 0,
            recharge: String(data.recharge ?? ""),
        };
        character.features.push(feature);
        FEATURES_UI.selectedId = feature.id;
        store.touch();
        closeModal();
        renderApp();
    }
});
document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el instanceof HTMLInputElement && el.hasAttribute("data-feature-search")) {
        FEATURES_UI.query = el.value;
        import("../app.js").then(({ renderApp }) => renderApp());
    }
});
//# sourceMappingURL=features.js.map