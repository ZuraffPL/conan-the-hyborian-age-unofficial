/**
 * Extend the base Actor document
 */
export class ConanActor extends Actor {

  /**
   * Set default token settings when creating a new actor
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    
    // Set default prototypeToken settings based on actor type
    const prototypeToken = {};
    
    if (data.type === "character") {
      // Player characters: linked tokens (changes sync with base actor)
      prototypeToken.actorLink = true;
      prototypeToken.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
      prototypeToken.sight = { enabled: true };
    } else if (data.type === "minion" || data.type === "antagonist") {
      // NPCs: unlinked tokens (independent instances)
      prototypeToken.actorLink = false;
      prototypeToken.disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE;
      prototypeToken.sight = { enabled: false };
    }
    
    this.updateSource({ prototypeToken });
  }

  /**
   * Augment the basic actor data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
  }

  /**
   * Prepare Character type specific data
   */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded documents or derived data
    
    // One-time migration: Initialize lifePoints.adjustment for existing characters
    if (this.type === "character" && this.system.characterCreated) {
      const systemData = this.system;
      
      // Check if adjustment needs initialization (undefined means not yet migrated)
      if (systemData.lifePoints?.adjustment === undefined && 
          systemData.initial?.lifePoints && 
          systemData.initial?.grit &&
          systemData.attributes?.grit) {
        
        // Calculate what adjustment should be based on current max
        const originBase = systemData.initial.lifePoints - (2 * systemData.initial.grit);
        const currentGrit = systemData.attributes.grit.value;
        const expectedBase = originBase + (2 * currentGrit);
        const currentMax = systemData.lifePoints.max;
        const calculatedAdjustment = currentMax - expectedBase;
        
        // Update actor with the calculated adjustment (only once)
        this.updateSource({ "system.lifePoints.adjustment": calculatedAdjustment });
      }
    }

    // One-time migration: Convert antagonist lifePoints from scalar to {value, max} object
    if (this.type === "antagonist" && typeof this.system.lifePoints === "number") {
      const scalar = this.system.lifePoints;
      this.updateSource({ "system.lifePoints": { value: scalar, max: scalar } });
    }
  }

  /**
   * Prepare derived data after embedded documents are prepared
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.conan || {};

    // Make modifications to data here
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;

    const systemData = actorData.system;

    // Calculate attribute modifiers - new attributes: might, edge, grit, wits (values 1-8)
    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      // Ensure die field exists (for backward compatibility)
      if (!attribute.die) {
        attribute.die = "d6";
      }
      
      // Apply poison effect 1: -1 to all attributes
      const attributePenalty = (systemData.poisoned && systemData.poisonEffects?.effect1) ? 1 : 0;
      attribute.isPoisonedAttributes = attributePenalty > 0;
      attribute.effectiveValue = Math.max(1, attribute.value - attributePenalty);
      
      // For values 1-8, modifier is simply (effectiveValue - 4)
      attribute.mod = attribute.effectiveValue - 4;
    }

    const gritValue = systemData.attributes.grit?.value || 1;
    
    // Initialize stamina based on Grit if not set (only on first creation)
    if (!systemData.stamina || systemData.stamina.value === undefined) {
      systemData.stamina = {
        value: gritValue,
        max: 100
      };
    }
    
    // Stamina max is always 100, not dependent on Grit
    if (systemData.stamina) {
      systemData.stamina.max = 100;
    }
    
    // Ensure flexDie field exists (for backward compatibility)
    if (!systemData.flexDie) {
      systemData.flexDie = "d10";
    }
    
    // Ensure experience field exists (for backward compatibility)
    if (!systemData.experience || systemData.experience.value === undefined) {
      systemData.experience = {
        value: 0,
        max: 100
      };
    }
    
    // Ensure lifePoints field exists (for backward compatibility)
    if (!systemData.lifePoints || systemData.lifePoints.value === undefined) {
      systemData.lifePoints = {
        value: systemData.lifePoints?.actual ?? 10,
        max: systemData.lifePoints?.max ?? 50
      };
    }
    
    // Ensure defense field exists (for backward compatibility)
    if (!systemData.defense) {
      systemData.defense = {
        physical: 0,
        sorcery: 0
      };
    }

    // Recalculate life points max based on effective Grit (accounts for poison penalty)
    // Formula: origin_base + 2×effectiveGrit + adjustment
    // Where adjustment captures manual modifications (e.g., +3 from skills)
    if (systemData.lifePoints && systemData.attributes.grit && systemData.initial?.lifePoints && systemData.initial?.grit) {
      const effectiveGrit = systemData.attributes.grit.effectiveValue;
      const initialGrit = systemData.initial.grit;
      const initialLifePoints = systemData.initial.lifePoints;
      
      // Calculate base from origin (initial life points minus initial grit contribution)
      const originBase = initialLifePoints - (2 * initialGrit);
      
      // Calculate expected base with current effective grit
      const calculatedBase = originBase + (2 * effectiveGrit);
      
      // Apply adjustment (captures +X from skills, items, etc.)
      // Use || 0 for backward compatibility with existing characters
      const adjustment = systemData.lifePoints.adjustment || 0;
      systemData.lifePoints.max = calculatedBase + adjustment;
    }

    // Recalculate defenses based on effective attribute values
    // Physical defense: Edge + 2 (minimum 5)
    // Sorcery defense: Wits + 2 (minimum 5)
    // Automatically recalculated on attribute changes (e.g., leveling up or poison effect)
    if (systemData.defense && systemData.attributes.edge && systemData.attributes.wits) {
      const effectiveEdge = systemData.attributes.edge.effectiveValue;
      const effectiveWits = systemData.attributes.wits.effectiveValue;
      
      // Calculate base defenses from attributes
      let physicalDefense = Math.max(effectiveEdge + 2, 5);
      const sorceryDefense = Math.max(effectiveWits + 2, 5);
      
      // Apply Defence modifier (+2) if active
      if (systemData.defenceActive) {
        physicalDefense += 2;
      }
      
      // Apply Immobilized modifier (defense becomes 0)
      if (systemData.immobilized) {
        physicalDefense = 0;
      }
      
      systemData.defense.physical = physicalDefense;
      systemData.defense.sorcery = sorceryDefense;
    }
  }

  /**
   * Prepare NPC type specific data
   */
  _prepareNpcData(actorData) {
    if (!["minion", "antagonist"].includes(actorData.type)) return;

    const systemData = actorData.system;

    // Calculate attribute modifiers - new attributes: might, edge, grit, wits (values 1-8)
    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      // Ensure die field exists (for backward compatibility)
      if (!attribute.die) {
        attribute.die = "d6";
      }
      
      // Apply poison effect 1: -1 to all attributes (also for NPCs)
      const attributePenalty = (systemData.poisoned && systemData.poisonEffects?.effect1) ? 1 : 0;
      attribute.isPoisonedAttributes = attributePenalty > 0;
      attribute.effectiveValue = Math.max(1, attribute.value - attributePenalty);
      
      // For values 1-8, modifier is simply (effectiveValue - 4)
      attribute.mod = attribute.effectiveValue - 4;
    }

    // Calculate NPC physical defense with Defence and Immobilized modifiers
    // NPCs have manually set defense values, but Defence/Immobilized still apply
    if (systemData.defense) {
      // Use basePhysical if available (stored when Defence/Immobilized first activated)
      // Otherwise use current physical defense as base
      let basePhysical = systemData.defense.basePhysical ?? systemData.defense.physical;
      
      let physicalDefense = basePhysical;
      
      // Apply Defence modifier (+2) if active
      if (systemData.defenceActive) {
        physicalDefense += 2;
      }
      
      // Apply Immobilized modifier (defense becomes 0) - overrides Defence
      if (systemData.immobilized) {
        physicalDefense = 0;
      }
      
      systemData.defense.physical = physicalDefense;
    }
  }

  /**
   * Override getRollData() to provide data to rolls
   */
  getRollData() {
    const data = {...super.getRollData()};

    // Prepare character roll data
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data
   */
  _getCharacterRollData(data) {
    if (this.type !== "character") return;

    // Add level for easier access
    if (data.level) {
      data.lvl = data.level;
    }

    // Add attribute modifiers
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = v.mod;
      }
    }
  }

  /**
   * Prepare NPC roll data
   */
  _getNpcRollData(data) {
    if (!["minion", "antagonist"].includes(this.type)) return;

    // Add attribute modifiers
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = v.mod;
      }
    }
  }

  /**
   * Handle pre-create item hook to validate XP cost for spells and skills
   */
  async _preCreateEmbeddedDocuments(embeddedName, data, options, userId) {
    if (embeddedName !== "Item") return super._preCreateEmbeddedDocuments(embeddedName, data, options, userId);
    
    // Check if any spell or skill items need XP validation
    for (const itemData of data) {
      // Validate spell restrictions based on origin
      if (itemData.type === "spell") {
        const origin = this.system.origin;
        const magicRestrictions = CONFIG.CONAN.magicRestrictions[origin];
        
        // Check if origin can use magic at all
        if (!magicRestrictions || !magicRestrictions.canUseMagic) {
          ui.notifications.error(game.i18n.localize("CONAN.Warnings.originCannotUseMagic"));
          return false;
        }
        
        const discipline = itemData.system?.discipline;
        
        // Check if discipline is allowed for this origin
        if (!magicRestrictions.allowedDisciplines.includes(discipline)) {
          ui.notifications.error(
            game.i18n.format("CONAN.Warnings.disciplineNotAllowed", {
              discipline: game.i18n.localize(`CONAN.Spell.disciplines.${discipline}`)
            })
          );
          return false;
        }
        
        // Check if adding this spell would exceed max disciplines limit
        // Only check if the spell's discipline is NEW (not already learned)
        const currentSpells = this.items.filter(i => i.type === "spell");
        const learnedDisciplines = new Set(currentSpells.map(s => s.system.discipline));
        
        // If this is a new discipline (not yet learned) and we're at the limit, block it
        if (!learnedDisciplines.has(discipline) && learnedDisciplines.size >= magicRestrictions.maxDisciplines) {
          ui.notifications.error(
            game.i18n.format("CONAN.Warnings.maxDisciplinesReached", {
              max: magicRestrictions.maxDisciplines
            })
          );
          return false;
        }
        
        // If the discipline is already learned, allow adding more spells from that discipline
        // This allows unlimited spells within allowed disciplines
      }
      
      // Only auto-deduct XP for spells (skills are handled manually in actor-sheet.mjs)
      if (itemData.type === "spell") {
        const xpCost = itemData.system?.xpCost || 0;
        const currentXP = this.system.experience?.value || 0;
        
        if (xpCost > currentXP) {
          ui.notifications.error(game.i18n.localize('CONAN.Warnings.notEnoughXPForSpell'));
          return false; // Prevent creation
        }
        
        // Deduct XP when spell is added
        await this.update({
          "system.experience.value": currentXP - xpCost
        });
      }
    }
    
    return super._preCreateEmbeddedDocuments(embeddedName, data, options, userId);
  }

  /**
   * Handle deletion of embedded documents - refund XP for spells only (skills handled in actor-sheet.mjs)
   */
  async _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    if (embeddedName === "Item") {
      for (const doc of documents) {
        if (doc.type === "spell") {
          const xpCost = doc.system?.xpCost || 0;
          if (xpCost > 0) {
            const currentXP = this.system.experience?.value || 0;
            await this.update({
              "system.experience.value": currentXP + xpCost
            });
          }
        }
      }
    }
    
    return super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
  }

  /**
   * Handle update of embedded documents - manage XP cost changes for spells only (skills handled in actor-sheet.mjs)
   */
  async _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    if (embeddedName === "Item" && game.user.id === userId) {
      for (const doc of documents) {
        if (doc.type === "spell") {
          // Get the original XP cost before update
          const originalDoc = this.items.get(doc.id);
          if (!originalDoc) continue;
          
          const oldXPCost = originalDoc.system?.xpCost || 0;
          const newXPCost = doc.system?.xpCost || 0;
          
          // Calculate XP difference
          const xpDifference = newXPCost - oldXPCost;
          
          if (xpDifference !== 0) {
            const currentXP = this.system.experience?.value || 0;
            const newXP = currentXP - xpDifference; // Subtract if cost increased, add if decreased
            
            // Check if actor has enough XP for the increase
            if (xpDifference > 0 && newXP < 0) {
              ui.notifications.error(game.i18n.localize('CONAN.Warnings.notEnoughXPForSpell'));
              
              // Revert the XP cost change
              await doc.update({ "system.xpCost": oldXPCost }, { render: false });
              continue;
            }
            
            // Update XP
            await this.update({
              "system.experience.value": newXP
            }, { render: false });
            
            ui.notifications.info(
              game.i18n.format("CONAN.Notifications.xpAdjusted", {
                change: xpDifference > 0 ? `-${xpDifference}` : `+${Math.abs(xpDifference)}`,
                remaining: newXP
              })
            );
          }
        }
      }
    }
    
    return super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
  }

  /**
   * Handle clickable rolls
   */
  async roll(attribute) {
    const label = game.i18n.localize(`CONAN.Attributes.${attribute}.label`) || attribute;
    const rollData = this.getRollData();
    const mod = rollData.attributes[attribute].mod;

    const roll = await new Roll("1d20 + @mod", { mod: mod }).roll();
    
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      rollMode: game.settings.get("core", "rollMode")
    });

    return roll;
  }
}
