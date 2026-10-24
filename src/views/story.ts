/** Onglet « Histoire » : apparence, personnalité, points d'histoire, notes. */

import type { Character, StoryEvent } from "../types.js";
import { EVENT_CATEGORIES } from "../data.js";
import { esc, todayISO, uid } from "../utils.js";
import { store } from "../state.js";
import { closeModal, collectFields, emptyState, modalRoot, openModal, textField, toast } from "../ui.js";
import { renderApp } from "../app.js";

export const STORY_UI = {
  selectedEventId: null as string | null,
};

export function renderStory(c: Character): string {
  const story = c.story;

  if (STORY_UI.selectedEventId && !story.events.some((e) => e.id === STORY_UI.selectedEventId)) {
    STORY_UI.selectedEventId = story.events[0]?.id ?? null;
  }

  const events = story.events
    .map(
      (e) => `<tr class="${e.id === STORY_UI.selectedEventId ? "is-selected" : ""}"
                    data-action="select-event" data-id="${e.id}" style="cursor:pointer">
        <td>${esc(e.title || "Sans titre")}</td>
        <td><span class="badge">${esc(e.category)}</span></td>
        <td>${esc(e.date || "—")}</td>
      </tr>`
    )
    .join("");

  return `
    <div class="grid-3">
      <div class="col">
        <section class="card">
          <h2>Apparence physique</h2>
          <label class="field"><span>Description détaillée</span>
            <textarea data-bind="story.appearance" rows="7"
              placeholder="Traits distinctifs, vêtements, cicatrices…">${esc(story.appearance)}</textarea></label>
        </section>
        <section class="card">
          <h2>Notes libres</h2>
          <label class="field"><span>Tout autre élément narratif</span>
            <textarea data-bind="story.notes" rows="6">${esc(story.notes)}</textarea></label>
        </section>
      </div>

      <div class="col">
        <section class="card">
          <h2>Personnalité</h2>
          <label class="field"><span>Traits de personnalité</span>
            <textarea data-bind="story.personality.traits" rows="3">${esc(story.personality.traits)}</textarea></label>
          <label class="field"><span>Idéaux</span>
            <textarea data-bind="story.personality.ideals" rows="3">${esc(story.personality.ideals)}</textarea></label>
          <label class="field"><span>Liens</span>
            <textarea data-bind="story.personality.bonds" rows="3">${esc(story.personality.bonds)}</textarea></label>
          <label class="field"><span>Défauts</span>
            <textarea data-bind="story.personality.flaws" rows="3">${esc(story.personality.flaws)}</textarea></label>
        </section>
      </div>

      <div class="col">
        <section class="card">
          <h2>Points d'histoire</h2>
          <table class="table">
            <thead><tr><th>Titre</th><th>Catégorie</th><th>Date</th></tr></thead>
            <tbody>${events || `<tr><td colspan="3" class="empty">Aucun point d'histoire.</td></tr>`}</tbody>
          </table>
          <div style="margin-top:10px">
            <button class="btn btn-sm" data-action="add-event">＋ Nouveau point d'histoire</button>
          </div>
        </section>
        <section class="card detail-pane">${eventDetail(c)}</section>
      </div>
    </div>`;
}

function eventDetail(c: Character): string {
  const index = c.story.events.findIndex((e) => e.id === STORY_UI.selectedEventId);
  if (index < 0) return emptyState("Sélectionnez un point d'histoire pour le détailler.");

  const event = c.story.events[index];
  const p = `story.events.${index}`;

  return `
    <h2>Détail du point d'histoire</h2>
    <label class="field"><span>Titre</span>
      <input type="text" data-bind="${p}.title" value="${esc(event.title)}"></label>
    <div class="field-row">
      <label class="field"><span>Catégorie</span>
        <select data-bind="${p}.category">
          ${EVENT_CATEGORIES.map(
            (cat) => `<option value="${esc(cat)}"${cat === event.category ? " selected" : ""}>${esc(cat)}</option>`
          ).join("")}
        </select></label>
      <label class="field"><span>Date</span>
        <input type="text" data-bind="${p}.date" value="${esc(event.date)}" placeholder="1489 CR"></label>
    </div>
    <label class="field"><span>Description</span>
      <textarea data-bind="${p}.description" rows="8">${esc(event.description)}</textarea></label>
    <div class="detail-actions">
      <button class="btn btn-sm btn-danger" data-action="delete-event" data-id="${event.id}">🗑 Supprimer</button>
    </div>`;
}

/* ------------------------------ Actions ------------------------------ */

document.addEventListener("click", (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  if (action === "select-event") {
    STORY_UI.selectedEventId = el.dataset.id ?? null;
    renderApp();
  }

  if (action === "delete-event") {
    const character = store.current();
    if (!character) return;
    character.story.events = character.story.events.filter((e) => e.id !== el.dataset.id);
    STORY_UI.selectedEventId = null;
    store.touch();
    renderApp();
  }

  if (action === "add-event") {
    openModal({
      title: "Nouveau point d'histoire",
      body: `
        ${textField("Titre", "title", "", { placeholder: "Le serment brisé" })}
        <div class="field-row">
          <label class="field"><span>Catégorie</span>
            <select data-field="category">
              ${EVENT_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
            </select></label>
          ${textField("Date", "date", "", { placeholder: "1489 CR" })}
        </div>
        <label class="field"><span>Description</span>
          <textarea data-field="description" rows="6"></textarea></label>`,
      actions: [
        { label: "Annuler", action: "modal-close" },
        { label: "Créer", action: "add-event-apply", primary: true },
      ],
    });
  }

  if (action === "add-event-apply") {
    const character = store.current();
    const root = modalRoot();
    if (!character || !root) return;
    const data = collectFields(root);
    const title = String(data.title ?? "").trim();
    if (!title) return toast("Le titre est obligatoire", "error");

    const event: StoryEvent = {
      id: uid(),
      title,
      category: String(data.category ?? "Événement"),
      date: String(data.date ?? todayISO()),
      description: String(data.description ?? ""),
    };
    character.story.events.push(event);
    STORY_UI.selectedEventId = event.id;
    store.touch();
    closeModal();
    renderApp();
  }
});