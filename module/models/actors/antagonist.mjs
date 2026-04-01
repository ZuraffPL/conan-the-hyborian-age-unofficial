/**
 * Model danych dla antagonistów (antagonist).
 * Antagonista różni się od miniona: ma pełne lifePoints (value/max),
 * nie ma pól wounded/defeated/threshold.
 * Zawiera migrację z prepareBaseData (scalar lifePoints → obiekt).
 *
 * prepareDerivedData() przeniesiona z ConanActor._prepareNpcData().
 */
import { PoisonEffectsModel } from "../shared/index.mjs";

export class AntagonistModel extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;

    // Pomocnicza fabryka: schemat atrybutu (value + die)
    const attributeSchema = () => new fields.SchemaField({
      value: new fields.NumberField({ required: true, initial: 1, min: 1, integer: true }),
      die:   new fields.StringField({ initial: "d6" })
    });

    // Pomocnicza fabryka: schemat ataku (melee / ranged)
    const attackSchema = () => new fields.SchemaField({
      name:          new fields.StringField({ initial: "" }),
      die:           new fields.StringField({ initial: "d6" }),
      modifier:      new fields.NumberField({ initial: 0, integer: true }),
      notApplicable: new fields.BooleanField({ initial: false })
    });

    return {
      // Pola z template templates.base
      biography: new fields.HTMLField({ required: false, initial: "" }),
      notes:     new fields.HTMLField({ required: false, initial: "" }),

      // Pola własne antagonisty
      description:  new fields.StringField({ initial: "" }),
      creatureType: new fields.StringField({ initial: "human" }),

      attributes: new fields.SchemaField({
        might: attributeSchema(),
        edge:  attributeSchema(),
        grit:  attributeSchema(),
        wits:  attributeSchema()
      }),

      defense: new fields.SchemaField({
        physical:     new fields.NumberField({ required: true, initial: 10, min: 0, integer: true }),
        sorcery:      new fields.NumberField({ required: true, initial: 10, min: 0, integer: true }),
        // basePhysical: przechowuje obronę przed efektami Defence/Immobilized
        basePhysical: new fields.NumberField({ required: false, initial: null, nullable: true, integer: true })
      }),

      armor: new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),

      lifePoints: new fields.SchemaField({
        value: new fields.NumberField({ required: true, initial: 20, min: 0, integer: true }),
        max:   new fields.NumberField({ required: true, initial: 20, min: 0, integer: true })
      }),

      damage: new fields.SchemaField({
        melee:  attackSchema(),
        ranged: attackSchema()
      }),

      actions: new fields.SchemaField({
        perRound: new fields.NumberField({ required: true, initial: 1, min: 1, integer: true }),
        attacks:  new fields.NumberField({ required: true, initial: 1, min: 1, integer: true })
      }),

      powers: new fields.SchemaField({
        magic:   new fields.StringField({ initial: "" }),
        special: new fields.StringField({ initial: "" })
      }),

      poisoned: new fields.BooleanField({ initial: false }),
      poisonEffects: new fields.EmbeddedDataField(PoisonEffectsModel),

      // Pola nieudokumentowane w template.json — teraz formalizowane w schemacie
      defenceActive: new fields.BooleanField({ initial: false }),
      immobilized:   new fields.BooleanField({ initial: false }),

      // ── Threat Engine ─────────────────────────────────────────────────────
      // Linked token = boss (własne stałe statystyki, Threat Engine nie dotyczy).
      // Unlinked token = antagonista szablonowy — tier losowany przy wystawieniu:
      //   0 = słaby (70%)  | 1 = silny (20%) ☠️  | 2 = elitarny (10%) ☠️☠️☠️
      threatEngineEnabled: new fields.BooleanField({ initial: true }),
      threatTier: new fields.NumberField({ required: false, initial: null, nullable: true, integer: true }),
      // Dla bossów (linked): opcjonalna ikona 💀 dodawana do nazwy tokena przy wystawieniu.
      bossIconEnabled: new fields.BooleanField({ initial: false })
    };
  }

  /**
   * Migracja: konwersja starego formatu lifePoints (scalar → {value, max}).
   * Przeniesiona z ConanActor.prepareBaseData() — wywoływana automatycznie przez Foundry.
   */
  static migrateData(source) {
    if (typeof source.lifePoints === "number") {
      source.lifePoints = { value: source.lifePoints, max: source.lifePoints };
    }
    return super.migrateData(source);
  }

  /**
   * Oblicza pochodne wartości (mod, effectiveValue, obrona) przy każdym renderze.
   * Przeniesione z ConanActor._prepareNpcData() — antagonist branch.
   */
  prepareDerivedData() {
    // Oblicz modyfikatory atrybutów
    const attributePenalty = this.poisoned ? (this.poisonEffects?.attributePenalty ?? 0) : 0;
    for (const [, attribute] of Object.entries(this.attributes)) {
      attribute.isPoisonedAttributes = attributePenalty > 0;
      attribute.effectiveValue = Math.max(1, attribute.value - attributePenalty);
      attribute.mod = attribute.effectiveValue - 4;
    }

    // Oblicz fizyczną obronę uwzględniając Obrona (+2) i Unieruchomiony (→0)
    const basePhysical = this.defense.basePhysical ?? this.defense.physical;
    let physicalDefense = basePhysical;

    if (this.defenceActive)  physicalDefense += 2;
    if (this.immobilized)    physicalDefense = 0;

    this.defense.physical = physicalDefense;
  }
}
