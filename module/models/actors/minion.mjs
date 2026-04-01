/**
 * Model danych dla stronników (minion).
 * Zawiera pełny schemat pól przechowywanych, w tym pola nieudokumentowane
 * w template.json: defenceActive, immobilized, defense.basePhysical.
 *
 * prepareDerivedData() przeniesiona z ConanActor._prepareNpcData().
 */
import { PoisonEffectsModel } from "../shared/index.mjs";

export class MinionModel extends foundry.abstract.TypeDataModel {

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

      // Pola własne miniona
      description:  new fields.StringField({ initial: "" }),
      creatureType: new fields.StringField({ initial: "human" }),

      attributes: new fields.SchemaField({
        might: attributeSchema(),
        edge:  attributeSchema(),
        grit:  attributeSchema(),
        wits:  attributeSchema()
      }),

      defense: new fields.SchemaField({
        physical:     new fields.NumberField({ required: true, initial: 5, min: 0, integer: true }),
        sorcery:      new fields.NumberField({ required: true, initial: 5, min: 0, integer: true }),
        // basePhysical: przechowuje niemodalną obronę przed efektami Defence/Immobilized
        basePhysical: new fields.NumberField({ required: false, initial: null, nullable: true, integer: true })
      }),

      armor:     new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
      threshold: new fields.NumberField({ required: true, initial: 5, min: 0, integer: true }),
      wounded:   new fields.BooleanField({ initial: false }),
      defeated:  new fields.BooleanField({ initial: false }),

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
      // Przy wystawieniu tokena na scenę Threat Engine losuje tier:
      //   0 = słaby (50%)  — wartości bazowe z karty
      //   1 = silny (30%)  — wartości +1
      //   2 = elitarny (20%) — wartości +2
      threatEngineEnabled: new fields.BooleanField({ initial: true }),

      // Tier przypisany przez Threat Engine (0=słaby, 1=silny, 2=elitarny).
      // null = Threat Engine jeszcze nie był uruchomiony dla tego tokena.
      threatTier: new fields.NumberField({ required: false, initial: null, nullable: true, integer: true })
    };
  }

  /**
   * Oblicza pochodne wartości (mod, effectiveValue, obrona) przy każdym renderze.
   * Przeniesione z ConanActor._prepareNpcData() — minion branch.
   * Wartości są tranzytywne: nie są zapisywane w bazie danych.
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
