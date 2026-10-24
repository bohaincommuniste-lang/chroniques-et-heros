/** Calculs dérivés des règles de D&D 5e. */

import type { AbilityKey, Character, Proficiency, SkillEntry, OtherTest } from "./types.js";
import { mod } from "./utils.js";

export function abilityScore(c: Character, key: AbilityKey): number {
  return c.general.abilities[key]?.score ?? 10;
}

export function abilityMod(c: Character, key: AbilityKey): number {
  return mod(abilityScore(c, key));
}

export function proficiencyBonus(c: Character): number {
  return c.general.combat.proficiencyBonus || 2;
}

export function proficiencyMultiplier(p: Proficiency): number {
  return p === "expertise" ? 2 : p === "proficient" ? 1 : 0;
}

export function skillBonus(c: Character, skill: SkillEntry): number {
  return abilityMod(c, skill.ability) + proficiencyBonus(c) * proficiencyMultiplier(skill.proficiency);
}

export function otherTestBonus(c: Character, test: OtherTest): number {
  return abilityMod(c, test.ability) + proficiencyBonus(c) * proficiencyMultiplier(test.proficiency);
}

export function saveBonus(c: Character, key: AbilityKey): number {
  return abilityMod(c, key) + (c.general.abilities[key]?.saveProficiency ? proficiencyBonus(c) : 0);
}

export function totalLevel(c: Character): number {
  return c.general.classes.reduce((sum, k) => sum + (Number(k.level) || 0), 0);
}

export function classLine(c: Character): string {
  const parts = c.general.classes
    .filter((k) => k.name || k.level)
    .map((k) => {
      const name = k.name || "Classe inconnue";
      return k.level > 1 ? `${name} (niv. ${k.level})` : name;
    });
  return parts.join(" / ") || "Classe non renseignée";
}

export function carriesCapacityKg(c: Character): number {
  return Math.round(abilityScore(c, "str") * 7.5 * 10) / 10;
}

export function inventoryWeight(c: Character): number {
  return Math.round(
    c.inventory.items.reduce((sum, it) => sum + (Number(it.weight) || 0) * (Number(it.quantity) || 1), 0) * 100
  ) / 100;
}

export function spellcastingAbilityMod(c: Character): number {
  const key = c.spells.spellcastingAbility;
  if (!key) return 0;
  return abilityMod(c, key);
}

export function suggestedSpellDC(c: Character): number {
  return 8 + proficiencyBonus(c) + spellcastingAbilityMod(c);
}

export function suggestedSpellAttack(c: Character): number {
  return proficiencyBonus(c) + spellcastingAbilityMod(c);
}