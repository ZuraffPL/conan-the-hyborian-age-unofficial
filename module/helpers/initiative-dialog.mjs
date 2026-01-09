/**
 * Initiative Dialog for Conan: The Hyborian Age
 * ApplicationV2-based dialog for rolling initiative
 */

export class InitiativeDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  static DEFAULT_OPTIONS = {
    id: "initiative-dialog",
    classes: ["conan", "dialog", "difficulty"],
    tag: "dialog",
    window: {
      title: "CONAN.Combat.rollInitiative",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 400,
      height: "auto"
    },
    actions: {
      roll: InitiativeDialog._onRoll,
      cancel: InitiativeDialog._onCancel
    },
    form: {
      handler: InitiativeDialog._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/initiative-dialog.hbs"
    }
  };

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.modifier = 0;
    this.resolve = null;
  }

  /**
   * Show the dialog and return a promise that resolves with {modifier}
   */
  static async prompt(actor) {
    const dialog = new InitiativeDialog(actor);
    return new Promise((resolve) => {
      dialog.resolve = resolve;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.title = game.i18n.localize("CONAN.Combat.rollInitiative");
    const edgeLabel = game.i18n.localize("CONAN.Attributes.edge.label");
    const edgeAbbr = game.i18n.localize("CONAN.Attributes.edge.abbr");
    // Show "Refleks (Edge)" in Polish, "Edge" in English
    context.edgeLabel = game.i18n.lang === "pl" ? `${edgeLabel} (${edgeAbbr})` : edgeLabel;
    context.hint = game.i18n.localize("CONAN.Combat.initiativeHint");
    context.modifierLabel = game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel");
    context.rollLabel = game.i18n.localize("CONAN.Dialog.difficulty.roll");
    context.cancelLabel = game.i18n.localize("CONAN.Dialog.difficulty.cancel");
    context.modifier = this.modifier;
    context.isPoisoned = this.actor && this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;

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
  }

  static async _onSubmit(event, form, formData) {
    const modifier = parseInt(formData.object.modifier) || 0;
    
    if (this.resolve) {
      this.resolve({ modifier });
    }
    
    this.close();
  }

  static async _onRoll(event, target) {
    const form = this.element.querySelector("form");
    if (form) {
      const formData = new foundry.applications.ux.FormDataExtended(form);
      const modifier = parseInt(formData.object.modifier) || 0;
      
      if (this.resolve) {
        this.resolve({ modifier });
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
    // If closed without a result, resolve with null
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
    
    return super.close(options);
  }
}
