/**
 * Dialog for making attack rolls
 */
export class AttackDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["conan", "dialog", "attack-dialog"],
    tag: "form",
    window: {
      title: "CONAN.Attack.title",
      icon: "fas fa-sword",
      minimizable: false
    },
    position: {
      width: 400,
      height: "auto"
    },
    actions: {
      roll: AttackDialog._onRoll
    },
    form: {
      handler: AttackDialog._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/attack-dialog.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.actor = this.actor;
    context.might = this.actor.system.attributes.might.value;
    context.edge = this.actor.system.attributes.edge.value;
    
    // Get target's Physical Defense from selected token
    const targets = Array.from(game.user.targets);
    if (targets.length > 0 && targets[0].actor) {
      const targetActor = targets[0].actor;
      context.targetDefense = targetActor.system.defense?.physical || 5;
    } else {
      context.targetDefense = 5;
    }
    
    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Setup modifier slider
    const modifierSlider = this.element.querySelector('input[name="modifier"]');
    const modifierLabel = this.element.querySelector('.modifier-value-label');
    
    if (modifierSlider && modifierLabel) {
      modifierSlider.addEventListener('input', (event) => {
        const value = parseInt(event.target.value);
        modifierLabel.textContent = value >= 0 ? `+${value}` : value;
      });
    }
  }

  /**
   * Handle form submission
   */
  static async _onSubmit(event, form, formData) {
    // Form data will be processed in _onRoll
  }

  /**
   * Handle roll button click
   */
  static async _onRoll(event, target) {
    const form = this.element;
    
    // Get form values directly
    const attackTypeInput = form.querySelector('input[name="attackType"]:checked');
    const focusedAttackInput = form.querySelector('input[name="focusedAttack"]');
    const modifierInput = form.querySelector('input[name="modifier"]');
    const targetDefenseInput = form.querySelector('input[name="targetDefense"]');
    
    const attackType = attackTypeInput ? attackTypeInput.value : 'melee';
    const focusedAttack = focusedAttackInput ? focusedAttackInput.checked : false;
    const sliderModifier = modifierInput ? parseInt(modifierInput.value) : 0;
    const targetDefense = targetDefenseInput ? parseInt(targetDefenseInput.value) : 5;
    
    // Determine which attribute to use
    const attribute = attackType === 'melee' ? 'might' : 'edge';
    const attributeValue = this.actor.system.attributes[attribute].value;
    const attributeDie = this.actor.system.attributes[attribute].die;
    
    // Calculate modifier (slider + focused attack bonus)
    let modifier = sliderModifier;
    if (focusedAttack) modifier += 2;
    
    const flexDie = this.actor.system.flexDie || 'd10';
    const flexDieDisabled = false;
    
    // Roll attribute die
    const attributeRoll = await new Roll(`1${attributeDie}`).evaluate();
    const attributeResult = attributeRoll.total;
    
    // Roll Flex die (unless disabled)
    const flexRoll = flexDieDisabled ? null : await new Roll(`1${flexDie}`).evaluate();
    const flexResult = flexDieDisabled ? 0 : flexRoll.total;
    const flexMax = parseInt(flexDie.substring(1));
    
    // Calculate total
    const total = attributeResult + attributeValue + modifier;
    
    // Check for Winds of Fate (1 on attribute die)
    const isWindsOfFate = attributeResult === 1;
    
    // Check for success (total >= target defense, unless Winds of Fate)
    const isSuccess = !isWindsOfFate && (total >= targetDefense);
    
    // Check for Flex Effect (max on flex die, only if not disabled)
    const isFlexEffect = !flexDieDisabled && (flexResult === flexMax);
    
    // Prepare chat message
    const attributeLabel = game.i18n.localize(`CONAN.Attributes.${attribute}.label`);
    const attributeAbbr = game.i18n.localize(`CONAN.Attributes.${attribute}.abbr`);
    const attackTypeLabel = game.i18n.localize(
      attackType === 'melee' ? 'CONAN.Attack.melee' :
      attackType === 'ranged' ? 'CONAN.Attack.ranged' :
      attackType === 'thrown' ? 'CONAN.Attack.thrown' :
      'CONAN.Attack.sorcery'
    );
    
    // Determine if we should show the Deal Damage button
    let showDealDamageButton = false;
    let dealDamageButtonHtml = '';
      // Show Deal Damage button for both PC and NPC attacks
      if (
        isSuccess &&
        game.combat &&
        game.combat.combatants.size > 0 &&
        game.user.targets.size > 0 &&
        this.actor && (this.actor.type === 'character' || this.actor.type === 'minion' || this.actor.type === 'antagonist')
      ) {
      showDealDamageButton = true;
      // Button with a unique class and data-actor-id for event delegation
      dealDamageButtonHtml = `
        <div class="deal-damage-row" style="text-align:center; margin-top:10px;">
          <button class="roll-damage-btn" data-actor-id="${this.actor.id}" style="background: linear-gradient(90deg, #6a1b9a 0%, #ffd700 100%); color: #fff; border: 2px solid #4a148c; border-radius: 6px; font-weight: bold; font-size: 1em; padding: 6px 18px; box-shadow: 0 2px 8px rgba(106,27,154,0.18); cursor:pointer; transition: filter 0.2s;">
            <i class="fas fa-bolt"></i> ${game.i18n.localize('CONAN.Damage.roll')}
          </button>
        </div>
      `;
    }

    let messageContent = `
      <div class="conan-roll-chat">
        <div class="roll-header attack">
          <h3>${attackTypeLabel}</h3>
          <div class="attribute-info">${attributeLabel} (${attributeAbbr})</div>
        </div>
        <div class="roll-details">
          <div class="dice-results">
            <div class="dice-roll">
              <div class="die-label">${attributeLabel}</div>
              <div class="die-result${isWindsOfFate ? ' winds-of-fate' : ''}">${attributeResult}</div>
            </div>
            ${!flexDieDisabled ? `
            <div class="dice-roll">
              <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
              <div class="die-result${isFlexEffect ? ' flex-effect' : ''}">${flexResult}</div>
            </div>
            ` : `
            <div class="dice-roll disabled">
              <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
              <div class="die-result disabled"><i class="fas fa-ban"></i></div>
            </div>
            `}
          </div>
          <div class="calculation">
            <span class="calc-part">${attributeResult}</span>
            <span class="calc-operator">+</span>
            <span class="calc-part">${attributeValue}</span>
            ${modifier !== 0 ? `<span class="calc-operator">+</span><span class="calc-part">${modifier}</span>` : ''}
            <span class="calc-operator">=</span>
            <span class="calc-total">${total}</span>
          </div>
          <div class="difficulty-check">
            <span class="difficulty-label">OF celu:</span>
            <span class="difficulty-value">${targetDefense}</span>
          </div>
          <div class="roll-result ${isSuccess ? 'success' : 'failure'}">
            <div class="result-text">${isSuccess ? game.i18n.localize('CONAN.Roll.success') : game.i18n.localize('CONAN.Roll.failure')}</div>
          </div>
          ${isWindsOfFate ? `<div class="winds-of-fate-message" style="color:#b71c1c; font-weight:bold; margin-top:8px; font-size:1.1em; text-shadow:0 0 4px #fff,0 0 2px #b71c1c;">${game.i18n.localize('CONAN.Roll.windsOfFate')}</div>` : ''}
          ${dealDamageButtonHtml}
        </div>
      </div>`;
    
    // Create chat message
    const chatMsg = await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: messageContent,
      sound: CONFIG.sounds.dice,
      flags: {
        "conan-the-hyborian-age": {
          attackSuccess: isSuccess,
          attackType: attackType
        }
      }
    });

    // If the Deal Damage button is present, set up a click handler (event delegation)
    if (showDealDamageButton && chatMsg) {
      // Wait for the message to render in chat (Foundry VTT v13+)
      Hooks.once('renderChatMessageHTML', (message, html, data) => {
        if (message.id !== chatMsg.id) return;
        const btn = html.querySelector('.roll-damage-btn');
        if (btn) {
          btn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            // Find the actor by ID
            const actorId = btn.getAttribute('data-actor-id');
            let baseActor = game.actors.get(actorId);
            let actor = baseActor;
            if (!actor && canvas.tokens) {
              // Try to find the actor from a token on the canvas (for token-based actors)
              for (let token of canvas.tokens.placeables) {
                if (token.actor && token.actor.id === actorId) {
                  actor = token.actor;
                  break;
                }
              }
            }
            if (!actor) return;
            {
              const { DamageDialog } = await import('./damage-dialog.mjs');
              const { rollSorceryWitsDamage, rollSorceryCustomDieDamage, rollSorceryFixedDamage } = await import('./roll-mechanics.mjs');
              // Determine allowed damage types based on attack type
              let allowedDamageTypes = ['melee', 'thrown', 'ranged', 'sorcery'];
              // Try to extract attack type from chat message context
              let chatContent = btn.closest('.conan-roll-chat');
              let attackType = null;
              if (chatContent) {
                const header = chatContent.querySelector('.roll-header.attack h3');
                if (header) {
                  const text = header.textContent.toLowerCase();
                  if (text.includes(game.i18n.localize('CONAN.Attack.melee').toLowerCase())) attackType = 'melee';
                  else if (text.includes(game.i18n.localize('CONAN.Attack.ranged').toLowerCase())) attackType = 'ranged';
                  else if (text.includes(game.i18n.localize('CONAN.Attack.thrown').toLowerCase())) attackType = 'thrown';
                  else if (text.includes(game.i18n.localize('CONAN.Attack.sorcery').toLowerCase())) attackType = 'sorcery';
                }
              }
              if (attackType === 'melee') allowedDamageTypes = ['melee'];
              else if (attackType === 'ranged') allowedDamageTypes = ['ranged', 'thrown'];
              else if (attackType === 'thrown') allowedDamageTypes = ['thrown'];
              else if (attackType === 'sorcery') allowedDamageTypes = ['sorcery'];
              // Use base actor for damage dialog if available, to ensure consistent equipped weapons
              const dialogActor = baseActor || actor;
              const result = await DamageDialog.prompt(dialogActor, { allowedDamageTypes });
              if (!result) return;
              // --- Handle the result as in actor-sheet.mjs ---
              const { modifier, damageType, weaponId, sorceryCustomModifier, sorceryDamageType, sorceryCustomDie, sorceryFixedValue } = result;
              if (damageType === 'melee' || damageType === 'thrown' || damageType === 'ranged') {
                // Import and call the appropriate roll function for weapon damage
                if (weaponId) {
                  // Handle unarmed attacks (melee only)
                  if (weaponId === 'unarmed' && damageType === 'melee') {
                    const { rollMeleeDamage } = await import('./roll-mechanics.mjs');
                    await rollMeleeDamage(actor, null, modifier);
                  } else {
                    // Support both simple and token-based item IDs
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
            }
          });
        }
      });
    }
    
    // Show 3D dice if Dice So Nice is active
    if (game.dice3d) {
      // Show both dice simultaneously
      game.dice3d.showForRoll(attributeRoll, game.user, true);
      game.dice3d.showForRoll(flexRoll, game.user, true, null, false, null, { 
        colorset: "bronze" 
      });
    }
    
    // Handle Flex Effect
    if (isFlexEffect) {
      const { FlexEffectDialog } = await import("./flex-dialog.mjs");
      const flexDialog = new FlexEffectDialog(this.actor, { 
        mainRoll: attributeRoll, 
        flexRoll: flexRoll, 
        success: isSuccess,
        isDamageRoll: false
      }, {
        rollContext: {
          isAttackRoll: true,
          attackType: attackType,
          attributeLabel: attributeLabel,
          attributeAbbr: attributeAbbr,
          attributeResult: attributeResult,
          attributeValue: attributeValue,
          modifier: modifier,
          difficulty: targetDefense,
          total: total,
          flexResult: flexResult,
          flexMax: flexMax
        }
      });
      flexDialog.render(true);
    }
    
    // Close the dialog
    this.close();
  }

  /**
   * Prompt for an attack roll
   */
  static async prompt(actor) {
    const dialog = new AttackDialog(actor);
    return dialog.render(true);
  }
}
