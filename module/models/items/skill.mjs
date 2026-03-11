/**
 * Model danych dla umiejętności (skill).
 */
import { BaseItemModel } from "./base-item.mjs";

export class SkillModel extends BaseItemModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      ...super.defineSchema(),
      rank:      new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
      attribute: new fields.StringField({ initial: "might" }),
      trained:   new fields.BooleanField({ initial: false }),
      xpCost:    new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
      skillType: new fields.StringField({ initial: "origin" })
    };
  }
}
