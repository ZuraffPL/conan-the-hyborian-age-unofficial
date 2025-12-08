/**
 * Extend ActorSheet for Minion actors
 */

import { ConanActorSheet } from "./actor-sheet.mjs";
import { NPCAttackDialog } from "../helpers/npc-attack-dialog.mjs";

/**
 * Setup N/A checkbox handlers with strikethrough effect
 * @param {HTMLElement} element - The sheet element
 */
function setupNACheckboxes(element) {
  const naCheckboxes = element.querySelectorAll('input[name$=".notApplicable"]');
  naCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (event) => {
      const isNA = event.target.checked;
      const damageType = event.target.name.includes('melee') ? 'melee' : 'ranged';
      
      // Find the damage row
      const damageRow = event.target.closest('.damage-row');
      
      // Toggle strikethrough class
      if (damageRow) {
        if (isNA) {
          damageRow.classList.add('not-applicable');
        } else {
          damageRow.classList.remove('not-applicable');
        }
      }
      
      // Disable/enable related fields
      const nameField = element.querySelector(`input[name="system.damage.${damageType}.name"]`);
      const dieField = element.querySelector(`select[name="system.damage.${damageType}.die"]`);
      const modField = element.querySelector(`input[name="system.damage.${damageType}.modifier"]`);
      
      if (nameField) nameField.disabled = isNA;
      if (dieField) dieField.disabled = isNA;
      if (modField) modField.disabled = isNA;
    });
    
    // Set initial state on load
    const isChecked = checkbox.checked;
    if (isChecked) {
      const damageRow = checkbox.closest('.damage-row');
      if (damageRow) {
        damageRow.classList.add('not-applicable');
      }
    }
  });
}

export class ConanMinionSheet extends ConanActorSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    ...ConanActorSheet.DEFAULT_OPTIONS,
    classes: ["conan", "sheet", "actor", "npc", "minion"],
    position: {
      width: 640,
      height: 1000
    },
    window: {
      ...ConanActorSheet.DEFAULT_OPTIONS.window,
      contentTag: "form",
      contentClasses: ["standard-form"]
    },
    actions: {
      ...ConanActorSheet.DEFAULT_OPTIONS.actions,
      rollAttribute: ConanMinionSheet._onRollAttribute,
      npcAttack: ConanMinionSheet._onNPCAttack,
      npcDamage: ConanMinionSheet._onNPCDamage,
      toggleDefence: ConanMinionSheet._onToggleDefence,
      toggleImmobilized: ConanMinionSheet._onToggleImmobilized,
      togglePoisoned: ConanMinionSheet._onTogglePoisoned
    }
  };

  /** @override */
  tabGroups = {
    primary: "stats"
  };

  /** @override */
  get documentType() {
    return "minion";
  }

  /** @override */
  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/actor/actor-minion-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    // For NPC sheets, always use the actor directly (no baseActor logic)
    this.baseActor = this.actor;
    
    // Add the actor reference to context
    context.actor = this.baseActor;
    
    // Add the actor's data to context
    context.system = this.baseActor.system;
    context.flags = this.baseActor.flags;

    // Add roll data for convenience
    context.rollData = this.baseActor.getRollData();

    // Prepare NPC data and items
    this._prepareItems(context);

    // Prepare tabs
    context.tabs = this._getTabs();

    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Activate tabs for NPCs
    this._activateTabs();
    
    // Add validation to numeric inputs
    const inputs = this.element.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      input.addEventListener('change', (event) => {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        let value = parseFloat(input.value);
        
        if (!isNaN(min) && value < min) {
          input.value = min;
          event.target.value = min;
        }
        if (!isNaN(max) && value > max) {
          input.value = max;
          event.target.value = max;
        }
      });
    });
    
    // Handle N/A checkboxes for damage types
    setupNACheckboxes(this.element);
    
    // Handle wounded checkbox highlighting
    const woundedCheckbox = this.element.querySelector('input[name="system.wounded"]');
    if (woundedCheckbox) {
      const woundedBox = woundedCheckbox.closest('.defense-box.wounded-box');
      
      // Set initial state
      if (woundedCheckbox.checked && woundedBox) {
        woundedBox.classList.add('active');
      }
      
      // Listen for changes
      woundedCheckbox.addEventListener('change', (event) => {
        if (woundedBox) {
          if (event.target.checked) {
            woundedBox.classList.add('active');
          } else {
            woundedBox.classList.remove('active');
          }
        }
        
        // Refresh Combat Tracker if in combat
        if (game.combat && ui.combat) {
          ui.combat.render();
        }
      });
    }
    
    // Setup auto-resize for powers textareas
    const powersTextareas = this.element.querySelectorAll('textarea.auto-resize-powers');
    powersTextareas.forEach(textarea => {
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
      };
      
      textarea.addEventListener('input', adjustHeight);
      
      // Initial adjustment
      if (textarea.value) {
        adjustHeight();
      }
    });
    
    // Validate attacks <= actions
    const actionsInput = this.element.querySelector('input[name="system.actions.perRound"]');
    const attacksInput = this.element.querySelector('input[name="system.actions.attacks"]');
    
    if (actionsInput && attacksInput) {
      const validateAttacks = () => {
        const actions = parseInt(actionsInput.value) || 1;
        const attacks = parseInt(attacksInput.value) || 1;
        
        if (attacks > actions) {
          attacksInput.value = actions;
        }
      };
      
      actionsInput.addEventListener('change', validateAttacks);
      attacksInput.addEventListener('change', validateAttacks);
    }
  }

  /**
   * Override rollAttribute for NPC (no flex die)
   */
  static async _onRollAttribute(event, target) {
    const attribute = target.dataset.attribute;
    await rollNPCAttribute(this.baseActor, attribute);
  }

  /**
   * Handle NPC attack
   */
  static async _onNPCAttack(event, target) {
    const attackType = target.dataset.attackType || event.currentTarget.dataset.attackType;
    await NPCAttackDialog.prompt(this.baseActor, attackType);
  }

  /**
   * Handle NPC damage roll
   */
  static async _onNPCDamage(event, target) {
    const attackType = target.dataset.attackType || event.currentTarget.dataset.attackType;
    const { rollNPCDamage } = await import("../helpers/roll-mechanics.mjs");
    await rollNPCDamage(this.baseActor, attackType);
  }

  /**
   * Toggle Defence status
   */
  static async _onToggleDefence(event, target) {
    const currentDefence = this.baseActor.system.defenceActive || false;
    const immobilized = this.baseActor.system.immobilized || false;
    
    // Cannot activate Defence when Immobilized
    if (!currentDefence && immobilized) {
      ui.notifications.warn(game.i18n.localize("CONAN.Warnings.cannotDefenceWhenImmobilized"));
      return;
    }
    
    const newDefence = !currentDefence;
    const basePhysical = this.baseActor.system.defense.basePhysical ?? this.baseActor.system.defense.physical;
    
    // Calculate new defense value
    let newPhysical = basePhysical;
    if (newDefence) {
      newPhysical = basePhysical + 2;
    }
    
    // Update actor
    await this.baseActor.update({
      "system.defenceActive": newDefence,
      "system.defense.basePhysical": basePhysical,
      "system.defense.physical": newPhysical
    });
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  /**
   * Toggle Immobilized status
   */
  static async _onToggleImmobilized(event, target) {
    const currentImmobilized = this.baseActor.system.immobilized || false;
    const newImmobilized = !currentImmobilized;
    
    const basePhysical = this.baseActor.system.defense.basePhysical ?? this.baseActor.system.defense.physical;
    
    const updateData = {
      "system.immobilized": newImmobilized,
      "system.defense.basePhysical": basePhysical
    };
    
    if (newImmobilized) {
      // When immobilized, set defense to 0 and disable Defence
      updateData["system.defense.physical"] = 0;
      updateData["system.defenceActive"] = false;
    } else {
      // When no longer immobilized, restore base defense
      updateData["system.defense.physical"] = basePhysical;
    }
    
    await this.baseActor.update(updateData);
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  static async _onTogglePoisoned(event, target) {
    const currentState = this.baseActor.system.poisoned || false;
    
    if (currentState) {
      // Deactivate poisoned
      await this.baseActor.update({
        'system.poisoned': false,
        'system.poisonEffects': {
          attributePenalty: false,
          rollPenalty: false,
          lifeDrain: false,
          staminaLock: false,
          flexDieDisabled: false
        }
      });
      
      // Refresh Combat Tracker
      if (game.combat && ui.combat) {
        ui.combat.render();
      }
    } else {
      // Open dialog to configure poison effects
      const { PoisonedDialog } = await import("../helpers/poisoned-dialog.mjs");
      const dialog = new PoisonedDialog(this.baseActor);
      dialog.render(true);
    }
  }
}

/**
 * Extend ActorSheet for Antagonist actors
 */
export class ConanAntagonistSheet extends ConanActorSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    ...ConanActorSheet.DEFAULT_OPTIONS,
    classes: ["conan", "sheet", "actor", "npc", "antagonist"],
    position: {
      width: 640,
      height: 1000
    },
    window: {
      ...ConanActorSheet.DEFAULT_OPTIONS.window,
      contentTag: "form",
      contentClasses: ["standard-form"]
    },
    actions: {
      ...ConanActorSheet.DEFAULT_OPTIONS.actions,
      rollAttribute: ConanAntagonistSheet._onRollAttribute,
      npcAttack: ConanAntagonistSheet._onNPCAttack,
      npcDamage: ConanAntagonistSheet._onNPCDamage,
      toggleDefence: ConanAntagonistSheet._onToggleDefence,
      toggleImmobilized: ConanAntagonistSheet._onToggleImmobilized,
      togglePoisoned: ConanAntagonistSheet._onTogglePoisoned
    }
  };

  /** @override */
  tabGroups = {
    primary: "stats"
  };

  /** @override */
  get documentType() {
    return "antagonist";
  }

  /** @override */
  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/actor/actor-antagonist-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    // For NPC sheets, always use the actor directly (no baseActor logic)
    this.baseActor = this.actor;
    
    // Add the actor reference to context
    context.actor = this.baseActor;
    
    // Add the actor's data to context
    context.system = this.baseActor.system;
    context.flags = this.baseActor.flags;

    // Add roll data for convenience
    context.rollData = this.baseActor.getRollData();

    // Prepare NPC data and items
    this._prepareItems(context);

    // Prepare tabs
    context.tabs = this._getTabs();

    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Activate tabs for NPCs
    this._activateTabs();
    
    // Add validation to numeric inputs
    const inputs = this.element.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      input.addEventListener('change', (event) => {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        let value = parseFloat(input.value);
        
        if (!isNaN(min) && value < min) {
          input.value = min;
          event.target.value = min;
        }
        if (!isNaN(max) && value > max) {
          input.value = max;
          event.target.value = max;
        }
      });
    });
    
    // Handle N/A checkboxes for damage types
    setupNACheckboxes(this.element);
    
    // Setup auto-resize for powers textareas
    const powersTextareas = this.element.querySelectorAll('textarea.auto-resize-powers');
    powersTextareas.forEach(textarea => {
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
      };
      
      textarea.addEventListener('input', adjustHeight);
      
      // Initial adjustment
      if (textarea.value) {
        adjustHeight();
      }
    });
    
    // Validate attacks <= actions
    const actionsInput = this.element.querySelector('input[name="system.actions.perRound"]');
    const attacksInput = this.element.querySelector('input[name="system.actions.attacks"]');
    
    if (actionsInput && attacksInput) {
      const validateAttacks = () => {
        const actions = parseInt(actionsInput.value) || 1;
        const attacks = parseInt(attacksInput.value) || 1;
        
        if (attacks > actions) {
          attacksInput.value = actions;
        }
      };
      
      actionsInput.addEventListener('change', validateAttacks);
      attacksInput.addEventListener('change', validateAttacks);
    }
  }

  /**
   * Override rollAttribute for NPC (no flex die)
   */
  static async _onRollAttribute(event, target) {
    const attribute = target.dataset.attribute;
    await rollNPCAttribute(this.baseActor, attribute);
  }

  /**
   * Handle NPC attack
   */
  static async _onNPCAttack(event, target) {
    const attackType = target.dataset.attackType || event.currentTarget.dataset.attackType;
    await NPCAttackDialog.prompt(this.baseActor, attackType);
  }

  /**
   * Handle NPC damage roll
   */
  static async _onNPCDamage(event, target) {
    const attackType = target.dataset.attackType || event.currentTarget.dataset.attackType;
    const { rollNPCDamage } = await import("../helpers/roll-mechanics.mjs");
    await rollNPCDamage(this.baseActor, attackType);
  }

  /**
   * Toggle Defence status
   */
  static async _onToggleDefence(event, target) {
    const currentDefence = this.baseActor.system.defenceActive || false;
    const immobilized = this.baseActor.system.immobilized || false;
    
    // Cannot activate Defence when Immobilized
    if (!currentDefence && immobilized) {
      ui.notifications.warn(game.i18n.localize("CONAN.Warnings.cannotDefenceWhenImmobilized"));
      return;
    }
    
    const newDefence = !currentDefence;
    const basePhysical = this.baseActor.system.defense.basePhysical ?? this.baseActor.system.defense.physical;
    
    // Calculate new defense value
    let newPhysical = basePhysical;
    if (newDefence) {
      newPhysical = basePhysical + 2;
    }
    
    // Update actor
    await this.baseActor.update({
      "system.defenceActive": newDefence,
      "system.defense.basePhysical": basePhysical,
      "system.defense.physical": newPhysical
    });
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  /**
   * Toggle Immobilized status
   */
  static async _onToggleImmobilized(event, target) {
    const currentImmobilized = this.baseActor.system.immobilized || false;
    const newImmobilized = !currentImmobilized;
    
    const basePhysical = this.baseActor.system.defense.basePhysical ?? this.baseActor.system.defense.physical;
    
    const updateData = {
      "system.immobilized": newImmobilized,
      "system.defense.basePhysical": basePhysical
    };
    
    if (newImmobilized) {
      // When immobilized, set defense to 0 and disable Defence
      updateData["system.defense.physical"] = 0;
      updateData["system.defenceActive"] = false;
    } else {
      // When no longer immobilized, restore base defense
      updateData["system.defense.physical"] = basePhysical;
    }
    
    await this.baseActor.update(updateData);
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  static async _onTogglePoisoned(event, target) {
    const currentState = this.baseActor.system.poisoned || false;
    
    if (currentState) {
      // Deactivate poisoned
      await this.baseActor.update({
        'system.poisoned': false,
        'system.poisonEffects': {
          attributePenalty: false,
          rollPenalty: false,
          lifeDrain: false,
          staminaLock: false,
          flexDieDisabled: false
        }
      });
      
      // Refresh Combat Tracker
      if (game.combat && ui.combat) {
        ui.combat.render();
      }
    } else {
      // Open dialog to configure poison effects
      const { PoisonedDialog } = await import("../helpers/poisoned-dialog.mjs");
      const dialog = new PoisonedDialog(this.baseActor);
      dialog.render(true);
    }
  }
}

/**
 * NPC Difficulty Dialog
 */
class NPCDifficultyDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  static DEFAULT_OPTIONS = {
    id: "npc-difficulty-dialog",
    classes: ["conan", "dialog", "difficulty"],
    tag: "dialog",
    window: {
      title: "CONAN.Dialog.difficulty.title",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 400,
      height: "auto"
    },
    actions: {
      roll: NPCDifficultyDialog._onRoll,
      cancel: NPCDifficultyDialog._onCancel
    },
    form: {
      handler: NPCDifficultyDialog._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/npc-difficulty-dialog.hbs"
    }
  };

  constructor(options = {}) {
    super(options);
    this.difficulty = null;
    this.modifier = 0;
    this.resolve = null;
  }

  static async prompt() {
    const dialog = new NPCDifficultyDialog();
    return new Promise((resolve) => {
      dialog.resolve = resolve;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.title = game.i18n.localize("CONAN.Dialog.difficulty.title");
    context.label = game.i18n.localize("CONAN.Dialog.difficulty.label");
    context.hint = game.i18n.localize("CONAN.Dialog.difficulty.hint");
    context.modifierLabel = game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel");
    context.rollLabel = game.i18n.localize("CONAN.Dialog.difficulty.roll");
    context.cancelLabel = game.i18n.localize("CONAN.Dialog.difficulty.cancel");
    context.defaultDifficulty = 10;
    context.modifier = this.modifier;

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Attach modifier slider listener
    const modifierSlider = this.element.querySelector('input[name="modifier"]');
    const modifierLabel = this.element.querySelector('.modifier-value-label');
    
    if (modifierSlider && modifierLabel) {
      modifierSlider.addEventListener('input', (event) => {
        const value = parseInt(event.target.value);
        this.modifier = value;
        modifierLabel.textContent = value >= 0 ? `+${value}` : value;
      });
    }

    // Attach difficulty input listener to update label
    const difficultyInput = this.element.querySelector('input[name="difficulty"]');
    const difficultyLabel = this.element.querySelector('[data-difficulty-label]');
    
    if (difficultyInput && difficultyLabel) {
      const updateDifficultyLabel = () => {
        const value = parseInt(difficultyInput.value) || 0;
        let labelText = '';
        let className = '';
        
        if (value >= 1 && value <= 3) {
          labelText = game.i18n.lang === 'pl' ? 'Trywialna' : 'Mundane';
          className = 'easy';
        } else if (value >= 4 && value <= 6) {
          labelText = game.i18n.lang === 'pl' ? 'Łatwa' : 'Easy';
          className = 'easy';
        } else if (value >= 7 && value <= 9) {
          labelText = game.i18n.lang === 'pl' ? 'Umiarkowana' : 'Moderate';
          className = 'moderate';
        } else if (value >= 10 && value <= 12) {
          labelText = game.i18n.lang === 'pl' ? 'Wymagająca' : 'Tough';
          className = 'tough';
        } else if (value >= 13) {
          labelText = game.i18n.lang === 'pl' ? 'Legendarna' : 'Legendary';
          className = 'legendary';
        }
        
        difficultyLabel.textContent = labelText;
        difficultyLabel.className = `difficulty-label ${className}`;
      };
      
      difficultyInput.addEventListener('input', updateDifficultyLabel);
      updateDifficultyLabel();
    }
  }

  static async _onSubmit(event, form, formData) {
    const difficulty = parseInt(formData.object.difficulty) || 10;
    const modifier = parseInt(formData.object.modifier) || 0;
    
    if (this.resolve) {
      this.resolve({ difficulty, modifier });
    }
    
    this.close();
  }

  static async _onRoll(event, target) {
    const form = this.element.querySelector("form");
    if (form) {
      const formData = new foundry.applications.ux.FormDataExtended(form);
      const difficulty = parseInt(formData.object.difficulty) || 10;
      const modifier = parseInt(formData.object.modifier) || 0;
      
      if (this.resolve) {
        this.resolve({ difficulty, modifier });
      }
      
      this.close();
    }
  }

  static async _onCancel(event, target) {
    if (this.resolve) {
      this.resolve(null);
    }
    
    this.close();
  }

  async close(options = {}) {
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
    
    return super.close(options);
  }
}

/**
 * Roll attribute for NPC (without flex die)
 * @param {Actor} actor - The NPC actor
 * @param {string} attribute - The attribute to roll (might, edge, grit, wits)
 */
async function rollNPCAttribute(actor, attribute) {
  const attributeData = actor.system.attributes[attribute];
  const attributeValue = attributeData.value;
  const attributeDie = attributeData.die;
  
  // Get attribute label
  const attrLabel = game.i18n.localize(`CONAN.Attributes.${attribute}.label`);
  const attrAbbr = game.i18n.localize(`CONAN.Attributes.${attribute}.abbr`);
  const displayName = game.i18n.lang === "pl" ? `${attrAbbr} (${attrLabel})` : attrLabel;
  
  // Ask for difficulty and modifier
  const result = await NPCDifficultyDialog.prompt();
  if (result === null || result === undefined) return;
  
  const difficulty = result.difficulty;
  let modifier = result.modifier;
  
  // Apply poison effect 2: -1 to all rolls
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -1 : 0;
  modifier += poisonPenalty;
  
  // Roll attribute die
  const dieRoll = new Roll(`1${attributeDie}`);
  await dieRoll.evaluate();
  const dieResult = dieRoll.total;
  
  // Calculate total
  const total = attributeValue + dieResult + modifier;
  
  // Winds of Fate: if attribute die shows 1, the test fails
  const windsOfFate = dieResult === 1;
  const success = windsOfFate ? false : (total >= difficulty);
  
  // Determine NPC type for styling
  const npcType = actor.type; // "minion" or "antagonist"
  const npcClass = npcType === "minion" ? "minion-roll" : "antagonist-roll";
  
  // Create chat message with same style as character rolls
  const modifierText = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
  const modifierSign = modifier >= 0 ? '+' : '';
  const hasPoisonPenalty = poisonPenalty !== 0;
  
  const content = `
    <div class="conan-roll-chat npc-roll ${npcClass} ${hasPoisonPenalty ? 'poisoned' : ''}">
      <div class="roll-header">
        <h3>${game.i18n.localize('CONAN.Roll.attributeTest')}</h3>
        <div class="attribute-info">${displayName}</div>
        ${hasPoisonPenalty ? `<div class="poison-indicator"><i class="fas fa-skull-crossbones"></i> ${game.i18n.localize('CONAN.Poisoned.title')}</div>` : ''}
      </div>
      <div class="roll-details">
        <div class="dice-results">
          <div class="dice-roll">
            <div class="die-label">${game.i18n.localize('CONAN.Roll.attributeDie')}</div>
            <div class="die-result${windsOfFate ? ' winds-of-fate' : ''}">${dieResult}</div>
          </div>
        </div>
        
        <div class="calculation">
          <span class="calc-part">${dieResult}</span>
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
        
        <div class="roll-result ${success ? 'success' : 'failure'}">
          <div class="result-text">${success ? game.i18n.localize('CONAN.Roll.success') : game.i18n.localize('CONAN.Roll.failure')}</div>
          ${windsOfFate ? `<div class="winds-notice"><i class="fas fa-wind"></i> ${game.i18n.localize('CONAN.Roll.windsOfFate')}</div>` : ''}
        </div>
      </div>
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    rolls: [dieRoll],
    rollMode: game.settings.get("core", "rollMode")
  });
}
