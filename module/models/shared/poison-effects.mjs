/**
 * Współdzielony model danych efektów trucizny.
 * Używany przez character, minion i antagonist jako EmbeddedDataField.
 *
 * Efekty:
 *   effect1 — kara -1 do wszystkich atrybutów (opcjonalny)
 *   effect2 — kara do rzutów (stackowalny, ×multiplier)
 *   effect3 — utrata 1 LP na koniec rundy (stackowalny, ×multiplier)
 *   effect4 — blokada Staminy (tylko postacie)
 *   effect5 — wyłączony Flex Die (tylko postacie)
 */
export class PoisonEffectsModel extends foundry.abstract.DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      effect1:           new fields.BooleanField({ initial: false }),
      effect2:           new fields.BooleanField({ initial: false }),
      effect2Multiplier: new fields.NumberField({ initial: 1, min: 1, max: 5, integer: true }),
      effect3:           new fields.BooleanField({ initial: false }),
      effect3Multiplier: new fields.NumberField({ initial: 1, min: 1, max: 5, integer: true }),
      effect4:           new fields.BooleanField({ initial: false }),
      effect5:           new fields.BooleanField({ initial: false })
    };
  }

  /** Kara do atrybutów (-1 gdy effect1). */
  get attributePenalty() {
    return this.effect1 ? 1 : 0;
  }

  /** Kara do rzutów (effect2 × multiplier, 0 gdy nieaktywny). */
  get rollPenalty() {
    return this.effect2 ? this.effect2Multiplier : 0;
  }

  /** Utrata Punktów Życia na koniec rundy (effect3 × multiplier, 0 gdy nieaktywny). */
  get lifeDrain() {
    return this.effect3 ? this.effect3Multiplier : 0;
  }

  /** Czy Stamina jest zablokowana (effect4). */
  get staminaLocked() {
    return this.effect4;
  }

  /** Czy Flex Die jest wyłączony (effect5). */
  get flexDieLocked() {
    return this.effect5;
  }

  /** Czy jakikolwiek efekt trucizny jest aktywny. */
  get isAnyActive() {
    return this.effect1 || this.effect2 || this.effect3 || this.effect4 || this.effect5;
  }
}
