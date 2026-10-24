/** Registre centralisé des actions (délégation d'événements). */

export type ActionHandler = (el: HTMLElement, ev: Event) => void | Promise<void>;

export const actions: Record<string, ActionHandler> = {};

export function registerActions(map: Record<string, ActionHandler>): void {
  Object.assign(actions, map);
}

export function initActions(): void {
  document.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    const el = target?.closest<HTMLElement>("[data-action]");
    if (!el) return;
    const name = el.dataset.action;
    if (!name) return;
    const handler = actions[name];
    if (!handler) return;
    ev.preventDefault();
    void handler(el, ev);
  });
}