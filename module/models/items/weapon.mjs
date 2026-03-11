/**
 * Model danych dla broni (weapon).
 * Zawiera logikę migracji starego formatu range (obiekt → string),
 * przeniesioną z ConanItem.prepareData().
 */
import { BaseItemModel } from "./base-item.mjs";

export class WeaponModel extends BaseItemModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      ...super.defineSchema(),
      equipped:       new fields.BooleanField({ initial: false }),
      quality:        new fields.StringField({ initial: "standard" }),
      weaponType:     new fields.StringField({ initial: "melee" }),
      handedness:     new fields.StringField({ initial: "one-handed" }),
      weaponSize:     new fields.StringField({ initial: "medium" }),
      improvised:     new fields.BooleanField({ initial: false }),
      damage:         new fields.StringField({ initial: "1d6" }),
      damageModifier: new fields.NumberField({ initial: 0 }),
      range:          new fields.StringField({ initial: "touch" }),
      stipulations:   new fields.StringField({ initial: "" })
    };
  }

  /**
   * Migracja: konwersja starego formatu range ({value, long}) na string.
   * Wywoływana automatycznie przez Foundry przy ładowaniu dokumentu.
   */
  static migrateData(source) {
    // Migracja: konwersja damage z obiektu ({dice, bonus, type}) na string
    if (source.damage && typeof source.damage === "object") {
      source.damage = source.damage.dice || "1d6";
    }
    // Migracja: konwersja starego formatu range (obiekt → string)
    if (source.range && typeof source.range === "object") {
      const weaponType = source.weaponType || "melee";
      if (weaponType === "thrown") {
        source.range = "close";
      } else if (weaponType === "ranged") {
        source.range = source.weaponSize === "heavy" ? "distant8" : "medium3";
      } else {
        source.range = "touch";
      }
    }
    return super.migrateData(source);
  }
}
