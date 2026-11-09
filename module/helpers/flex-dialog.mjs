/**
 * Flex Effect Dialog for Conan: The Hyborian Age
 */

import { renderCompactRoll, modifierTerm, dealDamageAction } from "./compact-roll.mjs";

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
      const currentLP = this.actor.system.lifePoints.value;
      const maxLP = this.actor.system.lifePoints.max;
      const newLP = Math.min(currentLP + lifePointsCost, maxLP);
      updates["system.lifePoints.value"] = newLP;
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
      content: await renderCompactRoll({
        rootClass: "flex-sorcery-recovery",
        icon: "fa-wand-sparkles",
        kind: game.i18n.localize("CONAN.FlexEffect.sorcery.name"),
        info: `${this.actor.name} ${game.i18n.localize("CONAN.FlexEffect.sorcery.recovered")}:`,
        lines: restoredDetails,
        footnote: game.i18n.localize("CONAN.FlexEffect.flexEffectUsed")
      })
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
        ui.notifications.warn(game.i18n.localize("CONAN.FlexDialog.cannotParseDieFormat"));
        return;
      }
    } else {
      ui.notifications.warn(game.i18n.localize("CONAN.FlexDialog.missingDamageInfo"));
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
      content: await renderCompactRoll({
        rootClass: "flex-massive-damage",
        icon: "fa-explosion",
        kind: game.i18n.localize("CONAN.FlexEffect.massive.name"),
        info: this.actor.name,
        terms: [
          { label: game.i18n.localize("CONAN.Common.damage"), value: originalDamage },
          { operator: "+", label: game.i18n.localize("CONAN.FlexEffect.massive.bonusDamage"), value: bonusDamage }
        ],
        totalLabel: game.i18n.localize("CONAN.FlexEffect.massive.totalDamage"),
        total: totalDamage,
        footnote: game.i18n.localize("CONAN.FlexEffect.flexEffectUsed"),
        action: dealDamageAction(this.actor, totalDamage)
      }),
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
    const isFightForLife = this.rollContext?.isFightForLife ?? false;

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

    // Fight for Life converted to success → character is unconscious (not dead)
    if (isFightForLife) {
      const { ConanSocket } = await import('./socket.mjs');
      await ConanSocket.requestToggleStatusEffect(null, null, this.actor.id, "unconscious", true);
      if (game.combat && ui.combat) ui.combat.render();
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
    
    const terms = [
      { label: game.i18n.localize('CONAN.Roll.attributeDie'), value: attributeResult },
      { operator: "+", label: game.i18n.localize('CONAN.Roll.attributeValue'), value: attributeValue }
    ];
    if (modifier !== 0) terms.push(modifierTerm(modifier));

    const content = await renderCompactRoll({
      kind: game.i18n.localize('CONAN.Roll.attributeTest'),
      info: displayName,
      terms,
      totalLabel: game.i18n.localize('CONAN.Roll.total'),
      total,
      flex: { disabled: false, result: flexResult, triggered: flexTriggered },
      verdict: {
        label: game.i18n.localize('CONAN.Roll.targetDifficulty'),
        difficulty,
        success: true
      },
      footnote: game.i18n.localize('CONAN.FlexEffect.flexEffectUsed')
    });
    
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      rollMode: game.settings.get("core", "messageMode")
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
    const terms = [
      { label: game.i18n.localize('CONAN.Roll.attributeDie'), value: attributeResult },
      { operator: "+", label: game.i18n.localize('CONAN.Roll.attributeValue'), value: attributeValue }
    ];
    if (modifier !== 0) terms.push(modifierTerm(modifier));

    const messageContent = await renderCompactRoll({
      headerClass: "attack",
      kind: attackTypeLabel,
      info: `${attributeLabel} (${attributeAbbr})`,
      terms,
      totalLabel: game.i18n.localize('CONAN.Roll.total'),
      total,
      flex: { disabled: false, result: flexResult, triggered: flexTriggered },
      verdict: {
        label: game.i18n.localize('CONAN.Attack.targetPhysicalDefense'),
        difficulty,
        success: true
      },
      footnote: game.i18n.localize('CONAN.FlexEffect.flexEffectUsed'),
      action: {
        buttonClass,
        icon: "fa-bolt",
        label: game.i18n.localize('CONAN.Damage.roll'),
        data: { "actor-id": this.actor.id, "attack-type": ctx.attackType }
      }
    });
    
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

}
