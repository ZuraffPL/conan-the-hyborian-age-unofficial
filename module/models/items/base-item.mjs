/**
 * Bazowy model danych dla wszystkich typów przedmiotów.
 * Odpowiada sekcji templates.base z template.json.
 */
export class BaseItemModel extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.HTMLField({ required: false, initial: "" }),
      quantity:    new fields.NumberField({ required: true, initial: 1, min: 0, integer: true }),
      weight:      new fields.NumberField({ required: true, initial: 0, min: 0 }),
      price:       new fields.NumberField({ required: true, initial: 0, min: 0 })
    };
  }
}
