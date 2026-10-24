/** Vues : liste des personnages, export/import, paramètres. */

import { registerActions } from "../actions.js";
import { store } from "../state.js";
import { formatDate, downloadFile, esc, readFileAsText, slugify, resizeImage } from "../utils.js";
import {
  badge,
  closeModal,
  collectFields,
  modalRoot,
  openModal,
  progressBar,
  textField,
  toast,
} from "../ui.js";
import { navigate, renderApp } from "../app.js";
import type { Character } from "../types.js";

/* ============================== LISTE ============================== */

export function renderCharacters(): string {
  const list = store.characters;
  const query = (document.getElementById("char-search") as HTMLInputElement | null)?.value ?? "";
  const filtered = query
    ? list.filter((c) =>
        `${c.general.name} ${c.general.classes.map((k) => k.name).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : list;

  const cards = filtered
    .map((c) => characterCard(c))
    .join("");

  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">Gestion des personnages</h1>
        <p class="page-sub">${list.length} personnage${list.length > 1 ? "s" : ""} · stockage local du navigateur</p>
      </div>
      <div class="toolbar">
        <label class="search">
          <span>🔍</span>
          <input id="char-search" type="search" placeholder="Rechercher un personnage…"
                 value="${esc(query)}" data-live-search="characters">
        </label>
        <button class="btn btn-primary" data-action="new-character">＋ Nouveau personnage</button>
      </div>
    </div>
    <div class="char-grid">
      ${cards}
      <button class="add-card" data-action="new-character">
        <span class="plus">＋</span>Ajouter un personnage
      </button>
    </div>`;
}

function characterCard(c: Character): string {
  const level = c.general.classes.reduce((s, k) => s + (Number(k.level) || 0), 0);
  const cls = c.general.classes.map((k) => k.name).filter(Boolean).join(" / ") || "—";
  const thumb = c.general.imageBase64
    ? `<img src="${c.general.imageBase64}" alt="">`
    : esc((c.general.name || "?").charAt(0).toUpperCase());

  return `<article class="char-card${c.archived ? " is-archived" : ""}" data-action="open-character" data-id="${c.id}">
    <div class="char-thumb">${thumb}</div>
    <div class="char-meta">
      <strong>${esc(c.general.name || "Sans nom")}</strong>
      <small>${esc(cls)} · Niveau ${level}</small>
      ${c.archived ? `<div style="margin-top:6px">${badge("Archivé")}</div>` : ""}
    </div>
    <button class="char-menu-btn" data-action="character-menu" data-id="${c.id}" aria-label="Options">⋯</button>
  </article>`;
}

/* ============================== EXPORT / IMPORT ============================== */

export function renderImportExport(): string {
  const list = store.characters;

  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">Exporter / Importer</h1>
        <p class="page-sub">Le format JSON est autosuffisant, lisible et versionné (schemaVersion 1.0).</p>
      </div>
    </div>

    <div class="grid-2">
      <section class="card">
        <h2>Exporter</h2>
        <p style="color:var(--muted);font-size:13.5px;margin:0 0 12px">
          Téléchargez un fichier JSON contenant un ou plusieurs personnages.
        </p>
        <label class="field">
          <span>Sélection</span>
          <select id="export-selection">
            <option value="all">Tous les personnages (${list.length})</option>
            ${list.map((c) => `<option value="${c.id}">${esc(c.general.name)}</option>`).join("")}
          </select>
        </label>
        <button class="btn btn-primary" data-action="export-selection">⭳ Exporter en JSON</button>
      </section>

      <section class="card">
        <h2>Importer</h2>
        <p style="color:var(--muted);font-size:13.5px;margin:0 0 12px">
          Importez un fichier JSON pour ajouter un ou plusieurs personnages.
        </p>
        <label class="field">
          <span>Fichier JSON</span>
          <input id="import-input" type="file" accept=".json,application/json">
        </label>
        <p style="font-size:12.5px;color:var(--muted)">
          Les images sont encodées en base64 : le fichier reste autonome.
        </p>
      </section>
    </div>

    <section class="card" style="margin-top:14px">
      <h2>Mes sauvegardes</h2>
      ${
        list.length === 0
          ? `<p style="color:var(--muted)">Aucun personnage enregistré.</p>`
          : `<table class="table">
              <thead><tr><th>Personnage</th><th>Classe</th><th>Modifié le</th><th class="num"></th></tr></thead>
              <tbody>
                ${list
                  .map(
                    (c) => `<tr>
                      <td><strong>${esc(c.general.name)}</strong></td>
                      <td>${esc(c.general.classes.map((k) => k.name).filter(Boolean).join(" / ") || "—")}</td>
                      <td>${formatDate(c.updatedAt)}</td>
                      <td class="num">
                        <button class="icon-btn" data-action="export-one" data-id="${c.id}"
                                title="Télécharger">⭳</button>
                      </td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>`
      }
    </section>`;
}

/* ============================== PARAMÈTRES ============================== */

export function renderSettings(): string {
  const prefs = store.prefs;
  const charCount = store.characters.length;

  const themeOption = (value: "light" | "dark" | "system", label: string) => `
    <label class="field" style="flex-direction:row;align-items:center;gap:8px">
      <input type="radio" name="theme" value="${value}" ${prefs.theme === value ? "checked" : ""}
             data-action="set-theme" data-theme-value="${value}" style="width:auto">
      <span style="text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--ink)">${esc(label)}</span>
    </label>`;

  return `
    <div class="page-head">
      <h1 class="page-title">Paramètres</h1>
    </div>

    <div class="grid-2">
      <section class="card">
        <h2>Général</h2>
        <h3 style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted)">Thème</h3>
        ${themeOption("light", "Clair")}
        ${themeOption("dark", "Sombre")}
        ${themeOption("system", "Système")}

        <label class="field" style="margin-top:14px">
          <span>Langue</span>
          <select disabled><option>Français</option></select>
        </label>
      </section>

      <section class="card">
        <h2>Stockage local</h2>
        <p style="font-size:13.5px;color:var(--ink-soft);margin:0 0 10px">
          ${charCount} personnage${charCount > 1 ? "s" : ""} · mécanisme :
          <strong>${store.storage.usingFallback ? "localStorage (repli)" : "IndexedDB"}</strong>
        </p>
        <div id="storage-meter">${progressBar(0)}</div>
        <p id="storage-label" style="font-size:12.5px;color:var(--muted)">Calcul de l'espace utilisé…</p>
        <button class="btn btn-danger" data-action="clear-storage">Vider le stockage</button>
      </section>

      <section class="card">
        <h2>Sauvegarde</h2>
        <label class="field" style="flex-direction:row;align-items:center;gap:8px">
          <input type="checkbox" ${prefs.autosave ? "checked" : ""} data-action="toggle-autosave" style="width:auto">
          <span style="text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--ink)">
            Sauvegarde automatique</span>
        </label>
        <p style="font-size:12.5px;color:var(--muted)">
          Les modifications sont persistées ~450 ms après la dernière frappe.
          Pensez à exporter régulièrement vos personnages.
        </p>
      </section>

      <section class="card">
        <h2>Divers</h2>
        <p style="font-size:13.5px;color:var(--ink-soft)">Version de l'application <strong>1.0.0</strong></p>
        <p style="font-size:13.5px;color:var(--ink-soft)">Schéma de données <strong>1.0</strong></p>
        <p style="font-size:12.5px;color:var(--muted)">
          Application 100 % statique : aucune donnée ne quitte votre navigateur.
        </p>
      </section>
    </div>`;
}

/* ============================== ACTIONS ============================== */

registerActions({
  "modal-close": () => closeModal(),

  "new-character": async () => {
    const character = await store.createCharacter();
    toast("Personnage créé", "success");
    navigate(`c/${character.id}/general`);
  },

  "open-character": (el) => {
    const id = el.dataset.id;
    if (id) navigate(`c/${id}/general`);
  },

  "character-menu": (el, ev) => {
    ev.stopPropagation();
    const id = el.dataset.id as string;
    const character = store.get(id);
    if (!character) return;
    openModal({
      title: character.general.name || "Sans nom",
      width: "420px",
      body: `
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn" data-action="char-open" data-id="${id}">📖 Ouvrir la fiche</button>
          <button class="btn" data-action="char-rename" data-id="${id}">✏️ Renommer</button>
          <button class="btn" data-action="char-duplicate" data-id="${id}">⧉ Dupliquer</button>
          <button class="btn" data-action="char-export" data-id="${id}">⭳ Exporter en JSON</button>
          <button class="btn" data-action="char-archive" data-id="${id}">
            ${character.archived ? "♻️ Désarchiver" : "🗄️ Archiver"}</button>
          <button class="btn btn-danger" data-action="char-delete" data-id="${id}">🗑️ Supprimer</button>
        </div>`,
    });
  },

  "char-open": (el) => {
    closeModal();
    const id = el.dataset.id;
    if (id) navigate(`c/${id}/general`);
  },

  "char-rename": (el) => {
    const id = el.dataset.id as string;
    const character = store.get(id);
    if (!character) return;
    openModal({
      title: "Renommer le personnage",
      width: "420px",
      body: textField("Nom", "name", character.general.name),
      actions: [
        { label: "Annuler", action: "modal-close" },
        { label: "Enregistrer", action: "char-rename-apply", primary: true },
      ],
    });
    const root = modalRoot();
    if (root) root.dataset.targetId = id;
  },

  "char-rename-apply": async () => {
    const root = modalRoot();
    if (!root) return;
    const id = root.dataset.targetId as string;
    const data = collectFields(root);
    await store.renameCharacter(id, String(data.name ?? ""));
    closeModal();
    toast("Personnage renommé", "success");
    renderApp();
  },

  "char-duplicate": async (el) => {
    const id = el.dataset.id as string;
    const copy = await store.duplicateCharacter(id);
    closeModal();
    if (copy) toast("Personnage dupliqué", "success");
    renderApp();
  },

  "char-archive": async (el) => {
    const id = el.dataset.id as string;
    await store.toggleArchive(id);
    closeModal();
    renderApp();
  },

  "char-delete": (el) => {
    const id = el.dataset.id as string;
    const character = store.get(id);
    if (!character) return;
    openModal({
      title: "Supprimer définitivement ?",
      width: "420px",
      body: `<p style="font-size:14px;color:var(--ink-soft)">
        « ${esc(character.general.name)} » sera supprimé du stockage local. Cette action est irréversible.
        Pensez à exporter une sauvegarde au préalable.</p>`,
      actions: [
        { label: "Annuler", action: "modal-close" },
        { label: "Supprimer", action: "char-delete-confirm", danger: true },
      ],
    });
    const root = modalRoot();
    if (root) root.dataset.targetId = id;
  },

  "char-delete-confirm": async () => {
    const root = modalRoot();
    if (!root) return;
    const id = root.dataset.targetId as string;
    await store.deleteCharacter(id);
    closeModal();
    toast("Personnage supprimé", "info");
    renderApp();
  },

  "char-export": (el) => {
    const id = el.dataset.id as string;
    const character = store.get(id);
    if (character) exportCharacters([character]);
    closeModal();
  },

  "export-selection": () => {
    const select = document.getElementById("export-selection") as HTMLSelectElement | null;
    const value = select?.value ?? "all";
    const list = value === "all" ? store.characters : store.characters.filter((c) => c.id === value);
    if (list.length === 0) {
      toast("Aucun personnage à exporter", "error");
      return;
    }
    exportCharacters(list);
    toast(`${list.length} personnage(s) exporté(s)`, "success");
  },

  "export-one": (el) => {
    const id = el.dataset.id as string;
    const character = store.get(id);
    if (character) exportCharacters([character]);
  },

  "clear-storage": () => {
    openModal({
      title: "Vider le stockage",
      width: "440px",
      body: `<p style="font-size:14px;color:var(--ink-soft)">
        Tous les personnages enregistrés localement seront définitivement perdus.
        Exportez vos données avant de continuer.</p>`,
      actions: [
        { label: "Annuler", action: "modal-close" },
        { label: "Tout supprimer", action: "clear-storage-confirm", danger: true },
      ],
    });
  },

  "clear-storage-confirm": async () => {
    await store.clearAll();
    closeModal();
    toast("Stockage vidé", "info");
    renderApp();
  },

  "set-theme": (el) => {
    const value = (el as HTMLInputElement).dataset.themeValue as "light" | "dark" | "system";
    store.prefs.theme = value;
    import("../storage.js").then(({ savePrefs }) => savePrefs(store.prefs));
    import("../app.js").then(({ applyTheme }) => applyTheme(value));
  },

  "toggle-autosave": (el) => {
    store.prefs.autosave = (el as HTMLInputElement).checked;
    import("../storage.js").then(({ savePrefs }) => savePrefs(store.prefs));
  },
});

function exportCharacters(list: Character[]): void {
  const payload =
    list.length === 1 ? list[0] : { schemaVersion: "1.0", type: "bundle", characters: list };
  const name =
    list.length === 1 ? `perso-${slugify(list[0].general.name)}.json` : `chroniques-sauvegarde.json`;
  downloadFile(name, JSON.stringify(payload, null, 2));
}

/* -------------------- Recherche live & import fichier -------------------- */

document.addEventListener("input", (ev) => {
  const el = ev.target as HTMLElement;
  if (el instanceof HTMLInputElement && el.dataset.liveSearch === "characters") {
    const grid = document.querySelector<HTMLElement>(".char-grid");
    if (!grid) return;
    const q = el.value.toLowerCase();
    grid.querySelectorAll<HTMLElement>(".char-card").forEach((card) => {
      card.style.display = card.textContent?.toLowerCase().includes(q) ? "" : "none";
    });
  }
});

document.addEventListener("change", async (ev) => {
  const el = ev.target as HTMLInputElement;
  if (el.id === "import-input" && el.files && el.files[0]) {
    try {
      const text = await readFileAsText(el.files[0]);
      const data = JSON.parse(text) as unknown;
      const items: unknown[] = Array.isArray(data)
        ? data
        : data && typeof data === "object" && "characters" in data
        ? ((data as { characters: unknown[] }).characters ?? [])
        : [data];

      let count = 0;
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        await store.importCharacter(item);
        count++;
      }
      toast(
        count > 0 ? `${count} personnage(s) importé(s)` : "Aucun personnage valide trouvé",
        count > 0 ? "success" : "error"
      );
      renderApp();
    } catch (err) {
      console.error(err);
      toast("Fichier JSON invalide", "error");
    } finally {
      el.value = "";
    }
  }

  if (el.id === "portrait-input" && el.files && el.files[0]) {
    const character = store.current();
    if (!character) return;
    try {
      character.general.imageBase64 = await resizeImage(el.files[0]);
      store.touch();
      renderApp();
    } catch {
      toast("Impossible de lire l'image", "error");
    } finally {
      el.value = "";
    }
  }
});