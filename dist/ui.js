/** Composants d'interface réutilisables : modale, toasts, champs de formulaire. */
import { esc } from "./utils.js";
/* ------------------------------ Toasts ------------------------------ */
export function toast(message, kind = "info") {
    const root = document.getElementById("toast-root");
    if (!root)
        return;
    const el = document.createElement("div");
    el.className = `toast toast-${kind}`;
    el.textContent = message;
    root.appendChild(el);
    window.setTimeout(() => {
        el.classList.add("out");
        window.setTimeout(() => el.remove(), 320);
    }, 2600);
}
export function openModal(options) {
    const root = document.getElementById("modal-root");
    if (!root)
        return;
    const actionsHtml = (options.actions ?? [])
        .map((a) => {
        const cls = a.primary ? "btn btn-primary" : a.danger ? "btn btn-danger" : "btn";
        return `<button class="${cls}" data-action="${esc(a.action)}">${esc(a.label)}</button>`;
    })
        .join("");
    root.innerHTML = `
    <div class="modal-backdrop" data-action="modal-close"></div>
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(options.title)}"
         style="max-width:${esc(options.width ?? "640px")}">
      <div class="modal-head">
        <h2>${esc(options.title)}</h2>
        <button class="icon-btn" data-action="modal-close" aria-label="Fermer">✕</button>
      </div>
      <div class="modal-body">${options.body}</div>
      ${actionsHtml ? `<div class="modal-actions">${actionsHtml}</div>` : ""}
    </div>`;
    root.classList.add("open");
    options.onMount?.(root);
    const firstInput = root.querySelector("input, textarea, select");
    firstInput?.focus();
}
export function closeModal() {
    const root = document.getElementById("modal-root");
    if (!root)
        return;
    root.innerHTML = "";
    root.classList.remove("open");
}
export function modalRoot() {
    const root = document.getElementById("modal-root");
    return root && root.classList.contains("open") ? root : null;
}
/** Récupère tous les champs marqués `data-field` d'un conteneur. */
export function collectFields(root) {
    const out = {};
    root.querySelectorAll("[data-field]").forEach((el) => {
        const key = el.dataset.field;
        if (!key)
            return;
        if (el instanceof HTMLInputElement && el.type === "checkbox")
            out[key] = el.checked;
        else if (el instanceof HTMLInputElement && el.type === "number")
            out[key] = el.value === "" ? 0 : Number(el.value);
        else
            out[key] = el.value;
    });
    return out;
}
/* ------------------------------ Champs ------------------------------ */
export function textField(label, field, value, opts = {}) {
    return `<label class="field${opts.full ? " full" : ""}">
    <span>${esc(label)}</span>
    <input type="text" data-field="${esc(field)}" value="${esc(value)}" placeholder="${esc(opts.placeholder ?? "")}">
  </label>`;
}
export function numberField(label, field, value, opts = {}) {
    return `<label class="field">
    <span>${esc(label)}</span>
    <input type="number" data-field="${esc(field)}" value="${Number(value) || 0}"
      ${opts.min !== undefined ? `min="${opts.min}"` : ""}
      ${opts.max !== undefined ? `max="${opts.max}"` : ""}
      ${opts.step !== undefined ? `step="${opts.step}"` : ""}>
  </label>`;
}
export function textareaField(label, field, value, rows = 4) {
    return `<label class="field">
    <span>${esc(label)}</span>
    <textarea data-field="${esc(field)}" rows="${rows}">${esc(value)}</textarea>
  </label>`;
}
export function selectField(label, field, value, options, opts = {}) {
    const optsHtml = [
        opts.allowEmpty !== false ? `<option value="">${esc(opts.emptyLabel ?? "—")}</option>` : "",
        ...options.map((o) => `<option value="${esc(o)}"${o === value ? " selected" : ""}>${esc(o)}</option>`),
    ].join("");
    return `<label class="field"><span>${esc(label)}</span>
    <select data-field="${esc(field)}">${optsHtml}</select>
  </label>`;
}
export function checkboxField(label, field, checked) {
    return `<label class="field" style="flex-direction:row;align-items:center;gap:8px">
    <input type="checkbox" data-field="${esc(field)}" ${checked ? "checked" : ""} style="width:auto">
    <span style="text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--ink)">${esc(label)}</span>
  </label>`;
}
/* ------------------------------ Divers ------------------------------ */
export function emptyState(message) {
    return `<p class="empty" style="color:var(--muted);font-style:italic;padding:14px 4px">${esc(message)}</p>`;
}
export function badge(text, variant = "") {
    return `<span class="badge ${variant}">${esc(text)}</span>`;
}
export function progressBar(ratio, over = false) {
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    return `<div class="progress${over ? " over" : ""}"><i style="width:${pct}%"></i></div>`;
}
//# sourceMappingURL=ui.js.map