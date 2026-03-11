/**
 * Model danych dla zbroi (armor).
 */
import { BaseItemModel } from "./base-item.mjs";

export class ArmorModel extends BaseItemModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      ...super.defineSchema(),
      equipped:     new fields.BooleanField({ initial: false }),
      quality:      new fields.StringField({ initial: "standard" }),
      armorType:    new fields.StringField({ initial: "light" }),
      specificMake: new fields.StringField({ initial: "leather" }),
      armorRating:  new fields.NumberField({ required: true, initial: 3, min: 0, integer: true }),
      encumbrance:  new fields.NumberField({ required: true, initial: 1, min: 0 }),
      stipulations: new fields.StringField({ initial: "" })
    };
  }
}
