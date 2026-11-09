/**
 * Shared helpers for compact roll chat cards (initiative, attack, damage, spellcasting)
 */

const COMPACT_ROLL_TEMPLATE = "systems/conan-the-hyborian-age/templates/chat/compact-roll.hbs";

/**
 * Render a compact roll card
 * @param {object} data - Template data (see templates/chat/compact-roll.hbs)
 * @returns {Promise<string>} Rendered HTML
 */
export function renderCompactRoll(data) {
  return foundry.applications.handlebars.renderTemplate(COMPACT_ROLL_TEMPLATE, data);
}

/**
 * Build an equation term for a signed modifier
 * @param {number} value - Signed modifier value
 * @returns {object}
 */
export function modifierTerm(value) {
  return {
    operator: value < 0 ? "−" : "+",
    label: game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel"),
    value: Math.abs(value)
  };
}

/**
 * Build an equation term for the poison penalty (effect 2)
 * @param {number} multiplier - Penalty size
 * @returns {object}
 */
export function poisonTerm(multiplier) {
  return {
    operator: "−",
    label: game.i18n.localize("CONAN.Roll.poisonPenalty"),
    value: multiplier,
    poison: true
  };
}

/**
 * Build the Flex die row data
 * @param {object} options
 * @param {boolean} options.disabled - Flex die locked by poison
 * @param {number} options.result - Flex die result
 * @param {boolean} options.triggered - Flex effect triggered
 * @returns {object}
 */
export function flexRow({ disabled = false, result = 0, triggered = false }) {
  return { disabled, result, triggered };
}

/**
 * Build the "Deal damage" action for damage cards
 * @param {Actor} actor - The attacking actor
 * @param {number} damage - Total damage
 * @returns {object}
 */
export function dealDamageAction(actor, damage) {
  return {
    buttonClass: "deal-pc-damage-btn",
    icon: "fa-heart-broken",
    label: game.i18n.localize("CONAN.Damage.DealDamage"),
    data: {
      damage,
      "attacker-id": actor._id || actor.id,
      "token-id": actor.token?.id || "",
      "scene-id": actor.token?.parent?.id || ""
    }
  };
}
