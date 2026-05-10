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
    // Zabezpieczenie przed pustym stringiem – StringField(initial) działa tylko gdy pole jest NIEOBECNE.
    // Jeśli w zapisanych danych jest "", przywracamy domyślne wartości.
    if (!this.weaponType)  this.weaponType  = "melee";
    if (!this.handedness)  this.handedness  = "one-handed";
    if (!this.weaponSize)  this.weaponSize  = "medium";
    if (!this.range)       this.range       = "touch";
    if (!this.damage)      this.damage      = "1d6";
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
    // Uzupełnienie pustych stringów (StringField.initial nie działa gdy pole istnieje jako "")
    if (!source.weaponType) source.weaponType = "melee";
    if (!source.handedness) source.handedness = "one-handed";
    if (!source.weaponSize) source.weaponSize = "medium";
    if (!source.range)      source.range      = "touch";
    if (!source.damage)     source.damage     = "1d6";
    return super.migrateData(source);
  }
}
