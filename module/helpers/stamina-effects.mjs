/**
 * Stamina Effects System
 * Handles spending Stamina to boost roll results
 */

/**
 * Add context menu options to chat messages for spending Stamina
 * @param {jQuery} html - The chat log HTML
 * @param {Array} options - Existing context menu options
 */
export function addStaminaContextMenu(html, options) {
  options.push(
    {
      name: game.i18n.localize("CONAN.Stamina.spend1"),
      icon: '<i class="fas fa-plus-circle"></i>',
      condition: li => {
        const message = game.messages.get(li.data("messageId"));
        return canSpendStamina(message, 1);
      },
      callback: li => {
        const message = game.messages.get(li.data("messageId"));
        spendStaminaToBoost(message, 1);
      }
    },
    {
      name: game.i18n.localize("CONAN.Stamina.spend2"),
      icon: '<i class="fas fa-plus-circle"></i>',
      condition: li => {
        const message = game.messages.get(li.data("messageId"));
        return canSpendStamina(message, 2);
      },
      callback: li => {
        const message = game.messages.get(li.data("messageId"));
        spendStaminaToBoost(message, 2);
      }
    }
  );
}

/**
 * Check if Stamina can be spent on this message
 * @param {ChatMessage} message - The chat message
 * @param {number} cost - The Stamina cost (1 or 2)
 * @returns {boolean}
 */
function canSpendStamina(message, cost) {
  if (!message) {
    return false;
  }
  
  // Only allow for messages from the current user or if user is GM
  if (!game.user.isGM && message.author.id !== game.user.id) {
    return false;
  }
  
  // Check if this message has already been boosted
  const alreadyBoosted = message.getFlag("conan-the-hyborian-age", "staminaBoosted");
  if (alreadyBoosted) {
    return false;
  }
  
  // Check if this is a valid roll type (attribute test, initiative, or attack)
  const flags = message.flags?.["conan-the-hyborian-age"] || {};
  
  const isValidRoll = flags.rollType === "attribute" || 
                      flags.rollType === "initiative" || 
                      flags.attackType !== undefined;
  
  if (!isValidRoll) {
    return false;
  }
  
  // Get the actor
  const speaker = message.speaker;
  let actor = null;
  
  if (speaker.token) {
    const token = canvas.tokens?.get(speaker.token);
    actor = token?.actor;
  }
  
  if (!actor && speaker.actor) {
    actor = game.actors.get(speaker.actor);
  }
  
  if (!actor) {
    return false;
  }
  
  // Check if stamina is locked due to poison effect 4
  if (actor.system.poisoned && actor.system.poisonEffects?.effect4) {
    return false;
  }
  
  // Check if actor has enough Stamina
  const currentStamina = actor.system.stamina?.value || 0;
  
  return currentStamina >= cost;
}

/**
 * Spend Stamina to boost a roll result
 * @param {ChatMessage} message - The chat message containing the roll
 * @param {number} boost - The amount to boost (1 or 2)
 */
async function spendStaminaToBoost(message, boost) {
  if (!message) return;
  
  // Get the actor
  const speaker = message.speaker;
  let actor = null;
  
  if (speaker.token) {
    const token = canvas.tokens?.get(speaker.token);
    actor = token?.actor;
  }
  
  if (!actor && speaker.actor) {
    actor = game.actors.get(speaker.actor);
  }
  
  if (!actor) {
    ui.notifications.error(game.i18n.localize("CONAN.Stamina.actorNotFound"));
    return;
  }
  
  // Check Stamina availability
  const currentStamina = actor.system.stamina?.value || 0;
  if (currentStamina < boost) {
    ui.notifications.error(game.i18n.format("CONAN.Stamina.notEnoughStamina", { 
      required: boost, 
      current: currentStamina 
    }));
    return;
  }
  
  // Deduct Stamina
  const newStamina = currentStamina - boost;
  await actor.update({ "system.stamina.value": newStamina });
  
  // Mark message as boosted
  await message.setFlag("conan-the-hyborian-age", "staminaBoosted", true);
  
  // Get roll data from message flags
  const flags = message.flags?.["conan-the-hyborian-age"] || {};
  const rollType = flags.rollType || "unknown";
  const attackType = flags.attackType; // melee, ranged, thrown, sorcery
  const isAttack = attackType !== undefined;
  
  // Parse the original message content to extract roll data
  const originalTotal = extractTotalFromMessage(message);
  const newTotal = originalTotal + boost;
  
  // Determine success/failure based on roll type
  let resultText = "";
  let difficulty = extractDifficultyFromMessage(message);
  let isSuccess = false;
  
  if (rollType === "initiative") {
    // For initiative, update combat tracker
    await updateInitiativeInCombat(actor, newTotal);
    resultText = game.i18n.format("CONAN.Stamina.initiativeBoosted", {
      oldValue: originalTotal,
      newValue: newTotal,
      boost: boost,
      cost: boost
    });
  } else {
    // For attribute tests and attacks, check success
    isSuccess = newTotal >= difficulty;
    const statusText = isSuccess ? 
      game.i18n.localize('CONAN.Roll.success') : 
      game.i18n.localize('CONAN.Roll.failure');
    
    const rollTypeLabel = isAttack ?
      game.i18n.localize('CONAN.Attack.title') :
      game.i18n.localize('CONAN.Roll.attributeTest');
    
    resultText = game.i18n.format("CONAN.Stamina.rollBoosted", {
      rollType: rollTypeLabel,
      oldValue: originalTotal,
      newValue: newTotal,
      boost: boost,
      cost: boost,
      difficulty: difficulty,
      status: statusText
    });
  }
  
  // Prepare damage button HTML for successful attacks
  let damageButtonHtml = '';
  if (isAttack && isSuccess) {
    damageButtonHtml = `
      <button class="roll-damage-btn" data-actor-id="${actor.id}" data-attack-type="${attackType}">
        <i class="fas fa-dice-d20"></i> ${game.i18n.localize('CONAN.Roll.rollDamage')}
      </button>
    `;
  }
  
  // Create new chat message showing the boosted result
  const content = `
    <div class="conan-stamina-boost">
      <div class="stamina-header">
        <i class="fas fa-bolt"></i>
        <h3>${game.i18n.localize("CONAN.Stamina.boosted")}</h3>
      </div>
      <div class="stamina-content">
        <div class="boost-info">
          <span class="original-value">${originalTotal}</span>
          <i class="fas fa-arrow-right"></i>
          <span class="new-value ${isSuccess ? 'success' : ''}">${newTotal}</span>
          <span class="boost-amount">(+${boost})</span>
        </div>
        ${difficulty ? `
        <div class="difficulty-check">
          <span class="difficulty-label">${game.i18n.localize('CONAN.Roll.targetDifficulty')}:</span>
          <span class="difficulty-value">${difficulty}</span>
        </div>
        <div class="roll-result ${isSuccess ? 'success' : ''}">
          ${isSuccess ? game.i18n.localize('CONAN.Roll.success') : game.i18n.localize('CONAN.Roll.failure')}
        </div>
        ` : ''}
        <div class="stamina-cost">
          ${game.i18n.format("CONAN.Stamina.spent", { cost: boost })}
        </div>
        ${damageButtonHtml}
      </div>
    </div>
  `;
  
  const chatMsg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    flags: {
      "conan-the-hyborian-age": {
        staminaBoost: true,
        originalMessageId: message.id,
        boostAmount: boost
      }
    }
  });
  
  // If attack was successful, attach damage button click handler
  if (isAttack && isSuccess && chatMsg) {
    Hooks.once('renderChatMessageHTML', (renderedMsg, html) => {
      if (renderedMsg.id !== chatMsg.id) return;
      
      const btn = html.querySelector('.roll-damage-btn');
      if (!btn) return;
      
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        
        const actorId = btn.getAttribute('data-actor-id');
        const attackType = btn.getAttribute('data-attack-type');
        
        let foundActor = game.actors.get(actorId);
        if (!foundActor && canvas.tokens) {
          for (let token of canvas.tokens.placeables) {
            if (token.actor && token.actor.id === actorId) {
              foundActor = token.actor;
              break;
            }
          }
        }
        
        if (!foundActor) return;
        
        const { DamageDialog } = await import('./damage-dialog.mjs');
        
        // Determine allowed damage types based on attack type
        let allowedDamageTypes = ['melee', 'thrown', 'ranged', 'sorcery'];
        if (attackType === 'melee') allowedDamageTypes = ['melee'];
        else if (attackType === 'ranged') allowedDamageTypes = ['ranged', 'thrown'];
        else if (attackType === 'thrown') allowedDamageTypes = ['thrown'];
        else if (attackType === 'sorcery') allowedDamageTypes = ['sorcery'];
        
        const result = await DamageDialog.prompt(foundActor, { allowedDamageTypes });
        if (!result) return;
        
        const { modifier, damageType, weaponId, sorceryCustomModifier, sorceryDamageType, sorceryCustomDie, sorceryFixedValue } = result;
        
        if (damageType === 'melee' || damageType === 'thrown' || damageType === 'ranged') {
          if (weaponId) {
            const weapon = foundActor.items.get(weaponId);
            if (!weapon) {
              ui.notifications.warn(game.i18n.localize('CONAN.DamageDialog.NoWeaponFound'));
              return;
            }
            
            const { rollWeaponDamage } = await import('./roll-mechanics.mjs');
            await rollWeaponDamage(foundActor, weapon, modifier);
          } else {
            const { rollUnarmedDamage } = await import('./roll-mechanics.mjs');
            await rollUnarmedDamage(foundActor, modifier);
          }
        } else if (damageType === 'sorcery') {
          const { rollSorceryWitsDamage, rollSorceryCustomDieDamage, rollSorceryFixedDamage } = await import('./roll-mechanics.mjs');
          
          if (sorceryDamageType === 'wits') {
            await rollSorceryWitsDamage(foundActor, sorceryCustomModifier || 0);
          } else if (sorceryDamageType === 'custom') {
            await rollSorceryCustomDieDamage(foundActor, sorceryCustomDie, sorceryCustomModifier || 0);
          } else if (sorceryDamageType === 'fixed') {
            await rollSorceryFixedDamage(foundActor, sorceryFixedValue || 0);
          }
        }
      });
    });
  }
  
  ui.notifications.info(game.i18n.format("CONAN.Stamina.boostedNotification", {
    boost: boost,
    cost: boost
  }));
}

/**
 * Extract the total value from a chat message
 * @param {ChatMessage} message - The chat message
 * @returns {number}
 */
function extractTotalFromMessage(message) {
  const html = $(message.content);
  
  // Try to find .calc-total element (for attribute tests and attacks)
  const calcTotal = html.find('.calc-total');
  if (calcTotal.length > 0) {
    return parseInt(calcTotal.text()) || 0;
  }
  
  // For initiative rolls, look for the initiative value
  const initiativeMatch = message.content.match(/:\s*<strong>(\d+)<\/strong>/);
  if (initiativeMatch) {
    return parseInt(initiativeMatch[1]) || 0;
  }
  
  return 0;
}

/**
 * Extract the difficulty/target defense from a chat message
 * @param {ChatMessage} message - The chat message
 * @returns {number|null}
 */
function extractDifficultyFromMessage(message) {
  const html = $(message.content);
  
  // Try to find .difficulty-value element
  const difficultyValue = html.find('.difficulty-value');
  if (difficultyValue.length > 0) {
    return parseInt(difficultyValue.text()) || null;
  }
  
  return null;
}

/**
 * Check if Stamina can be spent to boost damage
 * @param {ChatMessage} message - The chat message
 * @param {number} cost - The Stamina cost (1 or 2)
 * @returns {boolean}
 */
function canSpendStaminaOnDamage(message, cost) {
  if (!message) {
    return false;
  }
  
  // Only allow for messages from the current user or if user is GM
  if (!game.user.isGM && message.author.id !== game.user.id) {
    return false;
  }
  
  // Check if this message has already been boosted
  const alreadyBoosted = message.getFlag("conan-the-hyborian-age", "staminaBoosted");
  if (alreadyBoosted) {
    return false;
  }
  
  // Check if this is a damage roll
  const flags = message.flags?.["conan-the-hyborian-age"] || {};
  const isDamageRoll = flags.totalDamage !== undefined && flags.damageDealt === false;
  
  if (!isDamageRoll) {
    return false;
  }
  
  // Get the actor
  const speaker = message.speaker;
  let actor = null;
  
  if (speaker.token) {
    const token = canvas.tokens?.get(speaker.token);
    actor = token?.actor;
  }
  
  if (!actor && speaker.actor) {
    actor = game.actors.get(speaker.actor);
  }
  
  if (!actor) {
    return false;
  }
  
  // Check if stamina is locked due to poison effect 4
  if (actor.system.poisoned && actor.system.poisonEffects?.effect4) {
    return false;
  }
  
  // Check if actor has enough Stamina
  const currentStamina = actor.system.stamina?.value || 0;
  
  return currentStamina >= cost;
}

/**
 * Check if last Stamina point can be spent on Massive Damage
 * @param {ChatMessage} message - The chat message
 * @returns {boolean}
 */
function canSpendLastStaminaOnMassiveDamage(message) {
  if (!message) {
    return false;
  }
  
  // Only allow for messages from the current user or if user is GM
  if (!game.user.isGM && message.author.id !== game.user.id) {
    return false;
  }
  
  // Check if this message has already been boosted
  const alreadyBoosted = message.getFlag("conan-the-hyborian-age", "staminaBoosted");
  if (alreadyBoosted) {
    return false;
  }
  
  // Check if this is a damage roll
  const flags = message.flags?.["conan-the-hyborian-age"] || {};
  const isDamageRoll = flags.totalDamage !== undefined && flags.damageDealt === false;
  
  if (!isDamageRoll) {
    return false;
  }
  
  // Get the actor
  const speaker = message.speaker;
  let actor = null;
  
  if (speaker.token) {
    const token = canvas.tokens?.get(speaker.token);
    actor = token?.actor;
  }
  
  if (!actor && speaker.actor) {
    actor = game.actors.get(speaker.actor);
  }
  
  if (!actor) {
    return false;
  }
  
  // Check if stamina is locked due to poison effect 4
  if (actor.system.poisoned && actor.system.poisonEffects?.effect4) {
    return false;
  }
  
  // Check if actor has EXACTLY 1 Stamina point
  const currentStamina = actor.system.stamina?.value || 0;
  
  return currentStamina === 1;
}

/**
 * Spend Stamina to boost damage
 * @param {ChatMessage} message - The chat message containing the damage roll
 * @param {number} cost - The Stamina cost (1 or 2, adds 1d4 or 2d4 damage)
 */
async function spendStaminaToDamage(message, cost) {
  if (!message) return;
  
  // Get the actor
  const speaker = message.speaker;
  let actor = null;
  
  if (speaker.token) {
    const token = canvas.tokens?.get(speaker.token);
    actor = token?.actor;
  }
  
  if (!actor && speaker.actor) {
    actor = game.actors.get(speaker.actor);
  }
  
  if (!actor) {
    ui.notifications.error(game.i18n.localize("CONAN.Stamina.actorNotFound"));
    return;
  }
  
  // Check Stamina availability
  const currentStamina = actor.system.stamina?.value || 0;
  if (currentStamina < cost) {
    ui.notifications.error(game.i18n.format("CONAN.Stamina.notEnoughStamina", { 
      required: cost, 
      current: currentStamina 
    }));
    return;
  }
  
  // Deduct Stamina
  const newStamina = currentStamina - cost;
  await actor.update({ "system.stamina.value": newStamina });
  
  // Mark message as boosted
  await message.setFlag("conan-the-hyborian-age", "staminaBoosted", true);
  
  // Get original damage from flags
  const flags = message.flags?.["conan-the-hyborian-age"] || {};
  const originalDamage = flags.totalDamage || 0;
  
  // Roll additional damage dice (1d4 or 2d4)
  const diceFormula = `${cost}d4`;
  const damageRoll = await new Roll(diceFormula).evaluate();
  
  // Show 3D dice ONLY for this roll (not the original one)
  if (game.dice3d) {
    await game.dice3d.showForRoll(damageRoll, game.user, true);
  }
  
  const additionalDamage = damageRoll.total;
  const totalDamage = originalDamage + additionalDamage;
  
  // Prepare damage button HTML
  const damageButtonHtml = `
    <button class="deal-pc-damage-btn" 
            data-damage="${totalDamage}" 
            data-attacker-id="${actor.id}" 
            data-token-id="${actor.token?.id || ''}" 
            data-scene-id="${actor.token?.parent?.id || ''}">
      <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
    </button>
  `;
  
  // Create new chat message showing the boosted damage
  const content = `
    <div class="conan-stamina-boost damage-boost">
      <div class="stamina-header">
        <i class="fas fa-bolt"></i>
        <h3>${game.i18n.localize("CONAN.Stamina.damageBoosted")}</h3>
      </div>
      <div class="stamina-content">
        <div class="damage-breakdown">
          <div class="damage-component">
            <span class="component-label">${game.i18n.localize("CONAN.Common.damage")}:</span>
            <span class="component-value">${originalDamage}</span>
          </div>
          <div class="damage-component additional">
            <span class="component-label">${game.i18n.localize("CONAN.Stamina.damageIncrease")} (${diceFormula}):</span>
            <span class="component-value">+${additionalDamage}</span>
          </div>
        </div>
        <div class="boost-info">
          <span class="original-value">${originalDamage}</span>
          <i class="fas fa-arrow-right"></i>
          <span class="new-value success">${totalDamage}</span>
          <span class="boost-amount">(+${additionalDamage})</span>
        </div>
        <div class="damage-total">
          <span class="total-label">${game.i18n.localize("CONAN.Stamina.totalDamageAfterBoost")}:</span>
          <span class="total-value">${totalDamage}</span>
        </div>
        <div class="stamina-cost">
          ${game.i18n.format("CONAN.Stamina.spent", { cost: cost })}
        </div>
        ${damageButtonHtml}
      </div>
    </div>
  `;
  
  const chatMsg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    flags: {
      "conan-the-hyborian-age": {
        staminaBoost: true,
        originalMessageId: message.id,
        boostAmount: cost,
        totalDamage: totalDamage,
        damageDealt: false,
        attackerId: actor.id,
        tokenId: actor.token?.id || '',
        sceneId: actor.token?.parent?.id || ''
      }
    }
  });
  
  // Note: Nie trzeba ręcznie podpinać handlera do przycisku "Zadaj Obrażenia"
  // Globalny hook renderChatMessage w conan.mjs automatycznie obsługuje wszystkie .deal-pc-damage-btn
  
  ui.notifications.info(game.i18n.format("CONAN.Stamina.boostedNotification", {
    boost: additionalDamage,
    cost: cost
  }));
}

/**
 * Spend last Stamina point to trigger Massive Damage effect
 * @param {ChatMessage} message - The chat message containing the damage roll
 */
async function spendStaminaToMassiveDamage(message) {
  if (!message) return;
  
  // Get the actor
  const speaker = message.speaker;
  let actor = null;
  
  if (speaker.token) {
    const token = canvas.tokens?.get(speaker.token);
    actor = token?.actor;
  }
  
  if (!actor && speaker.actor) {
    actor = game.actors.get(speaker.actor);
  }
  
  if (!actor) {
    ui.notifications.error(game.i18n.localize("CONAN.Stamina.actorNotFound"));
    return;
  }
  
  // Check Stamina availability - must be exactly 1
  const currentStamina = actor.system.stamina?.value || 0;
  if (currentStamina !== 1) {
    ui.notifications.error(game.i18n.localize("CONAN.Stamina.needsExactlyOne"));
    return;
  }
  
  // Deduct last Stamina point
  await actor.update({ "system.stamina.value": 0 });
  
  // Mark message as boosted
  await message.setFlag("conan-the-hyborian-age", "staminaBoosted", true);
  
  // Get original damage from flags
  const flags = message.flags?.["conan-the-hyborian-age"] || {};
  const originalDamage = flags.totalDamage || 0;
  
  // Extract damage dice info from message content
  const damageRollData = extractDamageRollData(message);
  
  // Calculate bonus damage - same as massive damage from flex effect
  let bonusDamage = 0;
  
  if (damageRollData.isFixedDamage) {
    // For fixed damage, double it
    bonusDamage = originalDamage;
  } else {
    // For dice damage, add maximum value of the damage die
    bonusDamage = damageRollData.maxDieValue || 0;
  }
  
  const totalDamage = originalDamage + bonusDamage;
  
  // Prepare damage button HTML
  const damageButtonHtml = `
    <button class="deal-pc-damage-btn" 
            data-damage="${totalDamage}" 
            data-attacker-id="${actor.id}" 
            data-token-id="${actor.token?.id || ''}" 
            data-scene-id="${actor.token?.parent?.id || ''}">  
      <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
    </button>
  `;
  
  // Create new chat message showing the massive damage effect
  const content = `
    <div class="conan-stamina-boost damage-boost massive-damage">
      <div class="stamina-header">
        <i class="fas fa-explosion"></i>
        <h3>${game.i18n.localize("CONAN.Stamina.massiveDamage")}</h3>
      </div>
      <div class="stamina-content">
        <div class="massive-damage-info">
          <p><strong>${actor.name}</strong> ${game.i18n.localize("CONAN.Stamina.massiveDamageMessage")}</p>
          <div class="damage-breakdown">
            <div class="damage-component">
              <span class="component-label">${game.i18n.localize("CONAN.Common.damage")}:</span>
              <span class="component-value">${originalDamage}</span>
            </div>
            <div class="damage-component additional">
              <span class="component-label">${game.i18n.localize("CONAN.FlexEffect.massive.bonusDamage")}:</span>
              <span class="component-value">+${bonusDamage}</span>
            </div>
          </div>
        </div>
        <div class="boost-info">
          <span class="original-value">${originalDamage}</span>
          <i class="fas fa-arrow-right"></i>
          <span class="new-value success">${totalDamage}</span>
          <span class="boost-amount">(+${bonusDamage})</span>
        </div>
        <div class="damage-total">
          <span class="total-label">${game.i18n.localize("CONAN.FlexEffect.massive.totalDamage")}:</span>
          <span class="total-value">${totalDamage}</span>
        </div>
        <div class="stamina-cost">
          ${game.i18n.localize("CONAN.Stamina.lastPointSpent")}
        </div>
        ${damageButtonHtml}
      </div>
    </div>
  `;
  
  const chatMsg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    flags: {
      "conan-the-hyborian-age": {
        staminaBoost: true,
        massiveDamage: true,
        originalMessageId: message.id,
        totalDamage: totalDamage,
        damageDealt: false,
        attackerId: actor.id,
        tokenId: actor.token?.id || '',
        sceneId: actor.token?.parent?.id || ''
      }
    }
  });
  
  ui.notifications.info(game.i18n.format("CONAN.Stamina.massiveDamageNotification", {
    bonus: bonusDamage
  }));
}

/**
 * Extract damage roll data from message content
 * @param {ChatMessage} message - The chat message
 * @returns {Object} Object containing damage die info
 */
function extractDamageRollData(message) {
  const html = $(message.content);
  
  // Check if it's fixed damage (no dice rolled)
  const isFixedDamage = message.content.includes('Stałe obrażenia') || 
                        message.content.includes('Fixed damage') ||
                        message.content.includes('unarmedDamage');
  
  if (isFixedDamage) {
    // For fixed damage, the bonus equals the original damage
    const flags = message.flags?.["conan-the-hyborian-age"] || {};
    const originalDamage = flags.totalDamage || 0;
    return { isFixedDamage: true, maxDieValue: originalDamage };
  }
  
  // Try to extract die type from weapon info in damage-components
  // Look for patterns like "1k8", "2k6", "1d8", "2d6" in component values
  const componentValues = html.find('.component-value');
  let maxDieValue = 0;
  
  componentValues.each(function() {
    const text = $(this).text();
    const dicePattern = /(\d+)?[kd](\d+)/i;
    const match = text.match(dicePattern);
    
    if (match) {
      const dieValue = parseInt(match[2]);
      if (dieValue > maxDieValue) {
        maxDieValue = dieValue;
      }
    }
  });
  
  // If found a die value, return it
  if (maxDieValue > 0) {
    return { isFixedDamage: false, maxDieValue: maxDieValue };
  }
  
  // Try to find in damage-roll class div (for older format)
  const damageRollDiv = html.find('.damage-roll');
  if (damageRollDiv.length > 0) {
    const dicePattern = /(\d+)?[kd](\d+)/i;
    const match = damageRollDiv.html().match(dicePattern);
    
    if (match) {
      const maxDieValue = parseInt(match[2]);
      return { isFixedDamage: false, maxDieValue: maxDieValue };
    }
  }
  
  // Default to d8 if we can't determine (most common weapon die)
  return { isFixedDamage: false, maxDieValue: 8 };
}

/**
 * Update initiative in combat tracker
 * @param {Actor} actor - The actor
 * @param {number} newInitiative - The new initiative value
 */
async function updateInitiativeInCombat(actor, newInitiative) {
  const combat = game.combat;
  if (!combat) return;
  
  // Find the combatant for this actor
  const combatant = combat.combatants.find(c => c.actorId === actor.id);
  if (combatant) {
    await combat.setInitiative(combatant.id, newInitiative);
  }
}

/**
 * Initialize stamina effects system
 * Sets up hooks and event listeners
 */
export function initializeStaminaEffects() {
  // Użyj poprawnego namespace dla v13
  const ChatLogClass = foundry.applications.sidebar.tabs.ChatLog;
  
  // Rozszerzamy ChatLog._getEntryContextOptions
  const originalGetContextOptions = ChatLogClass.prototype._getEntryContextOptions;
  
  ChatLogClass.prototype._getEntryContextOptions = function() {
    const options = originalGetContextOptions.call(this);
    
    // Dodaj opcje wydawania Staminy dla rzutów (atrybuty, inicjatywa, ataki)
    options.push({
      name: game.i18n.localize("CONAN.Stamina.spend1"),
      icon: '<i class="fas fa-bolt"></i>',
      condition: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        return canSpendStamina(message, 1);
      },
      callback: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        spendStaminaToBoost(message, 1);
      }
    });
    
    options.push({
      name: game.i18n.localize("CONAN.Stamina.spend2"),
      icon: '<i class="fas fa-fire"></i>',
      condition: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        return canSpendStamina(message, 2);
      },
      callback: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        spendStaminaToBoost(message, 2);
      }
    });
    
    // Dodaj opcje wydawania Staminy dla obrażeń
    options.push({
      name: game.i18n.localize("CONAN.Stamina.spendDamage1"),
      icon: '<i class="fas fa-dice-d20"></i>',
      condition: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        return canSpendStaminaOnDamage(message, 1);
      },
      callback: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        spendStaminaToDamage(message, 1);
      }
    });
    
    options.push({
      name: game.i18n.localize("CONAN.Stamina.spendDamage2"),
      icon: '<i class="fas fa-dice-d20"></i>',
      condition: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        return canSpendStaminaOnDamage(message, 2);
      },
      callback: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        spendStaminaToDamage(message, 2);
      }
    });
    
    // Add Massive Damage option for last Stamina point
    options.push({
      name: game.i18n.localize("CONAN.Stamina.spendLastForMassive"),
      icon: '<i class="fas fa-explosion"></i>',
      condition: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        return canSpendLastStaminaOnMassiveDamage(message);
      },
      callback: li => {
        const messageId = li.dataset.messageId;
        const message = game.messages.get(messageId);
        spendStaminaToMassiveDamage(message);
      }
    });
    
    return options;
  };
}
