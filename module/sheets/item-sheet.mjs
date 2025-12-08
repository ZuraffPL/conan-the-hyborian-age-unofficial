/**
 * Extend the basic ItemSheet with ApplicationV2 and HandlebarsApplicationMixin
 */
export class ConanItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["conan", "sheet", "item"],
    position: {
      width: 490,
      height: 490
    },
    actions: {
      editImage: ConanItemSheet._onEditImage
    },
    window: {
      resizable: true
    },
    form: {
      submitOnChange: true
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/item/item-sheet.hbs"
    }
  };

  /** @override */
  tabGroups = {
    sheet: "description"
  };

  /** @override */
  _onChangeForm(formConfig, event) {
    const updateData = {};
    const field = event.target.name;
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    updateData[field] = value;
    
    const variousNote = game.i18n.localize('CONAN.Weapon.variousWeaponNote');
    const currentStipulations = this.item.system.stipulations || '';
    
    // Handle weapon type change - update range and damage defaults
    if (this.item.type === 'weapon' && field === 'system.weaponType') {
      const currentSize = this.item.system.weaponSize;
      
      if (value === 'melee') {
        // Melee weapon defaults
        updateData['system.range'] = 'touch';
        if (currentSize === 'light') updateData['system.damage'] = '1d4';
        else if (currentSize === 'medium') updateData['system.damage'] = '1d6';
        else updateData['system.damage'] = '1d6';
      } else if (value === 'thrown') {
        // Thrown weapon defaults
        updateData['system.range'] = 'close';
        if (currentSize === 'light') updateData['system.damage'] = '1d4';
        else if (currentSize === 'medium') updateData['system.damage'] = '1d6';
        else updateData['system.damage'] = '1d4';
      } else if (value === 'ranged') {
        // Ranged weapon defaults
        if (currentSize === 'light') {
          updateData['system.range'] = 'medium3';
          updateData['system.damage'] = '1d4';
        } else if (currentSize === 'medium') {
          updateData['system.range'] = 'medium3';
          updateData['system.damage'] = '1d6';
        } else {
          updateData['system.range'] = 'distant8';
          updateData['system.damage'] = '1d8';
        }
      }
      
      // Remove "various" note if changing from thrown
      if (value === 'melee' || value === 'ranged') {
        if (currentStipulations.includes(variousNote)) {
          const cleanedStipulations = currentStipulations
            .replace(variousNote, '')
            .replace(/\n\n\n+/g, '\n\n')
            .trim();
          updateData['system.stipulations'] = cleanedStipulations;
        }
      }
    }
    
    // Handle stipulations for thrown weapons based on size
    if (this.item.type === 'weapon' && 
        field === 'system.weaponSize' && 
        this.item.system.weaponType === 'thrown') {
      
      // Update damage based on size
      if (value === 'light') {
        updateData['system.damage'] = this.item.system.improvised ? '2' : '1d4';
      } else if (value === 'medium') {
        updateData['system.damage'] = '1d6';
      } else if (value === 'various') {
        updateData['system.damage'] = '1d4'; // Default for various
      }
      
      if (value === 'various') {
        // Add the note if not already present
        if (!currentStipulations.includes(variousNote)) {
          updateData['system.stipulations'] = currentStipulations ? 
            currentStipulations + '\n\n' + variousNote : 
            variousNote;
        }
      } else {
        // Remove the note if it exists
        if (currentStipulations.includes(variousNote)) {
          const cleanedStipulations = currentStipulations
            .replace(variousNote, '')
            .replace(/\n\n\n+/g, '\n\n') // Remove multiple newlines
            .trim();
          updateData['system.stipulations'] = cleanedStipulations;
        }
      }
    }
    
    // Handle weapon size change for melee weapons
    if (this.item.type === 'weapon' && 
        field === 'system.weaponSize' && 
        this.item.system.weaponType === 'melee') {
      
      const handedness = this.item.system.handedness;
      if (handedness === 'one-handed') {
        if (value === 'light') updateData['system.damage'] = '1d4';
        else if (value === 'medium') updateData['system.damage'] = '1d6';
        else if (value === 'heavy') updateData['system.damage'] = '1d6'; // Default, can be changed to 1d8
      } else if (handedness === 'two-handed') {
        if (value === 'medium') updateData['system.damage'] = '1d10';
        else if (value === 'heavy') updateData['system.damage'] = '1d12';
      }
    }
    
    // Handle weapon size change for ranged weapons
    if (this.item.type === 'weapon' && 
        field === 'system.weaponSize' && 
        this.item.system.weaponType === 'ranged') {
      
      if (value === 'light') {
        updateData['system.range'] = 'medium3';
        updateData['system.damage'] = '1d4';
      } else if (value === 'medium') {
        updateData['system.range'] = 'medium3';
        updateData['system.damage'] = '1d6';
      } else if (value === 'heavy') {
        updateData['system.range'] = 'distant8';
        updateData['system.damage'] = '1d8';
      }
    }
    
    // Handle handedness change for melee weapons
    if (this.item.type === 'weapon' && 
        field === 'system.handedness' && 
        this.item.system.weaponType === 'melee') {
      
      const size = this.item.system.weaponSize;
      if (value === 'one-handed') {
        if (size === 'light') updateData['system.damage'] = '1d4';
        else if (size === 'medium') updateData['system.damage'] = '1d6';
        else if (size === 'heavy') updateData['system.damage'] = '1d6';
        updateData['system.range'] = 'touch';
      } else if (value === 'two-handed') {
        if (size === 'medium') {
          updateData['system.damage'] = '1d10';
          updateData['system.range'] = 'close';
        } else if (size === 'heavy') {
          updateData['system.damage'] = '1d12';
          updateData['system.range'] = 'touch';
        }
      }
    }
    
    // Handle improvised checkbox change for thrown weapons
    if (this.item.type === 'weapon' && 
        field === 'system.improvised' && 
        this.item.system.weaponType === 'thrown' &&
        this.item.system.weaponSize === 'light') {
      
      if (value === true) {
        // Set damage to fixed 2 for light improvised thrown
        updateData['system.damage'] = '2';
      } else {
        // Set damage to 1d4 for light normal thrown
        updateData['system.damage'] = '1d4';
      }
    }
    
    // Update the item and re-render if critical fields changed
    const criticalFields = ['system.weaponType', 'system.handedness', 'system.weaponSize', 'system.improvised'];
    const shouldRerender = criticalFields.includes(field);
    
    this.item.update(updateData).then(() => {
      if (shouldRerender) {
        this.render(false);
      }
    });
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    
    // Add item type as a class for styling
    if (!options.classes) options.classes = [];
    if (Array.isArray(options.classes)) {
      options.classes.push(this.document.type);
    } else {
      // If classes is a string, convert to array
      options.classes = [options.classes, this.document.type];
    }
    
    // Adjust height for armor items
    if (this.document.type === 'armor') {
      if (!options.position) options.position = {};
      options.position.height = 530;
    }
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Add the item's data to context
    context.system = this.item.system;
    context.flags = this.item.flags;
    context.item = this.item;

    // Retrieve the roll data for TinyMCE editors
    context.rollData = this.item.getRollData();

    // Enrich description info for display
    const TextEditorImpl = foundry.applications.fields.HTMLField;
    if (TextEditorImpl && typeof TextEditorImpl.enrichHTML === "function") {
      context.enrichedDescription = await TextEditorImpl.enrichHTML(this.item.system.description || "", {
        secrets: this.item.isOwner,
        relativeTo: this.item,
        async: true
      });
    } else {
      // Fallback for simple HTML rendering
      context.enrichedDescription = this.item.system.description || "";
    }

    // Add config data
    context.config = CONFIG.CONAN;

    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Activate tabs
    this._activateTabs();
    
    // Auto-resize textarea for stipulations
    this._setupAutoResizeTextarea();
    
    // Handle skill type and origin mutual exclusion UI
    if (this.item.type === "skill") {
      const skillTypeSelect = this.element.querySelector('select[data-skill-type-select]');
      const originCheckbox = this.element.querySelector('input[data-origin-checkbox]');
      
      if (skillTypeSelect && originCheckbox) {
        // Set initial disabled states
        this._updateSkillFieldStates(skillTypeSelect, originCheckbox);
        
        // Add change listeners
        skillTypeSelect.addEventListener('change', () => {
          this._updateSkillFieldStates(skillTypeSelect, originCheckbox);
        });
        
        originCheckbox.addEventListener('change', () => {
          this._updateSkillFieldStates(skillTypeSelect, originCheckbox);
        });
      }
    }
    
    // Add armor type change listener for dynamic specific make options
    if (this.item.type === "armor") {
      const armorTypeSelect = this.element.querySelector('select[name="system.armorType"]');
      const specificMakeSelect = this.element.querySelector('select[name="system.specificMake"]');
      
      if (armorTypeSelect && specificMakeSelect) {
        armorTypeSelect.addEventListener('change', (event) => {
          this._updateSpecificMakeOptions(event.target.value, specificMakeSelect);
          this._updateArmorDefaults(event.target.value);
        });
      }
    }
  }

  /**
   * Activate tab navigation
   */
  _activateTabs() {
    const tabs = this.element.querySelectorAll('.sheet-tabs .item');
    const tabContents = this.element.querySelectorAll('.tab');
    
    if (tabs.length === 0) return;
    
    // Show first tab by default
    if (tabContents.length > 0) {
      tabContents[0].classList.add('active');
      tabs[0].classList.add('active');
    }
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        const targetTab = tab.dataset.tab;
        
        // Remove active from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        // Add active to clicked tab
        tab.classList.add('active');
        const targetContent = this.element.querySelector(`.tab[data-tab="${targetTab}"]`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  /**
   * Setup auto-resize for textarea elements
   */
  _setupAutoResizeTextarea() {
    const textareas = this.element.querySelectorAll('textarea[name="system.stipulations"], textarea[name="system.effect"], textarea[name="system.description"]');
    
    const autoResize = (textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = (textarea.scrollHeight) + 'px';
    };
    
    textareas.forEach(textarea => {
      // Initial resize
      autoResize(textarea);
      
      // Resize on input
      textarea.addEventListener('input', () => autoResize(textarea));
      
      // Resize on focus (in case content was updated programmatically)
      textarea.addEventListener('focus', () => autoResize(textarea));
    });
  }

  /**
   * Update specific make options based on armor type
   */
  _updateSpecificMakeOptions(armorType, selectElement) {
    const makes = {
      light: [
        { value: 'leather', label: game.i18n.localize('CONAN.Armor.makes.leather') },
        { value: 'hide', label: game.i18n.localize('CONAN.Armor.makes.hide') },
        { value: 'bones', label: game.i18n.localize('CONAN.Armor.makes.bones') }
      ],
      medium: [
        { value: 'breastplate', label: game.i18n.localize('CONAN.Armor.makes.breastplate') },
        { value: 'cuirass', label: game.i18n.localize('CONAN.Armor.makes.cuirass') },
        { value: 'hauberk', label: game.i18n.localize('CONAN.Armor.makes.hauberk') }
      ],
      heavy: [
        { value: 'fullPlate', label: game.i18n.localize('CONAN.Armor.makes.fullPlate') },
        { value: 'knightArmor', label: game.i18n.localize('CONAN.Armor.makes.knightArmor') }
      ],
      shield: [
        { value: 'wood', label: game.i18n.localize('CONAN.Armor.makes.wood') },
        { value: 'metal', label: game.i18n.localize('CONAN.Armor.makes.metal') },
        { value: 'makeshift', label: game.i18n.localize('CONAN.Armor.makes.makeshift') }
      ]
    };

    const options = makes[armorType] || [];
    selectElement.innerHTML = '';
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      selectElement.appendChild(option);
    });

    // Set first option as selected and update item
    if (options.length > 0) {
      selectElement.value = options[0].value;
      this.item.update({ 'system.specificMake': options[0].value });
    }
  }

  /**
   * Update armor rating and encumbrance based on armor type
   */
  _updateArmorDefaults(armorType) {
    const defaults = {
      light: { armorRating: 3, encumbrance: 1 },
      medium: { armorRating: 5, encumbrance: 3 },
      heavy: { armorRating: 8, encumbrance: 5 },
      shield: { armorRating: 0, encumbrance: 3 }
    };

    const values = defaults[armorType];
    if (values) {
      this.item.update({
        'system.armorRating': values.armorRating,
        'system.encumbrance': values.encumbrance
      });
    }
  }

  /**
   * Actions
   */
  static async _onEditImage(event, target) {
    const fp = new FilePicker({
      type: "image",
      callback: path => {
        this.item.update({ img: path });
      }
    });
    return fp.browse();
  }
}
