/**
 * Dialog for spellcasting rolls in Conan: The Hyborian Age
 */
export class SpellcastingDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    classes: ["conan", "dialog", "spellcasting-dialog"],
    tag: "form",
    window: {
      title: "CONAN.Spellcasting.title",
      icon: "fas fa-magic",
      minimizable: false,
      resizable: false
    },
    position: {
      width: 400,
      height: "auto"
    },
    actions: {
      cast: SpellcastingDialog._onCast,
      cancel: SpellcastingDialog._onCancel
    },
    form: {
      handler: SpellcastingDialog._onSubmit,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/spellcasting-dialog.hbs"
    }
  };

  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Update slider value display
    const slider = this.element.querySelector('.modifier-slider');
    const valueDisplay = this.element.querySelector('.modifier-value-label');
    if (slider && valueDisplay) {
      slider.addEventListener('input', (e) => {
        const value = e.target.value;
        valueDisplay.textContent = value > 0 ? `+${value}` : value;
      });
    }

    // Toggle target defense input based on magic attack checkbox
    const magicAttackCheckbox = this.element.querySelector('#magicAttack');
    const targetDefenseInput = this.element.querySelector('input[name="targetDefense"]');
    if (magicAttackCheckbox && targetDefenseInput) {
      const toggleDefenseInput = () => {
        targetDefenseInput.disabled = !magicAttackCheckbox.checked;
        targetDefenseInput.closest('.form-group').style.opacity = magicAttackCheckbox.checked ? '1' : '0.5';
      };
      
      magicAttackCheckbox.addEventListener('change', toggleDefenseInput);
      toggleDefenseInput(); // Initial state
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    const wits = this.actor.system.attributes.wits;
    const lifePoints = this.actor.system.lifePoints;
    const stamina = this.actor.system.stamina;
    
    // Get targeted token's sorcery defense if any
    let targetDefense = 5;
    const targets = Array.from(game.user.targets);
    if (targets.length > 0) {
      const targetActor = targets[0].actor;
      if (targetActor && targetActor.system.defense?.sorcery) {
        targetDefense = targetActor.system.defense.sorcery;
      }
    }
    
    context.actor = this.actor;
    context.wits = wits;
    context.lifePoints = lifePoints;
    context.stamina = stamina;
    context.targetDefense = targetDefense;
    context.hasTarget = targets.length > 0;
    
    return context;
  }

  static async _onCast(event, target) {
    // Get form data
    const form = this.element;
    const formData = new FormData(form);
    
    const modifier = parseInt(formData.get("modifier")) || 0;
    const lifePointsCost = parseInt(formData.get("lifePointsCost")) || 0;
    const staminaCost = parseInt(formData.get("staminaCost")) || 0;
    const isMagicAttack = formData.get("magicAttack") === "on";
    const targetDefense = parseInt(formData.get("targetDefense")) || 5;
    
    // Validate costs
    const currentLP = this.actor.system.lifePoints.actual;
    const currentStamina = this.actor.system.stamina.value;
    
    if (lifePointsCost > currentLP) {
      ui.notifications.error(game.i18n.localize("CONAN.Spellcasting.notEnoughLifePoints"));
      return;
    }
    
    if (staminaCost > currentStamina) {
      ui.notifications.error(game.i18n.localize("CONAN.Spellcasting.notEnoughStamina"));
      return;
    }
    
    // Check if total cost is zero
    const totalCost = lifePointsCost + staminaCost;
    if (totalCost === 0) {
      ui.notifications.warn(game.i18n.localize("CONAN.Spellcasting.noCostSpecified"));
      return;
    }
    
    // Deduct costs
    const updates = {};
    if (lifePointsCost > 0) {
      updates["system.lifePoints.actual"] = Math.max(0, currentLP - lifePointsCost);
    }
    if (staminaCost > 0) {
      updates["system.stamina.value"] = Math.max(0, currentStamina - staminaCost);
    }
    
    // Store spell costs temporarily as flags for potential Flex effect recovery
    updates["flags.conan-the-hyborian-age.lastSpellCost"] = {
      lifePointsCost,
      staminaCost
    };
    
    await this.actor.update(updates);
    
    // If not a magic attack, just show cost message
    if (!isMagicAttack) {
      await SpellcastingDialog._sendNonAttackMessage(this.actor, lifePointsCost, staminaCost);
      this.close();
      return;
    }
    
    // Perform magic attack roll
    await SpellcastingDialog._performMagicAttackRoll(
      this.actor,
      modifier,
      targetDefense,
      lifePointsCost,
      staminaCost
    );
    
    this.close();
  }

  static async _onCancel(event, target) {
    this.close();
  }

  static async _onSubmit(event, form, formData) {
    // Handled by _onCast action
  }

  /**
   * Send chat message for non-attack spellcasting
   */
  static async _sendNonAttackMessage(actor, lifePointsCost, staminaCost) {
    const costParts = [];
    if (lifePointsCost > 0) {
      costParts.push(`${lifePointsCost} ${game.i18n.localize("CONAN.Resources.lifePoints")}`);
    }
    if (staminaCost > 0) {
      costParts.push(`${staminaCost} ${game.i18n.localize("CONAN.Resources.stamina")}`);
    }
    
    const costString = costParts.join(" + ");
    
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: `
        <div class="conan-spellcasting-chat">
          <div class="spell-header">
            <h3>${game.i18n.localize("CONAN.Spellcasting.castingSpell")}</h3>
          </div>
          <div class="spell-cost">
            <strong>${game.i18n.localize("CONAN.Spellcasting.cost")}:</strong> ${costString}
          </div>
        </div>
      `
    };
    
    await ChatMessage.create(messageData);
  }

  /**
   * Perform magic attack roll with Wits + modifier vs target defense
   */
  static async _performMagicAttackRoll(actor, modifier, difficulty, lifePointsCost, staminaCost) {
    const wits = actor.system.attributes.wits;
    const witsValue = wits.value;
    const witsDie = wits.die || "d6";
    
    // Apply poison effect 2: -1 to all rolls
    
    const flexDie = actor.system.flexDie || 'd10';
    const flexDieDisabled = false;
    
    // Roll Wits die
    const witsRoll = await new Roll(`1${witsDie}`).evaluate();
    const witsResult = witsRoll.total;
    
    // Roll Flex die (unless disabled)
    const flexRoll = flexDieDisabled ? null : await new Roll(`1${flexDie}`).evaluate();
    const flexResult = flexDieDisabled ? 0 : flexRoll.total;
    const flexMax = parseInt(flexDie.substring(1));
    
    // Calculate total
    const total = witsResult + witsValue + modifier;
    
    // Check for Winds of Fate (1 on Wits die = automatic failure)
    const isWindsOfFate = witsResult === 1;
    
    // Check for Flex effect (max on Flex die, only if not disabled)
    const isFlexEffect = !flexDieDisabled && (flexResult === flexMax);
    
    // Determine success
    const isSuccess = !isWindsOfFate && total >= difficulty;
    
    // Show both dice in 3D simultaneously (if Dice So Nice is active)
    if (game.dice3d) {
      // Show both dice at once with different colors
      const promises = [];
      promises.push(game.dice3d.showForRoll(witsRoll, game.user, false));
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
    
    // Prepare cost display
    const costParts = [];
    if (lifePointsCost > 0) {
      costParts.push(`${lifePointsCost} ${game.i18n.localize("CONAN.Resources.lifePoints")}`);
    }
    if (staminaCost > 0) {
      costParts.push(`${staminaCost} ${game.i18n.localize("CONAN.Resources.stamina")}`);
    }
    const costString = costParts.join(" + ");
    
    // Create chat message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: `
        <div class="conan-roll-chat spellcasting-roll">
          <div class="roll-header">
            <h3>${game.i18n.localize("CONAN.Spellcasting.magicAttack")}</h3>
            <div class="attribute-info">
              ${game.i18n.localize("CONAN.Attributes.wits.label")} (${game.i18n.localize("CONAN.Attributes.wits.abbr")})
            </div>
          </div>
          <div class="roll-details">
            <div class="dice-results">
              <div class="dice-roll">
                <div class="die-label">${game.i18n.localize("CONAN.Attributes.wits.label")}</div>
                <div class="die-result${isWindsOfFate ? ' winds-of-fate' : ''}">${witsResult}</div>
              </div>
              <div class="dice-roll">
                <div class="die-label">${game.i18n.localize("CONAN.Roll.flexDie")}</div>
                <div class="die-result${isFlexEffect ? ' flex-effect' : ''}">${flexResult}</div>
              </div>
            </div>
            <div class="calculation">
              <span class="calc-part">${witsResult}</span>
              <span class="calc-operator">+</span>
              <span class="calc-part">${witsValue}</span>
              ${modifier !== 0 ? `<span class="calc-operator">${modifier >= 0 ? '+' : ''}</span><span class="calc-part">${modifier}</span>` : ''}
              <span class="calc-operator">=</span>
              <span class="calc-total">${total}</span>
            </div>
            <div class="difficulty-check">
              <span class="difficulty-label">${game.i18n.localize("CONAN.Spellcasting.targetDefense")}: </span>
              <span class="difficulty-value">${difficulty}</span>
            </div>
            <div class="spell-cost-display">
              <span class="cost-label">${game.i18n.localize("CONAN.Spellcasting.cost")}: </span>
              <span class="cost-value">${costString}</span>
            </div>
          </div>
          <div class="roll-result ${isSuccess ? 'success' : 'failure'}">
            ${isWindsOfFate ? `<div class="conan-winds-of-fate">${game.i18n.localize("CONAN.Roll.windsOfFate")}</div>` : ''}
            <div class="result-text">${isSuccess ? game.i18n.localize("CONAN.Roll.success") : game.i18n.localize("CONAN.Roll.failure")}</div>
            ${isFlexEffect ? `<div class="flex-notice">${game.i18n.localize("CONAN.Roll.flexEffect")}</div>` : ''}
            ${isSuccess ? `<div class="deal-damage-row" style="text-align:center; margin-top:10px;"><button class="sorcery-damage-btn" data-actor-id="${actor.id}" style="background: linear-gradient(90deg, #6a1b9a 0%, #ffd700 100%); color: #fff; border: 2px solid #4a148c; border-radius: 6px; font-weight: bold; font-size: 1em; padding: 6px 18px; box-shadow: 0 2px 8px rgba(106,27,154,0.18); cursor:pointer; transition: filter 0.2s; white-space: nowrap;"><i class="fas fa-bolt"></i> ${game.i18n.localize('CONAN.Damage.roll')}</button></div>` : ''}
          </div>
        </div>
      `
    };
    
    const chatMsg = await ChatMessage.create(messageData);

    // Przycisk Zadaj obrażenia (tylko dla sukcesu)
    if (isSuccess && chatMsg) {
      Hooks.once('renderChatMessageHTML', (message, html, data) => {
        if (message.id !== chatMsg.id) return;
        const btn = html.querySelector('.sorcery-damage-btn');
        if (btn) {
          btn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const actorId = btn.getAttribute('data-actor-id');
            const actor = game.actors.get(actorId);
            if (actor) {
              const { DamageDialog } = await import('./damage-dialog.mjs');
              const { rollSorceryWitsDamage, rollSorceryCustomDieDamage, rollSorceryFixedDamage } = await import('./roll-mechanics.mjs');
              const allowedDamageTypes = ['sorcery'];
              const result = await DamageDialog.prompt(actor, { allowedDamageTypes });
              if (!result) return;
              const { modifier, damageType, sorceryCustomModifier, sorceryDamageType, sorceryCustomDie, sorceryFixedValue } = result;
              if (damageType === 'sorcery') {
                if (sorceryDamageType === 'wits-die') {
                  await rollSorceryWitsDamage(actor, sorceryCustomModifier, modifier);
                } else if (sorceryDamageType === 'custom-die') {
                  await rollSorceryCustomDieDamage(actor, sorceryCustomDie, sorceryCustomModifier, modifier);
                } else if (sorceryDamageType === 'fixed') {
                  await rollSorceryFixedDamage(actor, sorceryFixedValue, sorceryCustomModifier, modifier);
                }
              }
            }
          });
        }
      });
    }
    
    // If Flex effect triggered, show Flex dialog
    if (isFlexEffect) {
      const { FlexEffectDialog } = await import("./flex-dialog.mjs");
      const dialog = new FlexEffectDialog(actor, { 
        mainRoll: witsRoll, 
        flexRoll, 
        success: isSuccess,
        isDamageRoll: false
      }, {
        rollContext: {
          isAttackRoll: true,
          attackType: 'sorcery',
          attributeLabel: game.i18n.localize("CONAN.Attributes.wits.label"),
          attributeAbbr: game.i18n.localize("CONAN.Attributes.wits.abbr"),
          attributeResult: witsResult,
          attributeValue: witsValue,
          modifier: modifier,
          difficulty: difficulty,
          total: total,
          flexResult: flexResult,
          flexMax: flexMax,
          lifePointsCost: lifePointsCost,
          staminaCost: staminaCost
        }
      });
      dialog.render(true);
    }
  }

  /**
   * Static method to show the dialog
   */
  static async prompt(actor) {
    const dialog = new SpellcastingDialog(actor);
    return dialog.render(true);
  }
}
