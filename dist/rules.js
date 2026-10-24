/** Calculs dérivés des règles de D&D 5e. */
import { mod } from "./utils.js";
export function abilityScore(c, key) {
    return c.general.abilities[key]?.score ?? 10;
}
export function abilityMod(c, key) {
    return mod(abilityScore(c, key));
}
export function proficiencyBonus(c) {
    return c.general.combat.proficiencyBonus || 2;
}
export function proficiencyMultiplier(p) {
    return p === "expertise" ? 2 : p === "proficient" ? 1 : 0;
}
export function skillBonus(c, skill) {
    return abilityMod(c, skill.ability) + proficiencyBonus(c) * proficiencyMultiplier(skill.proficiency);
}
export function otherTestBonus(c, test) {
    return abilityMod(c, test.ability) + proficiencyBonus(c) * proficiencyMultiplier(test.proficiency);
}
export function saveBonus(c, key) {
    return abilityMod(c, key) + (c.general.abilities[key]?.saveProficiency ? proficiencyBonus(c) : 0);
}
export function totalLevel(c) {
    return c.general.classes.reduce((sum, k) => sum + (Number(k.level) || 0), 0);
}
export function classLine(c) {
    const parts = c.general.classes
        .filter((k) => k.name || k.level)
        .map((k) => {
        const name = k.name || "Classe inconnue";
        return k.level > 1 ? `${name} (niv. ${k.level})` : name;
    });
    return parts.join(" / ") || "Classe non renseignée";
}
export function carriesCapacityKg(c) {
    return Math.round(abilityScore(c, "str") * 7.5 * 10) / 10;
}
export function inventoryWeight(c) {
    return Math.round(c.inventory.items.reduce((sum, it) => sum + (Number(it.weight) || 0) * (Number(it.quantity) || 1), 0) * 100) / 100;
}
export function spellcastingAbilityMod(c) {
    const key = c.spells.spellcastingAbility;
    if (!key)
        return 0;
    return abilityMod(c, key);
}
export function suggestedSpellDC(c) {
    return 8 + proficiencyBonus(c) + spellcastingAbilityMod(c);
}
export function suggestedSpellAttack(c) {
    return proficiencyBonus(c) + spellcastingAbilityMod(c);
}
//# sourceMappingURL=rules.js.map