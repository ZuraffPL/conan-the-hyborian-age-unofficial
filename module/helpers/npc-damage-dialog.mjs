/**
 * NPC Damage Roll Dialog
 */
export class NPCDamageDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  static DEFAULT_OPTIONS = {
    id: "npc-damage-dialog",
    classes: ["conan", "dialog", "damage"],
    tag: "dialog",
    window: {
      title: "CONAN.Damage.title",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 400,
      height: "auto"
    },
    actions: {
      roll: NPCDamageDialog._onRoll,
      cancel: NPCDamageDialog._onCancel
    },
    form: {
      handler: NPCDamageDialog._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/npc-damage-dialog.hbs"
    }
  };

  constructor(actor, attackType, options = {}) {
    super(options);
    this.actor = actor;
    this.attackType = attackType; // 'melee' or 'ranged'
    this.modifier = 0;
    this.resolve = null;
  }

  static async prompt(actor, attackType) {
    const dialog = new NPCDamageDialog(actor, attackType);
    return new Promise((resolve) => {
      dialog.resolve = resolve;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    // Get damage data from actor
    const damageData = this.actor.system.damage[this.attackType];
    
    context.attackType = this.attackType;
    context.attackTypeLabel = this.attackType === 'melee' 
      ? game.i18n.localize("CONAN.NPC.meleeDamage")
      : game.i18n.localize("CONAN.NPC.rangedDamage");
    
    context.weaponName = damageData.name || game.i18n.localize("CONAN.NPC.weaponName");
    context.damageDie = damageData.die || "d6";
    context.damageModifier = damageData.modifier || 0;
    context.modifier = this.modifier;
    
    // For melee attacks, include Brawn value
    if (this.attackType === 'melee') {
      context.brawnValue = this.actor.system.attributes.might?.value || 0;
    }
    
    context.title = game.i18n.localize("CONAN.Damage.title");
    context.rollLabel = game.i18n.localize("CONAN.Dialog.difficulty.roll");
    context.cancelLabel = game.i18n.localize("CONAN.Dialog.difficulty.cancel");
    context.modifierLabel = game.i18n.localize("CONAN.Dialog.difficulty.modifierLabel");
    context.isPoisoned = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    context.poisonMultiplier = this.actor.system.poisonEffects?.effect2Multiplier || 1;

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
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
    
    return super.close(options);
  }
}
