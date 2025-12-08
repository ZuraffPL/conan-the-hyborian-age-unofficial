/**
 * Dialog for character creation with origin selection and attribute point distribution
 */
export class CharacterCreationDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  constructor(actor) {
    super();
    this.actor = actor;
    this.selectedOrigin = "";
    this.attributePoints = {
      might: 1,
      edge: 1,
      grit: 1,
      wits: 1
    };
    this.totalPoints = 16;
  }

  static DEFAULT_OPTIONS = {
    id: "character-creation-dialog",
    classes: ["conan", "dialog", "character-creation"],
    tag: "dialog",
    window: {
      title: "CONAN.Dialog.characterCreation.title",
      icon: "fa-solid fa-user-plus",
      minimizable: false
    },
    position: {
      width: 500,
      height: "auto"
    },
    actions: {
      confirm: CharacterCreationDialog._onConfirm,
      cancel: CharacterCreationDialog._onCancel,
      incrementAttribute: CharacterCreationDialog._onIncrementAttribute,
      decrementAttribute: CharacterCreationDialog._onDecrementAttribute
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/character-creation-dialog.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    // Calculate remaining points
    const usedPoints = Object.values(this.attributePoints).reduce((sum, val) => sum + val, 0);
    const remainingPoints = this.totalPoints - usedPoints;
    
    context.selectedOrigin = this.selectedOrigin;
    context.attributePoints = this.attributePoints;
    context.remainingPoints = remainingPoints;
    context.canConfirm = remainingPoints === 0 && this.selectedOrigin !== "";
    
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Attach change listener for origin selection
    const originSelect = this.element.querySelector('select[name="origin"]');
    if (originSelect) {
      originSelect.addEventListener('change', (event) => {
        this.selectedOrigin = event.target.value;
        this.render();
      });
    }
  }

  static async _onIncrementAttribute(event, target) {
    const attribute = target.dataset.attribute;
    const usedPoints = Object.values(this.attributePoints).reduce((sum, val) => sum + val, 0);
    
    if (this.attributePoints[attribute] < 6 && usedPoints < this.totalPoints) {
      this.attributePoints[attribute]++;
      this.render();
    }
  }

  static async _onDecrementAttribute(event, target) {
    const attribute = target.dataset.attribute;
    
    if (this.attributePoints[attribute] > 1) {
      this.attributePoints[attribute]--;
      this.render();
    }
  }

  static async _onConfirm(event, target) {
    const usedPoints = Object.values(this.attributePoints).reduce((sum, val) => sum + val, 0);
    
    if (usedPoints !== this.totalPoints || !this.selectedOrigin) {
      ui.notifications.warn(game.i18n.localize("CONAN.Dialog.characterCreation.mustDistribute"));
      return;
    }

    // Prepare update data
    const updateData = {
      "system.origin": this.selectedOrigin,
      "system.attributes.might.value": this.attributePoints.might,
      "system.attributes.edge.value": this.attributePoints.edge,
      "system.attributes.grit.value": this.attributePoints.grit,
      "system.attributes.wits.value": this.attributePoints.wits,
      "system.characterCreated": true
    };

    // Set life points based on origin + (2 x Grit)
    const baseLifePointsMap = {
      "hills": 30,
      "streets": 22,
      "steppes": 26,
      "north": 32,
      "wilds": 30,
      "civilized": 22,
      "unknown": 26,
      "jhebbal": 28,
      "acheron": 20,
      "demon": 26
    };

    const totalLifePoints = baseLifePointsMap[this.selectedOrigin] + (2 * this.attributePoints.grit);
    
    if (baseLifePointsMap[this.selectedOrigin]) {
      updateData["system.lifePoints"] = {
        actual: totalLifePoints,
        max: totalLifePoints
      };
    }

    // Set stamina to Grit value
    updateData["system.stamina.value"] = this.attributePoints.grit;

    // Set physical defense to Edge + 2, minimum 5
    const physicalDefense = Math.max(this.attributePoints.edge + 2, 5);
    updateData["system.defense.physical"] = physicalDefense;

    // Set sorcery defense to Wits + 2, minimum 5
    const sorceryDefense = Math.max(this.attributePoints.wits + 2, 5);
    updateData["system.defense.sorcery"] = sorceryDefense;

    // Give 3 starting XP
    updateData["system.experience.value"] = 3;

    // Store initial values for comparison
    updateData["system.initial"] = {
      might: this.attributePoints.might,
      edge: this.attributePoints.edge,
      grit: this.attributePoints.grit,
      wits: this.attributePoints.wits,
      lifePoints: totalLifePoints,
      stamina: this.attributePoints.grit,
      physicalDefense: physicalDefense,
      sorceryDefense: sorceryDefense,
      experience: 3
    };

    await this.actor.update(updateData);
    
    ui.notifications.info(game.i18n.localize("CONAN.Dialog.characterCreation.created"));
    this.close();
  }

  static async _onCancel(event, target) {
    this.close();
  }

  /**
   * Static method to show the dialog
   */
  static async prompt(actor) {
    const dialog = new CharacterCreationDialog(actor);
    dialog.render(true);
  }
}
