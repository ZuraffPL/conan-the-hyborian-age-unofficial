/**
 * Flex Effect Dialog for Conan: The Hyborian Age
 */

export class FlexEffectDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  static DEFAULT_OPTIONS = {
    id: "flex-effect-dialog",
    classes: ["conan", "dialog", "flex-effect"],
    tag: "dialog",
    window: {
      title: "CONAN.FlexEffect.title",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 500,
      height: "auto"
    },
    actions: {
      selectEffect: FlexEffectDialog._onSelectEffect
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/flex-effect.hbs"
    }
  };

  constructor(actor, rollResult, options = {}) {
    super(options);
    this.actor = actor;
    this.rollResult = rollResult;
    this.selectedEffect = null;
    this.rollContext = options.rollContext || {}; // Store context for re-rolling on success conversion
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.title = game.i18n.localize("CONAN.FlexEffect.title");
    context.subtitle = game.i18n.localize("CONAN.FlexEffect.subtitle");
    
    const isSuccess = this.rollResult?.success ?? true;
    const isDamageRoll = this.rollResult?.isDamageRoll ?? false;
    const attackType = this.rollContext?.attackType || '';
    const isSorceryRoll = attackType === 'sorcery';
    const hasSorceryCost = (this.rollContext?.lifePointsCost > 0) || (this.rollContext?.staminaCost > 0);
    
    // Build effects array based on success/failure and roll type
    const effects = [];
    
    // Stamina is always available
    effects.push({
      id: "stamina",
      name: game.i18n.localize("CONAN.FlexEffect.stamina.name"),
      description: game.i18n.localize("CONAN.FlexEffect.stamina.description"),
      icon: "fa-heart-pulse"
    });
    
    // Success conversion only available on failure for attribute tests and attacks (not damage rolls)
    if (!isSuccess && !isDamageRoll) {
      effects.push({
        id: "success",
        name: game.i18n.localize("CONAN.FlexEffect.success.name"),
        description: game.i18n.localize("CONAN.FlexEffect.success.description"),
        icon: "fa-trophy"
      });
    }
    
    // Massive Damage option for damage rolls
    if (isDamageRoll) {
      effects.push({
        id: "massive",
        name: game.i18n.localize("CONAN.FlexEffect.massive.name"),
        description: game.i18n.localize("CONAN.FlexEffect.massive.description"),
        icon: "fa-explosion"
      });
    }
    
    // Sorcery option for magic attacks/damage with spell cost
    if (isSorceryRoll && hasSorceryCost) {
      effects.push({
        id: "sorcery",
        name: game.i18n.localize("CONAN.FlexEffect.sorcery.name"),
        description: game.i18n.localize("CONAN.FlexEffect.sorcery.description"),
        icon: "fa-wand-sparkles"
      });
    }
    
    context.effects = effects;

    return context;
  }

  static async _onSelectEffect(event, target) {
    const effectId = target.dataset.effect;
    
    if (!effectId) return;

    this.selectedEffect = effectId;

    // Apply the selected effect
    await this.applyEffect(effectId);

    // Close the dialog
    this.close();
  }

  async applyEffect(effectId) {
    switch (effectId) {
      case "stamina":
        await this.applyStaminaEffect();
        break;
      case "success":
        await this.applySuccessEffect();
        break;
      case "sorcery":
        await this.applySorceryEffect();
        break;
      case "massive":
        await this.applyMassiveEffect();
        break;
      case "damage":
        await this.applyDamageEffect();
        break;
    }
  }

  async applySorceryEffect() {
    const lifePointsCost = this.rollContext?.lifePointsCost || 0;
    const staminaCost = this.rollContext?.staminaCost || 0;
    
    // Check if there are any costs to restore
    if (lifePointsCost === 0 && staminaCost === 0) {
      ui.notifications.warn("No spell costs to restore!");
      return;
    }
    
    const updates = {};
    const restoredParts = [];
    const restoredDetails = [];
    
    // Restore life points
    if (lifePointsCost > 0) {
      const currentLP = this.actor.system.lifePoints.actual;
      const maxLP = this.actor.system.lifePoints.max;
      const newLP = Math.min(currentLP + lifePointsCost, maxLP);
      updates["system.lifePoints.actual"] = newLP;
      restoredParts.push(`${lifePointsCost} ${game.i18n.localize("CONAN.Resources.lifePoints")}`);
      restoredDetails.push(`${game.i18n.localize("CONAN.Resources.lifePoints")}: ${currentLP} → ${newLP}`);
    }
    
    // Restore stamina
    if (staminaCost > 0) {
      const currentStamina = this.actor.system.stamina.value;
      const newStamina = Math.min(currentStamina + staminaCost, 100);
      updates["system.stamina.value"] = newStamina;
      restoredParts.push(`${staminaCost} ${game.i18n.localize("CONAN.Resources.stamina")}`);
      restoredDetails.push(`${game.i18n.localize("CONAN.Resources.stamina")}: ${currentStamina} → ${newStamina}`);
    }
    
    await this.actor.update(updates);
    
    const restoredString = restoredParts.join(" + ");
    
    // Show notification
    ui.notifications.info(
      `${this.actor.name}: ${game.i18n.localize("CONAN.FlexEffect.sorcery.name")} - ${game.i18n.localize("CONAN.FlexEffect.sorcery.restored")}: ${restoredString}`
    );
    
    // Create chat message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="conan-roll-chat flex-sorcery-recovery">
          <div class="roll-header">
            <h3><i class="fas fa-wand-sparkles"></i> ${game.i18n.localize("CONAN.FlexEffect.sorcery.name")}</h3>
          </div>
          <div class="roll-details">
            <div class="flex-notice">
              <i class="fas fa-star"></i> ${game.i18n.localize("CONAN.FlexEffect.flexEffectUsed")}
            </div>
            <div class="sorcery-recovery-info">
              <p><strong>${this.actor.name}</strong> ${game.i18n.localize("CONAN.FlexEffect.sorcery.recovered")}:</p>
              <div class="recovery-details">
                ${restoredDetails.map(detail => `<div class="recovery-item">${detail}</div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      `
    };
    
    await ChatMessage.create(messageData);
  }

  async applyMassiveEffect() {
    const originalDamage = parseInt(this.rollContext?.originalDamage) || 0;
    const weaponDie = this.rollContext?.weaponDie || null; // e.g., "d6", "1d10"
    const weaponModifier = parseInt(this.rollContext?.weaponModifier) || 0; // e.g., 3 for ranged weapon with +3
    const isFixedDamage = this.rollContext?.isFixedDamage || false;
    
    let bonusDamage = 0;
    let description = '';
    
    if (isFixedDamage) {
      // For fixed damage (unarmed, sorcery fixed): double the damage
      bonusDamage = originalDamage;
      description = game.i18n.format("CONAN.FlexEffect.massive.description");
    } else if (weaponDie) {
      // For weapon/die damage: add max die value + modifier
      // Extract die size from formats like "d6", "1d6", "2d8" etc.
      const dieMatch = weaponDie.match(/(\d*)d(\d+)/i);
      if (dieMatch) {
        const dieCount = dieMatch[1] ? parseInt(dieMatch[1]) : 1; // Number before 'd', default 1
        const dieSize = parseInt(dieMatch[2]); // Number after 'd'
        const dieMax = dieCount * dieSize; // Total maximum: count × size
        bonusDamage = dieMax + weaponModifier;
        description = `${weaponDie} (max ${dieMax})${weaponModifier > 0 ? ` + ${weaponModifier}` : ''}`;
      } else {
        ui.notifications.warn("Cannot parse weapon die format!");
        return;
      }
    } else {
      ui.notifications.warn("Cannot apply Massive Damage - missing damage information!");
      return;
    }
    
    const totalDamage = originalDamage + bonusDamage;
    
    // Show notification
    ui.notifications.info(
      `${this.actor.name}: ${game.i18n.localize("CONAN.FlexEffect.massive.message")} ${originalDamage} → ${totalDamage}`
    );
    
    // Create chat message with massive damage
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="conan-roll-chat flex-massive-damage">
          <div class="roll-header">
            <h3><i class="fas fa-explosion"></i> ${game.i18n.localize("CONAN.FlexEffect.massive.name")}</h3>
          </div>
          <div class="roll-details">
            <div class="flex-notice">
              <i class="fas fa-star"></i> ${game.i18n.localize("CONAN.FlexEffect.flexEffectUsed")}
            </div>
            <div class="massive-damage-info">
              <p><strong>${this.actor.name}</strong> ${game.i18n.localize("CONAN.FlexEffect.massive.message")}</p>
              <div class="damage-breakdown">
                <div class="damage-item">${game.i18n.localize("CONAN.Common.damage")}: ${originalDamage}</div>
                <div class="damage-item">${game.i18n.localize("CONAN.FlexEffect.massive.bonusDamage")}: +${bonusDamage}</div>
                <div class="damage-total">${game.i18n.localize("CONAN.FlexEffect.massive.totalDamage")}: <strong>${totalDamage}</strong></div>
              </div>
            </div>
          </div>
          
          <div class="damage-actions" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.1); text-align: center;">
            <button class="deal-pc-damage-btn" 
                    data-damage="${totalDamage}" 
                    data-attacker-id="${this.actor._id || this.actor.id}" 
                    data-token-id="${this.actor.token?.id || ''}" 
                    data-scene-id="${this.actor.token?.parent?.id || ''}">
              <i class="fas fa-heart-broken"></i> ${game.i18n.localize('CONAN.Damage.DealDamage')}
            </button>
          </div>
        </div>
      `,
      flags: {
        "conan-the-hyborian-age": {
          damageDealt: false,
          totalDamage: totalDamage,
          attackerId: this.actor._id || this.actor.id,
          tokenId: this.actor.token?.id || '',
          sceneId: this.actor.token?.parent?.id || ''
        }
      }
    };
    
    await ChatMessage.create(messageData);
  }

  async applyStaminaEffect() {
    const currentStamina = this.actor.system.stamina?.value || 0;
    const newStamina = Math.min(currentStamina + 1, 100);
    await this.actor.update({
      'system.stamina.value': newStamina
    });

    ui.notifications.info(
      `${this.actor.name}: ${game.i18n.localize("CONAN.FlexEffect.stamina.name")} ${currentStamina} → ${newStamina}`
    );
  }

  async applySuccessEffect() {
    const isAttackRoll = this.rollContext?.isAttackRoll ?? false;
    
    // Show notification
    ui.notifications.info(
      `${this.actor.name}: ${game.i18n.localize("CONAN.FlexEffect.success.name")} - ${game.i18n.localize("CONAN.Roll.failure")} → ${game.i18n.localize("CONAN.Roll.success")}`
    );
    
    // Generate new success message
    if (isAttackRoll && this.rollContext) {
      // For attack rolls - generate message with Roll Damage button
      await this.generateAttackSuccessMessage();
    } else if (this.rollContext) {
      // For attribute tests - generate simple success message
      await this.generateAttributeSuccessMessage();
    }
  }
  
  async generateAttributeSuccessMessage() {
    const ctx = this.rollContext;
    
    const attributeLabel = ctx.attributeLabel || '';
    const attributeAbbr = ctx.attributeAbbr || '';
    const displayName = ctx.displayName || `${attributeLabel} (${attributeAbbr})`;
    const attributeResult = ctx.attributeResult || 0;
    const attributeValue = ctx.attributeValue || 0;
    const modifier = ctx.modifier || 0;
    const difficulty = ctx.difficulty || 0;
    const total = ctx.total || 0;
    const flexResult = ctx.flexResult || 0;
    const flexMax = ctx.flexMax || 10;
    const flexTriggered = flexResult === flexMax;
    
    const modifierSign = modifier >= 0 ? '+' : '';
    
    const content = `
      <div class="conan-roll-chat">
        <div class="roll-header">
          <h3>${game.i18n.localize('CONAN.Roll.attributeTest')}</h3>
          <div class="attribute-info">${displayName}</div>
        </div>
        <div class="roll-details">
          <div class="dice-results">
            <div class="dice-roll">
              <div class="die-label">${game.i18n.localize('CONAN.Roll.attributeDie')}</div>
              <div class="die-result">${attributeResult}</div>
            </div>
            <div class="dice-roll">
              <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
              <div class="die-result${flexTriggered ? ' flex-effect' : ''}">${flexResult}</div>
            </div>
          </div>
          
          <div class="calculation">
            <span class="calc-part">${attributeResult}</span>
            <span class="calc-operator">+</span>
            <span class="calc-part">${attributeValue}</span>
            ${modifier !== 0 ? `<span class="calc-operator">${modifierSign}</span><span class="calc-part">${Math.abs(modifier)}</span>` : ''}
            <span class="calc-operator">=</span>
            <span class="calc-total">${total}</span>
          </div>
          
          <div class="difficulty-check">
            <span class="difficulty-label">${game.i18n.localize('CONAN.Roll.targetDifficulty')}:</span>
            <span class="difficulty-value">${difficulty}</span>
          </div>
          
          <div class="roll-result success">
            <div class="result-text">${game.i18n.localize('CONAN.Roll.success')}</div>
            <div class="flex-bonus-note">${game.i18n.localize('CONAN.FlexEffect.flexEffectUsed')}</div>
          </div>
        </div>
      </div>
    `;
    
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      rollMode: game.settings.get("core", "rollMode")
    });
  }
  
  async generateAttackSuccessMessage() {
    const ctx = this.rollContext;
    
    // Determine attack type label
    const attackTypeLabel = game.i18n.localize(
      ctx.attackType === 'melee' ? 'CONAN.Attack.melee' :
      ctx.attackType === 'ranged' ? 'CONAN.Attack.ranged' :
      ctx.attackType === 'thrown' ? 'CONAN.Attack.thrown' :
      'CONAN.Attack.sorcery'
    );
    
    const attributeLabel = ctx.attributeLabel || '';
    const attributeAbbr = ctx.attributeAbbr || '';
    const attributeResult = ctx.attributeResult || 0;
    const attributeValue = ctx.attributeValue || 0;
    const modifier = ctx.modifier || 0;
    const difficulty = ctx.difficulty || 0;
    const total = ctx.total || 0;
    const flexResult = ctx.flexResult || 0;
    const flexMax = ctx.flexMax || 10;
    const flexTriggered = flexResult === flexMax;
    
    // Generate damage button - use unique class to avoid handler conflicts
    const buttonClass = 'flex-roll-damage-btn';
    const dealDamageButtonHtml = `
      <div class="deal-damage-row" style="text-align:center; margin-top:10px;">
        <button class="${buttonClass}" data-actor-id="${this.actor.id}" data-attack-type="${ctx.attackType}" style="background: linear-gradient(90deg, #6a1b9a 0%, #ffd700 100%); color: #fff; border: 2px solid #4a148c; border-radius: 6px; font-weight: bold; font-size: 1em; padding: 6px 18px; box-shadow: 0 2px 8px rgba(106,27,154,0.18); cursor:pointer; transition: filter 0.2s;">
          <i class="fas fa-bolt"></i> ${game.i18n.localize('CONAN.Damage.roll')}
        </button>
      </div>
    `;
    
    const modifierSign = modifier >= 0 ? '+' : '';
    const modifierText = modifier !== 0 ? ` ${modifierSign}${modifier}` : '';
    
    const messageContent = `
      <div class="conan-roll-chat">
        <div class="roll-header attack">
          <h3>${attackTypeLabel}</h3>
          <div class="attribute-info">${attributeLabel} (${attributeAbbr})</div>
        </div>
        <div class="roll-details">
          <div class="dice-results">
            <div class="dice-roll">
              <div class="die-label">${attributeLabel}</div>
              <div class="die-result">${attributeResult}</div>
            </div>
            <div class="dice-roll">
              <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
              <div class="die-result${flexTriggered ? ' flex-effect' : ''}">${flexResult}</div>
            </div>
          </div>
          
          <div class="calculation">
            <span class="calc-part">${attributeResult}</span>
            <span class="calc-operator">+</span>
            <span class="calc-part">${attributeValue}</span>
            ${modifier !== 0 ? `<span class="calc-operator">${modifierSign}</span><span class="calc-part">${Math.abs(modifier)}</span>` : ''}
            <span class="calc-operator">=</span>
            <span class="calc-total">${total}</span>
          </div>
          
          <div class="difficulty-check">
            <span class="difficulty-label">OF celu:</span>
            <span class="difficulty-value">${difficulty}</span>
          </div>
          
          <div class="roll-result success">
            <div class="result-text">${game.i18n.localize('CONAN.Roll.success')}</div>
            <div class="flex-bonus-note">${game.i18n.localize('CONAN.FlexEffect.flexEffectUsed')}</div>
          </div>
          ${dealDamageButtonHtml}
        </div>
      </div>
    `;
    
    const chatMsg = await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: messageContent,
      sound: CONFIG.sounds.dice,
      flags: {
        conan: {
          attackSuccess: true,
          attackType: ctx.attackType,
          flexConverted: true
        }
      }
    });
    
    // Set up click handler for the damage button
    if (chatMsg) {
      const buttonClass = '.flex-roll-damage-btn';
      
      Hooks.once('renderChatMessageHTML', (message, html, data) => {
        if (message.id !== chatMsg.id) return;
        const btn = html.querySelector(buttonClass);
        if (btn) {
          btn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const actorId = btn.getAttribute('data-actor-id');
            const attackType = btn.getAttribute('data-attack-type');
            let baseActor = game.actors.get(actorId);
            let actor = baseActor;
            if (!actor && canvas.tokens) {
              for (let token of canvas.tokens.placeables) {
                if (token.actor && token.actor.id === actorId) {
                  actor = token.actor;
                  break;
                }
              }
            }
            if (!actor) return;
            
            const { DamageDialog } = await import('./damage-dialog.mjs');
            const { rollSorceryWitsDamage, rollSorceryCustomDieDamage, rollSorceryFixedDamage } = await import('./roll-mechanics.mjs');
            
            let allowedDamageTypes = ['melee', 'thrown', 'ranged', 'sorcery'];
            
            if (attackType === 'melee') allowedDamageTypes = ['melee'];
            else if (attackType === 'ranged') allowedDamageTypes = ['ranged', 'thrown'];
            else if (attackType === 'thrown') allowedDamageTypes = ['thrown'];
            else if (attackType === 'sorcery') allowedDamageTypes = ['sorcery'];
            
            const dialogActor = baseActor || actor;
            const result = await DamageDialog.prompt(dialogActor, { allowedDamageTypes });
            if (!result) return;
            
            const { modifier, damageType, weaponId, sorceryCustomModifier, sorceryDamageType, sorceryCustomDie, sorceryFixedValue } = result;
            
            if (damageType === 'melee' || damageType === 'thrown' || damageType === 'ranged') {
              if (weaponId) {
                if (weaponId === 'unarmed' && damageType === 'melee') {
                  const { rollMeleeDamage } = await import('./roll-mechanics.mjs');
                  await rollMeleeDamage(actor, null, modifier);
                } else {
                  const simpleWeaponId = weaponId.split('.').pop();
                  const item = actor.items.get(simpleWeaponId);
                  if (item && item.system && item.system.damage !== undefined) {
                    if (damageType === 'melee') {
                      const { rollMeleeDamage } = await import('./roll-mechanics.mjs');
                      await rollMeleeDamage(actor, item, modifier);
                    } else if (damageType === 'thrown') {
                      const { rollThrownDamage } = await import('./roll-mechanics.mjs');
                      await rollThrownDamage(actor, item, modifier);
                    } else if (damageType === 'ranged') {
                      const { rollRangedDamage } = await import('./roll-mechanics.mjs');
                      await rollRangedDamage(actor, item, modifier);
                    }
                  } else {
                    ui.notifications?.warn(game.i18n.localize('CONAN.DamageDialog.NoWeaponFound'));
                  }
                }
              } else {
                ui.notifications?.warn(game.i18n.localize('CONAN.DamageDialog.NoWeaponId'));
              }
            } else if (damageType === 'sorcery') {
              if (sorceryDamageType === 'wits-die') {
                await rollSorceryWitsDamage(actor, sorceryCustomModifier, modifier);
              } else if (sorceryDamageType === 'custom-die') {
                await rollSorceryCustomDieDamage(actor, sorceryCustomDie, sorceryCustomModifier, modifier);
              } else if (sorceryDamageType === 'fixed') {
                await rollSorceryFixedDamage(actor, sorceryFixedValue, sorceryCustomModifier, modifier);
              }
            }
          });
        }
      });
    }
  }

  async applyDamageEffect() {
    // This will be handled in damage rolls
    ui.notifications.info(
      `${this.actor.name}: ${game.i18n.localize("CONAN.FlexEffect.damage.name")} - ${game.i18n.localize("CONAN.FlexEffect.damage.description")}`
    );
  }
}
