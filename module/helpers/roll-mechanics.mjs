// Sorcery damage rolls
export { rollSorceryWitsDamage, rollSorceryCustomDieDamage, rollSorceryFixedDamage } from "./roll-sorcery-damage.mjs";
/**
 * Roll mechanics for Conan: The Hyborian Age
 */

import { ConanSocket } from "./socket.mjs";
import { FlexEffectDialog } from "./flex-dialog.mjs";
import { DifficultyDialog } from "./difficulty-dialog.mjs";

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
  
  // Apply poison effect 2: -1 penalty to all rolls
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -1 : 0;
  
  const attributeValue = attrData.value || 0;
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
  const flexFormula = `1${flexDie}`;

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
    promises.push(game.dice3d.showForRoll(mainRoll, game.user, false));
    if (!flexDieDisabled) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, false, null, false, null, {
        appearance: {
          colorset: "bronze"
        }
      }));
    }
    
    // Wait for both animations to complete
    await Promise.all(promises);
  }

  // Create modern chat message
  const modifierText = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
  const modifierSign = modifier >= 0 ? '+' : '';
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;
  
  const content = `
    <div class="conan-roll-chat ${isPoisoned ? 'poisoned-roll' : ''}">
      <div class="roll-header">
        <h3>${game.i18n.localize('CONAN.Roll.attributeTest')}${isPoisoned ? ' <i class="fas fa-skull-crossbones poison-skull" style="color: #15a20e;"></i>' : ''}</h3>
        <div class="attribute-info">${displayName}</div>
      </div>
      <div class="roll-details">
        <div class="dice-results">
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.attributeDie')}</div>
            <div class="die-result${windsOfFate ? ' winds-of-fate' : ''}">${attributeDieResult}</div>
          </div>
          ${!flexDieDisabled ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result${flexTriggered ? ' flex-effect' : ''}">${flexResult}</div>
          </div>
          ` : `
          <div class="dice-roll disabled">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result disabled"><i class="fas fa-ban"></i></div>
          </div>
          `}
        </div>
        
        <div class="calculation">
          <span class="calc-part">${attributeDieResult}</span>
          <span class="calc-operator">+</span>
          <span class="calc-part">${attributeValue}</span>
          ${modifier !== 0 ? `<span class="calc-operator">${modifierSign}</span><span class="calc-part">${Math.abs(modifier)}</span>` : ''}
          ${poisonPenalty !== 0 ? `<span class="calc-operator">-</span><span class="calc-part poison-penalty">1</span>` : ''}
          <span class="calc-operator">=</span>
          <span class="calc-total">${mainTotal}</span>
        </div>
        
        <div class="difficulty-check">
          <span class="difficulty-label">${game.i18n.localize('CONAN.Roll.targetDifficulty')}:</span>
          <span class="difficulty-value">${difficulty}</span>
        </div>
        
        <div class="roll-result ${success ? 'success' : 'failure'}">
          <div class="result-text">${success ? game.i18n.localize('CONAN.Roll.success') : game.i18n.localize('CONAN.Roll.failure')}</div>
          ${windsOfFate ? `<div class="winds-notice"><i class="fas fa-wind"></i> ${game.i18n.localize('CONAN.Roll.windsOfFate')}</div>` : ''}
          ${flexTriggered ? `<div class="flex-notice"><i class="fas fa-star"></i> ${game.i18n.localize('CONAN.Roll.flexEffect')}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  // Display result in chat
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    rollMode: game.settings.get("core", "rollMode"),
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
  
  // Apply poison effect 2: -1 penalty to all rolls
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -1 : 0;
  
  const edgeValue = edgeData.value || 0;
  const edgeDie = edgeData.die || "d6";
  
  // Check if this is an NPC (no flex die for NPCs)
  const isNPC = actor.type === "minion" || actor.type === "antagonist";
  const flexDie = isNPC ? null : (actor.system.flexDie || "d10");
  // Disable flex die for NPCs or if poisoned with effect5
  const flexDieDisabled = isNPC || (actor.system.poisoned && actor.system.poisonEffects?.effect5);

  // Create roll formulas
  const formula = `1${edgeDie} + ${edgeValue}`;
  const flexFormula = flexDieDisabled ? null : `1${flexDie}`;

  // Evaluate the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = flexDieDisabled ? null : await new Roll(flexFormula).evaluate();

  const initiativeResult = mainRoll.total + modifier + poisonPenalty;
  const flexResult = flexDieDisabled ? 0 : flexRoll.dice[0].total;
  const flexMax = flexDieDisabled ? 0 : parseInt(flexDie.substring(1));
  const flexTriggered = flexDieDisabled ? false : (flexResult === flexMax);

  // Show both dice in 3D simultaneously
  if (game.dice3d) {
    const promises = [];
    promises.push(game.dice3d.showForRoll(mainRoll, game.user, false));
    if (!flexDieDisabled) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, false, null, false, null, {
        appearance: { colorset: "bronze" }
      }));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
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

  // Create simple chat message
  const modifierText = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
  const characterName = actor.name;
  const initiativeText = game.i18n.localize('CONAN.Combat.initiativeRolled');
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: `
      <div class="conan-initiative-roll ${isPoisoned ? 'poisoned-roll' : ''}">
        <p><strong>${characterName}</strong> ${initiativeText}: <strong>${initiativeResult}</strong>${isPoisoned ? ' <i class="fas fa-skull-crossbones poison-skull" style="color: #15a20e;"></i>' : ''}</p>
        ${flexTriggered ? `<div class="conan-flex-effect"><i class="fas fa-star"></i> ${game.i18n.localize('CONAN.Roll.flexEffect')}</div>` : ''}
      </div>
    `,
    rollMode: game.settings.get("core", "rollMode"),
    flags: {
      "conan-the-hyborian-age": {
        rollType: "initiative"
      }
    }
  });

  // If flex triggered, show dialog
  if (flexTriggered) {
    const { FlexEffectDialog } = await import("./flex-dialog.mjs");
    const dialog = new FlexEffectDialog(actor, { mainRoll, flexRoll, success: true });
    dialog.render(true);
  }

  return { mainRoll, flexRoll, initiativeResult, flexTriggered };
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
    rollMode: game.settings.get("core", "rollMode")
  }, {
    rollMode: game.settings.get("core", "rollMode")
  });

  // Trigger 3D dice if Dice So Nice module is active
  if (game.dice3d) {
    await game.dice3d.showForRoll(roll);
  }

  return roll;
}

/**
 * Roll weapon damage
 * @param {Actor} actor - The actor performing the roll
 * @param {Item} weapon - The weapon item
 */
export async function rollWeaponDamage(actor, weapon) {
  if (!actor || !weapon) {
    ui.notifications.error("Invalid weapon damage parameters");
    return null;
  }

  const damageFormula = weapon.system.damage?.dice || "1d6";
  const damageBonus = weapon.system.damage?.bonus || 0;
  
  const formula = damageBonus !== 0 ? `${damageFormula} + @bonus` : damageFormula;
  const rollData = { bonus: damageBonus };

  // Evaluate the roll
  const roll = await new Roll(formula, rollData).evaluate();

  // Display in chat with 3D dice
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: `<strong>${weapon.name}</strong> - ${game.i18n.localize("CONAN.Common.damage")}`,
    rollMode: game.settings.get("core", "rollMode")
  }, {
    rollMode: game.settings.get("core", "rollMode")
  });

  // Trigger 3D dice if Dice So Nice module is active
  if (game.dice3d) {
    await game.dice3d.showForRoll(roll);
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
  
  // Get Might attribute value
  const might = actor.system.attributes.might.value;
  
  // Apply poison effect 2: -1 penalty to all rolls
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -1 : 0;
  
  // Build the roll formula: Might + Weapon Damage + Modifier + Poison Penalty
  const formula = `${might} + ${weaponDamage} + ${modifier} + ${poisonPenalty}`;
  
  // For characters (not NPCs), also roll flex die
  const isCharacter = actor.type === "character";
  const flexDie = isCharacter ? (actor.system.flexDie || "d10") : null;
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;
  
  // Create and execute the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}`).evaluate() : null;
  
  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);
  
  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    // Only show main roll dice if it has dice to show (not for unarmed/fixed damage)
    if (!isFixedDamage) {
      promises.push(game.dice3d.showForRoll(mainRoll, game.user, false));
    }
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, false, null, false, null, {
        appearance: { colorset: "bronze" }
      }));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
  
  // Prepare chat message content
  const modifierSign = modifier >= 0 ? '+' : '';
  const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;
  
  // Get weapon die result for display (if it's dice-based, not fixed)
  const weaponDieResult = !isFixedDamage && mainRoll.dice.length > 0 ? mainRoll.dice[0].total : null;
  
  const content = `
    <div class="conan-roll-chat damage-roll ${isPoisoned ? 'poisoned-roll' : ''}">
      <div class="roll-header melee">
        <h3>${game.i18n.localize("CONAN.Damage.meleeDamage")}${isPoisoned ? ' <i class="fas fa-skull-crossbones poison-skull" style="color: #15a20e;"></i>' : ''}</h3>
        <div class="weapon-info">${weaponName}</div>
      </div>
      <div class="roll-details">
        ${isCharacter ? `
        <div class="dice-results">
          ${weaponDieResult !== null ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize("CONAN.Weapon.damage")}</div>
            <div class="die-result">${weaponDieResult}</div>
          </div>
          ` : ''}
          ${!flexDieDisabled ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result${flexTriggered ? ' flex-effect' : ''}">${flexResult}</div>
          </div>
          ` : `
          <div class="dice-roll disabled">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result disabled"><i class="fas fa-ban"></i></div>
          </div>
          `}
        </div>
        ` : ''}
        
        <div class="damage-components">
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Attributes.might.abbr")}:</span>
            <span class="component-value">${might}</span>
          </div>
          <div class="component">
            <span class="component-label">${weaponName}:</span>
            <span class="component-value">${weaponDamage}</span>
          </div>
          ${modifier !== 0 ? `
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel")}:</span>
            <span class="component-value">${modifierSign}${modifier}</span>
          </div>
          ` : ''}
          ${poisonPenalty !== 0 ? `
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Poisoned.title")}:</span>
            <span class="component-value poison-penalty">-1</span>
          </div>
          ` : ''}
        </div>
        
        <div class="damage-total highlighted">
          <span class="total-label">${game.i18n.localize("CONAN.Common.damage")}:</span>
          <span class="total-value">${damageTotal}</span>
        </div>
        
        ${flexTriggered ? `
        <div class="roll-result">
          <div class="flex-notice"><i class="fas fa-star"></i> ${game.i18n.localize('CONAN.Roll.flexEffect')}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="damage-actions" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.1); text-align: center;">
        <button class="deal-pc-damage-btn" 
                data-damage="${damageTotal}" 
                data-attacker-id="${actor._id || actor.id}" 
                data-token-id="${actor.token?.id || ''}" 
                data-scene-id="${actor.token?.parent?.id || ''}">
          <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
        </button>
      </div>
    </div>
  `;
  
  // Send to chat with flags
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    rollMode: game.settings.get("core", "rollMode"),
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
  
  // Get Might attribute value
  const might = actor.system.attributes.might.value;
  
  // Build the roll formula: Might + Weapon Damage + Modifier
  const formula = `${might} + ${weaponDamage} + ${modifier}`;
  
  // For characters (not NPCs), also roll flex die
  const isCharacter = actor.type === "character";
  const flexDie = isCharacter ? (actor.system.flexDie || "d10") : null;
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;
  
  // Create and execute the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}`).evaluate() : null;
  
  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexDieDisabled ? false : (flexRoll && (flexResult === flexMax));
  
  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    // Only show main roll dice if it has dice to show (not for unarmed/fixed damage)
    if (!isFixedDamage) {
      promises.push(game.dice3d.showForRoll(mainRoll, game.user, false));
    }
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, false, null, false, null, {
        appearance: { colorset: "bronze" }
      }));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
  
  // Prepare chat message content
  const modifierSign = modifier >= 0 ? '+' : '';
  
  // Get weapon die result for display (if it's dice-based, not fixed)
  const weaponDieResult = !isFixedDamage && mainRoll.dice.length > 0 ? mainRoll.dice[0].total : null;
  
  const content = `
    <div class="conan-roll-chat damage-roll">
      <div class="roll-header thrown">
        <h3>${game.i18n.localize("CONAN.Damage.thrownDamage")}</h3>
        <div class="weapon-info">${weapon.name}</div>
      </div>
      <div class="roll-details">
        ${isCharacter ? `
        <div class="dice-results">
          ${weaponDieResult !== null ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize("CONAN.Weapon.damage")}</div>
            <div class="die-result">${weaponDieResult}</div>
          </div>
          ` : ''}
          ${!flexDieDisabled ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result${flexTriggered ? ' flex-effect' : ''}">${flexResult}</div>
          </div>
          ` : `
          <div class="dice-roll disabled">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result disabled"><i class="fas fa-ban"></i></div>
          </div>
          `}
        </div>
        ` : ''}
        
        <div class="damage-components">
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Attributes.might.abbr")}:</span>
            <span class="component-value">${might}</span>
          </div>
          <div class="component">
            <span class="component-label">${weapon.name}:</span>
            <span class="component-value">${weaponDamage}</span>
          </div>
          ${modifier !== 0 ? `
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel")}:</span>
            <span class="component-value">${modifierSign}${modifier}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="damage-total highlighted">
          <span class="total-label">${game.i18n.localize("CONAN.Common.damage")}:</span>
          <span class="total-value">${damageTotal}</span>
        </div>
        
        ${flexTriggered ? `
        <div class="roll-result">
          <div class="flex-notice"><i class="fas fa-star"></i> ${game.i18n.localize('CONAN.Roll.flexEffect')}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="damage-actions" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.1); text-align: center;">
        <button class="deal-pc-damage-btn" 
                data-damage="${damageTotal}" 
                data-attacker-id="${actor._id || actor.id}" 
                data-token-id="${actor.token?.id || ''}" 
                data-scene-id="${actor.token?.parent?.id || ''}">
          <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
        </button>
      </div>
    </div>
  `;
  
  // Send to chat with flags
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    rollMode: game.settings.get("core", "rollMode"),
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
  const weaponDice = weapon.system.damage?.dice || "1d6";
  const weaponBonus = weapon.system.damageModifier || 0;
  // Build the roll formula: Weapon Dice + Weapon Modifier + Slider Modifier
  const formula = `${weaponDice} + ${weaponBonus} + ${modifier}`;
  
  // For characters (not NPCs), also roll flex die
  const isCharacter = actor.type === "character";
  const flexDie = isCharacter ? (actor.system.flexDie || "d10") : null;
  const flexDieDisabled = isCharacter && actor.system.poisoned && actor.system.poisonEffects?.effect5;
  
  // Create and execute the rolls
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}`).evaluate() : null;
  
  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexDieDisabled ? false : (flexRoll && (flexResult === flexMax));
  
  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
    // Always show main roll dice for ranged weapons
    promises.push(game.dice3d.showForRoll(mainRoll, game.user, false));
    if (flexRoll) {
      promises.push(game.dice3d.showForRoll(flexRoll, game.user, false, null, false, null, {
        appearance: { colorset: "bronze" }
      }));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
  
  // Prepare chat message content
  const modifierSign = modifier >= 0 ? '+' : '';
  // Get weapon die result for display
  const weaponDieResult = mainRoll.dice.length > 0 ? mainRoll.dice[0].total : null;
  // Weapon bonus display (next to die-result)
  const weaponBonusHtml = weaponBonus !== 0 ? `<span class="weapon-bonus">${weaponBonus > 0 ? '+' : ''}${weaponBonus}</span>` : '';

  const content = `
    <div class="conan-roll-chat damage-roll">
      <div class="roll-header ranged">
        <h3>${game.i18n.localize("CONAN.Damage.rangedDamage")}</h3>
        <div class="weapon-info">${weapon.name}</div>
      </div>
      <div class="roll-details">
        ${isCharacter ? `
        <div class="dice-results">
          ${weaponDieResult !== null ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize("CONAN.Weapon.damage")}</div>
            <div class="die-result-bonus-row">
              <div class="die-result">${weaponDieResult}</div>
              ${weaponBonusHtml}
            </div>
          </div>
          ` : ''}
          ${!flexDieDisabled ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result${flexTriggered ? ' flex-effect' : ''}">${flexResult}</div>
          </div>
          ` : `
          <div class="dice-roll disabled">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
            <div class="die-result disabled"><i class="fas fa-ban"></i></div>
          </div>
          `}
        </div>
        ` : ''}

        <div class="damage-components">
          <div class="component">
            <span class="component-label">${weapon.name}:</span>
            <span class="component-value">${weaponDice}${weaponBonus !== 0 ? (weaponBonus > 0 ? '+' + weaponBonus : weaponBonus) : ''}</span>
          </div>
          ${modifier !== 0 ? `
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel")}</span>:
            <span class="component-value">${modifierSign}${modifier}</span>
          </div>
          ` : ''}
        </div>

        <div class="damage-total highlighted">
          <span class="total-label">${game.i18n.localize("CONAN.Common.damage")}</span>:
          <span class="total-value">${damageTotal}</span>
        </div>

        ${flexTriggered ? `
        <div class="roll-result">
          <div class="flex-notice"><i class="fas fa-star"></i> ${game.i18n.localize('CONAN.Roll.flexEffect')}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="damage-actions" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.1); text-align: center;">
        <button class="deal-pc-damage-btn" 
                data-damage="${damageTotal}" 
                data-attacker-id="${actor._id || actor.id}" 
                data-token-id="${actor.token?.id || ''}" 
                data-scene-id="${actor.token?.parent?.id || ''}">
          <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
        </button>
      </div>
    </div>
  `;
  
  // Create chat message with flags
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    sound: CONFIG.sounds.dice,
    rollMode: game.settings.get("core", "rollMode"),
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
export async function rollNPCDamage(actor, attackType) {
  if (!actor || (actor.type !== "minion" && actor.type !== "antagonist")) {
    ui.notifications.error("Invalid NPC actor for damage roll");
    return null;
  }

  // Get damage data from actor
  const damageData = actor.system.damage[attackType];
  
  if (!damageData || damageData.notApplicable) {
    ui.notifications.warn(game.i18n.localize("CONAN.Warnings.damageNotApplicable"));
    return null;
  }

  // Show damage dialog
  const { NPCDamageDialog } = await import("./npc-damage-dialog.mjs");
  const result = await NPCDamageDialog.prompt(actor, attackType);
  if (result === null) return null; // User cancelled
  
  const modifier = result.modifier || 0;
  const damageDie = damageData.die || "d6";
  const damageModifier = damageData.modifier || 0;
  const weaponName = damageData.name || game.i18n.localize("CONAN.NPC.weaponName");
  
  // For melee attacks, add Brawn value
  let brawnValue = 0;
  if (attackType === 'melee') {
    brawnValue = actor.system.attributes.might?.value || 0;
  }
  
  // Roll damage die
  const damageRoll = await new Roll(`1${damageDie}`).evaluate();
  const dieResult = damageRoll.total;
  
  // Calculate total damage
  // Melee: Brawn + die + modifier from card + slider modifier
  // Ranged: die + modifier from card + slider modifier
  const totalDamage = Math.max(0, brawnValue + dieResult + damageModifier + modifier);
  
  // Note: Don't manually show 3D dice here - ChatMessage.create with rolls: [damageRoll]
  // will automatically trigger the dice animation via Dice So Nice
  
  // Determine NPC type for styling
  const npcType = actor.type; // "minion" or "antagonist"
  const npcClass = npcType === "minion" ? "minion-roll" : "antagonist-roll";
  const attackTypeLabel = attackType === 'melee' 
    ? game.i18n.localize("CONAN.NPC.meleeDamage")
    : game.i18n.localize("CONAN.NPC.rangedDamage");
  
  // Create chat message
  const modifierTotal = damageModifier + modifier;
  const modifierSign = modifierTotal >= 0 ? '+' : '';
  
  // Build calculation display
  let calcParts = [];
  if (brawnValue > 0) {
    calcParts.push(`<span class="calc-part">${brawnValue}</span>`);
  }
  calcParts.push(`<span class="calc-part">${dieResult}</span>`);
  
  const calculation = calcParts.join('<span class="calc-operator">+</span>') + 
    (modifierTotal !== 0 ? `<span class="calc-operator">${modifierSign}</span><span class="calc-part">${Math.abs(modifierTotal)}</span>` : '') +
    `<span class="calc-operator">=</span><span class="calc-total damage-total">${totalDamage}</span>`;
  
  const content = `
    <div class="conan-roll-chat npc-roll ${npcClass} damage-roll">
      <div class="roll-header">
        <h3>${game.i18n.localize('CONAN.Damage.title')}</h3>
        <div class="attack-type-info">${attackTypeLabel}</div>
        <div class="weapon-name">${weaponName}</div>
      </div>
      <div class="roll-details">
        <div class="dice-results">
          ${brawnValue > 0 ? `
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.Attributes.might.label')}</div>
            <div class="die-result">${brawnValue}</div>
          </div>
          ` : ''}
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.NPC.damageDie')}</div>
            <div class="die-result">${dieResult}</div>
          </div>
        </div>
        
        <div class="calculation">
          ${calculation}
        </div>
        
        <div class="damage-result">
          <div class="result-label">${game.i18n.localize('CONAN.Damage.totalDamage')}:</div>
          <div class="result-value">${totalDamage}</div>
        </div>
        
        <div class="damage-actions">
          <button class="deal-damage-btn" data-damage="${totalDamage}" data-attacker-id="${actor.id}" data-token-id="${actor.token?.id || ''}" data-scene-id="${actor.token?.parent?.id || ''}">
            <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    rolls: [damageRoll],
    sound: CONFIG.sounds.dice,
    rollMode: game.settings.get("core", "rollMode"),
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
  
  if (targetType === "character") {
    // Player character - reduce actual HP
    // If there's an open sheet, submit any pending changes first
    if (target.sheet?.rendered && target.sheet.element) {
      const form = target.sheet.element.find('form')[0];
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
    const currentHP = target.system.lifePoints?.actual || 0;
    const newHP = Math.max(0, currentHP - finalDamage);
    
    // Update token if unlinked, otherwise actor
    if (isToken && !targetToken.actorLink) {
      // For unlinked tokens in v13, use delta.system path
      await ConanSocket.requestTokenUpdate(
        targetToken.parent.id,
        targetToken.id,
        { "delta.system.lifePoints.actual": newHP }
      );
    } else {
      await ConanSocket.requestActorUpdate(
        target.id,
        { "system.lifePoints.actual": newHP }
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
    }
    
  } else if (targetType === "antagonist") {
    // Antagonist NPC - reduce life points
    const currentLP = target.system.lifePoints || 0;
    const newLP = Math.max(0, currentLP - finalDamage);
    
    // Update token if unlinked, otherwise actor
    if (isToken && !targetToken.actorLink) {
      // For unlinked tokens in v13, use delta.system path
      await ConanSocket.requestTokenUpdate(
        targetToken.parent.id,
        targetToken.id,
        { "delta.system.lifePoints": newLP }
      );
    } else {
      await ConanSocket.requestActorUpdate(
        target.id,
        { "system.lifePoints": newLP }
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
      // Mark as defeated in combat tracker and add dead overlay
      if (isToken) {
        await ConanSocket.requestTokenUpdate(
          targetToken.parent.id,
          targetToken.id,
          { "overlayEffect": CONFIG.controlIcons.defeated }
        );
      }
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
          {
            "delta.system.defeated": true,
            "overlayEffect": CONFIG.controlIcons.defeated
          }
        );
      } else {
        await ConanSocket.requestActorUpdate(
          target.id,
          { "system.defeated": true }
        );
        if (isToken) {
          await ConanSocket.requestTokenUpdate(
            targetToken.parent.id,
            targetToken.id,
            { "overlayEffect": CONFIG.controlIcons.defeated }
          );
        }
      }
      
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
          {
            "delta.system.defeated": true,
            "overlayEffect": CONFIG.controlIcons.defeated
          }
        );
      } else {
        await ConanSocket.requestActorUpdate(
          target.id,
          { "system.defeated": true }
        );
        if (isToken) {
          await ConanSocket.requestTokenUpdate(
            targetToken.parent.id,
            targetToken.id,
            { "overlayEffect": CONFIG.controlIcons.defeated }
          );
        }
      }
      
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
      
      resultMessage = game.i18n.format("CONAN.Damage.minionWounded", {
        name: target.name,
        damage: finalDamage,
        armor: armor,
        threshold: threshold
      });
    }
  }
  
  // Create chat message with result
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
      ${defeated ? `<div class="defeated-banner">${game.i18n.localize('CONAN.Damage.defeated')}</div>` : ''}
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attacker }),
    content: messageContent,
    sound: defeated ? CONFIG.sounds.notification : null
  });
  
  return { finalDamage, defeated, target };
}
