/**
 * Poisoned Effects Dialog
 */
export class PoisonedDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
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
    const form = this.element.querySelector("form");
    if (!form) return;
    
    // Get checkbox values
    const effect1 = form.querySelector('input[name="poisonEffect1"]')?.checked || false;
    const effect2 = form.querySelector('input[name="poisonEffect2"]')?.checked || false;
    const effect3 = form.querySelector('input[name="poisonEffect3"]')?.checked || false;
    const effect4 = form.querySelector('input[name="poisonEffect4"]')?.checked || false;
    const effect5 = form.querySelector('input[name="poisonEffect5"]')?.checked || false;
    
    // Check if any effect is selected
    const anyEffectActive = effect1 || effect2 || effect3 || effect4 || effect5;
    
    // Update actor with poison effects
    await this.actor.update({
      'system.poisoned': anyEffectActive,
      'system.poisonEffects': {
        effect1: effect1,
        effect2: effect2,
        effect3: effect3,
        effect4: effect4,
        effect5: effect5
      }
    });
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
    
    this.close();
  }

  static async _onClose(event, target) {
    this.close();
  }
}
