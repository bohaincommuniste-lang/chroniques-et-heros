/** Petits composants partagés entre les vues. */
export function profButton(proficiency, attrs) {
    const symbol = proficiency === "expertise" ? "◆" : proficiency === "proficient" ? "●" : "○";
    const cls = proficiency === "none" ? "prof-btn" : `prof-btn ${proficiency}`;
    return `<button class="${cls}" ${attrs}>${symbol}</button>`;
}
export function pips(current, max, action, id) {
    const total = Math.max(max, 0);
    let html = "";
    for (let i = 0; i < total; i++) {
        html += `<button class="pip${i < current ? " on" : ""}" data-action="${action}" data-id="${id}"
      data-index="${i}" aria-label="Charge ${i + 1}"></button>`;
    }
    return total === 0 ? `<span style="font-size:12.5px;color:var(--muted)">Aucune charge</span>` : html;
}
export function tagEditor(path, items, placeholder) {
    const tags = items
        .map((item, i) => `<span class="tag">${escapeTag(item)}<button type="button"
    data-action="remove-tag" data-path="${path}" data-index="${i}"
    aria-label="Retirer">×</button></span>`)
        .join("");
    return `<div class="tag-editor" data-tag-path="${path}">
  <div class="tag-list">${tags || `<span class="tag-empty">Aucune entrée</span>`}</div>
  <div class="tag-input-row">
  <input type="text" data-tag-new placeholder="${escapeTag(placeholder)}">
  <button type="button" class="btn btn-sm" data-action="add-tag" data-path="${path}">＋</button>
  </div>
  </div>`;
}
function escapeTag(s) {
    return String(s).replace(/[&<>"']/g, (c) => c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;");
}
//# sourceMappingURL=widgets.js.map