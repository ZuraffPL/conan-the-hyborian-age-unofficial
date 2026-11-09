import { getFlexDieColorset } from "./dice-utils.mjs";
import { renderCompactRoll, modifierTerm, poisonTerm, flexRow } from "./compact-roll.mjs";

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
    context.might = this.actor.system.attributes.might.effectiveValue || this.actor.system.attributes.might.value;
    context.edge = this.actor.system.attributes.edge.effectiveValue || this.actor.system.attributes.edge.value;
    context.isPoisoned = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    context.isPoisonedAttributes = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect1;
    context.poisonMultiplier = this.actor.system.poisonEffects?.effect2Multiplier || 1;
    
    // Get target's Physical Defense from targeted tokens (all users)
    // Nieprzytomna cel ma obronę fizyczną = 0 (każdy atak trafia)
    const targets = canvas.tokens?.placeables?.filter(t => t.targeted.size > 0) ?? [];
    if (targets.length > 0 && targets[0].actor) {
      const targetActor = targets[0].actor;
      if (targetActor.statuses?.has("unconscious")) {
        context.targetDefense = 0;
      } else {
        context.targetDefense = targetActor.system.defense?.physical ?? 5;
      }
      context.targetProneActive = targetActor.system.prone || false;
    } else {
      context.targetDefense = 5;
      context.targetProneActive = false;
    }

    // Wykryj założoną broń, aby wstępnie zaznaczyć typ ataku i zablokować drugą opcję
    const equippedWeapons = this.actor.items.filter(i => i.type === "weapon" && i.system.equipped);
    const hasMelee = equippedWeapons.some(i => i.system.weaponType === "melee");
    const hasRangedOrThrown = equippedWeapons.some(i =>
      i.system.weaponType === "ranged" || i.system.weaponType === "thrown"
    );
    // Blokuj opcję tylko gdy założony jest wyłącznie jeden typ broni
    context.meleeChecked  = hasMelee || (!hasMelee && !hasRangedOrThrown);
    context.rangedChecked = hasRangedOrThrown && !hasMelee;
    context.meleeDisabled  = hasRangedOrThrown && !hasMelee;
    context.rangedDisabled = hasMelee && !hasRangedOrThrown;

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
    
    // Read prone flag from hidden input
    const targetProneActiveInput = form.querySelector('input[name="targetProneActive"]');
    const targetProneActive = targetProneActiveInput?.value === 'true';
    
    // Apply prone modifier based on attack type
    let effectiveTargetDefense = targetDefense;
    let proneModifier = 0;
    if (targetProneActive) {
      if (attackType === 'melee') {
        proneModifier = -1; // easier to hit prone target with melee
      } else {
        proneModifier = +1; // harder to hit prone target with ranged/thrown
      }
      effectiveTargetDefense += proneModifier;
    }
    
    // Determine which attribute to use
    const attribute = attackType === 'melee' ? 'might' : 'edge';
    const attributeValue = this.actor.system.attributes[attribute].value;
    const attributeDie = this.actor.system.attributes[attribute].die || 'd6';
    
    // Calculate modifier (slider + focused attack bonus)
    let modifier = sliderModifier;
    if (focusedAttack) modifier += 2;
    
    // Apply poison effect 2: penalty to all rolls (multiplied)
    const effect2Multiplier = this.actor.system.poisonEffects?.effect2Multiplier || 1;
    const poisonPenalty = (this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
    
    const flexDie = this.actor.system.flexDie || 'd10';
    const flexDieDisabled = false;
    
    // Roll attribute die
    const attributeRoll = await new Roll(`1${attributeDie}`).evaluate();
    const attributeResult = attributeRoll.total;
    
    // Roll Flex die (unless disabled)
    const flexRoll = flexDieDisabled ? null : await new Roll(`1${flexDie}[${getFlexDieColorset()}]`).evaluate();
    const flexResult = flexDieDisabled ? 0 : flexRoll.total;
    const flexMax = parseInt(flexDie.substring(1));
    
    // Calculate total (with poison penalty)
    const total = attributeResult + attributeValue + modifier + poisonPenalty;
    
    // Check for Winds of Fate (1 on attribute die)
    const isWindsOfFate = attributeResult === 1;
    
    // Check for success (total >= target defense, unless Winds of Fate)
    const isSuccess = !isWindsOfFate && (total >= effectiveTargetDefense);
    
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
    const isPoisoned = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    
    // Determine if we should show the Deal Damage button
    let showDealDamageButton = false;
    let rollDamageAction = null;
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
      rollDamageAction = {
        buttonClass: "roll-damage-btn",
        icon: "fa-bolt",
        label: game.i18n.localize('CONAN.Damage.roll'),
        data: { "actor-id": this.actor.id }
      };
    }

    const terms = [
      { label: game.i18n.localize("CONAN.Roll.attributeDie"), value: attributeResult, winds: isWindsOfFate },
      { operator: "+", label: game.i18n.localize("CONAN.Roll.attributeValue"), value: attributeValue }
    ];
    if (modifier !== 0) terms.push(modifierTerm(modifier));
    if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

    const messageContent = await renderCompactRoll({
      headerClass: "attack",
      kind: attackTypeLabel,
      info: `${attributeLabel} (${attributeAbbr})`,
      poisoned: isPoisoned,
      terms,
      totalLabel: game.i18n.localize("CONAN.Roll.total"),
      total,
      flex: flexRow({ disabled: flexDieDisabled, result: flexResult, triggered: isFlexEffect }),
      verdict: {
        label: game.i18n.localize("CONAN.Attack.targetPhysicalDefense"),
        difficulty: effectiveTargetDefense,
        note: targetProneActive ? `(${proneModifier > 0 ? '+' : ''}${proneModifier} ${game.i18n.localize('CONAN.Attack.prone')})` : "",
        success: isSuccess
      },
      windsOfFate: isWindsOfFate,
      action: rollDamageAction
    });
    
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
              // Zablokuj typ obrażeń przeciwny do wykonanego ataku (thrown i sorcery zawsze aktywne)
              let disabledDamageTypes = [];
              if (attackType === 'melee') disabledDamageTypes = ['ranged'];
              else if (attackType === 'ranged') disabledDamageTypes = ['melee'];
              // Use base actor for damage dialog if available, to ensure consistent equipped weapons
              const dialogActor = baseActor || actor;
              const result = await DamageDialog.prompt(dialogActor, { disabledDamageTypes });
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
      if (flexRoll) {
        game.dice3d.showForRoll(flexRoll, game.user, true);
      }
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
