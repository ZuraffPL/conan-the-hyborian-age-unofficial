import { renderCompactRoll, modifierTerm, poisonTerm } from "./compact-roll.mjs";

/**
 * Dialog for making NPC attack rolls
 * NPCs do not use Flex Die, only Winds of Fate applies
 */
export class NPCAttackDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {

  constructor(actor, attackIndex, options = {}) {
    super(options);
    this.actor = actor;
    this.attackIndex = attackIndex; // indeks w actor.system.damage[]
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
      roll: NPCAttackDialog._onRoll
    },
    form: {
      handler: NPCAttackDialog._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/npc-attack-dialog.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.actor = this.actor;
    // Obsługa starego formatu danych (obiekt) i nowego (tablica)
    const rawDamage = this.actor.system.damage;
    const damageArray = Array.isArray(rawDamage) ? rawDamage : Object.values(rawDamage ?? {});
    const attackData = damageArray[this.attackIndex];
    const attackType = attackData?.type || 'melee';
    context.attackType = attackType;
    context.attackTypeLabel = game.i18n.localize(
      attackType.startsWith('melee') ? 'CONAN.Attack.melee' : 'CONAN.Attack.ranged'
    );
    
    // Get attribute based on attack type
    const attribute = attackType.startsWith('melee') ? 'might' : 'edge';
    context.attribute = attribute;
    context.attributeValue = this.actor.system.attributes[attribute].effectiveValue || this.actor.system.attributes[attribute].value;
    context.attributeDie = this.actor.system.attributes[attribute].die;
    
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
    
    context.isPoisoned = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    context.isPoisonedAttributes = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect1;
    context.poisonMultiplier = this.actor.system.poisonEffects?.effect2Multiplier || 1;
    
    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Set up modifier slider
    const modifierInput = this.element.querySelector('#modifier');
    const modifierLabel = this.element.querySelector('.modifier-value-label');
    
    if (modifierInput && modifierLabel) {
      modifierInput.addEventListener('input', (event) => {
        const value = parseInt(event.target.value);
        modifierLabel.textContent = value >= 0 ? `+${value}` : value;
      });
    }
  }

  /** @override */
  static async _onSubmit(event, form, formData) {
    // Prevent default form submission
    event.preventDefault();
  }

  /**
   * Handle roll button click
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    
    const form = this.element.querySelector('form');
    
    // Get form data using direct DOM queries
    const modifierInput = form.querySelector('input[name="modifier"]');
    const targetDefenseInput = form.querySelector('input[name="targetDefense"]');
    
    const sliderModifier = modifierInput ? parseInt(modifierInput.value) : 0;
    const targetDefense = targetDefenseInput ? parseInt(targetDefenseInput.value) : 5;
    
    // Read prone flag from hidden input
    const targetProneActiveInput = form.querySelector('input[name="targetProneActive"]');
    const targetProneActive = targetProneActiveInput?.value === 'true';
    
    // Obsługa starego formatu danych (obiekt) i nowego (tablica)
    const rawDmg = this.actor?.system?.damage;
    const dmgArray = Array.isArray(rawDmg) ? rawDmg : Object.values(rawDmg ?? {});
    const attackData = dmgArray[this.attackIndex];
    // Determine attack type (melee vs ranged) — jednolity fallback na 'melee'
    const npcAttackType = attackData?.type || 'melee';
    const isMeleeAttack = npcAttackType.startsWith('melee');
    
    // Apply prone modifier based on attack type
    let effectiveTargetDefense = targetDefense;
    let proneModifier = 0;
    if (targetProneActive) {
      if (isMeleeAttack) {
        proneModifier = -1;
      } else {
        proneModifier = +1;
      }
      effectiveTargetDefense += proneModifier;
    }
    
    const modifier = sliderModifier;
    const effect2Multiplier = this.actor.system.poisonEffects?.effect2Multiplier || 1;
    const poisonPenalty = (this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
    
    // Użyj isMeleeAttack (z jednolitym fallbackiem) zamiast ponownego odczytu z damage array
    const attribute = isMeleeAttack ? 'might' : 'edge';
    const attributeValue = this.actor.system.attributes[attribute].effectiveValue || this.actor.system.attributes[attribute].value;
    const attributeDie = this.actor.system.attributes[attribute].die;
    
    // Roll attribute die
    const attributeRoll = new Roll(`1${attributeDie}`);
    await attributeRoll.evaluate();
    const attributeResult = attributeRoll.total;
    
    // Check for Winds of Fate (1 on attribute die)
    const isWindsOfFate = attributeResult === 1;
    
    // Calculate total (with poison penalty)
    const total = attributeResult + attributeValue + modifier + poisonPenalty;
    const isSuccess = !isWindsOfFate && (total >= effectiveTargetDefense);
    
    // Prepare chat message
    const attributeLabel = game.i18n.localize(`CONAN.Attributes.${attribute}.label`);
    const attributeAbbr = game.i18n.localize(`CONAN.Attributes.${attribute}.abbr`);
    const attackTypeLabel = game.i18n.localize(isMeleeAttack ? 'CONAN.Attack.melee' : 'CONAN.Attack.ranged');
    const weaponName = attackData?.name?.trim() || '';
    const isPoisoned = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    const isPoisonedAttributes = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect1;
    
    // Determine NPC type for styling
    const actorType = this.actor.type; // 'minion' or 'antagonist'
    const npcClass = actorType === 'minion' ? 'minion-roll' : 'antagonist-roll';
    
    const terms = [
      { label: game.i18n.localize("CONAN.Roll.attributeDie"), value: attributeResult, winds: isWindsOfFate },
      { operator: "+", label: game.i18n.localize("CONAN.Roll.attributeValue"), value: attributeValue, poison: !!isPoisonedAttributes }
    ];
    if (modifier !== 0) terms.push(modifierTerm(modifier));
    if (poisonPenalty !== 0) terms.push(poisonTerm(effect2Multiplier));

    const messageContent = await renderCompactRoll({
      headerClass: "attack",
      rootClass: `npc-roll ${npcClass}`,
      kind: `${attackTypeLabel}${weaponName ? ` (${weaponName})` : ''}`,
      info: `${attributeLabel} (${attributeAbbr})`,
      poisoned: isPoisoned || isPoisonedAttributes,
      terms,
      totalLabel: game.i18n.localize("CONAN.Roll.total"),
      total,
      verdict: {
        label: game.i18n.localize("CONAN.Attack.targetPhysicalDefense"),
        difficulty: effectiveTargetDefense,
        note: targetProneActive ? `(${proneModifier > 0 ? '+' : ''}${proneModifier} ${game.i18n.localize('CONAN.Attack.prone')})` : "",
        success: isSuccess
      },
      windsOfFate: isWindsOfFate,
      action: isSuccess ? {
        buttonClass: "roll-npc-damage-btn",
        icon: "fa-dice-d20",
        label: game.i18n.localize('CONAN.Roll.rollDamage'),
        data: {
          "actor-id": this.actor.id,
          "token-id": this.actor.token?.id || '',
          "scene-id": this.actor.token?.parent?.id || '',
          "attack-index": this.attackIndex
        }
      } : null
    });
    
    // Create chat message with flags
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: messageContent,
      sound: CONFIG.sounds.dice,
      flags: {
        "conan-the-hyborian-age": {
          attackSuccess: isSuccess,
          attackIndex: this.attackIndex,
          actorId: this.actor.id,
          tokenId: this.actor.token?.id || null,
          sceneId: this.actor.token?.parent?.id || null
        }
      }
    });
    
    // Show 3D dice if Dice So Nice is active
    if (game.dice3d) {
      game.dice3d.showForRoll(attributeRoll, game.user, true);
    }
    
    // Close dialog
    this.close();
  }

  /**
   * Static method to show the dialog
   */
  static async prompt(actor, attackIndex) {
    const dialog = new NPCAttackDialog(actor, attackIndex);
    dialog.render(true);
    return dialog;
  }
}
