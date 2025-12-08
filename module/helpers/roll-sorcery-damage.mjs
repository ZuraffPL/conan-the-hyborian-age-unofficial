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

  // Sum modifiers
  const totalModifier = Number(paramModifier) + Number(sliderModifier);
  const total = Number(fixedValue) + totalModifier;

  // Flex die roll
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}`).evaluate() : null;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);

  // Show flex die in 3D (if Dice So Nice is active)
  if (game.dice3d && flexRoll) {
    await game.dice3d.showForRoll(flexRoll, game.user, false, null, false, null, {
      appearance: { colorset: "bronze" }
    });
  }

  // Prepare chat message content
  const modifierSign = totalModifier >= 0 ? '+' : '';
  const content = `
    <div class="conan-roll-chat damage-roll spellcasting-roll">
      <div class="roll-header">
        <h3>${game.i18n.localize("CONAN.Damage.sorceryDamage")}</h3>
        <div class="weapon-info">${game.i18n.localize("CONAN.Damage.sorceryFixedValue")}</div>
      </div>
      <div class="roll-details">
        <div class="dice-results">
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize("CONAN.Damage.fixedValue")}</div>
            <div class="die-result">${fixedValue}</div>
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
        <div class="damage-components">
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Damage.fixedValue")}</span>:
            <span class="component-value">${fixedValue}</span>
          </div>
          ${totalModifier !== 0 ? `
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel")}</span>:
            <span class="component-value">${modifierSign}${totalModifier}</span>
          </div>
          ` : ''}
        </div>
        <div class="damage-total highlighted">
          <span class="total-label">${game.i18n.localize("CONAN.Common.damage")}</span>:
          <span class="total-value">${total}</span>
        </div>
        ${flexTriggered ? `
        <div class="roll-result">
          <div class="flex-notice"><i class="fas fa-star"></i> ${game.i18n.localize('CONAN.Roll.flexEffect')}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="damage-actions" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.1); text-align: center;">
        <button class="deal-pc-damage-btn" 
                data-damage="${total}" 
                data-attacker-id="${actor._id || actor.id}" 
                data-token-id="${actor.token?.id || ''}" 
                data-scene-id="${actor.token?.parent?.id || ''}">
          <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
        </button>
      </div>
    </div>
  `;

  // Create chat message with flags
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    sound: CONFIG.sounds.dice,
    rollMode: game.settings.get("core", "rollMode"),
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

  // Sum modifiers
  const totalModifier = Number(paramModifier) + Number(sliderModifier);
  // Build the roll formula: Custom Die + total modifier
  const formula = `1${dieType} + ${totalModifier}`;
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}`).evaluate() : null;

  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);

  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
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

  // Prepare chat message content (inspired by melee damage)
  const modifierSign = totalModifier >= 0 ? '+' : '';
  const dieResult = mainRoll.dice.length > 0 ? mainRoll.dice[0].total : null;
  const dieLabel = dieType.toUpperCase();

  const content = `
    <div class="conan-roll-chat damage-roll spellcasting-roll">
      <div class="roll-header">
        <h3>${game.i18n.localize("CONAN.Damage.sorceryDamage")}</h3>
        <div class="weapon-info">${game.i18n.localize("CONAN.Damage.sorceryCustomDie")}</div>
      </div>
      <div class="roll-details">
        <div class="dice-results">
          <div class="dice-roll">
            <div class="die-label">${dieLabel}</div>
            <div class="die-result">${dieResult}</div>
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
        <div class="damage-components">
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Damage.sorceryCustomDie")}</span>:
            <span class="component-value">${dieType}</span>
          </div>
          ${totalModifier !== 0 ? `
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel")}</span>:
            <span class="component-value">${modifierSign}${totalModifier}</span>
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
  await ChatMessage.create({
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

  // Sum modifiers
  const totalModifier = Number(paramModifier) + Number(sliderModifier);
  // Build the roll formula: Wits Die + total modifier
  const formula = `1${witsDie} + ${totalModifier}`;
  const mainRoll = await new Roll(formula).evaluate();
  const flexRoll = (isCharacter && !flexDieDisabled) ? await new Roll(`1${flexDie}`).evaluate() : null;

  const damageTotal = mainRoll.total;
  const flexResult = flexRoll ? flexRoll.dice[0].total : 0;
  const flexMax = flexDie ? parseInt(flexDie.substring(1)) : 0;
  const flexTriggered = flexRoll && (flexResult === flexMax);

  // Show both dice in 3D simultaneously (if Dice So Nice is active)
  if (game.dice3d) {
    const promises = [];
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

  // Prepare chat message content (inspired by melee damage)
  const modifierSign = totalModifier >= 0 ? '+' : '';
  const witsDieResult = mainRoll.dice.length > 0 ? mainRoll.dice[0].total : null;
  const witsAbbr = game.i18n.localize("CONAN.Attributes.wits.abbr");
  const witsLabel = game.i18n.localize("CONAN.Attributes.wits.label");

  const content = `
    <div class="conan-roll-chat damage-roll spellcasting-roll">
      <div class="roll-header">
        <h3>${game.i18n.localize("CONAN.Damage.sorceryDamage")}</h3>
        <div class="weapon-info">${game.i18n.localize("CONAN.Damage.sorceryWitsDie")}</div>
      </div>
      <div class="roll-details">
        <div class="dice-results">
          <div class="dice-roll">
            <div class="die-label">${witsAbbr} (${witsLabel})</div>
            <div class="die-result">${witsDieResult}</div>
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
        <div class="damage-components">
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Attributes.wits.die")}</span>:
            <span class="component-value">${witsDie}</span>
          </div>
          ${totalModifier !== 0 ? `
          <div class="component">
            <span class="component-label">${game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel")}</span>:
            <span class="component-value">${modifierSign}${totalModifier}</span>
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
  await ChatMessage.create({
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
