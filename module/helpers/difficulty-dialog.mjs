/**
 * Difficulty Dialog for Conan: The Hyborian Age
 * ApplicationV2-based dialog for setting test difficulty
 */

export class DifficultyDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  static DEFAULT_OPTIONS = {
    id: "difficulty-dialog",
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
      roll: DifficultyDialog._onRoll,
      cancel: DifficultyDialog._onCancel
    },
    form: {
      handler: DifficultyDialog._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/difficulty-dialog.hbs"
    }
  };

  constructor(options = {}) {
    super(options);
    this.difficulty = null;
    this.modifier = 0;
    this.resolve = null;
  }

  /**
   * Show the dialog and return a promise that resolves with {difficulty, modifier}
   */
  static async prompt() {
    const dialog = new DifficultyDialog();
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
      
      // Update on input
      difficultyInput.addEventListener('input', updateDifficultyLabel);
      
      // Initial update
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
    // If closed without a result, resolve with null
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
    
    return super.close(options);
  }
}
