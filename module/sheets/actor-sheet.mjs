/**
 * Extend the basic ActorSheet with ApplicationV2 and HandlebarsApplicationMixin
 */

import { rollAttribute } from "../helpers/roll-mechanics.mjs";
import { rollMeleeDamage } from "../helpers/roll-mechanics.mjs";
import { rollThrownDamage } from "../helpers/roll-mechanics.mjs";
import { rollRangedDamage } from "../helpers/roll-mechanics.mjs";
import { CharacterCreationDialog } from "../helpers/character-creation-dialog.mjs";
import { StartingSkillsDialog } from "../helpers/starting-skills-dialog.mjs";
import { SpellcastingDialog } from "../helpers/spellcasting-dialog.mjs";
import { AttackDialog } from "../helpers/attack-dialog.mjs";
import { DamageDialog } from "../helpers/damage-dialog.mjs";
import { PoisonedDialog } from "../helpers/poisoned-dialog.mjs";
import { StaminaSpendDialog } from "../helpers/stamina-spend-dialog.mjs";
import { ConanSocket } from "../helpers/socket.mjs";

export class ConanActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["conan", "sheet", "actor"],
    position: {
      width: 840,
      height: 1000
    },
    actions: {
      editImage: ConanActorSheet._onEditImage,
      createCharacter: ConanActorSheet._onCreateCharacter,
      rollAttribute: ConanActorSheet._onRollAttribute,
      rollInitiative: ConanActorSheet._onRollInitiative,
      rollAttack: ConanActorSheet._onRollAttack,
      rollDamage: ConanActorSheet._onRollDamage,
      castSpell: ConanActorSheet._onCastSpell,
      toggleDefence: ConanActorSheet._onToggleDefence,
      toggleImmobilized: ConanActorSheet._onToggleImmobilized,
      togglePoisoned: ConanActorSheet._onTogglePoisoned,
      spendStamina: ConanActorSheet._onSpendStamina,
      addStartingSkill: ConanActorSheet._onAddStartingSkill,
      editStartingSkill: ConanActorSheet._onEditStartingSkill,
      deleteStartingSkill: ConanActorSheet._onDeleteStartingSkill,
      createItem: ConanActorSheet._onItemCreate,
      editItem: ConanActorSheet._onItemEdit,
      deleteItem: ConanActorSheet._onItemDelete,
      rollItem: ConanActorSheet._onItemRoll,
      toggleEquipped: ConanActorSheet._onToggleEquipped
    },
    window: {
      resizable: true,
      minimizable: true,
      maximizable: true
    },
    form: {
      submitOnChange: true
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/actor/actor-character-sheet.hbs"
    }
  };

  /** @override */
  tabGroups = {
    primary: "skills"
  };

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Activate tabs manually
    this._activateTabs();
    
    // Setup auto-resize textareas
    this._setupAutoResizeTextarea();
    
    // Attach change listeners to all form inputs for auto-save
    const form = this.element.querySelector('form');
    if (form) {
      form.addEventListener('change', async (event) => {
        const target = event.target;
        if (!target.name) return;
        
        // Get the field name and value
        const fieldName = target.name;
        let fieldValue = target.value;
        
        // Block stamina changes if locked due to poison effect 4
        if (fieldName === "system.stamina.value" && 
            this.actor.system.poisoned && 
            this.actor.system.poisonEffects?.effect4) {
          ui.notifications.error(game.i18n.localize("CONAN.Poisoned.staminaLocked"));
          // Revert to current value
          target.value = this.actor.system.stamina?.value || 0;
          return;
        }
        
        // Parse value based on data type
        const dtype = target.dataset.dtype;
        if (dtype === "Number") {
          fieldValue = parseInt(fieldValue) || 0;
        } else if (dtype === "Boolean") {
          fieldValue = target.checked;
        }
        
        // Update the actor
        const updateData = {};
        updateData[fieldName] = fieldValue;
        
        // Special handling for origin change - set initial life points
        if (fieldName === "system.origin" && fieldValue) {
          const lifePointsMap = {
            "hills": { actual: 30, max: 30 },
            "streets": { actual: 22, max: 22 },
            "steppes": { actual: 26, max: 26 },
            "north": { actual: 32, max: 32 },
            "wilds": { actual: 30, max: 30 },
            "civilized": { actual: 22, max: 22 },
            "unknown": { actual: 26, max: 26 },
            "jhebbal": { actual: 28, max: 28 },
            "acheron": { actual: 20, max: 20 },
            "demon": { actual: 26, max: 26 }
          };
          
          if (lifePointsMap[fieldValue]) {
            updateData["system.lifePoints"] = lifePointsMap[fieldValue];
          }
        }
        
        // Special handling for Grit change - update max life points
        if (fieldName === "system.attributes.grit.value" && this.actor.system.origin && this.actor.system.characterCreated) {
          const baseLifePointsMap = {
            "hills": 30,
            "streets": 22,
            "steppes": 26,
            "north": 32,
            "wilds": 30,
            "civilized": 22,
            "unknown": 26,
            "jhebbal": 28,
            "acheron": 20,
            "demon": 26
          };
          
          const baseLP = baseLifePointsMap[this.actor.system.origin];
          if (baseLP) {
            const newMaxLP = baseLP + (2 * fieldValue);
            updateData["system.lifePoints.max"] = newMaxLP;
            
            // If current actual is higher than new max, cap it
            if (this.actor.system.lifePoints.actual > newMaxLP) {
              updateData["system.lifePoints.actual"] = newMaxLP;
            }
          }
        }
        
        // Special handling for Edge change - update physical defense
        if (fieldName === "system.attributes.edge.value" && this.actor.system.characterCreated) {
          const newPhysicalDefense = Math.max(fieldValue + 2, 5);
          updateData["system.defense.physical"] = newPhysicalDefense;
        }
        
        // Special handling for Wits change - update sorcery defense
        if (fieldName === "system.attributes.wits.value" && this.actor.system.characterCreated) {
          const newSorceryDefense = Math.max(fieldValue + 2, 5);
          updateData["system.defense.sorcery"] = newSorceryDefense;
        }
        
        // Special handling for actual life points - cannot exceed max
        if (fieldName === "system.lifePoints.actual") {
          const maxLP = this.actor.system.lifePoints.max;
          if (fieldValue > maxLP) {
            updateData["system.lifePoints.actual"] = maxLP;
            ui.notifications.warn(`Aktualne punkty życia nie mogą przekroczyć maksymalnych (${maxLP})`);
          }
        }
        
        // Special handling for max life points - adjust actual if needed
        if (fieldName === "system.lifePoints.max") {
          const actualLP = this.actor.system.lifePoints.actual;
          if (actualLP > fieldValue) {
            updateData["system.lifePoints.actual"] = fieldValue;
          }
        }
        
        await this.baseActor.update(updateData);
        
        // Synchronize changes to all clients
        ConanSocket.emit("syncActorUpdate", {
          actorId: this.baseActor.id,
          updateData: updateData
        });
      });
    }
  }

  /**
   * Override drop handler to add custom validation for skills and spells
   * @override
   */
  async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;

    // Custom logic for skills
    if (item.type === 'skill') {
      // Get the drop zone that was targeted
      const dropZone = event.target.closest('[data-drop-zone]');
      const dropZoneType = dropZone?.dataset.dropZone;

      // Validate skill type matches drop zone
      const isOriginSkill = item.system.skillType === 'origin' || item.system.skillType === 'starting';
      
      if (dropZoneType === 'origin-skill' && !isOriginSkill) {
        ui.notifications.warn(game.i18n.localize("CONAN.Warnings.onlyOriginSkillsAllowed"));
        return false;
      }
      
      if (dropZoneType === 'learned-skill' && isOriginSkill) {
        ui.notifications.warn(game.i18n.localize("CONAN.Warnings.onlyLearnedSkillsAllowed"));
        return false;
      }

      // Check if skill already exists
      const existing = this.baseActor.items.find(i => i.id === item.id || i.name === item.name);
      if (existing) {
        ui.notifications.warn(game.i18n.format("CONAN.Warnings.alreadyHave", { name: item.name }));
        return false;
      }

      // Check XP cost (only origin skills are free)
      const cost = item.system.skillType === 'origin' ? 0 : (parseInt(item.system.xpCost) || 0);
      const availableXP = this.baseActor.system.experience?.value || 0;

      if (cost > availableXP) {
        ui.notifications.error(game.i18n.format("CONAN.LearnedSkills.notEnoughXP", {
          cost: cost,
          available: availableXP
        }));
        return false;
      }

      // Create the item on the actor
      const itemData = item.toObject();
      const createdItems = await this.baseActor.createEmbeddedDocuments('Item', [itemData]);
      
      // Store the initial cost paid for this skill (for correct refund on delete)
      if (createdItems && createdItems[0]) {
        await createdItems[0].setFlag('conan-the-hyborian-age', 'initialCost', cost);
      }

      // Deduct XP cost (manual handling because auto-deduct is disabled for skills in actor.mjs)
      if (cost > 0) {
        const newXP = availableXP - cost;
        await this.baseActor.update({ "system.experience.value": newXP });
      }

      ui.notifications.info(game.i18n.localize("CONAN.LearnedSkills.skillAdded"));
      return false; // Prevent default drop handling
    }

    // Custom logic for spells
    if (item.type === 'spell') {
      // Check if spell already exists
      const existing = this.baseActor.items.find(i => i.id === item.id || i.name === item.name);
      if (existing) {
        ui.notifications.warn(game.i18n.format("CONAN.Warnings.alreadyHave", { name: item.name }));
        return false;
      }

      // Check XP cost
      const cost = parseInt(item.system.xpCost) || 0;
      const availableXP = this.baseActor.system.experience?.value || 0;

      if (cost > availableXP) {
        ui.notifications.error(game.i18n.localize('CONAN.Warnings.notEnoughXPForSpell'));
        return false;
      }

      // Create the item on the actor
      const itemData = item.toObject();
      const createdItems = await this.baseActor.createEmbeddedDocuments('Item', [itemData]);
      
      // Store the initial cost paid for this spell (for correct refund on delete)
      if (createdItems && createdItems[0]) {
        await createdItems[0].setFlag('conan-the-hyborian-age', 'initialCost', cost);
      }

      // Deduct XP cost
      if (cost > 0) {
        const newXP = availableXP - cost;
        await this.baseActor.update({ "system.experience.value": newXP });
      }

      ui.notifications.info(game.i18n.localize("CONAN.LearnedSkills.skillAdded")); // Reuse same message
      return false; // Prevent default drop handling
    }

    // Custom logic for weapons and armor - always create a copy to avoid shared equipped state
    if (item.type === 'weapon' || item.type === 'armor') {
      // If the item is from the same actor, allow default reordering behavior
      if (item.parent?.id === this.baseActor.id) {
        return super._onDropItem(event, data);
      }

      // Check if item with same name already exists
      const existing = this.baseActor.items.find(i => 
        i.name === item.name && 
        i.type === item.type
      );
      
      if (existing) {
        ui.notifications.warn(game.i18n.format("CONAN.Warnings.alreadyHave", { name: item.name }));
        return false;
      }

      // Create a new copy of the item on the actor (not a reference/link)
      const itemData = item.toObject();
      
      // Ensure equipped state is reset for the new copy
      if (itemData.system.equipped === undefined) {
        itemData.system.equipped = false;
      } else {
        // Reset equipped to false when copying from another source
        itemData.system.equipped = false;
      }
      
      await this.baseActor.createEmbeddedDocuments('Item', [itemData]);
      
      ui.notifications.info(game.i18n.format("CONAN.Notifications.itemAdded", { name: item.name }));
      return false; // Prevent default drop handling
    }

    // For other items, use default behavior
    return super._onDropItem(event, data);
  }

  /**
   * Setup auto-resize textareas
   */
  _setupAutoResizeTextarea() {
    const textareas = this.element.querySelectorAll('textarea.auto-resize');
    
    textareas.forEach(textarea => {
      // Function to adjust height
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      };
      
      // Adjust on input
      textarea.addEventListener('input', adjustHeight);
      
      // Initial adjustment
      adjustHeight();
    });
  }

  /**
   * Activate tab navigation
   */
  _activateTabs() {
    const nav = this.element.querySelector('.sheet-tabs');
    if (!nav) return;

    const tabs = nav.querySelectorAll('.item');
    const contents = this.element.querySelectorAll('.tab');

    // Restore active tab from saved state
    const activeTab = this.tabGroups.primary || 'skills';
    
    // First remove all active classes
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    
    // Then set the active tab
    const activeTabElement = nav.querySelector(`[data-tab="${activeTab}"]`);
    const activeContent = this.element.querySelector(`.tab[data-tab="${activeTab}"]`);
    
    if (activeTabElement) activeTabElement.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    // Add click listeners
    tabs.forEach(tab => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        const targetTab = tab.dataset.tab;
        
        // Remove active from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // Add active to clicked tab and corresponding content
        tab.classList.add('active');
        const targetContent = this.element.querySelector(`.tab[data-tab="${targetTab}"]`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
        
        // Update tabGroups state
        this.tabGroups.primary = targetTab;
      });
    });
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    // Determine base actor for synchronization
    this.isTokenActor = this.actor.prototypeToken?.actorLink === false;
    if (this.isTokenActor) {
      this.baseActor = game.actors.find(a => a.name === this.actor.name);
    } else {
      this.baseActor = this.actor;
    }
    
    // Add the actor reference to context
    context.actor = this.baseActor;
    
    // Add the actor's data to context
    context.system = this.baseActor.system;
    context.flags = this.baseActor.flags;

    // Add roll data for convenience
    context.rollData = this.baseActor.getRollData();
    
    // Count active poison effects
    if (context.system.poisoned && context.system.poisonEffects) {
      context.activePoisonEffects = [
        context.system.poisonEffects.effect1,
        context.system.poisonEffects.effect2,
        context.system.poisonEffects.effect3,
        context.system.poisonEffects.effect4,
        context.system.poisonEffects.effect5
      ].filter(Boolean).length;
    } else {
      context.activePoisonEffects = 0;
    }

    // Prepare character data and items
    if (this.actor.type === "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
      this._prepareValueComparisons(context);
    }

    // Prepare tabs
    context.tabs = this._getTabs();

    return context;
  }

  /**
   * Get tab configuration
   */
  _getTabs() {
    const tabs = {
      skills: {
        id: "skills",
        group: "primary",
        label: "CONAN.CharacterSheet.skills",
        active: this.tabGroups.primary === "skills"
      },
      sorcery: {
        id: "sorcery",
        group: "primary",
        label: "CONAN.CharacterSheet.sorcery",
        active: this.tabGroups.primary === "sorcery"
      },
      notes: {
        id: "notes",
        group: "primary",
        label: "CONAN.CharacterSheet.notes",
        active: this.tabGroups.primary === "notes"
      }
    };

    return Object.values(tabs);
  }

  /**
   * Organize and classify Items for Character sheets
   */
  _prepareCharacterData(context) {
    // Handle attribute modifiers
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = game.i18n.localize(`CONAN.Attributes.${k}.label`) || k;
      v.abbr = game.i18n.localize(`CONAN.Attributes.${k}.abbr`) || k;
    }
    
    // Calculate total armor rating and encumbrance from equipped armor
    let totalAR = 0;
    let totalEncumbrance = 0;
    
    for (let item of this.baseActor.items) {
      if (item.type === "armor" && item.system.equipped) {
        totalAR += item.system.armorRating || 0;
        totalEncumbrance += item.system.encumbrance || 0;
      }
    }
    
    context.totalAR = totalAR;
    context.totalEncumbrance = totalEncumbrance;
    
    // Check if overencumbered (encumbrance > Might value)
    const mightValue = context.system.attributes.might?.value || 1;
    context.isOverencumbered = totalEncumbrance > mightValue;
    
    // Check magic restrictions based on origin
    const origin = context.system.origin;
    const magicRestrictions = CONFIG.CONAN.magicRestrictions[origin];
    
    context.canUseMagic = magicRestrictions?.canUseMagic || false;
    context.maxDisciplines = magicRestrictions?.maxDisciplines || 0;
    context.allowedDisciplines = magicRestrictions?.allowedDisciplines || [];
    
    // Count unique disciplines already learned
    const learnedDisciplines = new Set();
    for (let item of this.baseActor.items) {
      if (item.type === "spell" && item.system.discipline) {
        learnedDisciplines.add(item.system.discipline);
      }
    }
    context.learnedDisciplinesCount = learnedDisciplines.size;
  }

  /**
   * Organize and classify Items for all sheets
   */
  _prepareItems(context) {
    // Initialize containers
    const weapons = [];
    const armor = [];
    const originSkills = [];
    const learnedSkills = [];
    const spells = [];

    // Iterate through items, allocating to containers
    for (let i of this.baseActor.items) {
      const itemData = i.toObject();
      itemData.img = itemData.img || Item.DEFAULT_ICON;
      
      // Append to appropriate array
      if (itemData.type === "weapon") {
        weapons.push(itemData);
      } else if (itemData.type === "armor") {
        armor.push(itemData);
      } else if (itemData.type === "skill") {
        // Separate origin/starting skills from learned skills
        if (itemData.system.skillType === 'origin' || itemData.system.skillType === 'starting') {
          originSkills.push(itemData);
        } else {
          learnedSkills.push(itemData);
        }
      } else if (itemData.type === "spell") {
        spells.push(itemData);
      }
    }

    // Assign and return
    context.weapons = weapons;
    context.armor = armor;
    context.originSkills = originSkills;
    context.learnedSkills = learnedSkills;
    context.spells = spells;
  }

  /**
   * Prepare value comparisons for visual highlighting
   */
  _prepareValueComparisons(context) {
    const initial = this.baseActor.system.initial || {};
    const current = this.baseActor.system;
    
    // Only compare if character was created
    if (!current.characterCreated) {
      context.valueChanges = {};
      return;
    }
    
    context.valueChanges = {
      // Attributes
      might: this._compareValue(current.attributes.might.value, initial.might),
      edge: this._compareValue(current.attributes.edge.value, initial.edge),
      grit: this._compareValue(current.attributes.grit.value, initial.grit),
      wits: this._compareValue(current.attributes.wits.value, initial.wits),
      
      // Life Points
      lifePointsMax: this._compareValue(current.lifePoints.max, initial.lifePoints),
      
      // Stamina
      stamina: this._compareValue(current.stamina.value, initial.stamina),
      
      // Defense
      physicalDefense: this._compareValue(current.defense.physical, initial.physicalDefense),
      sorceryDefense: this._compareValue(current.defense.sorcery, initial.sorceryDefense),
      
      // Experience
      experience: this._compareValue(current.experience.value, initial.experience)
    };
  }

  /**
   * Compare a current value with initial value and return CSS class
   */
  _compareValue(current, initial) {
    if (initial === undefined) return '';
    if (current > initial) return 'value-increased';
    if (current < initial) return 'value-decreased';
    return '';
  }

  /**
   * Actions
   */
  static async _onCreateCharacter(event, target) {
    await CharacterCreationDialog.prompt(this.baseActor);
  }

  static async _onEditImage(event, target) {
    const fp = new foundry.applications.apps.FilePicker({
      type: "image",
      callback: path => {
        this.baseActor.update({ img: path });
      }
    });
    return fp.render(true);
  }

  static async _onRollAttribute(event, target) {
    const attribute = target.dataset.attribute;
    await rollAttribute(this.baseActor, attribute);
  }

  static async _onRollInitiative(event, target) {
    const { rollInitiative } = await import("../helpers/roll-mechanics.mjs");
    
    // Try to find the combatant for this actor/token
    let combatant = null;
    if (game.combat) {
      // For token actors, find by tokenId; for linked actors, find by actorId
      if (this.actor.token) {
        combatant = game.combat.combatants.find(c => c.tokenId === this.actor.token.id);
      } else {
        combatant = game.combat.combatants.find(c => c.actorId === this.baseActor.id);
      }
    }
    
    await rollInitiative(this.baseActor, combatant);
  }

  static async _onRollAttack(event, target) {
    await AttackDialog.prompt(this.baseActor);
  }

  static async _onRollDamage(event, target) {
    const result = await DamageDialog.prompt(this.baseActor);
    if (!result) return; // User cancelled
    const { modifier, damageType, weaponId, sorceryCustomModifier, sorceryDamageType, sorceryCustomDie } = result;
    // For melee damage
    if (damageType === 'melee') {
      // If no weaponId provided or explicitly "unarmed", use unarmed damage
      if (!weaponId || weaponId === 'unarmed') {
        await rollMeleeDamage(this.baseActor, null, modifier);
      } else {
        const weapon = this.baseActor.items.get(weaponId);
        if (!weapon) {
          ui.notifications.warn(game.i18n.localize("CONAN.Damage.noMeleeWeapon"));
          return;
        }
        await rollMeleeDamage(this.baseActor, weapon, modifier);
      }
    }
    // For thrown damage
    else if (damageType === 'thrown') {
      const weapon = this.baseActor.items.get(weaponId);
      if (!weapon) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.noThrownWeapon"));
        return;
      }
      await rollThrownDamage(this.baseActor, weapon, modifier);
    }
    // For ranged damage
    else if (damageType === 'ranged') {
      const weapon = this.baseActor.items.get(weaponId);
      if (!weapon) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.noRangedWeapon"));
        return;
      }
      await rollRangedDamage(this.baseActor, weapon, modifier);
    }
    // For sorcery damage
    else if (damageType === 'sorcery') {
      if (sorceryDamageType === 'wits-die') {
        const { rollSorceryWitsDamage } = await import('../helpers/roll-mechanics.mjs');
        await rollSorceryWitsDamage(this.baseActor, sorceryCustomModifier || 0, modifier);
      } else if (sorceryDamageType === 'custom-die') {
        const { rollSorceryCustomDieDamage } = await import('../helpers/roll-mechanics.mjs');
        await rollSorceryCustomDieDamage(this.baseActor, sorceryCustomDie || 'd6', sorceryCustomModifier || 0, modifier);
      } else if (sorceryDamageType === 'fixed') {
        // Pobierz wartość z dialogu
        const form = document.querySelector('.damage-form');
        let fixedValue = 0;
        if (form) {
          const input = form.querySelector('input[name="sorceryFixedValue"]');
          if (input) fixedValue = parseInt(input.value) || 0;
        }
        // Jeśli nie znaleziono w DOM, spróbuj z result (przyszłościowo)
        if (!fixedValue && typeof result.sorceryFixedValue !== 'undefined') {
          fixedValue = parseInt(result.sorceryFixedValue) || 0;
        }
        const { rollSorceryFixedDamage } = await import('../helpers/roll-mechanics.mjs');
        await rollSorceryFixedDamage(this.baseActor, fixedValue, sorceryCustomModifier || 0, modifier);
      }
    }
  }

  static async _onCastSpell(event, target) {
    await SpellcastingDialog.prompt(this.baseActor);
  }

  static async _onToggleDefence(event, target) {
    // Cannot use Defence when Immobilized
    if (this.actor.system.immobilized) {
      ui.notifications.warn(game.i18n.localize("CONAN.Attack.immobilized") + " - " + game.i18n.localize("CONAN.Attack.defence") + " is disabled");
      return;
    }
    
    const currentState = this.actor.system.defenceActive || false;
    const newState = !currentState;
    
    // Store base physical defense if not already stored (needed for manual defense adjustments)
    if (!this.baseActor.system.defense.basePhysical) {
      await this.baseActor.update({
        'system.defense.basePhysical': this.baseActor.system.defense.physical
      });
    }
    
    // Just toggle the flag - prepareDerivedData() will recalculate defense automatically
    await this.baseActor.update({
      'system.defenceActive': newState
    });
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  static async _onToggleImmobilized(event, target) {
    const currentState = this.actor.system.immobilized || false;
    const newState = !currentState;
    
    // Store base physical defense if not already stored (needed for manual defense adjustments)
    if (!this.baseActor.system.defense.basePhysical) {
      await this.baseActor.update({
        'system.defense.basePhysical': this.baseActor.system.defense.physical
      });
    }
    
    const updates = {
      'system.immobilized': newState
    };
    
    // Disable Defence when becoming immobilized
    if (newState && this.baseActor.system.defenceActive) {
      updates['system.defenceActive'] = false;
    }
    
    // Just toggle flags - prepareDerivedData() will recalculate defense automatically
    await this.baseActor.update(updates);
    
    // Refresh Combat Tracker if in combat
    if (game.combat && ui.combat) {
      ui.combat.render();
    }
  }

  static async _onTogglePoisoned(event, target) {
    // Always open dialog to configure poison effects
    const dialog = new PoisonedDialog(this.baseActor);
    dialog.render(true);
  }

  static async _onSpendStamina(event, target) {
    await StaminaSpendDialog.prompt(this.baseActor);
  }

  static async _onAddStartingSkill(event, target) {
    await StartingSkillsDialog.prompt(this.baseActor);
  }

  static async _onEditStartingSkill(event, target) {
    event.stopPropagation(); // Prevent details toggle
    const skillId = target.dataset.skillId;
    const skills = this.baseActor.system.startingSkills || [];
    const skill = skills.find(s => s.id === skillId);
    
    if (skill) {
      await StartingSkillsDialog.prompt(this.baseActor, skill);
    }
  }

  static async _onDeleteStartingSkill(event, target) {
    event.stopPropagation(); // Prevent details toggle
    const skillId = target.dataset.skillId;
    const skills = this.actor.system.startingSkills || [];
    
    const confirmMessage = game.i18n.localize("CONAN.StartingSkills.deleteConfirm");
    const confirmed = window.confirm(confirmMessage);
    
    if (confirmed) {
      const updatedSkills = skills.filter(s => s.id !== skillId);
      
      // Recalculate XP
      const totalCost = updatedSkills
        .filter(s => s.skillType !== 'origin')
        .reduce((sum, s) => sum + s.cost, 0);
      
      const initialXP = this.actor.system.initial?.experience || 0;
      const remainingXP = initialXP - totalCost;
      
      await this.baseActor.update({
        "system.startingSkills": updatedSkills,
        "system.experience.value": remainingXP
      });
      ui.notifications.info(game.i18n.localize("CONAN.StartingSkills.skillDeleted"));
    }
  }

  static async _onItemCreate(event, target) {
    const type = target.dataset.type;
    const name = game.i18n.format("CONAN.ItemNew", { type: type.capitalize() });
    const itemData = {
      name: name,
      type: type,
      system: {}
    };

    // Set default icons for specific item types
    if (type === "spell") {
      itemData.img = "icons/svg/book.svg";
    } else if (type === "skill") {
      itemData.img = "icons/svg/aura.svg";
    }

    return await Item.create(itemData, { parent: this.baseActor });
  }

  static async _onItemEdit(event, target) {
    const li = target.closest(".item") || target.closest(".skill-item");
    if (!li) return;
    const item = this.baseActor.items.get(li.dataset.itemId);
    if (item) item.sheet.render(true);
  }

  static async _onItemDelete(event, target) {
    const li = target.closest(".item") || target.closest(".skill-item");
    if (!li) return;
    const item = this.baseActor.items.get(li.dataset.itemId);
    if (!item) return;

    // Refund XP cost for skills and spells based on what was originally paid
    if (item.type === 'skill' || item.type === 'spell') {
      const initialCost = item.getFlag('conan-the-hyborian-age', 'initialCost');
      let cost = initialCost !== undefined ? parseInt(initialCost) : NaN;

      if (Number.isNaN(cost)) {
        cost = parseInt(item.system?.xpCost) || 0;
      }

      if (cost > 0) {
        const currentXP = parseInt(this.baseActor.system.experience?.value) || 0;
        const newXP = currentXP + cost;
        await this.baseActor.update({ "system.experience.value": newXP });

        const messageKey = item.type === 'spell'
          ? 'CONAN.Spells.spellRemoved'
          : 'CONAN.LearnedSkills.skillRemoved';

        ui.notifications.info(game.i18n.format(messageKey, { cost: cost }));
      }
    }

    await item.delete();
  }

  static async _onItemRoll(event, target) {
    const li = target.closest(".item");
    const item = this.baseActor.items.get(li.dataset.itemId);
    if (item) return item.roll();
  }

  static async _onToggleEquipped(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.baseActor.items.get(itemId);
    if (!item) return;
    
    const newEquippedState = !item.system.equipped;
    
    // Check if trying to equip a weapon
    if (item.type === 'weapon' && newEquippedState) {
      // Check if actor has a shield equipped
      const hasShield = this.baseActor.items.some(i => 
        i.type === 'armor' && 
        i.system.armorType === 'shield' && 
        i.system.equipped
      );
      
      if (hasShield) {
        // Check if weapon can be used with shield
        const canUseWithShield = ConanActorSheet._canUseWeaponWithShield(item);
        
        if (!canUseWithShield) {
          ui.notifications.warn(
            game.i18n.localize('CONAN.Warnings.cannotUseWeaponWithShield')
          );
          return;
        }
      }
      
      // Check weapon combination limits
      const canEquip = ConanActorSheet._canEquipWeapon(this.baseActor, item);
      if (!canEquip.allowed) {
        ui.notifications.warn(canEquip.message);
        return;
      }
    }
    
    // Use updateEmbeddedDocuments to ensure we only update this actor's item instance
    await this.baseActor.updateEmbeddedDocuments('Item', [{ 
      _id: item.id, 
      'system.equipped': newEquippedState 
    }]);
  }
  
  /**
   * Check if a weapon can be equipped based on currently equipped weapons
   * @param {Actor} actor - The actor
   * @param {Item} weaponToEquip - The weapon trying to equip
   * @returns {Object} - {allowed: boolean, message: string}
   */
  static _canEquipWeapon(actor, weaponToEquip) {
    // Get currently equipped weapons (excluding the one we're trying to equip)
    const equippedWeapons = actor.items.filter(i => 
      i.type === 'weapon' && 
      i.system.equipped && 
      i.id !== weaponToEquip.id
    );
    
    const weaponType = weaponToEquip.system.weaponType;
    const handedness = weaponToEquip.system.handedness;
    const weaponSize = weaponToEquip.system.weaponSize;
    
    // Count currently equipped weapons by type
    const oneHandedMelee = equippedWeapons.filter(w => 
      w.system.weaponType === 'melee' && w.system.handedness === 'one-handed'
    ).length;
    
    const twoHandedMelee = equippedWeapons.filter(w => 
      w.system.weaponType === 'melee' && w.system.handedness === 'two-handed'
    ).length;
    
    const thrown = equippedWeapons.filter(w => 
      w.system.weaponType === 'thrown'
    ).length;
    
    const rangedHeavy = equippedWeapons.filter(w => 
      w.system.weaponType === 'ranged' && w.system.weaponSize === 'heavy'
    ).length;
    
    const rangedOther = equippedWeapons.filter(w => 
      w.system.weaponType === 'ranged' && w.system.weaponSize !== 'heavy'
    ).length;
    
    // Rule: max one two-handed melee weapon
    if (weaponType === 'melee' && handedness === 'two-handed') {
      if (twoHandedMelee > 0) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.alreadyHaveTwoHandedWeapon')
        };
      }
      if (equippedWeapons.length > 0) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.twoHandedRequiresBothHands')
        };
      }
    }
    
    // Rule: max one heavy ranged weapon
    if (weaponType === 'ranged' && weaponSize === 'heavy') {
      if (rangedHeavy > 0) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.alreadyHaveHeavyRanged')
        };
      }
      if (equippedWeapons.length > 0) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.heavyRangedRequiresBothHands')
        };
      }
    }
    
    // Rule: if already have two-handed or heavy ranged, can't equip anything else
    if (twoHandedMelee > 0 || rangedHeavy > 0) {
      return {
        allowed: false,
        message: game.i18n.localize('CONAN.Warnings.bothHandsOccupied')
      };
    }
    
    // Rule: max two one-handed melee weapons
    if (weaponType === 'melee' && handedness === 'one-handed') {
      if (oneHandedMelee >= 2) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.maxTwoOneHandedWeapons')
        };
      }
      // Can't have one-handed melee with thrown
      if (thrown > 0 && oneHandedMelee >= 1) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.cannotCombineMeleeAndThrown')
        };
      }
    }
    
    // Rule: max one thrown weapon with one one-handed melee
    if (weaponType === 'thrown') {
      if (thrown > 0) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.alreadyHaveThrownWeapon')
        };
      }
      if (oneHandedMelee >= 2) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.cannotCombineMeleeAndThrown')
        };
      }
    }
    
    // Rule: ranged weapons (non-heavy) are typically solo but we allow one
    if (weaponType === 'ranged' && weaponSize !== 'heavy') {
      if (rangedOther > 0 || equippedWeapons.length > 0) {
        return {
          allowed: false,
          message: game.i18n.localize('CONAN.Warnings.cannotEquipMultipleRanged')
        };
      }
    }
    
    return { allowed: true, message: '' };
  }
  
  /**
   * Check if a weapon can be used with a shield equipped
   * @param {Item} weapon - The weapon item
   * @returns {boolean} - True if weapon can be used with shield
   */
  static _canUseWeaponWithShield(weapon) {
    if (weapon.type !== 'weapon') return true;
    
    const weaponType = weapon.system.weaponType;
    const handedness = weapon.system.handedness;
    const weaponSize = weapon.system.weaponSize;
    
    // Allowed: melee one-handed
    if (weaponType === 'melee' && handedness === 'one-handed') {
      return true;
    }
    
    // Allowed: all thrown weapons
    if (weaponType === 'thrown') {
      return true;
    }
    
    // Allowed: ranged light only
    if (weaponType === 'ranged' && weaponSize === 'light') {
      return true;
    }
    
    // All other combinations not allowed with shield
    return false;
  }
}
