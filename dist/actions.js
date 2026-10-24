/** Registre centralisé des actions (délégation d'événements). */
export const actions = {};
export function registerActions(map) {
    Object.assign(actions, map);
}
export function initActions() {
    document.addEventListener("click", (ev) => {
        const target = ev.target;
        const el = target?.closest("[data-action]");
        if (!el)
            return;
        const name = el.dataset.action;
        if (!name)
            return;
        const handler = actions[name];
        if (!handler)
            return;
        ev.preventDefault();
        void handler(el, ev);
    });
}
//# sourceMappingURL=actions.js.map