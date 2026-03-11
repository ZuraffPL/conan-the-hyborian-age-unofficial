/**
 * Model danych dla postaci gracza (character).
 * Przeniesiona logika z ConanActor._prepareCharacterData() i prepareBaseData().
 *
 * Pola nieudokumentowane w template.json (formalizowane tu):
 *   - defenceActive, immobilized
 *   - lifePoints.adjustment
 */
import { PoisonEffectsModel } from "../shared/index.mjs";

export class CharacterModel extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;

    // Schemat pojedynczego atrybutu
    const attributeSchema = () => new fields.SchemaField({
      value: new fields.NumberField({ required: true, initial: 1, min: 1, integer: true }),
      mod:   new fields.NumberField({ required: false, initial: 0, integer: true }),
      die:   new fields.StringField({ initial: "d6" })
    });

    return {
      // Pola z templates.base
      biography: new fields.HTMLField({ required: false, initial: "" }),
      notes:     new fields.HTMLField({ required: false, initial: "" }),

      // Pola własne postaci
      origin:           new fields.StringField({ initial: "" }),
      characterCreated: new fields.BooleanField({ initial: false }),
      flexDie:          new fields.StringField({ initial: "d10" }),
      level:            new fields.NumberField({ required: true, initial: 1, min: 1, integer: true }),

      attributes: new fields.SchemaField({
        might: attributeSchema(),
        edge:  attributeSchema(),
        grit:  attributeSchema(),
        wits:  attributeSchema()
      }),

      stamina: new fields.SchemaField({
        value: new fields.NumberField({ required: true, initial: 1, min: 0, integer: true }),
        max:   new fields.NumberField({ required: true, initial: 100, integer: true })
      }),

      lifePoints: new fields.SchemaField({
        value:      new fields.NumberField({ required: true, initial: 10, min: 0, integer: true }),
        max:        new fields.NumberField({ required: true, initial: 50, integer: true }),
        adjustment: new fields.NumberField({ required: false, initial: 0, integer: true })
      }),

      defense: new fields.SchemaField({
        physical: new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
        sorcery:  new fields.NumberField({ required: true, initial: 0, min: 0, integer: true })
      }),

      experience: new fields.SchemaField({
        value: new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
        max:   new fields.NumberField({ required: true, initial: 100, integer: true })
      }),

      poisoned: new fields.BooleanField({ initial: false }),
      poisonEffects: new fields.EmbeddedDataField(PoisonEffectsModel),

      // combat template fields
      combat: new fields.SchemaField({
        reach:      new fields.NumberField({ required: true, initial: 1, min: 0, integer: true }),
        armor:      new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
        initiative: new fields.NumberField({ required: true, initial: 0, integer: true })
      }),

      // Przechowuje wartości z procesu tworzenia postaci
      initial: new fields.SchemaField({
        might:            new fields.NumberField({ initial: 1, integer: true }),
        edge:             new fields.NumberField({ initial: 1, integer: true }),
        grit:             new fields.NumberField({ initial: 1, integer: true }),
        wits:             new fields.NumberField({ initial: 1, integer: true }),
        lifePoints:       new fields.NumberField({ initial: 10, integer: true }),
        stamina:          new fields.NumberField({ initial: 1, integer: true }),
        physicalDefense:  new fields.NumberField({ initial: 0, integer: true }),
        sorceryDefense:   new fields.NumberField({ initial: 0, integer: true }),
        experience:       new fields.NumberField({ initial: 0, integer: true })
      }),

      startingSkills: new fields.ArrayField(new fields.StringField()),
      skills:         new fields.ArrayField(new fields.StringField()),

      // Pola nieudokumentowane w template.json — formalizowane w schemacie
      defenceActive: new fields.BooleanField({ initial: false }),
      immobilized:   new fields.BooleanField({ initial: false })
    };
  }

  /**
   * Migracja danych ze starych formatów:
   *  - brakujący adjustment lifePoints (jednorazowa inicjalizacja)
   *  - brakujące pola experience, flexDie (dla starych zapisów)
   */
  static migrateData(source) {
    // Normalizacja zagnieżdżonych obiektów (ochrona przed brakującymi kluczami)
    source.stamina     ??= { value: 1, max: 100 };
    source.lifePoints  ??= { value: 10, max: 50, adjustment: 0 };
    source.defense     ??= { physical: 0, sorcery: 0 };
    source.experience  ??= { value: 0, max: 100 };
    source.initial     ??= {};
    // Stary format lifePoints.actual → value
    if (source.lifePoints.actual !== undefined && source.lifePoints.value === undefined) {
      source.lifePoints.value = source.lifePoints.actual;
    }

    // Inicjalizacja adjustment (jednorazowe dla istniejących postaci)
    if (source.lifePoints.adjustment === undefined) {
      source.lifePoints.adjustment = 0;
    }

    // Domyślne wartości dla opcjonalnych pól
    source.flexDie ??= "d10";

    return super.migrateData(source);
  }

  /**
   * Kalkuluje wartości pochodne:
   *   - modyfikatory atrybutów, effectiveValue, isPoisonedAttributes
   *   - lifePoints.max (formuła: base_z_origin + 2×effectiveGrit + adjustment)
   *   - defense.physical (Edge+2, min 5, ±Defence/Immobilized)
   *   - defense.sorcery  (Wits+2, min 5)
   *   - stamina.max (zawsze 100)
   *
   * Przeniesione z ConanActor._prepareCharacterData().
   */
  prepareDerivedData() {
    // 1. Modyfikatory atrybutów
    const attributePenalty = this.poisoned ? (this.poisonEffects?.attributePenalty ?? 0) : 0;
    for (const [, attribute] of Object.entries(this.attributes)) {
      attribute.die ??= "d6";
      attribute.isPoisonedAttributes = attributePenalty > 0;
      attribute.effectiveValue = Math.max(1, attribute.value - attributePenalty);
      attribute.mod = attribute.effectiveValue - 4;
    }

    // 2. Stamina max zawsze 100
    this.stamina.max = 100;

    // 3. Maksimum punktów życia
    const { initial } = this;
    const grit = this.attributes.grit;
    if (initial?.lifePoints && initial?.grit && grit) {
      const originBase   = initial.lifePoints - (2 * initial.grit);
      const calculatedBase = originBase + (2 * grit.effectiveValue);
      this.lifePoints.max = calculatedBase + (this.lifePoints.adjustment || 0);
    }

    // 4. Obrona fizyczna i magiczna
    const edge = this.attributes.edge;
    const wits = this.attributes.wits;
    if (edge && wits) {
      let physicalDefense = Math.max(edge.effectiveValue + 2, 5);
      const sorceryDefense = Math.max(wits.effectiveValue + 2, 5);

      if (this.defenceActive)  physicalDefense += 2;
      if (this.immobilized)    physicalDefense = 0;

      this.defense.physical = physicalDefense;
      this.defense.sorcery  = sorceryDefense;
    }
  }
}
