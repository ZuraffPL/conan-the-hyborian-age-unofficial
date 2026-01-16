/**
 * Damage Roll Dialog
 */
export class DamageDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  
  static DEFAULT_OPTIONS = {
    id: "damage-dialog",
    classes: ["conan", "dialog", "damage"],
    tag: "dialog",
    window: {
      title: "CONAN.Damage.title",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 500,
      height: "auto"
    },
    actions: {
      roll: DamageDialog._onRoll,
      cancel: DamageDialog._onCancel
    },
    form: {
      handler: DamageDialog._onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/damage-dialog.hbs"
    }
  };

  constructor(actor, options = {}) {
    super(options);
    // Always use base actor for linked tokens to ensure equipped weapons are up to date
    this.actor = actor.prototypeToken?.actorLink ? game.actors.get(actor.id) : actor;
    this.modifier = 0;
    this.resolve = null;
    this.allowedDamageTypes = options.allowedDamageTypes || ['melee', 'thrown', 'ranged', 'sorcery'];
  }

  static async prompt(actor, options = {}) {
    const dialog = new DamageDialog(actor, options);
    return new Promise((resolve) => {
      dialog.resolve = resolve;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.title = game.i18n.localize("CONAN.Damage.title");
    context.rollLabel = game.i18n.localize("CONAN.Damage.roll");
    context.cancelLabel = game.i18n.localize("CONAN.Common.cancel");
    context.modifier = this.modifier;
    context.sorceryDamageType = "wits-die";
    context.sorceryCustomDie = "d6";
    context.sorceryFixedValue = 1;
    context.allowedDamageTypes = this.allowedDamageTypes;
    // Get equipped melee weapons
    const equippedMeleeWeapons = this.actor.items.filter(item => 
      item.type === "weapon" && 
      item.system.equipped && 
      item.system.weaponType === "melee"
    );
    // Get equipped thrown weapons
    const equippedThrownWeapons = this.actor.items.filter(item => 
      item.type === "weapon" && 
      item.system.equipped && 
      item.system.weaponType === "thrown"
    );
    // Get equipped ranged weapons (support both "ranged" and legacy "range")
    const equippedRangedWeapons = this.actor.items.filter(item => 
      item.type === "weapon" && 
      item.system.equipped && 
      (item.system.weaponType === "ranged" || item.system.weaponType === "range")
    );
    context.equippedMeleeWeapons = equippedMeleeWeapons;
    context.equippedThrownWeapons = equippedThrownWeapons;
    context.equippedRangedWeapons = equippedRangedWeapons;
    context.isPoisoned = this.actor.system.poisoned && this.actor.system.poisonEffects?.effect2;
    context.poisonMultiplier = this.actor.system.poisonEffects?.effect2Multiplier || 1;
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Attach modifier slider listener
    const modifierSlider = this.element.querySelector('input[name="modifier"]');
    const modifierLabel = this.element.querySelector('.modifier-value-label');
    
    // Helper to update only the visible .modifier-display
    const updateVisibleModifierDisplay = (value) => {
      const allParams = this.element.querySelectorAll('.damage-params');
      allParams.forEach(params => {
        if (params.style.display === 'block') {
          const display = params.querySelector('.modifier-display');
          if (display) {
            const displayValue = value >= 0 ? `+${value}` : value;
            display.textContent = displayValue;
          }
        }
      });
    };

    if (modifierSlider && modifierLabel) {
      modifierSlider.addEventListener('input', (event) => {
        const value = parseInt(event.target.value);
        this.modifier = value;
        const displayValue = value >= 0 ? `+${value}` : value;
        modifierLabel.textContent = displayValue;
        updateVisibleModifierDisplay(value);
      });
      // Set initial value
      const displayValue = this.modifier >= 0 ? `+${this.modifier}` : this.modifier;
      modifierLabel.textContent = displayValue;
      updateVisibleModifierDisplay(this.modifier);
    }
    
    // Attach damage type radio button listeners
    const damageTypeRadios = this.element.querySelectorAll('input[name="damageType"]');
    damageTypeRadios.forEach(radio => {
      radio.addEventListener('change', (event) => {
        this._onDamageTypeChange(event.target.value);
        // Po zmianie typu obrażeń zaktualizuj widoczny .modifier-display
        updateVisibleModifierDisplay(this.modifier);
      });
    });

    // Show initial damage type parameters (melee is default)
    this._onDamageTypeChange(this.selectedDamageType || 'melee');
    updateVisibleModifierDisplay(this.modifier);
    
    // Weapon selection change listener (melee)
    const weaponSelect = this.element.querySelector('select[name="weaponId"]');
    if (weaponSelect) {
      weaponSelect.addEventListener('change', (event) => {
        this.selectedWeaponId = event.target.value;
      });
    }

    // Weapon selection change listener (ranged)
    const rangedWeaponSelect = this.element.querySelector('select[name="rangedWeaponId"]');
    if (rangedWeaponSelect) {
      rangedWeaponSelect.addEventListener('change', (event) => {
        const selectedId = event.target.value;
        // Znajdź wybraną broń dystansową
        const weapon = context.equippedRangedWeapons.find(w => w._id === selectedId);
        const valueBox = this.element.querySelector('.ranged-params .param-item .param-value .value-display');
        if (weapon && valueBox) {
          let dmg = weapon.system.damage?.dice || weapon.system.damage || '';
          const mod = weapon.system.damageModifier;
          if (mod && !isNaN(mod) && Number(mod) !== 0) {
            dmg += (mod > 0 ? `+${mod}` : mod);
          }
          valueBox.textContent = dmg;
        }
      });
    }

    // --- SORCERY DAMAGE TYPE DYNAMIC FIELDS ---
    const sorceryTypeSelect = this.element.querySelector('select[name="sorceryDamageType"]');
    const dieDisplay = this.element.querySelector('.sorcery-die-display');
    const actor = this.actor;
    function updateSorceryFields() {
      if (!sorceryTypeSelect || !dieDisplay) return;
      const type = sorceryTypeSelect.value;
      dieDisplay.innerHTML = '';
      if (type === 'wits-die') {
        // Kość sprytu z karty postaci
        const span = document.createElement('span');
        span.className = 'value-display value-display-witsdie';
        span.textContent = actor.system?.attributes?.wits?.die || 'd6';
        dieDisplay.appendChild(span);
      } else if (type === 'custom-die') {
        // Selektor kości d4-d12
        const select = document.createElement('select');
        select.name = 'sorceryCustomDie';
        select.className = 'sorcery-die-select';
        select.style.width = 'auto';
        select.style.minWidth = '60px';
        ['d4','d6','d8','d10','d12'].forEach(val => {
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = val;
          select.appendChild(opt);
        });
        dieDisplay.appendChild(select);
      } else if (type === 'fixed') {
        // Pole liczby
        const input = document.createElement('input');
        input.type = 'number';
        input.name = 'sorceryFixedValue';
        input.value = 1;
        input.min = 1;
        input.max = 99;
        input.className = 'sorcery-fixed-input';
        input.style.width = '70px';
        input.style.textAlign = 'center';
        dieDisplay.appendChild(input);
      }
    }
    if (sorceryTypeSelect && dieDisplay) {
      sorceryTypeSelect.addEventListener('change', updateSorceryFields);
      updateSorceryFields();
    }
  }
  
  _onDamageTypeChange(damageType) {
    // Hide all damage parameter sections
    const allParams = this.element.querySelectorAll('.damage-params');
    allParams.forEach(params => {
      params.style.display = 'none';
    });

    // Show the selected damage type parameters
    const selectedParams = this.element.querySelector(`.damage-params[data-damage-type="${damageType}"]`);
    if (selectedParams) {
      selectedParams.style.display = 'block';
      // Aktualizuj .modifier-display w tej sekcji
      const modifierDisplay = selectedParams.querySelector('.modifier-display');
      if (modifierDisplay) {
        const value = this.modifier || 0;
        const displayValue = value >= 0 ? `+${value}` : value;
        modifierDisplay.textContent = displayValue;
      }
    }
  }

  static async _onSubmit(event, form, formData) {
    const modifier = parseInt(formData.object.modifier) || 0;
    const damageType = formData.object.damageType || 'melee';
    let weaponId = null;
    let sorceryCustomModifier = 0;
    let sorceryDamageType = undefined;
    let sorceryCustomDie = undefined;
    let sorceryFixedValue = undefined;
    if (damageType === 'melee') {
      weaponId = formData.object.weaponId;
    } else if (damageType === 'thrown') {
      weaponId = formData.object.thrownWeaponId;
    } else if (damageType === 'ranged') {
      weaponId = formData.object.rangedWeaponId;
    } else if (damageType === 'sorcery') {
      sorceryCustomModifier = parseInt(formData.object.sorceryCustomModifier) || 0;
      sorceryDamageType = formData.object.sorceryDamageType;
      if (sorceryDamageType === 'custom-die') {
        sorceryCustomDie = formData.object.sorceryCustomDie;
      } else if (sorceryDamageType === 'fixed') {
        sorceryFixedValue = parseInt(formData.object.sorceryFixedValue) || 0;
      }
    }
    if (this.resolve) {
      this.resolve({ 
        modifier, 
        damageType,
        weaponId: damageType === 'sorcery' ? null : weaponId,
        sorceryCustomModifier: damageType === 'sorcery' ? sorceryCustomModifier : undefined,
        sorceryDamageType: damageType === 'sorcery' ? sorceryDamageType : undefined,
        sorceryCustomDie: damageType === 'sorcery' ? sorceryCustomDie : undefined,
        sorceryFixedValue: damageType === 'sorcery' ? sorceryFixedValue : undefined
      });
    }
    this.close();
  }

  static async _onRoll(event, target) {
    console.log("=== DAMAGE DIALOG VERSION 2024-11-13-15:30 ===");
    const form = this.element.querySelector("form");
    if (form) {
      const formData = new foundry.applications.ux.FormDataExtended(form);
      const modifier = parseInt(formData.object.modifier) || 0;
      const damageType = formData.object.damageType || 'melee';
      let weaponId = null;
      let sorceryCustomModifier = 0;
      let sorceryDamageType = undefined;
      let sorceryCustomDie = undefined;
      let sorceryFixedValue = undefined;
      if (damageType === 'melee') {
        weaponId = formData.object.weaponId; // Can be "unarmed"
      } else if (damageType === 'thrown') {
        weaponId = form.querySelector('input[name="thrownWeaponId"]')?.value;
      } else if (damageType === 'ranged') {
        weaponId = form.querySelector('input[name="rangedWeaponId"]')?.value;
      } else if (damageType === 'sorcery') {
        sorceryCustomModifier = parseInt(formData.object.sorceryCustomModifier) || 0;
        sorceryDamageType = formData.object.sorceryDamageType;
        if (sorceryDamageType === 'custom-die') {
          sorceryCustomDie = formData.object.sorceryCustomDie;
        } else if (sorceryDamageType === 'fixed') {
          sorceryFixedValue = parseInt(formData.object.sorceryFixedValue) || 0;
        }
      }
      console.log("DEBUG damage-dialog _onRoll:");
      console.log("  damageType:", damageType);
      console.log("  FINAL weaponId:", weaponId);
      if (this.resolve) {
        this.resolve({ 
          modifier,
          damageType,
          weaponId: damageType === 'sorcery' ? null : weaponId,
          sorceryCustomModifier: damageType === 'sorcery' ? sorceryCustomModifier : undefined,
          sorceryDamageType: damageType === 'sorcery' ? sorceryDamageType : undefined,
          sorceryCustomDie: damageType === 'sorcery' ? sorceryCustomDie : undefined,
          sorceryFixedValue: damageType === 'sorcery' ? sorceryFixedValue : undefined
        });
      }
      this.close();
    }
  }

  static async _onCancel(event, target) {
    if (this.resolve) {
      this.resolve(null);
    }
    
    this.close();
  }

  async close(options = {}) {
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
    
    return super.close(options);
  }
}
