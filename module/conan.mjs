/**
 * Conan: The Hyborian Age system for Foundry VTT
 * Main system initialization file
 */

// Import Document classes
import { ConanActor } from "./documents/actor.mjs";
import { ConanItem } from "./documents/item.mjs";

// Import Application classes
import { ConanActorSheet } from "./sheets/actor-sheet.mjs";
import { ConanMinionSheet, ConanAntagonistSheet } from "./sheets/npc-sheet.mjs";
import { ConanItemSheet } from "./sheets/item-sheet.mjs";

// Import helper/utility classes and constants
import { CONAN } from "./helpers/config.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { ConanSocket } from "./helpers/socket.mjs";
import { FlexEffectDialog } from "./helpers/flex-dialog.mjs";
import { initializeStaminaEffects } from "./helpers/stamina-effects.mjs";

/**
 * Initialize system
 */
Hooks.once("init", async function() {
  console.log("Conan: The Hyborian Age | Initializing system");

  // Add custom constants for configuration
  game.conan = {
    ConanActor,
    ConanItem,
    FlexEffectDialog,
    config: CONAN
  };

  // Add CONAN config to CONFIG for global access
  CONFIG.CONAN = CONAN;

  // Define custom Document classes
  CONFIG.Actor.documentClass = ConanActor;
  CONFIG.Item.documentClass = ConanItem;

  // Register sheet application classes (ApplicationV2)
  foundry.applications.apps.DocumentSheetConfig.registerSheet(ConanActor, "conan", ConanActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "CONAN.SheetLabels.Actor"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(ConanActor, "conan-minion", ConanMinionSheet, {
    types: ["minion"],
    makeDefault: true,
    label: "CONAN.SheetLabels.Minion"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(ConanActor, "conan-antagonist", ConanAntagonistSheet, {
    types: ["antagonist"],
    makeDefault: true,
    label: "CONAN.SheetLabels.Antagonist"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(ConanItem, "conan", ConanItemSheet, {
    types: ["weapon", "armor", "skill", "spell"],
    makeDefault: true,
    label: "CONAN.SheetLabels.Item"
  });

  // Preload Handlebars templates
  await preloadHandlebarsTemplates();

  // Register Handlebars helpers (global Handlebars is still correct for helpers)
  Handlebars.registerHelper("concat", function(...args) {
    args.pop(); // Remove the options object
    return args.join("");
  });

  Handlebars.registerHelper("times", function(n, block) {
    let accum = "";
    for(let i = 0; i < n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper("ne", function(a, b) {
    return a !== b;
  });

  Handlebars.registerHelper("gt", function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper("lt", function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper("select", function(selected, options) {
    const escapedValue = RegExp.escape(Handlebars.escapeExpression(selected));
    const rgx = new RegExp(' value=[\"\']' + escapedValue + '[\"\']');
    const html = options.fn(this);
    return html.replace(rgx, "$& selected");
  });
  
  // Initialize stamina effects system EARLY (before ChatLog instances are created)
  initializeStaminaEffects();

  console.log("Conan: The Hyborian Age | System initialized");
});

/**
 * Ready hook
 */
Hooks.once("ready", async function() {
  console.log("Conan: The Hyborian Age | System ready");
  
  // Initialize socket handler
  ConanSocket.initialize();
  
  // Override Combat.rollInitiative to use custom Edge-based initiative
  const originalCombatRollInitiative = CONFIG.Combat.documentClass.prototype.rollInitiative;
  
  CONFIG.Combat.documentClass.prototype.rollInitiative = async function(ids, options = {}) {
    // Get combatant IDs
    const combatantIds = typeof ids === "string" ? [ids] : ids;
    
    // Roll initiative for each combatant using our custom system
    for (let id of combatantIds) {
      const combatant = this.combatants.get(id);
      
      if (combatant?.actor) {
        const { rollInitiative } = await import("./helpers/roll-mechanics.mjs");
        // Pass the combatant to properly identify token-based actors
        await rollInitiative(combatant.actor, combatant);
      }
    }
    
    return this;
  };
});

/**
 * Prevent automatic initiative rolls when combatants are added
 */
Hooks.on("preCreateCombatant", (combatant, data, options, userId) => {
  if (data.initiative === null) {
    options.skipInitiative = true;
  }
});

/**
 * Set default icons for new spell and skill items
 */
Hooks.on("preCreateItem", (item, data, options, userId) => {
  if (item.type === "spell" && !data.img) {
    item.updateSource({ img: "icons/svg/book.svg" });
  } else if (item.type === "skill" && !data.img) {
    item.updateSource({ img: "icons/svg/aura.svg" });
  }
});

/**
 * Synchronize embedded item updates back to world items
 * When an item on an actor sheet is updated, update the original world item if it exists
 */
Hooks.on("updateItem", async (item, changes, options, userId) => {
  // Only process if this is an embedded item (has a parent actor)
  if (!item.parent || item.parent.documentName !== "Actor") return;
  
  // Only process for the user who made the change
  if (game.user.id !== userId) return;
  
  // Don't sync if this update came from a world item sync (prevent loops)
  if (options.fromWorldItemSync) return;
  
  // Extract the original world item ID from the embedded item's ID
  // Format: Actor.xxx.Item.yyy where yyy is the original world item ID
  const embeddedId = item.id;
  
  // Try to find the original world item by this ID
  const worldItem = game.items.get(embeddedId);
  
  if (worldItem) {
    // Prepare the update data - only sync system data and img
    const updateData = {};
    
    if (changes.name !== undefined) {
      updateData.name = changes.name;
    }
    
    if (changes.img !== undefined) {
      updateData.img = changes.img;
    }
    
    if (changes.system) {
      updateData.system = changes.system;
    }
    
    // Update the world item if there are changes
    if (Object.keys(updateData).length > 0) {
      await worldItem.update(updateData, { fromEmbeddedItemSync: true });
      
      ui.notifications.info(
        game.i18n.format("CONAN.Notifications.itemSyncedToWorld", {
          name: item.name
        })
      );
    }
  }
});

/**
 * Synchronize world item updates to embedded items on actors
 * When a world item is updated, update all copies of it on actor sheets
 */
Hooks.on("updateItem", async (item, changes, options, userId) => {
  // Only process if this is a world item (no parent)
  if (item.parent) return;
  
  // Only process for the user who made the change
  if (game.user.id !== userId) return;
  
  // Don't sync if this update came from an embedded item sync (prevent loops)
  if (options.fromEmbeddedItemSync) return;
  
  // Find all actors that have this item embedded (by the same ID)
  const actorsWithItem = game.actors.filter(actor => 
    actor.items.some(i => i.id === item.id)
  );
  
  if (actorsWithItem.length > 0) {
    // Prepare the update data - only sync system data and img
    const updateData = {};
    
    if (changes.name !== undefined) {
      updateData.name = changes.name;
    }
    
    if (changes.img !== undefined) {
      updateData.img = changes.img;
    }
    
    if (changes.system) {
      updateData.system = changes.system;
    }
    
    if (Object.keys(updateData).length > 0) {
      for (const actor of actorsWithItem) {
        const embeddedItem = actor.items.get(item.id);
        
        if (embeddedItem) {
          await embeddedItem.update(updateData, { fromWorldItemSync: true });
        }
      }
      
      ui.notifications.info(
        game.i18n.format("CONAN.Notifications.itemSyncedToActors", {
          name: item.name,
          count: actorsWithItem.length
        })
      );
    }
  }
});

/**
 * Add status effect icons to Combat Tracker
 */
Hooks.on("renderCombatTracker", (app, html, data) => {
  // Convert to DOM element if jQuery
  const element = html instanceof jQuery ? html[0] : html;
  
  // For each combatant in the tracker
  const combatants = element.querySelectorAll(".combatant");
  
  combatants.forEach((el) => {
    const combatantId = el.dataset.combatantId;
    const combatant = game.combat?.combatants.get(combatantId);
    
    if (!combatant?.actor) return;
    
    const actor = combatant.actor;
    
    // Create status icons container
    const tokenEffects = el.querySelector(".token-effects");
    if (!tokenEffects) return;
    
    // Handle character actors
    if (actor.type === "character") {
      const defenceActive = actor.system.defenceActive || false;
      const immobilized = actor.system.immobilized || false;
      
      // Add Defence icon if active
      if (defenceActive) {
        const defenceIcon = document.createElement("img");
        defenceIcon.src = "icons/svg/shield.svg";
        defenceIcon.classList.add("token-effect");
        defenceIcon.title = game.i18n.localize("CONAN.Attack.defence");
        defenceIcon.style.border = "2px solid #daa520";
        defenceIcon.style.borderRadius = "3px";
        defenceIcon.style.width = "20px";
        defenceIcon.style.height = "20px";
        tokenEffects.appendChild(defenceIcon);
      }
      
      // Add Immobilized icon if active
      if (immobilized) {
        const immobilizedIcon = document.createElement("img");
        immobilizedIcon.src = "systems/conan-the-hyborian-age/assets/icons/paralysis.svg";
        immobilizedIcon.classList.add("token-effect");
        immobilizedIcon.title = game.i18n.localize("CONAN.Attack.immobilized");
        immobilizedIcon.style.border = "2px solid #dc143c";
        immobilizedIcon.style.borderRadius = "3px";
        immobilizedIcon.style.filter = "invert(1)";
        immobilizedIcon.style.width = "20px";
        immobilizedIcon.style.height = "20px";
        tokenEffects.appendChild(immobilizedIcon);
      }
    }
    
    // Handle minion actors
    if (actor.type === "minion") {
      const defenceActive = actor.system.defenceActive || false;
      const immobilized = actor.system.immobilized || false;
      const wounded = actor.system.wounded || false;
      
      // Add Defence icon if active
      if (defenceActive) {
        const defenceIcon = document.createElement("img");
        defenceIcon.src = "icons/svg/shield.svg";
        defenceIcon.classList.add("token-effect");
        defenceIcon.title = game.i18n.localize("CONAN.Attack.defence");
        defenceIcon.style.border = "2px solid #daa520";
        defenceIcon.style.borderRadius = "3px";
        defenceIcon.style.width = "20px";
        defenceIcon.style.height = "20px";
        tokenEffects.appendChild(defenceIcon);
      }
      
      // Add Immobilized icon if active
      if (immobilized) {
        const immobilizedIcon = document.createElement("img");
        immobilizedIcon.src = "systems/conan-the-hyborian-age/assets/icons/paralysis.svg";
        immobilizedIcon.classList.add("token-effect");
        immobilizedIcon.title = game.i18n.localize("CONAN.Attack.immobilized");
        immobilizedIcon.style.border = "2px solid #dc143c";
        immobilizedIcon.style.borderRadius = "3px";
        immobilizedIcon.style.filter = "invert(1)";
        immobilizedIcon.style.width = "20px";
        immobilizedIcon.style.height = "20px";
        tokenEffects.appendChild(immobilizedIcon);
      }
      
      // Add Wounded icon if active
      if (wounded) {
        const woundedIcon = document.createElement("img");
        woundedIcon.src = "icons/svg/blood.svg";
        woundedIcon.classList.add("token-effect");
        woundedIcon.title = game.i18n.localize("CONAN.NPC.wounded");
        woundedIcon.style.border = "2px solid #dc143c";
        woundedIcon.style.borderRadius = "3px";
        woundedIcon.style.width = "20px";
        woundedIcon.style.height = "20px";
        tokenEffects.appendChild(woundedIcon);
      }
    }
    
    // Handle antagonist actors
    if (actor.type === "antagonist") {
      const defenceActive = actor.system.defenceActive || false;
      const immobilized = actor.system.immobilized || false;
      
      // Add Defence icon if active
      if (defenceActive) {
        const defenceIcon = document.createElement("img");
        defenceIcon.src = "icons/svg/shield.svg";
        defenceIcon.classList.add("token-effect");
        defenceIcon.title = game.i18n.localize("CONAN.Attack.defence");
        defenceIcon.style.border = "2px solid #daa520";
        defenceIcon.style.borderRadius = "3px";
        defenceIcon.style.width = "20px";
        defenceIcon.style.height = "20px";
        tokenEffects.appendChild(defenceIcon);
      }
      
      // Add Immobilized icon if active
      if (immobilized) {
        const immobilizedIcon = document.createElement("img");
        immobilizedIcon.src = "systems/conan-the-hyborian-age/assets/icons/paralysis.svg";
        immobilizedIcon.classList.add("token-effect");
        immobilizedIcon.title = game.i18n.localize("CONAN.Attack.immobilized");
        immobilizedIcon.style.border = "2px solid #dc143c";
        immobilizedIcon.style.borderRadius = "3px";
        immobilizedIcon.style.filter = "invert(1)";
        immobilizedIcon.style.width = "20px";
        immobilizedIcon.style.height = "20px";
        tokenEffects.appendChild(immobilizedIcon);
      }
    }
  });
});

/**
 * Combat hook: End of round - apply poison life drain effect
 * TEMPORARILY DISABLED FOR DEBUGGING
 */
/*
Hooks.on("combatRound", async (combat, updateData, updateOptions) => {
  // Only run on the GM's client to avoid duplicate processing
  if (!game.user.isGM) return;
  
  console.log("Conan | Processing poison life drain at end of combat round");
  
  // Process all combatants in the combat
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;
    
    // Check if actor has poison effect 3 active (life drain)
    if (actor.system.poisoned && actor.system.poisonEffects?.effect3) {
      console.log(`Conan | Applying poison life drain to ${actor.name}`);
      
      // Handle differently based on actor type
      if (actor.type === "character" || actor.type === "antagonist") {
        // Characters and antagonists: lose 1 life point
        const currentLife = actor.type === "character" ? actor.system.lifePoints.actual : actor.system.lifePoints;
        const newLife = Math.max(0, currentLife - 1);
        
        const updatePath = actor.type === "character" ? "system.lifePoints.actual" : "system.lifePoints";
        await actor.update({ [updatePath]: newLife });
        
        // Notify in chat
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: actor }),
          content: `
            <div class="conan-poison-drain">
              <i class="fas fa-skull-crossbones" style="color: #15a20e;"></i>
              <strong>${actor.name}</strong> ${game.i18n.localize('CONAN.Poisoned.lifeDrain')} 
              (${currentLife} → ${newLife})
            </div>
          `,
          whisper: [game.user.id]
        });
        
      } else if (actor.type === "minion") {
        // Minions: if not wounded, become wounded; if already wounded, die
        const currentlyWounded = actor.system.wounded || false;
        
        if (!currentlyWounded) {
          // Become wounded
          await actor.update({ "system.wounded": true });
          
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `
              <div class="conan-poison-drain minion-wounded">
                <i class="fas fa-skull-crossbones" style="color: #15a20e;"></i>
                <strong>${actor.name}</strong> ${game.i18n.localize('CONAN.Poisoned.minionWounded')}
              </div>
            `,
            whisper: [game.user.id]
          });
        } else {
          // Already wounded - minion dies, remove from combat
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `
              <div class="conan-poison-drain minion-dead">
                <i class="fas fa-skull" style="color: #8b0000;"></i>
                <strong>${actor.name}</strong> ${game.i18n.localize('CONAN.Poisoned.minionDead')}
              </div>
            `,
            whisper: [game.user.id]
          });
          
          // Remove combatant from combat
          await combat.deleteEmbeddedDocuments("Combatant", [combatant.id]);
        }
      }
    }
  }
});
*/

/**
 * Handle deal damage button clicks in chat
 */
Hooks.on("renderChatMessageHTML", (message, html) => {
  // Add click handler for deal damage buttons
  const dealDamageBtn = html.querySelector(".deal-damage-btn");
  if (dealDamageBtn) {
    // Check if damage was already dealt (on render)
    const damageDealt = message.getFlag("conan-the-hyborian-age", "damageDealt");
    if (damageDealt) {
      dealDamageBtn.disabled = true;
      dealDamageBtn.classList.add("disabled");
      dealDamageBtn.innerHTML = `<i class="fas fa-check"></i> ${game.i18n.localize('CONAN.Damage.damageDealt')}`;
    }
    
    dealDamageBtn.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      
      // Check if damage already dealt
      const damageDealt = message.getFlag("conan-the-hyborian-age", "damageDealt");
      if (damageDealt) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.alreadyDealt"));
        return;
      }
      
      const totalDamage = parseInt(button.dataset.damage);
      const attackerId = button.dataset.attackerId;
      const tokenId = button.dataset.tokenId;
      const sceneId = button.dataset.sceneId;
      
      // Try to get actor from token first (for unlinked tokens)
      let attacker = null;
      if (tokenId && sceneId) {
        const scene = game.scenes.get(sceneId);
        const token = scene?.tokens.get(tokenId);
        attacker = token?.actor;
      }
      
      // Fallback to base actor
      if (!attacker) {
        attacker = game.actors.get(attackerId);
      }
      
      if (!attacker) {
        ui.notifications.error(game.i18n.localize("CONAN.Damage.attackerNotFound"));
        return;
      }
      
      // Get selected target(s)
      const targets = Array.from(game.user.targets);
      
      if (targets.length === 0) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.noTarget"));
        return;
      }
      
      if (targets.length > 1) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.tooManyTargets"));
        return;
      }
      
      const target = targets[0].actor;
      
      // Apply damage
      const { applyNPCDamage } = await import("./helpers/roll-mechanics.mjs");
      await applyNPCDamage(totalDamage, target, attacker);
      
      // Mark damage as dealt and disable button
      await message.setFlag("conan-the-hyborian-age", "damageDealt", true);
      button.disabled = true;
      button.classList.add("disabled");
      button.innerHTML = `<i class="fas fa-check"></i> ${game.i18n.localize('CONAN.Damage.damageDealt')}`;
    });
  }
  
  
  // Add click handler for roll NPC damage buttons
  const rollDamageBtn = html.querySelector(".roll-npc-damage-btn");
  if (rollDamageBtn) {
    rollDamageBtn.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const actorId = button.dataset.actorId;
      const tokenId = button.dataset.tokenId;
      const sceneId = button.dataset.sceneId;
      const attackType = button.dataset.attackType;
      
      // Try to get actor from token first (for unlinked tokens)
      let actor = null;
      if (tokenId && sceneId) {
        const scene = game.scenes.get(sceneId);
        const token = scene?.tokens.get(tokenId);
        actor = token?.actor;
      }
      
      // Fallback to base actor
      if (!actor) {
        actor = game.actors.get(actorId);
      }
      
      if (!actor) {
        ui.notifications.error(game.i18n.localize("CONAN.Damage.attackerNotFound"));
        return;
      }
      
      // Import and call rollNPCDamage
      const { rollNPCDamage } = await import("./helpers/roll-mechanics.mjs");
      await rollNPCDamage(actor, attackType);
    });
  }
  
  // Add click handler for PC damage buttons (deal damage from PC damage rolls)
  const dealPCDamageBtn = html.querySelector(".deal-pc-damage-btn");
  if (dealPCDamageBtn) {
    // Check if damage was already dealt (on render)
    const damageDealt = message.getFlag("conan-the-hyborian-age", "damageDealt");
    if (damageDealt) {
      dealPCDamageBtn.disabled = true;
      dealPCDamageBtn.classList.add("disabled");
      dealPCDamageBtn.innerHTML = `<i class="fas fa-check"></i> ${game.i18n.localize('CONAN.Damage.damageDealt')}`;
    }
    
    dealPCDamageBtn.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      
      // Check if damage already dealt
      const damageDealt = message.getFlag("conan-the-hyborian-age", "damageDealt");
      if (damageDealt) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.alreadyDealt"));
        return;
      }
      
      const totalDamage = parseInt(button.dataset.damage);
      const attackerId = button.dataset.attackerId;
      const tokenId = button.dataset.tokenId;
      const sceneId = button.dataset.sceneId;
      
      // Try to get actor from token first (for unlinked tokens)
      let attacker = null;
      if (tokenId && sceneId) {
        const scene = game.scenes.get(sceneId);
        const token = scene?.tokens.get(tokenId);
        attacker = token?.actor;
      }
      
      // Fallback to base actor
      if (!attacker) {
        attacker = game.actors.get(attackerId);
      }
      
      if (!attacker) {
        ui.notifications.error(game.i18n.localize("CONAN.Damage.attackerNotFound"));
        return;
      }
      
      // Get selected target(s)
      const targets = Array.from(game.user.targets);
      
      if (targets.length === 0) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.noTarget"));
        return;
      }
      
      if (targets.length > 1) {
        ui.notifications.warn(game.i18n.localize("CONAN.Damage.tooManyTargets"));
        return;
      }
      
      const targetToken = targets[0].document;
      
      // Mark damage as dealt BEFORE applying (to prevent race conditions)
      await message.setFlag("conan-the-hyborian-age", "damageDealt", true);
      
      // Disable button immediately (DOM update)
      button.disabled = true;
      button.classList.add("disabled");
      button.innerHTML = `<i class="fas fa-check"></i> ${game.i18n.localize('CONAN.Damage.damageDealt')}`;
      
      // Apply damage using the same function as NPC damage
      const { applyNPCDamage } = await import("./helpers/roll-mechanics.mjs");
      await applyNPCDamage(totalDamage, targetToken, attacker);
    });
  }
});

