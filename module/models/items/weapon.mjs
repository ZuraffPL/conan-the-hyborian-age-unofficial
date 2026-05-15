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

  /** @override */
  prepareBaseData() {
    super.prepareBaseData?.();
    // Zabezpieczenie przed pustym stringiem LUB stringiem "undefined" (artefakt błędnego selectOptions).
    // StringField(initial) działa tylko gdy pole jest NIEOBECNE w zapisanych danych.
    const BAD = new Set(["", "undefined", "null", "[object Object]"]);
    if (!this.weaponType || BAD.has(this.weaponType))  this.weaponType  = "melee";
    if (!this.handedness || BAD.has(this.handedness))  this.handedness  = "one-handed";
    if (!this.weaponSize || BAD.has(this.weaponSize))  this.weaponSize  = "medium";
    if (!this.range      || BAD.has(this.range))       this.range       = "touch";
    if (!this.damage     || BAD.has(this.damage))      this.damage      = "1d6";
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
    // Obsługa artefaktu po koercji StringField: {value:"touch"} → "[object Object]"
    if (source.range === "[object Object]") source.range = "touch";
    // Uzupełnienie pustych stringów LUB stringu "undefined" (artefakt błędnego selectOptions).
    // StringField.initial nie działa gdy pole istnieje jako "" lub "undefined".
    const BAD = new Set(["", "undefined", "null", "[object Object]"]);
    if (!source.weaponType || BAD.has(source.weaponType)) source.weaponType = "melee";
    if (!source.handedness || BAD.has(source.handedness)) source.handedness = "one-handed";
    if (!source.weaponSize || BAD.has(source.weaponSize)) source.weaponSize = "medium";
    if (!source.range      || BAD.has(source.range))      source.range      = "touch";
    if (!source.damage     || BAD.has(source.damage))     source.damage     = "1d6";
    return super.migrateData(source);
  }
}
