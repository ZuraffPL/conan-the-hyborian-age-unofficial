import { getFlexDieColorset } from "./dice-utils.mjs";
import { renderCompactRoll, modifierTerm, poisonTerm, flexRow, dealDamageAction } from "./compact-roll.mjs";

/**
 * Roll sorcery damage using a fixed value (stała wartość)
 * @param {Actor} actor - The actor dealing damage
 * @param {number} fixedValue - Wartość stałych obrażeń wpisana przez gracza
 * @param {number} paramModifier - Modifier from spell parameters
 * @param {number} sliderModifier - Modifier from slider
 */
export async function rollSorceryFixedDamage(actor, fixedValue = 0, paramModifier = 0, sliderModifier = 0) {
  if (!actor) {
    ui.notifications.error("Invalid damage roll parameters");
    return null;
  }

  const flexDie = actor.system.flexDie || "d10";
  const isCharacter = actor.type === "character";
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;

  // Apply poison effect 2: penalty to damage rolls (multiplied)
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;

  // Sum modifiers
  const totalModifier = Number(paramModifier) + Number(sliderModifier);
  const total = Number(fixedValue) + totalModifier + poisonPenalty;

  // Flex die roll
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}[${getFlexDieColorset()}]`).evaluate() : null;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);

  // Show flex die in 3D (if Dice So Nice is active)
  if (game.dice3d && flexRoll) {
    await game.dice3d.showForRoll(flexRoll, game.user, true);
  }

  // Prepare chat message content
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;

  const terms = [{ label: game.i18n.localize("CONAN.Damage.fixedValue"), value: Number(fixedValue) }];
  if (totalModifier !== 0) terms.push(modifierTerm(totalModifier));
  if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

  const content = await renderCompactRoll({
    rootClass: "damage-roll spellcasting-roll",
    kind: game.i18n.localize("CONAN.Damage.sorceryDamage"),
    info: game.i18n.localize("CONAN.Damage.sorceryFixedValue"),
    poisoned: isPoisoned,
    terms,
    totalLabel: game.i18n.localize("CONAN.Common.damage"),
    total,
    flex: isCharacter ? flexRow({ disabled: !!flexDieDisabled, result: flexResult, triggered: !!flexTriggered }) : null,
    action: dealDamageAction(actor, total)
  });

  // Create chat message with flags
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    sound: CONFIG.sounds.dice,
    rollMode: game.settings.get("core", "messageMode"),
    flags: {
      "conan-the-hyborian-age": {
        damageDealt: false,
        totalDamage: total,
        attackerId: actor._id || actor.id,
        tokenId: actor.token?.id || '',
        sceneId: actor.token?.parent?.id || ''
      }
    }
  });

  // If flex triggered, show dialog for character
  if (flexTriggered && isCharacter) {
    const { FlexEffectDialog } = await import("./flex-dialog.mjs");
    const spellCost = actor.flags?.["conan-the-hyborian-age"]?.lastSpellCost || {};
    const dialog = new FlexEffectDialog(actor, { 
      mainRoll: null, 
      flexRoll, 
      success: true, 
      isDamageRoll: true 
    }, {
      rollContext: {
        attackType: 'sorcery',
        isDamageRoll: true,
        lifePointsCost: spellCost.lifePointsCost || 0,
        staminaCost: spellCost.staminaCost || 0,
        originalDamage: total,
        weaponDie: null,
        weaponModifier: 0,
        isFixedDamage: true
      }
    });
    dialog.render(true);
  }

  return { total, flexRoll, flexTriggered };
}
/**
 * Roll sorcery damage using a custom die (selected in dialog)
 * @param {Actor} actor - The actor dealing damage
 * @param {string} dieType - Die type string, e.g. 'd4', 'd6', 'd8', 'd10', 'd12'
 * @param {number} paramModifier - Modifier from spell parameters
 * @param {number} sliderModifier - Modifier from slider
 */
export async function rollSorceryCustomDieDamage(actor, dieType = 'd6', paramModifier = 0, sliderModifier = 0) {
  if (!actor) {
    ui.notifications.error("Invalid damage roll parameters");
    return null;
  }

  const flexDie = actor.system.flexDie || "d10";
  const isCharacter = actor.type === "character";
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;

  // Apply poison effect 2: penalty to damage rolls (multiplied)
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;

  // Sum modifiers
  const totalModifier = Number(paramModifier) + Number(sliderModifier);
  // Build the roll formula: Custom Die + total modifier + poison penalty
  const formula = `1${dieType} + ${totalModifier} + ${poisonPenalty}`;
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}[${getFlexDieColorset()}]`).evaluate() : null;

  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);

  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    promises.push(game.dice3d.showForRoll(mainRoll, game.user, true));
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, true));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  // Prepare chat message content (inspired by melee damage)
  const dieResult = mainRoll.dice.length > 0 ? mainRoll.dice[0].total : null;
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;

  const terms = [{
    label: game.i18n.localize("CONAN.Damage.sorceryCustomDie"),
    expression: dieType,
    value: dieResult
  }];
  if (totalModifier !== 0) terms.push(modifierTerm(totalModifier));
  if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

  const content = await renderCompactRoll({
    rootClass: "damage-roll spellcasting-roll",
    kind: game.i18n.localize("CONAN.Damage.sorceryDamage"),
    info: game.i18n.localize("CONAN.Damage.sorceryCustomDie"),
    poisoned: isPoisoned,
    terms,
    totalLabel: game.i18n.localize("CONAN.Common.damage"),
    total: damageTotal,
    flex: isCharacter ? flexRow({ disabled: !!flexDieDisabled, result: flexResult, triggered: !!flexTriggered }) : null,
    action: dealDamageAction(actor, damageTotal)
  });

  // Create chat message with flags
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    sound: CONFIG.sounds.dice,
    rollMode: game.settings.get("core", "messageMode"),
    flags: {
      "conan-the-hyborian-age": {
        damageDealt: false,
        totalDamage: damageTotal,
        attackerId: actor._id || actor.id,
        tokenId: actor.token?.id || '',
        sceneId: actor.token?.parent?.id || ''
      }
    }
  });

  // If flex triggered, show dialog for character
  if (flexTriggered && isCharacter) {
    const { FlexEffectDialog } = await import("./flex-dialog.mjs");
    const spellCost = actor.flags?.["conan-the-hyborian-age"]?.lastSpellCost || {};
    const dialog = new FlexEffectDialog(actor, { 
      mainRoll, 
      flexRoll, 
      success: true, 
      isDamageRoll: true 
    }, {
      rollContext: {
        attackType: 'sorcery',
        isDamageRoll: true,
        lifePointsCost: spellCost.lifePointsCost || 0,
        staminaCost: spellCost.staminaCost || 0,
        originalDamage: damageTotal,
        weaponDie: dieType,
        weaponModifier: 0,
        isFixedDamage: false
      }
    });
    dialog.render(true);
  }

  return { mainRoll, flexRoll, damageTotal, flexTriggered };
}
/**
 * Sorcery damage roll mechanics for Conan: The Hyborian Age
 */

/**
 * Roll sorcery damage using Wits die (kość sprytu)
 * @param {Actor} actor - The actor dealing damage
 * @param {number} modifier - The damage modifier from slider
 */
/**
 * Roll sorcery damage using Wits die (kość sprytu)
 * @param {Actor} actor - The actor dealing damage
 * @param {number} paramModifier - Modifier from spell parameters
 * @param {number} sliderModifier - Modifier from slider
 */
export async function rollSorceryWitsDamage(actor, paramModifier = 0, sliderModifier = 0) {
  if (!actor) {
    ui.notifications.error("Invalid damage roll parameters");
    return null;
  }

  const witsDie = actor.system.attributes.wits.die || "d6";
  const flexDie = actor.system.flexDie || "d10";
  const isCharacter = actor.type === "character";
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;

  // Apply poison effect 2: penalty to damage rolls (multiplied)
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;

  // Sum modifiers
  const totalModifier = Number(paramModifier) + Number(sliderModifier);
  // Build the roll formula: Wits Die + total modifier + poison penalty
  const formula = `1${witsDie} + ${totalModifier} + ${poisonPenalty}`;
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}[${getFlexDieColorset()}]`).evaluate() : null;

  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);

  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    promises.push(game.dice3d.showForRoll(mainRoll, game.user, true));
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, true));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  // Prepare chat message content (inspired by melee damage)
  const witsDieResult = mainRoll.dice.length > 0 ? mainRoll.dice[0].total : null;
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;

  const terms = [{
    label: game.i18n.localize("CONAN.Damage.sorceryWitsDie"),
    expression: witsDie,
    value: witsDieResult
  }];
  if (totalModifier !== 0) terms.push(modifierTerm(totalModifier));
  if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

  const content = await renderCompactRoll({
    rootClass: "damage-roll spellcasting-roll",
    kind: game.i18n.localize("CONAN.Damage.sorceryDamage"),
    info: `${game.i18n.localize("CONAN.Attributes.wits.label")} (${game.i18n.localize("CONAN.Attributes.wits.abbr")})`,
    poisoned: isPoisoned,
    terms,
    totalLabel: game.i18n.localize("CONAN.Common.damage"),
    total: damageTotal,
    flex: isCharacter ? flexRow({ disabled: !!flexDieDisabled, result: flexResult, triggered: !!flexTriggered }) : null,
    action: dealDamageAction(actor, damageTotal)
  });

  // Create chat message with flags
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    sound: CONFIG.sounds.dice,
    rollMode: game.settings.get("core", "messageMode"),
    flags: {
      "conan-the-hyborian-age": {
        damageDealt: false,
        totalDamage: damageTotal,
        attackerId: actor._id || actor.id,
        tokenId: actor.token?.id || '',
        sceneId: actor.token?.parent?.id || ''
      }
    }
  });

  // If flex triggered, show dialog for character
  if (flexTriggered && isCharacter) {
    const witsDie = actor.system.attributes.wits.die || 'd6';
    const { FlexEffectDialog } = await import("./flex-dialog.mjs");
    const spellCost = actor.flags?.["conan-the-hyborian-age"]?.lastSpellCost || {};
    const dialog = new FlexEffectDialog(actor, { 
      mainRoll, 
      flexRoll, 
      success: true, 
      isDamageRoll: true 
    }, {
      rollContext: {
        attackType: 'sorcery',
        isDamageRoll: true,
        lifePointsCost: spellCost.lifePointsCost || 0,
        staminaCost: spellCost.staminaCost || 0,
        originalDamage: damageTotal,
        weaponDie: witsDie,
        weaponModifier: 0,
        isFixedDamage: false
      }
    });
    dialog.render(true);
  }

  return { mainRoll, flexRoll, damageTotal, flexTriggered };
}
