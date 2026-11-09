// Sorcery damage rolls
export { rollSorceryWitsDamage, rollSorceryCustomDieDamage, rollSorceryFixedDamage } from "./roll-sorcery-damage.mjs";
/**
 * Roll mechanics for Conan: The Hyborian Age
 */

import { ConanSocket } from "./socket.mjs";
import { FlexEffectDialog } from "./flex-dialog.mjs";
import { DifficultyDialog } from "./difficulty-dialog.mjs";
import { getFlexDieColorset } from "./dice-utils.mjs";
import { renderCompactRoll, modifierTerm, poisonTerm, flexRow, dealDamageAction } from "./compact-roll.mjs";

/**
 * Roll an attribute check
 * @param {Actor} actor - The actor performing the roll
 * @param {string} attribute - The attribute key (might, edge, grit, wits)
 */
export async function rollAttribute(actor, attribute) {
  if (!actor || !attribute) {
    ui.notifications.error("Invalid roll parameters");
    return null;
  }

  const attrData = actor.system.attributes[attribute];
  if (!attrData) {
    ui.notifications.error(`Attribute ${attribute} not found`);
    return null;
  }

  // Ask for difficulty and modifier
  const result = await DifficultyDialog.prompt(actor);
  if (result === null) return null; // User cancelled
  
  const difficulty = result.difficulty;
  let modifier = result.modifier;
  
  // Apply poison effect 2: penalty to all rolls (multiplied)
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
  
  // Check if attributes are poisoned (effect 1)
  const attributePoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect1;
  const attributeValue = attrData.effectiveValue || attrData.value || 0;
  const attributeDie = attrData.die || "d6";
  const flexDie = actor.system.flexDie || "d10";
  // Check if flex die is disabled due to poison effect
  const flexDieDisabled = actor.system.poisoned && actor.system.poisonEffects?.effect5;
  
  // Get both polish and english attribute names
  const attributeAbbr = game.i18n.localize(`CONAN.Attributes.${attribute}.abbr`);
  const attributeLabel = game.i18n.localize(`CONAN.Attributes.${attribute}.label`);
  const displayName = game.i18n.lang === "pl" ? `${attributeAbbr} (${attributeLabel})` : attributeLabel;

  // Create the roll formula: 1d6 + attribute value (or d8/d10) + flex die (not added to total)
  const formula = `1${attributeDie} + ${attributeValue}`;
  const flexFormula = `1${flexDie}[${getFlexDieColorset()}]`;

  // Evaluate the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = flexDieDisabled ? null : await new Roll(flexFormula).evaluate();

  const mainTotal = mainRoll.total + modifier + poisonPenalty; // Apply modifier and poison penalty to final result
  const flexResult = flexDieDisabled ? 0 : flexRoll.dice[0].total;
  const flexMax = parseInt(flexDie.substring(1)); // Get max value from "d10" -> 10

  // Winds of Fate: if attribute die shows 1, the test fails regardless of modifiers
  const attributeDieResult = mainRoll.dice[0].total;
  const windsOfFate = attributeDieResult === 1;
  
  const success = windsOfFate ? false : (mainTotal >= difficulty);
  // Flex can only trigger if flex die is not disabled
  const flexTriggered = flexDieDisabled ? false : (flexResult === flexMax);

  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  let diceShown = false;
  if (game.dice3d) {
    diceShown = true;
    
    // Show both dice at once with different colors
    const promises = [];
    promises.push(game.dice3d.showForRoll(mainRoll, game.user, true));
    if (!flexDieDisabled) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, true));
    }
    
    // Wait for both animations to complete
    try {
      await Promise.all(promises);
    } catch(e) {
      // Dice3D canvas may be unavailable (e.g. resizing), ignore
    }
  }

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/conan-the-hyborian-age/templates/chat/attribute-roll.hbs",
    {
      displayName,
      attributeDieResult,
      attributeValue,
      attributePoisoned,
      modifierSign: modifier < 0 ? "−" : "+",
      modifierValue: Math.abs(modifier),
      poisonPenalty: Math.abs(poisonPenalty),
      poisoned: attributePoisoned || poisonPenalty !== 0 || flexDieDisabled,
      mainTotal,
      difficulty,
      success,
      windsOfFate,
      flexDieDisabled,
      flexResult,
      flexTriggered
    }
  );

  // Display result in chat
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    rollMode: game.settings.get("core", "messageMode"),
    flags: {
      "conan-the-hyborian-age": {
        rollType: "attribute"
      }
    }
  });

  // Broadcast roll to other clients via socket
  ConanSocket.broadcastRoll(actor, mainRoll, "attribute");

  // If flex triggered, show dialog
  if (flexTriggered) {
    const dialog = new FlexEffectDialog(actor, { mainRoll, flexRoll, success, isDamageRoll: false }, {
      rollContext: {
        isAttackRoll: false,
        attributeLabel: attributeLabel,
        attributeAbbr: attributeAbbr,
        displayName: displayName,
        attributeResult: attributeDieResult,
        attributeValue: attributeValue,
        modifier: modifier,
        difficulty: difficulty,
        total: mainTotal,
        flexResult: flexResult,
        flexMax: flexMax
      }
    });
    dialog.render(true);
  }

  return { mainRoll, flexRoll, success, flexTriggered };
}

/**
 * Roll for Initiative
 * @param {Actor} actor - The actor rolling initiative
 * @param {Combatant} combatant - The combatant in combat (optional, for token-based actors)
 */
export async function rollInitiative(actor, combatant = null) {
  if (!actor) {
    ui.notifications.error("Invalid actor for initiative roll");
    return null;
  }

  // Initiative is always based on Edge attribute
  const edgeData = actor.system.attributes.edge;
  if (!edgeData) {
    ui.notifications.error("Edge attribute not found");
    return null;
  }

  // Show dialog for modifier only (no difficulty)
  const { InitiativeDialog } = await import("./initiative-dialog.mjs");
  const result = await InitiativeDialog.prompt(actor);
  if (result === null) return null; // User cancelled
  
  let modifier = result.modifier;
  
  // Apply poison effect 2: penalty to all rolls (multiplied)
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
  
  const edgeValue = edgeData.value || 0;
  const edgeDie = edgeData.die || "d6";

  // Create roll formula (initiative never uses flex die)
  const formula = `1${edgeDie} + ${edgeValue}`;

  // Evaluate the roll
  const mainRoll = await new Roll(formula).evaluate();

  const initiativeResult = mainRoll.total + modifier + poisonPenalty;

  // Show dice in 3D
  if (game.dice3d) {
    try {
      await game.dice3d.showForRoll(mainRoll, game.user, true);
    } catch(e) {
      // Dice3D canvas may be unavailable (e.g. resizing), ignore
    }
  }

  // Update combat tracker initiative if actor is in combat
  const combat = game.combat;
  if (combat && combatant) {
    // Use the passed combatant directly (works for both linked and unlinked tokens)
    await combat.setInitiative(combatant.id, initiativeResult);
  } else if (combat && !combatant) {
    // Fallback: try to find by actorId (for sheets opened outside combat tracker)
    const foundCombatant = combat.combatants.find(c => c.actorId === actor.id);
    if (foundCombatant) {
      await combat.setInitiative(foundCombatant.id, initiativeResult);
    }
  }

  // Create chat message with calculation details
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;
  const edgeDieResult = mainRoll.dice[0].total;

  const terms = [
    { label: game.i18n.localize("CONAN.Roll.attributeDie"), value: edgeDieResult },
    { operator: "+", label: game.i18n.localize("CONAN.Roll.attributeValue"), value: edgeValue }
  ];
  if (modifier !== 0) terms.push(modifierTerm(modifier));
  if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

  const content = await renderCompactRoll({
    kind: game.i18n.localize("CONAN.Combat.initiative"),
    rootClass: "initiative-roll",
    poisoned: isPoisoned,
    terms,
    totalLabel: game.i18n.localize("CONAN.Combat.initiative"),
    total: initiativeResult
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content,
    rollMode: game.settings.get("core", "messageMode"),
    flags: {
      "conan-the-hyborian-age": {
        rollType: "initiative"
      }
    }
  });

  return { mainRoll, initiativeResult };
}

/**
 * Roll a skill check
 * @param {Actor} actor - The actor performing the roll
 * @param {string} skillName - The name of the skill
 * @param {string} attribute - The associated attribute
 */
export async function rollSkill(actor, skillName, attribute) {
  if (!actor || !skillName || !attribute) {
    ui.notifications.error("Invalid skill roll parameters");
    return null;
  }

  const attrData = actor.system.attributes[attribute];
  if (!attrData) {
    ui.notifications.error(`Attribute ${attribute} not found`);
    return null;
  }

  const attributeValue = attrData.value || 0;
  const attributeDie = attrData.die || "d6";

  // Create the roll formula
  const formula = `1${attributeDie} + @value`;
  const rollData = { value: attributeValue };

  // Evaluate the roll
  const roll = await new Roll(formula, rollData).evaluate();

  // Display in chat with 3D dice
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: `<strong>${skillName}</strong> (${game.i18n.localize(`CONAN.Attributes.${attribute}.label`)})`,
    rollMode: game.settings.get("core", "messageMode")
  }, {
    rollMode: game.settings.get("core", "messageMode")
  });

  // Trigger 3D dice if Dice So Nice module is active
  if (game.dice3d) {
    try {
      await game.dice3d.showForRoll(roll, game.user, true);
    } catch(e) {
      // Dice3D canvas may be unavailable (e.g. resizing), ignore
    }
  }

  return roll;
}

/**
 * Roll melee damage with Might attribute
 * @param {Actor} actor - The actor performing the roll
 * @param {Item} weapon - The weapon item (or null for unarmed)
 * @param {number} modifier - The damage modifier from slider
 */
export async function rollMeleeDamage(actor, weapon, modifier = 0) {
  if (!actor) {
    ui.notifications.error("Invalid damage roll parameters");
    return null;
  }

  // Check if unarmed combat (no weapon)
  const isUnarmed = !weapon || weapon === "unarmed";
  const weaponName = isUnarmed ? game.i18n.localize("CONAN.Damage.unarmedDamage") : weapon.name;
  
  // Get weapon damage - "2" for unarmed, or weapon's damage dice/value
  const weaponDamage = isUnarmed ? "2" : (weapon.system.damage?.dice || weapon.system.damage || "1d6");
  
  // Check if it's a fixed value (unarmed or improvised)
  const isFixedDamage = !weaponDamage.includes('d');
  
  // Get Might attribute value (with poison effect 1 applied)
  const might = actor.system.attributes.might.effectiveValue || actor.system.attributes.might.value;
  
  // Apply poison effect 2: penalty to all rolls (multiplied)
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
  
  // Build the roll formula: Might + Weapon Damage + Modifier + Poison Penalty
  const formula = `${might} + ${weaponDamage} + ${modifier} + ${poisonPenalty}`;
  
  // For characters (not NPCs), also roll flex die
  const isCharacter = actor.type === "character";
  const flexDie = isCharacter ? (actor.system.flexDie || "d10") : null;
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;
  
  // Create and execute the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}[${getFlexDieColorset()}]`).evaluate() : null;
  
  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);
  
  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    // Only show main roll dice if it has dice to show (not for unarmed/fixed damage)
    if (!isFixedDamage) {
      promises.push(game.dice3d.showForRoll(mainRoll, game.user, true));
    }
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, true));
    }
    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch(e) {
        // Dice3D canvas may be unavailable (e.g. resizing), ignore
      }
    }
  }
  
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;
  
  // Weapon part of the equation (handles formulas like "1d8+2")
  const weaponPart = damageTotal - might - modifier - poisonPenalty;

  const terms = [
    {
      label: weaponName,
      expression: isFixedDamage ? "" : weaponDamage,
      value: weaponPart
    },
    { operator: "+", label: game.i18n.localize("CONAN.Attributes.might.label"), value: might }
  ];
  if (modifier !== 0) terms.push(modifierTerm(modifier));
  if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

  const content = await renderCompactRoll({
    headerClass: "melee",
    rootClass: "damage-roll",
    kind: game.i18n.localize("CONAN.Damage.meleeDamage"),
    info: weaponName,
    poisoned: isPoisoned,
    terms,
    totalLabel: game.i18n.localize("CONAN.Common.damage"),
    total: damageTotal,
    flex: isCharacter ? flexRow({ disabled: !!flexDieDisabled, result: flexResult, triggered: !!flexTriggered }) : null,
    action: dealDamageAction(actor, damageTotal)
  });
  
  // Send to chat with flags
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
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
    const dialog = new FlexEffectDialog(actor, { mainRoll, flexRoll, success: true, isDamageRoll: true }, {
      rollContext: {
        attackType: 'melee',
        isDamageRoll: true,
        originalDamage: damageTotal,
        weaponDie: isFixedDamage ? null : weaponDamage,
        weaponModifier: 0,
        isFixedDamage: isFixedDamage
      }
    });
    dialog.render(true);
  }
  
  return { mainRoll, flexRoll, damageTotal, flexTriggered };
}

/**
 * Roll thrown weapon damage with Might attribute
 * @param {Actor} actor - The actor performing the roll
 * @param {Item} weapon - The thrown weapon item
 * @param {number} modifier - The damage modifier from slider
 */
export async function rollThrownDamage(actor, weapon, modifier = 0) {
  if (!actor || !weapon) {
    ui.notifications.error("Invalid damage roll parameters");
    return null;
  }

  // Get weapon damage - can be dice (e.g., "1d6") or fixed value (e.g., "2" for light improvised)
  const weaponDamage = weapon.system.damage?.dice || weapon.system.damage || "1d6";
  
  // Check if it's a fixed value (light improvised thrown weapon)
  const isFixedDamage = !weaponDamage.includes('d');
  
  // Get Might attribute value (with poison effect 1 applied)
  const might = actor.system.attributes.might.effectiveValue || actor.system.attributes.might.value;
  
  // Build the roll formula: Might + Weapon Damage + Modifier
  const formula = `${might} + ${weaponDamage} + ${modifier}`;
  
  // For characters (not NPCs), also roll flex die
  const isCharacter = actor.type === "character";
  const flexDie = isCharacter ? (actor.system.flexDie || "d10") : null;
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;
  
  // Create and execute the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}[${getFlexDieColorset()}]`).evaluate() : null;
  
  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexDieDisabled ? false : (flexRoll && (flexResult === flexMax));
  
  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    // Only show main roll dice if it has dice to show (not for unarmed/fixed damage)
    if (!isFixedDamage) {
      promises.push(game.dice3d.showForRoll(mainRoll, game.user, true));
    }
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, true));
    }
    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch(e) {
        // Dice3D canvas may be unavailable (e.g. resizing), ignore
      }
    }
  }
  
  // Weapon part of the equation (handles formulas like "1d8+2")
  const weaponPart = damageTotal - might - modifier;

  const terms = [
    {
      label: weapon.name,
      expression: isFixedDamage ? "" : weaponDamage,
      value: weaponPart
    },
    { operator: "+", label: game.i18n.localize("CONAN.Attributes.might.label"), value: might }
  ];
  if (modifier !== 0) terms.push(modifierTerm(modifier));

  const content = await renderCompactRoll({
    headerClass: "thrown",
    rootClass: "damage-roll",
    kind: game.i18n.localize("CONAN.Damage.thrownDamage"),
    info: weapon.name,
    terms,
    totalLabel: game.i18n.localize("CONAN.Common.damage"),
    total: damageTotal,
    flex: isCharacter ? flexRow({ disabled: !!flexDieDisabled, result: flexResult, triggered: !!flexTriggered }) : null,
    action: dealDamageAction(actor, damageTotal)
  });
  
  // Send to chat with flags
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
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
    const dialog = new FlexEffectDialog(actor, { mainRoll, flexRoll, success: true, isDamageRoll: true }, {
      rollContext: {
        attackType: 'thrown',
        isDamageRoll: true,
        originalDamage: damageTotal,
        weaponDie: isFixedDamage ? null : weaponDamage,
        weaponModifier: 0,
        isFixedDamage: isFixedDamage
      }
    });
    dialog.render(true);
  }
  
  return { mainRoll, flexRoll, damageTotal, flexTriggered };
}

/**
 * Roll ranged weapon damage
 * @param {Actor} actor - The actor dealing damage
 * @param {Item} weapon - The ranged weapon being used
 * @param {number} modifier - The damage modifier from slider
 */
export async function rollRangedDamage(actor, weapon, modifier = 0) {
  if (!actor || !weapon) {
    ui.notifications.error("Invalid damage roll parameters");
    return null;
  }

  // Get weapon damage (dice and modifier)
  const weaponDice = weapon.system.damage?.dice || weapon.system.damage || "1d6";
  const weaponBonus = weapon.system.damageModifier || 0;
  // Build the roll formula: Weapon Dice + Weapon Modifier + Slider Modifier
  const formula = `${weaponDice} + ${weaponBonus} + ${modifier}`;
  
  // For characters (not NPCs), also roll flex die
  const isCharacter = actor.type === "character";
  const flexDie = isCharacter ? (actor.system.flexDie || "d10") : null;
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;
  
  // Create and execute the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}[${getFlexDieColorset()}]`).evaluate() : null;
  
  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexDieDisabled ? false : (flexRoll && (flexResult === flexMax));
  
  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    // Always show main roll dice for ranged weapons
    promises.push(game.dice3d.showForRoll(mainRoll, game.user, true));
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, true));
    }
    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch(e) {
        // Dice3D canvas may be unavailable (e.g. resizing), ignore
      }
    }
  }
  
  // Weapon die result; weapon bonus and slider modifier are shown as a single modifier
  const totalModifier = (Number(weaponBonus) || 0) + modifier;
  const weaponDieResult = damageTotal - totalModifier;

  const terms = [{ label: weapon.name, expression: weaponDice, value: weaponDieResult }];
  if (totalModifier !== 0) terms.push(modifierTerm(totalModifier));

  const content = await renderCompactRoll({
    headerClass: "ranged",
    rootClass: "damage-roll",
    kind: game.i18n.localize("CONAN.Damage.rangedDamage"),
    info: weapon.name,
    terms,
    totalLabel: game.i18n.localize("CONAN.Common.damage"),
    total: damageTotal,
    flex: isCharacter ? flexRow({ disabled: !!flexDieDisabled, result: flexResult, triggered: !!flexTriggered }) : null,
    action: dealDamageAction(actor, damageTotal)
  });
  
  // Create chat message with flags
  const chatMessage = await ChatMessage.create({
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
    const dialog = new FlexEffectDialog(actor, { mainRoll, flexRoll, success: true, isDamageRoll: true }, {
      rollContext: {
        attackType: 'ranged',
        isDamageRoll: true,
        originalDamage: damageTotal,
        weaponDie: weaponDice,
        weaponModifier: weaponBonus,
        isFixedDamage: false
      }
    });
    dialog.render(true);
  }
  
  return { damageRoll: mainRoll, flexRoll, damageTotal, flexTriggered };
}

/**
 * Roll NPC damage
 * @param {Actor} actor - The NPC actor rolling damage
 * @param {string} attackType - The attack type ('melee' or 'ranged')
 * @returns {Object} - The roll result object
 */
export async function rollNPCDamage(actor, attackIndex) {
  if (!actor || (actor.type !== "minion" && actor.type !== "antagonist")) {
    ui.notifications.error("Invalid NPC actor for damage roll");
    return null;
  }

  // Obsługa starego formatu danych (obiekt) i nowego (tablica ArrayField)
  const rawDamage = actor.system.damage;
  const damageArray = Array.isArray(rawDamage) ? rawDamage : Object.values(rawDamage ?? {});
  const damageData = damageArray[attackIndex];
  const attackType = damageData?.type || 'melee';
  
  if (!damageData || damageData.notApplicable) {
    ui.notifications.warn(game.i18n.localize("CONAN.Warnings.damageNotApplicable"));
    return null;
  }

  // Show damage dialog
  const { NPCDamageDialog } = await import("./npc-damage-dialog.mjs");
  const result = await NPCDamageDialog.prompt(actor, attackIndex);
  if (result === null) return null; // User cancelled
  
  const modifier = result.modifier || 0;
  const damageDie = damageData.die || "d6";
  const damageModifier = damageData.modifier || 0;
  const weaponName = damageData.name || game.i18n.localize("CONAN.NPC.weaponName");
  
  // Apply poison effect 2: penalty to all rolls (multiplied)
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;
  
  // For melee attacks, add Brawn value
  let brawnValue = 0;
  if (attackType.startsWith('melee')) {
    brawnValue = actor.system.attributes.might?.effectiveValue || actor.system.attributes.might?.value || 0;
  }
  
  // Roll damage die
  const damageRoll = await new Roll(`1${damageDie}`).evaluate();
  const dieResult = damageRoll.total;
  
  // Calculate total damage (including poison penalty)
  // Melee: Brawn + die + modifier from card + slider modifier + poison penalty
  // Ranged: die + modifier from card + slider modifier + poison penalty
  const totalDamage = Math.max(0, brawnValue + dieResult + damageModifier + modifier + poisonPenalty);
  
  // Note: Don't manually show 3D dice here - ChatMessage.create with rolls: [damageRoll]
  // will automatically trigger the dice animation via Dice So Nice
  
  // Determine NPC type for styling
  const npcType = actor.type; // "minion" or "antagonist"
  const npcClass = npcType === "minion" ? "minion-roll" : "antagonist-roll";
  const attackTypeLabel = attackType.startsWith('melee') 
    ? game.i18n.localize("CONAN.NPC.meleeDamage")
    : game.i18n.localize("CONAN.NPC.rangedDamage");
  
  // Create chat message
  const modifierTotal = damageModifier + modifier;

  const terms = [{ label: game.i18n.localize('CONAN.NPC.damageDie'), value: dieResult }];
  if (brawnValue > 0) {
    terms.push({ operator: "+", label: game.i18n.localize('CONAN.Attributes.might.label'), value: brawnValue });
  }
  if (modifierTotal !== 0) terms.push(modifierTerm(modifierTotal));
  if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

  const content = await renderCompactRoll({
    rootClass: `npc-roll ${npcClass} damage-roll`,
    kind: attackTypeLabel,
    info: weaponName,
    poisoned: isPoisoned,
    terms,
    totalLabel: game.i18n.localize('CONAN.Damage.totalDamage'),
    total: totalDamage,
    action: {
      buttonClass: "deal-damage-btn",
      icon: "fa-heart-broken",
      label: game.i18n.localize('CONAN.Damage.DealDamage'),
      data: {
        damage: totalDamage,
        "attacker-id": actor.id,
        "token-id": actor.token?.id || '',
        "scene-id": actor.token?.parent?.id || ''
      }
    }
  });
  
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    rolls: [damageRoll],
    sound: CONFIG.sounds.dice,
    rollMode: game.settings.get("core", "messageMode"),
    flags: {
      "conan-the-hyborian-age": {
        damageDealt: false,
        totalDamage: totalDamage,
        attackerId: actor.id
      }
    }
  });
  
  return { damageRoll, totalDamage, messageId: chatMessage.id };
}

/**
 * Apply damage to target actor
 * @param {number} totalDamage - Total damage rolled
 * @param {Actor} target - Target actor receiving damage
 * @param {Actor} attacker - Attacker actor
 * @returns {Object} - Result of damage application
 */
export async function applyNPCDamage(totalDamage, targetToken, attacker) {
  if (!targetToken) {
    ui.notifications.error(game.i18n.localize("CONAN.Damage.noTarget"));
    return null;
  }

  // Get target actor from token (supports both linked and unlinked tokens)
  const target = targetToken.actor || targetToken;
  const isToken = targetToken.actor !== undefined;

  // Get target's armor value based on actor type
  let armor = 0;
  if (target.type === "character") {
    // For characters, calculate total AR from equipped armor items
    let totalAR = 0;
    for (let item of target.items) {
      if (item.type === "armor" && item.system.equipped) {
        totalAR += item.system.armorRating || 0;
      }
    }
    // Add base armor value from combat stats
    const baseArmor = target.system.combat?.armor || 0;
    armor = baseArmor + totalAR;
  } else {
    // For NPCs, use the armor field directly
    armor = target.system.armor || 0;
  }
  
  // Calculate damage after armor (minimum 1 if attack succeeded)
  let finalDamage = totalDamage - armor;
  if (finalDamage <= 0) {
    finalDamage = 1; // Successful attack always deals at least 1 damage
  }
  
  const targetType = target.type;
  let resultMessage = "";
  let defeated = false;
  let isAlreadyUnconscious = false;
  
  if (targetType === "character") {
    // Player character - reduce actual HP
    isAlreadyUnconscious = target.statuses?.has("unconscious") ?? false;
    // If there's an open sheet, submit any pending changes first
    if (target.sheet?.rendered && target.sheet.element) {
      const form = target.sheet.element.querySelector
        ? target.sheet.element.querySelector('form')
        : target.sheet.element.find?.('form')?.[0];
      if (form) {
        // Trigger blur on active element to save any pending edits
        const activeElement = document.activeElement;
        if (activeElement && form.contains(activeElement)) {
          activeElement.blur();
          // Wait a tiny bit for the blur event to process
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    // Get current HP after potential blur/save
    const currentHP = target.system.lifePoints?.value || 0;
    const newHP = Math.max(0, currentHP - finalDamage);
    
    // Update token if unlinked, otherwise actor
    if (isToken && !targetToken.actorLink) {
      // For unlinked tokens in v13, use delta.system path
      await ConanSocket.requestTokenUpdate(
        targetToken.parent.id,
        targetToken.id,
        { "delta.system.lifePoints.value": newHP }
      );
    } else {
      await ConanSocket.requestActorUpdate(
        target.id,
        { "system.lifePoints.value": newHP }
      );
    }
    
    resultMessage = game.i18n.format("CONAN.Damage.characterTookDamage", {
      name: target.name,
      damage: finalDamage,
      armor: armor,
      remaining: newHP
    });
    
    if (newHP === 0) {
      defeated = true;
      if (isAlreadyUnconscious) {
        // Nieprzytomna postać nie dostaje szansy na WoŻ – od razu ginie
        const sceneId = isToken ? targetToken.parent?.id : null;
        const tokenId = isToken ? targetToken.id : null;
        await ConanSocket.requestToggleStatusEffect(sceneId, tokenId, target.id, "dead", true);
        if (game.combat && ui.combat) ui.combat.render();
      }
    }
    
  } else if (targetType === "antagonist") {
    // Antagonist NPC - reduce life points
    const currentLP = target.system.lifePoints?.value ?? target.system.lifePoints ?? 0;
    const newLP = Math.max(0, currentLP - finalDamage);
    
    // Update token if unlinked, otherwise actor
    if (isToken && !targetToken.actorLink) {
      // For unlinked tokens in v13, use delta.system path
      await ConanSocket.requestTokenUpdate(
        targetToken.parent.id,
        targetToken.id,
        { "delta.system.lifePoints.value": newLP }
      );
    } else {
      await ConanSocket.requestActorUpdate(
        target.id,
        { "system.lifePoints.value": newLP }
      );
    }
    
    resultMessage = game.i18n.format("CONAN.Damage.antagonistTookDamage", {
      name: target.name,
      damage: finalDamage,
      armor: armor,
      remaining: newLP
    });
    
    if (newLP === 0) {
      defeated = true;
      // Mark as defeated: apply "dead" status effect (overlay handled by Foundry via Active Effect)
      await ConanSocket.requestToggleStatusEffect(
        targetToken.parent?.id,
        targetToken.id,
        target.id,
        "dead",
        true
      );
      const combatant = game.combat?.combatants.find(c => c.tokenId === targetToken.id);
      if (combatant) {
        await ConanSocket.requestCombatantUpdate(combatant.id, { defeated: true });
      }
    }
    
  } else if (targetType === "minion") {
    // Minion NPC - compare damage to threshold
    const threshold = target.system.threshold || 0;
    const isWounded = target.system.wounded || false;
    
    if (isWounded) {
      // Already wounded, any hit kills
      defeated = true;
      resultMessage = game.i18n.format("CONAN.Damage.minionDefeated", {
        name: target.name,
        damage: finalDamage,
        armor: armor
      });
      
      // Mark minion as defeated (update token if unlinked, otherwise actor)
      if (isToken && !targetToken.actorLink) {
        await ConanSocket.requestTokenUpdate(
          targetToken.parent.id,
          targetToken.id,
          { "delta.system.defeated": true }
        );
      } else {
        await ConanSocket.requestActorUpdate(
          target.id,
          { "system.defeated": true }
        );
      }
      await ConanSocket.requestToggleStatusEffect(
        targetToken.parent?.id,
        targetToken.id,
        target.id,
        "dead",
        true
      );

      const combatant = game.combat?.combatants.find(c => c.tokenId === targetToken.id);
      if (combatant) {
        await ConanSocket.requestCombatantUpdate(combatant.id, { defeated: true });
      }

    } else if (finalDamage >= threshold) {
      // Damage meets or exceeds threshold - instant defeat
      defeated = true;
      resultMessage = game.i18n.format("CONAN.Damage.minionDefeated", {
        name: target.name,
        damage: finalDamage,
        armor: armor
      });
      
      // Mark minion as defeated (update token if unlinked, otherwise actor)
      if (isToken && !targetToken.actorLink) {
        await ConanSocket.requestTokenUpdate(
          targetToken.parent.id,
          targetToken.id,
          { "delta.system.defeated": true }
        );
      } else {
        await ConanSocket.requestActorUpdate(
          target.id,
          { "system.defeated": true }
        );
      }
      await ConanSocket.requestToggleStatusEffect(
        targetToken.parent?.id,
        targetToken.id,
        target.id,
        "dead",
        true
      );

      const combatant = game.combat?.combatants.find(c => c.tokenId === targetToken.id);
      if (combatant) {
        await ConanSocket.requestCombatantUpdate(combatant.id, { defeated: true });
      }

    } else {
      // Damage below threshold - mark as wounded
      defeated = false; // Sługus przeżył, tylko ranny

      // Mark minion as wounded (update token if unlinked, otherwise actor)
      if (isToken && !targetToken.actorLink) {
        await ConanSocket.requestTokenUpdate(
          targetToken.parent.id,
          targetToken.id,
          { "delta.system.wounded": true }
        );
      } else {
        await ConanSocket.requestActorUpdate(
          target.id,
          { "system.wounded": true }
        );
      }
      // Apply wounded status effect icon and refresh combat tracker
      await ConanSocket.requestToggleStatusEffect(
        targetToken.parent?.id,
        targetToken.id,
        target.id,
        "wounded",
        true
      );
      if (game.combat && ui.combat) ui.combat.render();

      resultMessage = game.i18n.format("CONAN.Damage.minionWounded", {
        name: target.name,
        damage: finalDamage,
        armor: armor,
        threshold: threshold
      });
    }
  }
  
  // Create chat message with result
  const fightForLifeHtml = (defeated && targetType === "character" && !isAlreadyUnconscious) ? `
    <div class="fight-for-life-container" style="margin-top: 10px; padding: 10px; background: rgba(220, 20, 60, 0.1); border: 2px solid #dc143c; border-radius: 6px; text-align: center;">
      <div style="margin-bottom: 8px; color: #8b0000; font-weight: bold;">
        <i class="fas fa-heart-broken" style="color: #dc143c;"></i> ${game.i18n.localize('CONAN.FightForLife.warning')}
      </div>
      <button class="fight-for-life-btn"
        data-actor-id="${target.id}"
        style="background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
               color: white;
               border: 2px solid #8b0000;
               border-radius: 6px;
               padding: 8px 16px;
               font-weight: bold;
               cursor: pointer;
               transition: all 0.2s;">
        <i class="fas fa-dice-d20"></i> ${game.i18n.localize('CONAN.FightForLife.button')}
      </button>
    </div>
  ` : (defeated && targetType === "character" && isAlreadyUnconscious) ? `
    <div class="fight-for-life-container" style="margin-top: 10px; padding: 10px; background: rgba(0, 0, 0, 0.2); border: 2px solid #4a0000; border-radius: 6px; text-align: center;">
      <div style="color: #8b0000; font-weight: bold;">
        <i class="fas fa-skull" style="color: #4a0000;"></i> ${game.i18n.localize('CONAN.FightForLife.killedUnconscious')}
      </div>
    </div>
  ` : '';

  const messageContent = `
    <div class="conan-damage-applied">
      <h3>${game.i18n.localize('CONAN.Damage.damageApplied')}</h3>
      <div class="damage-info">
        <p><strong>${game.i18n.localize('CONAN.Damage.attacker')}:</strong> ${attacker.name}</p>
        <p><strong>${game.i18n.localize('CONAN.Damage.target')}:</strong> ${target.name}</p>
        <p><strong>${game.i18n.localize('CONAN.Damage.totalDamage')}:</strong> ${totalDamage}</p>
        <p><strong>${game.i18n.localize('CONAN.Damage.armor')}:</strong> ${armor}</p>
        <p><strong>${game.i18n.localize('CONAN.Damage.finalDamage')}:</strong> ${finalDamage}</p>
      </div>
      <div class="damage-result-text ${defeated ? 'defeated' : ''}">
        ${resultMessage}
      </div>
      ${(defeated && targetType !== "character") ? `<div class="defeated-banner">${game.i18n.localize('CONAN.Damage.defeated')}</div>` : ''}
      ${fightForLifeHtml}
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attacker }),
    content: messageContent,
    sound: defeated ? CONFIG.sounds.notification : null
  });
  
  return { finalDamage, defeated, target };
}
