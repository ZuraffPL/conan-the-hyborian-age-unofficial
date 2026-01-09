/**
 * Dialog for making NPC attack rolls
 * NPCs do not use Flex Die, only Winds of Fate applies
 */
export class NPCAttackDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {

  constructor(actor, attackType, options = {}) {
    super(options);
    this.actor = actor;
    this.attackType = attackType; // 'melee' or 'ranged'
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
    context.attackType = this.attackType;
    context.attackTypeLabel = game.i18n.localize(
      this.attackType === 'melee' ? 'CONAN.Attack.melee' : 'CONAN.Attack.ranged'
    );
    
    // Get attribute based on attack type
    const attribute = this.attackType === 'melee' ? 'might' : 'edge';
    context.attribute = attribute;
    context.attributeValue = this.actor.system.attributes[attribute].value;
    context.attributeDie = this.actor.system.attributes[attribute].die;
    
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
    
    const modifier = sliderModifier;
    
    // Apply poison effect 2: -1 penalty to all rolls
    const poisonPenalty = (this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2) ? -1 : 0;
    
    const attribute = this.attackType === 'melee' ? 'might' : 'edge';
    const attributeValue = this.actor.system.attributes[attribute].value;
    const attributeDie = this.actor.system.attributes[attribute].die;
    
    // Roll attribute die
    const attributeRoll = new Roll(`1${attributeDie}`);
    await attributeRoll.evaluate();
    const attributeResult = attributeRoll.total;
    
    // Check for Winds of Fate (1 on attribute die)
    const isWindsOfFate = attributeResult === 1;
    
    // Calculate total (with poison penalty)
    const total = attributeResult + attributeValue + modifier + poisonPenalty;
    const isSuccess = !isWindsOfFate && (total >= targetDefense);
    
    // Prepare chat message
    const attributeLabel = game.i18n.localize(`CONAN.Attributes.${attribute}.label`);
    const attributeAbbr = game.i18n.localize(`CONAN.Attributes.${attribute}.abbr`);
    const attackTypeLabel = game.i18n.localize(this.attackType === 'melee' ? 'CONAN.Attack.melee' : 'CONAN.Attack.ranged');
    const isPoisoned = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    
    // Determine NPC type for styling
    const actorType = this.actor.type; // 'minion' or 'antagonist'
    const npcClass = actorType === 'minion' ? 'minion-roll' : 'antagonist-roll';
    
    let messageContent = `
      <div class="conan-roll-chat npc-roll ${npcClass} ${isPoisoned ? 'poisoned-roll' : ''}">
        <div class="roll-header attack">
          <h3>${attackTypeLabel}${isPoisoned ? ' <i class="fas fa-skull-crossbones poison-skull" style="color: #15a20e;"></i>' : ''}</h3>
          <div class="attribute-info">${attributeLabel} (${attributeAbbr})</div>
        </div>
        <div class="roll-details">
          <div class="dice-results">
            <div class="dice-roll">
              <div class="die-label">${attributeLabel}</div>
              <div class="die-result${isWindsOfFate ? ' winds-of-fate' : ''}">${attributeResult}</div>
            </div>
          </div>
          <div class="calculation">
            <span class="calc-part">${attributeResult}</span>
            <span class="calc-operator">+</span>
            <span class="calc-part">${attributeValue}</span>
            ${modifier !== 0 ? `<span class="calc-operator">+</span><span class="calc-part">${modifier}</span>` : ''}
            ${poisonPenalty !== 0 ? `<span class="calc-operator">-</span><span class="calc-part poison-penalty">1</span>` : ''}
            <span class="calc-operator">=</span>
            <span class="calc-total">${total}</span>
          </div>
          <div class="difficulty-check">
            <span class="difficulty-label">OF celu:</span>
            <span class="difficulty-value">${targetDefense}</span>
          </div>
          <div class="roll-result ${isSuccess ? 'success' : 'failure'}">
            <div class="result-text">${isSuccess ? game.i18n.localize('CONAN.Roll.success') : game.i18n.localize('CONAN.Roll.failure')}</div>`;
    
    // Add special conditions
    if (isWindsOfFate) {
      messageContent += `
            <div class="winds-notice">
              <i class="fas fa-wind"></i>
              ${game.i18n.localize('CONAN.Roll.windsOfFate')}
            </div>`;
    }
    
    messageContent += `
          </div>`;
    
    // Add damage roll button if attack was successful
    if (isSuccess) {
      // For unlinked tokens, we need the base actor ID for lookup
      const baseActorId = this.actor.token ? this.actor._stats.systemId : this.actor.id;
      messageContent += `
          <div class="damage-actions" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.1); text-align: center;">
            <button class="roll-npc-damage-btn" data-actor-id="${baseActorId}" data-token-id="${this.actor.token?.id || ''}" data-scene-id="${this.actor.token?.parent?.id || ''}" data-attack-type="${this.attackType}">
              <i class="fas fa-dice-d20"></i> ${game.i18n.localize('CONAN.Roll.rollDamage')}
            </button>
          </div>`;
    }
    
    messageContent += `
        </div>
      </div>`;
    
    // Create chat message with flags
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: messageContent,
      sound: CONFIG.sounds.dice,
      flags: {
        "conan-the-hyborian-age": {
          attackSuccess: isSuccess,
          attackType: this.attackType,
          actorId: this.actor.id,
          tokenId: this.actor.token?.id || null,
          sceneId: this.actor.token?.parent?.id || null
        }
      }
    });
    
    // Show 3D dice if Dice So Nice is active
    if (game.dice3d) {
      game.dice3d.showForRoll(attributeRoll);
    }
    
    // Close dialog
    this.close();
  }

  /**
   * Static method to show the dialog
   */
  static async prompt(actor, attackType) {
    const dialog = new NPCAttackDialog(actor, attackType);
    dialog.render(true);
    return dialog;
  }
}
