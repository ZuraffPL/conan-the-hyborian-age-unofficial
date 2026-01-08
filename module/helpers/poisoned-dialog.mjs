/**
 * Poisoned Effects Dialog
 */
export class PoisonedDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.baseActor = actor;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["conan", "dialog", "poisoned"],
    tag: "form",
    window: {
      title: "CONAN.Poisoned.title",
      contentClasses: ["standard-form"],
      minimizable: false
    },
    position: {
      width: 500,
      height: "auto"
    },
    actions: {
      apply: PoisonedDialog._onApply,
      close: PoisonedDialog._onClose
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/poisoned-dialog.hbs"
    }
  };

  static async show(actor) {
    const dialog = new PoisonedDialog(actor);
    dialog.render(true);
    return dialog;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.isCharacter = this.actor.type === "character";
    context.poisonEffects = this.actor.system.poisonEffects || {
      effect1: false,
      effect2: false,
      effect3: false,
      effect4: false,
      effect5: false
    };
    return context;
  }

  static async _onApply(event, target) {
    const form = target.closest("form");
    if (!form) return;
    
    // Get previous state
    const previousPoisoned = this.baseActor.system.poisoned || false;
    const previousEffects = this.baseActor.system.poisonEffects || {};
    
    // Get checkbox values
    const effect1 = form.querySelector('input[name="poisonEffect1"]')?.checked || false;
    const effect2 = form.querySelector('input[name="poisonEffect2"]')?.checked || false;
    const effect3 = form.querySelector('input[name="poisonEffect3"]')?.checked || false;
    const effect4 = form.querySelector('input[name="poisonEffect4"]')?.checked || false;
    const effect5 = form.querySelector('input[name="poisonEffect5"]')?.checked || false;
    
    // Check if any effect is selected
    const anyEffectActive = effect1 || effect2 || effect3 || effect4 || effect5;
    
    // Update actor with poison effects
    await this.baseActor.update({
      'system.poisoned': anyEffectActive,
      'system.poisonEffects': {
        effect1: effect1,
        effect2: effect2,
        effect3: effect3,
        effect4: effect4,
        effect5: effect5
      }
    });
    
    // Create chat message about poison status changes
    await PoisonedDialog._createPoisonStatusMessage(this.baseActor, previousPoisoned, anyEffectActive, previousEffects, {
      effect1, effect2, effect3, effect4, effect5
    });
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
    
    this.close();
  }

  /**
   * Create chat message about poison status changes
   */
  static async _createPoisonStatusMessage(actor, wasPoisoned, isPoisoned, oldEffects, newEffects) {
    // Determine which effects were added or removed
    const addedEffects = [];
    const removedEffects = [];
    
    const effectNames = {
      effect1: game.i18n.localize("CONAN.Poisoned.option1.name"),
      effect2: game.i18n.localize("CONAN.Poisoned.option2.name"),
      effect3: game.i18n.localize("CONAN.Poisoned.option3.name"),
      effect4: game.i18n.localize("CONAN.Poisoned.option4.name"),
      effect5: game.i18n.localize("CONAN.Poisoned.option5.name")
    };
    
    for (let key of ['effect1', 'effect2', 'effect3', 'effect4', 'effect5']) {
      if (newEffects[key] && !oldEffects[key]) {
        addedEffects.push(effectNames[key]);
      } else if (!newEffects[key] && oldEffects[key]) {
        removedEffects.push(effectNames[key]);
      }
    }
    
    // Don't create message if nothing changed
    if (addedEffects.length === 0 && removedEffects.length === 0) {
      return;
    }
    
    // Build message content
    let content = `<div class="conan-poison-status">`;
    
    if (addedEffects.length > 0) {
      content += `
        <div class="poison-applied">
          <div class="poison-header">
            <i class="fas fa-skull-crossbones" style="color: #15a20e;"></i>
            <strong>${actor.name}</strong> ${game.i18n.localize("CONAN.Poisoned.appliedMessage")}
          </div>
          <div class="poison-effects-list">
            <strong>${game.i18n.localize("CONAN.Poisoned.appliedEffects")}</strong>
            <ul>
              ${addedEffects.map(effect => `<li>${effect}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
    
    if (removedEffects.length > 0) {
      content += `
        <div class="poison-removed">
          <div class="poison-header">
            <i class="fas fa-heart" style="color: #dc143c;"></i>
            <strong>${actor.name}</strong> ${game.i18n.localize("CONAN.Poisoned.removedMessage")}
          </div>
          <div class="poison-effects-list">
            <strong>${game.i18n.localize("CONAN.Poisoned.removedEffects")}</strong>
            <ul>
              ${removedEffects.map(effect => `<li>${effect}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
    
    content += `</div>`;
    
    // Create chat message
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: content,
      flavor: isPoisoned ? "Zatrucie!" : "Odtrucie!",
      flags: {
        "conan-the-hyborian-age": {
          poisonStatus: true,
          addedEffects: addedEffects,
          removedEffects: removedEffects
        }
      }
    });
  }

  static async _onClose(event, target) {
    this.close();
  }
}
