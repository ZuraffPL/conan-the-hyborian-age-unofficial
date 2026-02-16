/**
 * Extend the base Item document
 */
export class ConanItem extends Item {

  /** @override */
  static async create(data, options = {}) {
    // Set default icon based on item type
    if (!data.img || data.img === "icons/svg/item-bag.svg") {
      const defaultIcons = {
        armor: "icons/svg/shield.svg",
        weapon: "icons/svg/sword.svg",
        skill: "icons/svg/aura.svg",
        spell: "icons/svg/book.svg"
      };
      data.img = defaultIcons[data.type] || "icons/svg/item-bag.svg";
    }
    return super.create(data, options);
  }

  /**
   * Augment the basic item data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
    
    // Migrate old range format (object) to new format (string)
    if (this.type === "weapon" && this.system.range && typeof this.system.range === "object") {
      // Old format was {value: 0, long: 0}, convert to default "touch" for melee
      const weaponType = this.system.weaponType || "melee";
      let defaultRange = "touch";
      
      if (weaponType === "thrown") {
        defaultRange = "close";
      } else if (weaponType === "ranged") {
        const size = this.system.weaponSize || "medium";
        if (size === "heavy") {
          defaultRange = "distant8";
        } else {
          defaultRange = "medium3";
        }
      }
      
      // Update the item data with the new format
      this.updateSource({ "system.range": defaultRange });
    }
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands
   */
  getRollData() {
    // If present, return the actor's roll data
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle clickable rolls
   */
  async roll() {
    const item = this;

    // Initialize chat data
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message
    if (!this.system.damage?.dice) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description || ""
      });
      return;
    }

    // Otherwise, create a roll and send a chat message from it
    const rollData = this.getRollData();

    // Invoke the roll and submit it to chat
    const roll = await new Roll(item.system.damage.dice + " + @attributes.strength.mod", rollData).roll();
    
    roll.toMessage({
      speaker: speaker,
      flavor: label,
      rollMode: rollMode
    });

    return roll;
  }
}
