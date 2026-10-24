/** Petits composants partagés entre les vues. */

import type { Proficiency } from "../types.js";

export function profButton(proficiency: Proficiency, attrs: string): string {
  const symbol = proficiency === "expertise" ? "◆" : proficiency === "proficient" ? "●" : "○";
  const cls = proficiency === "none" ? "prof-btn" : `prof-btn ${proficiency}`;
  return `<button class="${cls}" ${attrs}>${symbol}</button>`;
}

export function pips(current: number, max: number, action: string, id: string): string {
  const total = Math.max(max, 0);
  let html = "";
  for (let i = 0; i < total; i++) {
    html += `<button class="pip${i < current ? " on" : ""}" data-action="${action}" data-id="${id}"
      data-index="${i}" aria-label="Charge ${i + 1}"></button>`;
  }
  return total === 0 ? `<span style="font-size:12.5px;color:var(--muted)">Aucune charge</span>` : html;
}