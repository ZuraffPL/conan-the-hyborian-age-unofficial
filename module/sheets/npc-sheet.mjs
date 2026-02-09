/**
 * Extend ActorSheet for Minion actors
 */

import { ConanActorSheet } from "./actor-sheet.mjs";
import { NPCAttackDialog } from "../helpers/npc-attack-dialog.mjs";

/**
 * Debounce function to delay execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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
      togglePoisoned: ConanMinionSheet._onTogglePoisoned,
      toggleWounded: ConanMinionSheet._onToggleWounded
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
      template: "systems/conan-the-hyborian-age/templates/actor/actor-minion-sheet.hbs",
      submitOnChange: false
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
    
    // Count active poison effects
    if (context.system.poisoned && context.system.poisonEffects) {
      context.activePoisonEffects = [
        context.system.poisonEffects.effect1,
        context.system.poisonEffects.effect2,
        context.system.poisonEffects.effect3,
        context.system.poisonEffects.effect4,
        context.system.poisonEffects.effect5
      ].filter(Boolean).length;
    } else {
      context.activePoisonEffects = 0;
    }

    // Prepare NPC data and items
    this._prepareItems(context);

    // Prepare tabs
    context.tabs = this._getTabs();

    return context;
  }

  /** @override */
  async _onRender(context, options) {
    // Call grandparent _onRender directly to avoid ConanActorSheet's form listener
    // which is designed for character sheets with submitOnChange: true
    await foundry.applications.api.HandlebarsApplicationMixin(
      foundry.applications.sheets.ActorSheetV2
    ).prototype._onRender.call(this, context, options);
    
    // Activate tabs for NPCs
    this._activateTabs();
    
    // Setup NPC-specific form handling with debounce for text inputs
    this._setupNPCFormHandling();
    
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
    
    // Handle defense.physical changes to update basePhysical when no effects are active
    const defenseInput = this.element.querySelector('input[name="system.defense.physical"]');
    if (defenseInput) {
      defenseInput.addEventListener('change', async (event) => {
        const newPhysical = parseInt(event.target.value) || 0;
        const defenceActive = this.baseActor.system.defenceActive || false;
        const immobilized = this.baseActor.system.immobilized || false;
        
        // If no effects are active, update basePhysical to match
        if (!defenceActive && !immobilized) {
          await this.baseActor.update({
            'system.defense.basePhysical': newPhysical
          });
        }
      });
    }
    
    // Handle N/A checkboxes for damage types
    setupNACheckboxes(this.element);
    
    // Update wounded box CSS based on current state
    this._updateWoundedState();
    
    // Setup auto-resize for powers textareas
    const powersTextareas = this.element.querySelectorAll('textarea.auto-resize-powers');
    powersTextareas.forEach(textarea => {
      // Get the CSS min-height value (default 80px)
      const computedStyle = window.getComputedStyle(textarea);
      const minHeight = parseInt(computedStyle.minHeight) || 80;
      const maxHeight = 400;
      
      const adjustHeight = () => {
        // Temporarily set height to auto to get accurate scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate the needed height with a small buffer for line-height
        const scrollHeight = textarea.scrollHeight;
        
        // Use the larger of minHeight or scrollHeight, but cap at maxHeight
        const newHeight = Math.max(minHeight, Math.min(scrollHeight + 2, maxHeight));
        textarea.style.height = newHeight + 'px';
        
        // Show/hide scrollbar based on content
        textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      };
      
      textarea.addEventListener('input', adjustHeight);
      
      // Initial adjustment - always run to set proper overflow
      adjustHeight();
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
    
    // Store base physical defense if not already stored (needed for manual defense adjustments)
    const updateData = {
      "system.defenceActive": newDefence
    };
    
    if (this.baseActor.system.defense.basePhysical === undefined) {
      updateData["system.defense.basePhysical"] = this.baseActor.system.defense.physical;
    }
    
    // Just toggle the flag - prepareDerivedData() will recalculate defense automatically
    await this.baseActor.update(updateData);
    
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
    
    const updateData = {
      "system.immobilized": newImmobilized
    };
    
    // Store base physical defense if not already stored (needed for manual defense adjustments)
    if (this.baseActor.system.defense.basePhysical === undefined) {
      updateData["system.defense.basePhysical"] = this.baseActor.system.defense.physical;
    }
    
    // Disable Defence when becoming immobilized
    if (newImmobilized && this.baseActor.system.defenceActive) {
      updateData["system.defenceActive"] = false;
    }
    
    // Just toggle flags - prepareDerivedData() will recalculate defense automatically
    await this.baseActor.update(updateData);
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  static async _onTogglePoisoned(event, target) {
    // Always open dialog to configure poison effects
    const { PoisonedDialog } = await import("../helpers/poisoned-dialog.mjs");
    const dialog = new PoisonedDialog(this.baseActor);
    dialog.render(true);
  }

  /**
   * Setup form handling for NPC sheets with debounce for text inputs
   * This prevents the sheet from freezing during text entry
   */
  _setupNPCFormHandling() {
    const form = this.element.querySelector('form');
    if (!form) return;
    
    // Track if we're currently updating to prevent re-render loops
    this._isUpdating = false;
    
    // Create debounced update function for text inputs (500ms delay)
    const debouncedTextUpdate = debounce(async (fieldName, fieldValue) => {
      if (this._isUpdating) return;
      this._isUpdating = true;
      
      try {
        const updateData = {};
        updateData[fieldName] = fieldValue;
        await this.baseActor.update(updateData, { render: false });
      } finally {
        this._isUpdating = false;
      }
    }, 500);
    
    // Create immediate update function for non-text inputs
    const immediateUpdate = async (fieldName, fieldValue, dtype) => {
      if (this._isUpdating) return;
      this._isUpdating = true;
      
      try {
        // Parse value based on data type
        if (dtype === "Number") {
          fieldValue = parseInt(fieldValue) || 0;
        } else if (dtype === "Boolean") {
          // Already boolean from checkbox
        }
        
        const updateData = {};
        updateData[fieldName] = fieldValue;
        await this.baseActor.update(updateData);
      } finally {
        this._isUpdating = false;
      }
    };
    
    // Handle text inputs with debounce (input event for real-time feel)
    const textInputs = form.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
      // Use 'input' event for real-time debounced updates
      input.addEventListener('input', (event) => {
        const fieldName = event.target.name;
        if (!fieldName) return;
        debouncedTextUpdate(fieldName, event.target.value);
      });
      
      // Also save on blur (when leaving the field)
      input.addEventListener('blur', async (event) => {
        const fieldName = event.target.name;
        if (!fieldName || this._isUpdating) return;
        
        this._isUpdating = true;
        try {
          const updateData = {};
          updateData[fieldName] = event.target.value;
          await this.baseActor.update(updateData, { render: false });
        } finally {
          this._isUpdating = false;
        }
      });
    });
    
    // Handle number inputs and selects with immediate update on change
    const numberInputs = form.querySelectorAll('input[type="number"], select');
    numberInputs.forEach(input => {
      input.addEventListener('change', (event) => {
        const fieldName = event.target.name;
        if (!fieldName) return;
        const dtype = event.target.dataset.dtype || (event.target.type === 'number' ? 'Number' : 'String');
        immediateUpdate(fieldName, event.target.value, dtype);
      });
    });
    
    // Handle checkboxes with immediate update
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      // Skip checkboxes that have specific action handlers (like wounded, defence, etc.)
      if (checkbox.dataset.action) return;
      
      checkbox.addEventListener('change', (event) => {
        const fieldName = event.target.name;
        if (!fieldName) return;
        immediateUpdate(fieldName, event.target.checked, 'Boolean');
      });
    });
  }

  /**
   * Update wounded box CSS based on current actor state
   */
  _updateWoundedState() {
    const woundedCheckbox = this.element.querySelector('input[name="system.wounded"]');
    if (woundedCheckbox) {
      const woundedBox = woundedCheckbox.closest('.defense-box.wounded-box');
      
      if (woundedBox) {
        if (woundedCheckbox.checked) {
          woundedBox.classList.add('active');
        } else {
          woundedBox.classList.remove('active');
        }
      }
    }
  }

  /**
   * Toggle wounded status
   */
  static async _onToggleWounded(event, target) {
    const newWounded = target.checked;
    
    // Update CSS immediately for instant visual feedback
    const woundedBox = target.closest('.defense-box.wounded-box');
    if (woundedBox) {
      if (newWounded) {
        woundedBox.classList.add('active');
      } else {
        woundedBox.classList.remove('active');
      }
    }
    
    // Update actor data asynchronously (no await - don't block UI)
    this.baseActor.update({
      'system.wounded': newWounded
    }).then(async () => {
      // Refresh Combat Tracker after update completes
      if (game.combat && ui.combat) {
        ui.combat.render();
      }
      
      // Toggle wounded status effect on actor (will show on all tokens)
      await this.baseActor.toggleStatusEffect("wounded", { active: newWounded });
    });
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
      template: "systems/conan-the-hyborian-age/templates/actor/actor-antagonist-sheet.hbs",
      submitOnChange: false
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
    
    // Count active poison effects
    if (context.system.poisoned && context.system.poisonEffects) {
      context.activePoisonEffects = [
        context.system.poisonEffects.effect1,
        context.system.poisonEffects.effect2,
        context.system.poisonEffects.effect3,
        context.system.poisonEffects.effect4,
        context.system.poisonEffects.effect5
      ].filter(Boolean).length;
    } else {
      context.activePoisonEffects = 0;
    }

    // Prepare NPC data and items
    this._prepareItems(context);

    // Prepare tabs
    context.tabs = this._getTabs();

    return context;
  }

  /** @override */
  async _onRender(context, options) {
    // Call grandparent _onRender directly to avoid ConanActorSheet's form listener
    // which is designed for character sheets with submitOnChange: true
    await foundry.applications.api.HandlebarsApplicationMixin(
      foundry.applications.sheets.ActorSheetV2
    ).prototype._onRender.call(this, context, options);
    
    // Activate tabs for NPCs
    this._activateTabs();
    
    // Setup NPC-specific form handling with debounce for text inputs
    this._setupNPCFormHandling();
    
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
    
    // Handle defense.physical changes to update basePhysical when no effects are active
    const defenseInput = this.element.querySelector('input[name="system.defense.physical"]');
    if (defenseInput) {
      defenseInput.addEventListener('change', async (event) => {
        const newPhysical = parseInt(event.target.value) || 0;
        const defenceActive = this.baseActor.system.defenceActive || false;
        const immobilized = this.baseActor.system.immobilized || false;
        
        // If no effects are active, update basePhysical to match
        if (!defenceActive && !immobilized) {
          await this.baseActor.update({
            'system.defense.basePhysical': newPhysical
          });
        }
      });
    }
    
    // Handle N/A checkboxes for damage types
    setupNACheckboxes(this.element);
    
    // Setup auto-resize for powers textareas
    const powersTextareas = this.element.querySelectorAll('textarea.auto-resize-powers');
    powersTextareas.forEach(textarea => {
      // Get the CSS min-height value (default 80px)
      const computedStyle = window.getComputedStyle(textarea);
      const minHeight = parseInt(computedStyle.minHeight) || 80;
      const maxHeight = 400;
      
      const adjustHeight = () => {
        // Temporarily set height to auto to get accurate scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate the needed height with a small buffer for line-height
        const scrollHeight = textarea.scrollHeight;
        
        // Use the larger of minHeight or scrollHeight, but cap at maxHeight
        const newHeight = Math.max(minHeight, Math.min(scrollHeight + 2, maxHeight));
        textarea.style.height = newHeight + 'px';
        
        // Show/hide scrollbar based on content
        textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      };
      
      textarea.addEventListener('input', adjustHeight);
      
      // Initial adjustment - always run to set proper overflow
      adjustHeight();
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
   * Setup form handling for NPC sheets with debounce for text inputs
   * This prevents the sheet from freezing during text entry
   */
  _setupNPCFormHandling() {
    const form = this.element.querySelector('form');
    if (!form) return;
    
    // Track if we're currently updating to prevent re-render loops
    this._isUpdating = false;
    
    // Create debounced update function for text inputs (500ms delay)
    const debouncedTextUpdate = debounce(async (fieldName, fieldValue) => {
      if (this._isUpdating) return;
      this._isUpdating = true;
      
      try {
        const updateData = {};
        updateData[fieldName] = fieldValue;
        await this.baseActor.update(updateData, { render: false });
      } finally {
        this._isUpdating = false;
      }
    }, 500);
    
    // Create immediate update function for non-text inputs
    const immediateUpdate = async (fieldName, fieldValue, dtype) => {
      if (this._isUpdating) return;
      this._isUpdating = true;
      
      try {
        // Parse value based on data type
        if (dtype === "Number") {
          fieldValue = parseInt(fieldValue) || 0;
        } else if (dtype === "Boolean") {
          // Already boolean from checkbox
        }
        
        const updateData = {};
        updateData[fieldName] = fieldValue;
        await this.baseActor.update(updateData);
      } finally {
        this._isUpdating = false;
      }
    };
    
    // Handle text inputs with debounce (input event for real-time feel)
    const textInputs = form.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
      // Use 'input' event for real-time debounced updates
      input.addEventListener('input', (event) => {
        const fieldName = event.target.name;
        if (!fieldName) return;
        debouncedTextUpdate(fieldName, event.target.value);
      });
      
      // Also save on blur (when leaving the field)
      input.addEventListener('blur', async (event) => {
        const fieldName = event.target.name;
        if (!fieldName || this._isUpdating) return;
        
        this._isUpdating = true;
        try {
          const updateData = {};
          updateData[fieldName] = event.target.value;
          await this.baseActor.update(updateData, { render: false });
        } finally {
          this._isUpdating = false;
        }
      });
    });
    
    // Handle number inputs and selects with immediate update on change
    const numberInputs = form.querySelectorAll('input[type="number"], select');
    numberInputs.forEach(input => {
      input.addEventListener('change', (event) => {
        const fieldName = event.target.name;
        if (!fieldName) return;
        const dtype = event.target.dataset.dtype || (event.target.type === 'number' ? 'Number' : 'String');
        immediateUpdate(fieldName, event.target.value, dtype);
      });
    });
    
    // Handle checkboxes with immediate update
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      // Skip checkboxes that have specific action handlers (like wounded, defence, etc.)
      if (checkbox.dataset.action) return;
      
      checkbox.addEventListener('change', (event) => {
        const fieldName = event.target.name;
        if (!fieldName) return;
        immediateUpdate(fieldName, event.target.checked, 'Boolean');
      });
    });
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
    
    // Store base physical defense if not already stored (needed for manual defense adjustments)
    const updateData = {
      "system.defenceActive": newDefence
    };
    
    if (this.baseActor.system.defense.basePhysical === undefined) {
      updateData["system.defense.basePhysical"] = this.baseActor.system.defense.physical;
    }
    
    // Just toggle the flag - prepareDerivedData() will recalculate defense automatically
    await this.baseActor.update(updateData);
    
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
    
    const updateData = {
      "system.immobilized": newImmobilized
    };
    
    // Store base physical defense if not already stored (needed for manual defense adjustments)
    if (this.baseActor.system.defense.basePhysical === undefined) {
      updateData["system.defense.basePhysical"] = this.baseActor.system.defense.physical;
    }
    
    // Disable Defence when becoming immobilized
    if (newImmobilized && this.baseActor.system.defenceActive) {
      updateData["system.defenceActive"] = false;
    }
    
    // Just toggle flags - prepareDerivedData() will recalculate defense automatically
    await this.baseActor.update(updateData);
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  static async _onTogglePoisoned(event, target) {
    // Always open dialog to configure poison effects
    const { PoisonedDialog } = await import("../helpers/poisoned-dialog.mjs");
    const dialog = new PoisonedDialog(this.baseActor);
    dialog.render(true);
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

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.difficulty = null;
    this.modifier = 0;
    this.resolve = null;
  }

  static async prompt(actor) {
    const dialog = new NPCDifficultyDialog(actor);
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
    context.isPoisoned = this.actor && this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    context.isPoisonedAttributes = this.actor && this.actor.system.poisoned && this.actor.system.poisonEffects?.effect1;
    context.poisonMultiplier = this.actor?.system.poisonEffects?.effect2Multiplier || 1;

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
  const attributeValue = attributeData.effectiveValue || attributeData.value;
  const attributeDie = attributeData.die;
  
  // Get attribute label
  const attrLabel = game.i18n.localize(`CONAN.Attributes.${attribute}.label`);
  const attrAbbr = game.i18n.localize(`CONAN.Attributes.${attribute}.abbr`);
  const displayName = game.i18n.lang === "pl" ? `${attrAbbr} (${attrLabel})` : attrLabel;
  
  // Ask for difficulty and modifier
  const result = await NPCDifficultyDialog.prompt(actor);
  if (result === null || result === undefined) return;
  
  const difficulty = result.difficulty;
  let modifier = result.modifier;
  
  // Apply poison effect 2: -1 to all rolls
  const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
  const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
  modifier += poisonPenalty;
  
  // Check if attribute is poisoned (effect 1)
  const isPoisonedAttributes = actor.system.poisoned && actor.system.poisonEffects?.effect1;
  
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
    <div class="conan-roll-chat npc-roll ${npcClass} ${hasPoisonPenalty || isPoisonedAttributes ? 'poisoned-roll' : ''}">
      <div class="roll-header">
        <h3>${game.i18n.localize('CONAN.Roll.attributeTest')}${hasPoisonPenalty || isPoisonedAttributes ? ' <i class="fas fa-skull-crossbones poison-skull" style="color: #15a20e;"></i>' : ''}</h3>
        <div class="attribute-info">${displayName}${isPoisonedAttributes ? ' <span style="color: #15a20e; font-size: 0.9em;">(zatruty)</span>' : ''}</div>
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
          <span class="calc-part${isPoisonedAttributes ? ' poisoned-value' : ''}">${attributeValue}</span>
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
