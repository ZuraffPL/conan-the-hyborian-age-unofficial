/**
 * Model danych dla zaklęć (spell).
 */
import { BaseItemModel } from "./base-item.mjs";

export class SpellModel extends BaseItemModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      ...super.defineSchema(),
      discipline: new fields.StringField({ initial: "alchemy" }),
      xpCost:     new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
      effect:     new fields.StringField({ initial: "" })
    };
  }
}
