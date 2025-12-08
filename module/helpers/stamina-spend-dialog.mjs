/**
 * Dialog for spending Stamina points on tactical options
 */
export class StaminaSpendDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    id: "stamina-spend-dialog-{id}",
    classes: ["conan", "dialog", "stamina-spend-dialog"],
    tag: "form",
    window: {
      title: "CONAN.Stamina.spendTitle",
      icon: "fas fa-bolt",
      minimizable: false,
      resizable: false
    },
    position: {
      width: 500,
      height: "auto"
    },
    actions: {
      spend: StaminaSpendDialog.#onSpend,
      cancel: StaminaSpendDialog.#onCancel
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/stamina-spend-dialog.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    const currentStamina = this.actor.system.stamina?.value || 0;
    
    return {
      ...context,
      actor: this.actor,
      currentStamina: currentStamina,
      hasStamina: currentStamina >= 1,
      options: [
        {
          id: "extra-move",
          icon: "fas fa-running",
          label: game.i18n.localize("CONAN.Stamina.extraMove"),
          description: game.i18n.localize("CONAN.Stamina.extraMoveDesc"),
          cost: 1
        },
        {
          id: "increase-range",
          icon: "fas fa-bullseye",
          label: game.i18n.localize("CONAN.Stamina.increaseRange"),
          description: game.i18n.localize("CONAN.Stamina.increaseRangeDesc"),
          cost: 1
        },
        {
          id: "ignore-encumbrance",
          icon: "fas fa-weight-hanging",
          label: game.i18n.localize("CONAN.Stamina.ignoreEncumbrance"),
          description: game.i18n.localize("CONAN.Stamina.ignoreEncumbranceDesc"),
          cost: 1
        }
      ]
    };
  }

  /**
   * Handle spending stamina
   */
  static async #onSpend(event, target) {
    const form = target.closest("form");
    const formData = new foundry.applications.ux.FormDataExtended(form);
    const data = formData.object;
    
    if (!data.option) {
      ui.notifications.warn(game.i18n.localize("CONAN.Stamina.noOptionSelected"));
      return;
    }
    
    const currentStamina = this.actor.system.stamina?.value || 0;
    const cost = 1; // All options cost 1 Stamina
    
    if (currentStamina < cost) {
      ui.notifications.error(game.i18n.format("CONAN.Stamina.notEnoughStamina", {
        required: cost,
        current: currentStamina
      }));
      return;
    }
    
    // Deduct Stamina
    const newStamina = currentStamina - cost;
    await this.actor.update({ "system.stamina.value": newStamina });
    
    // Get option details
    const optionLabels = {
      "extra-move": game.i18n.localize("CONAN.Stamina.extraMove"),
      "increase-range": game.i18n.localize("CONAN.Stamina.increaseRange"),
      "ignore-encumbrance": game.i18n.localize("CONAN.Stamina.ignoreEncumbrance")
    };
    
    const optionIcons = {
      "extra-move": "fas fa-running",
      "increase-range": "fas fa-bullseye",
      "ignore-encumbrance": "fas fa-weight-hanging"
    };
    
    const optionLabel = optionLabels[data.option] || data.option;
    const optionIcon = optionIcons[data.option] || "fas fa-bolt";
    
    // Create chat message
    const content = `
      <div class="conan-stamina-spend">
        <div class="stamina-spend-content">
          <div class="character-info">
            <strong>${this.actor.name}</strong> ${game.i18n.localize("CONAN.Stamina.spentPoint")}
          </div>
          <div class="option-used">
            <i class="${optionIcon}"></i>
            <span class="option-label">${optionLabel}</span>
          </div>
          <div class="stamina-remaining">
            ${game.i18n.format("CONAN.Stamina.remaining", { value: newStamina })}
          </div>
        </div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      flavor: game.i18n.format("CONAN.Stamina.spent", { cost: 1 }),
      flags: {
        "conan-the-hyborian-age": {
          staminaSpend: true,
          option: data.option,
          cost: 1
        }
      }
    });    ui.notifications.info(game.i18n.format("CONAN.Stamina.spentNotification", {
      option: optionLabel
    }));
    
    this.close();
  }

  /**
   * Handle cancel
   */
  static async #onCancel(event, target) {
    this.close();
  }

  /**
   * Static helper to show the dialog
   */
  static async prompt(actor) {
    const dialog = new StaminaSpendDialog(actor);
    dialog.render(true);
  }
}
