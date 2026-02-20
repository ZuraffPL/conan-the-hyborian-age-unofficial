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
import { PoisonedDialog } from "./helpers/poisoned-dialog.mjs";
import { initializeStaminaEffects } from "./helpers/stamina-effects.mjs";
import { TaleDialog } from "./helpers/tale.mjs";
import { TalePlayerDialog } from "./helpers/tale.mjs";
import { getFlexDieColorset } from "./helpers/dice-utils.mjs";

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
    PoisonedDialog,
    TaleDialog,
    TalePlayerDialog,
    config: CONAN
  };

  // Add CONAN config to CONFIG for global access
  CONFIG.CONAN = CONAN;

  // Define custom Document classes
  CONFIG.Actor.documentClass = ConanActor;
  CONFIG.Item.documentClass = ConanItem;

  // Add custom status effects
  CONFIG.statusEffects.push({
    id: "wounded",
    name: "CONAN.NPC.wounded",
    img: "systems/conan-the-hyborian-age/assets/icons/wounded.svg"
  });

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

  // Foundry VTT v13+ provides these built-in Handlebars helpers:
  // - concat, eq, ne, gt, gte, lt, lte, and, or, not, select
  // We only register custom helpers that Foundry doesn't provide
  
  Handlebars.registerHelper("times", function(n, block) {
    let accum = "";
    for(let i = 0; i < n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });
  
  // Initialize stamina effects system EARLY (before ChatLog instances are created)
  initializeStaminaEffects();

  // Rejestracja ustawień persistence dla okna Opowieści
  TaleDialog.registerSettings();

  console.log("Conan: The Hyborian Age | System initialized");
});

/**
 * Ready hook
 */
Hooks.once("ready", async function() {
  console.log("Conan: The Hyborian Age | System ready");

  // Przywróć stan timera Opowieści (wznawia jeśli działał przed przeładowaniem)
  TaleDialog.restoreState();

  // Otwórz okno Opowieści automatycznie przy starcie (tylko GM)
  if (game.user.isGM) TaleDialog.open();
  
  // Initialize socket handler
  ConanSocket.initialize();
  
  // Override Combat.rollInitiative to use custom Edge-based initiative
  CONFIG.Combat.documentClass.prototype.rollInitiative = async function(ids, options = {}) {
    // Get combatant IDs
    const combatantIds = typeof ids === "string" ? [ids] : ids;
    
    // Roll initiative for each combatant using our custom system
    for (let id of combatantIds) {
      const combatant = this.combatants.get(id);
      
      if (combatant?.actor) {
        const { rollInitiative } = await import("./helpers/roll-mechanics.mjs");
        // Use base actor for linked tokens to ensure poison effects are up to date
        const actor = combatant.actor.prototypeToken?.actorLink ? game.actors.get(combatant.actor.id) : combatant.actor;
        // Pass the combatant to properly identify token-based actors
        await rollInitiative(actor, combatant);
      }
    }
    
    return this;
  };
});

/**
 * Register two custom Dice So Nice colorsets for the flex die.
 *   conan_flex_dark  — dark mahogany + gold pips (for players with light dice)
 *   conan_flex_light — warm cream + dark crimson pips (for players with dark dice)
 *
 * dice-utils.mjs → getFlexDieColorset() picks the one that contrasts best
 * with the player's attribute dice colour.
 */
Hooks.once("diceSoNiceReady", (dice3d) => {
  dice3d.addColorset({
    name: "conan_flex_dark",
    description: "Conan Flex Die (Dark)",
    category: "Conan: The Hyborian Age",
    foreground: "#f5c840",   // gold text/pips
    background: "#1a0800",   // very dark brownish-black
    outline: "#c8860a",      // dark gold outline
    texture: "none",
    edge: "#8b4513"           // saddle brown edge
  }, "default");

  dice3d.addColorset({
    name: "conan_flex_light",
    description: "Conan Flex Die (Light)",
    category: "Conan: The Hyborian Age",
    foreground: "#8b0000",   // dark crimson text/pips
    background: "#f5f0e0",   // warm cream / parchment
    outline: "#6b3a2a",      // dark brown outline
    texture: "none",
    edge: "#d4a76a"           // tan edge
  }, "default");
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
      const wounded = actor.system.wounded || false;
      if (wounded) {
        const woundedIcon = document.createElement("img");
        woundedIcon.src = "systems/conan-the-hyborian-age/assets/icons/wounded.svg";
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

    // Add Poisoned icon for ALL actor types if poisoned
    if (actor.system.poisoned) {
      const poisonedIcon = document.createElement("img");
      poisonedIcon.src = "systems/conan-the-hyborian-age/assets/icons/Poisoned.svg";
      poisonedIcon.classList.add("token-effect", "poisoned-icon");
      poisonedIcon.title = game.i18n.localize("CONAN.Poisoned.title");
      poisonedIcon.style.border = "2px solid #15a20e";
      poisonedIcon.style.borderRadius = "3px";
      poisonedIcon.style.width = "20px";
      poisonedIcon.style.height = "20px";
      tokenEffects.appendChild(poisonedIcon);
    }
  });
});

/**
 * Combat hook: End of round - apply poison life drain effect
 */
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
      
      // Handle only characters and antagonists (only they have life points)
      if (actor.type === "character" || actor.type === "antagonist") {
        // Get multiplier for life drain effect
        const multiplier = actor.system.poisonEffects?.effect3Multiplier || 1;
        
        // Characters: lose multiplier * 1 actual life points; Antagonists: lose multiplier * 1 from life points pool
        const currentLife = actor.type === "character"
          ? actor.system.lifePoints.value
          : (actor.system.lifePoints?.value ?? actor.system.lifePoints ?? 0);
        const lifeLoss = multiplier;
        const newLife = Math.max(0, currentLife - lifeLoss);
        
        await actor.update({ "system.lifePoints.value": newLife });
        
        // Build chat message content
        let chatContent = `
          <div class="conan-poison-drain">
            <div class="poison-drain-info">
              <i class="fas fa-skull-crossbones" style="color: #15a20e;"></i>
              <strong>${actor.name}</strong> ${game.i18n.localize('CONAN.Poisoned.lifeDrain')} 
              ${multiplier > 1 ? `(x${multiplier}) ` : ''}(${currentLife} → ${newLife})
            </div>
        `;
        
        // Check if life points reached 0
        if (newLife === 0) {
          if (actor.type === "antagonist") {
            // Antagonist defeated
            chatContent += `
            <div class="defeated-banner" style="margin-top: 10px; padding: 8px; background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%); border-radius: 6px; text-align: center;">
              <i class="fas fa-skull" style="color: white; font-size: 18px;"></i>
              <strong style="color: white; font-size: 16px; display: block; margin-top: 5px;">${game.i18n.localize('CONAN.Damage.defeated').toUpperCase()}</strong>
            </div>
            `;
            
            // Mark as defeated in combat tracker
            const token = combatant.token?.object;
            if (token) {
              await ConanSocket.requestTokenUpdate(
                token.document.parent.id,
                token.document.id,
                { "overlayEffect": CONFIG.controlIcons.defeated }
              );
            }
            await ConanSocket.requestCombatantUpdate(combatant.id, { defeated: true });
            
          } else if (actor.type === "character") {
            // Character - fight for life
            chatContent += `
            <div class="fight-for-life-container" style="margin-top: 10px; padding: 10px; background: rgba(220, 20, 60, 0.1); border: 2px solid #dc143c; border-radius: 6px; text-align: center;">
              <div style="margin-bottom: 8px; color: #8b0000; font-weight: bold;">
                <i class="fas fa-heart-broken" style="color: #dc143c;"></i> ${game.i18n.localize('CONAN.FightForLife.warning')}
              </div>
              <button class="fight-for-life-btn" 
                data-actor-id="${actor.id}"
                style="background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%); 
                       color: white; 
                       border: 2px solid #8b0000; 
                       border-radius: 6px; 
                       padding: 8px 16px; 
                       font-weight: bold; 
                       cursor: pointer; 
                       transition: all 0.2s;">
                <i class="fas fa-dice-d20"></i> ${game.i18n.localize('CONAN.FightForLife.button')}
              </button>
            </div>
            `;
          }
        }
        
        chatContent += `</div>`;
        
        // Notify in chat
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: actor }),
          content: chatContent,
          flavor: game.i18n.localize('CONAN.Poisoned.title')
        });
        
        // Refresh actor sheet to update UI immediately
        actor.sheet?.render(false);
        
        // Refresh Combat Tracker if in combat
        if (ui.combat) {
          ui.combat.render();
        }
      }
    }
  }
});

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
      
      const targetToken = targets[0].document;
      
      // Apply damage
      const { applyNPCDamage } = await import("./helpers/roll-mechanics.mjs");
      await applyNPCDamage(totalDamage, targetToken, attacker);
      
      // Mark damage as dealt and disable button
      await message.setFlag("conan-the-hyborian-age", "damageDealt", true);
      button.disabled = true;
      button.classList.add("disabled");
      button.innerHTML = `<i class="fas fa-check"></i> ${game.i18n.localize('CONAN.Damage.damageDealt')}`;
    });
  }
  
  // Add click handler for "Fight for Life" button
  const fightForLifeBtn = html.querySelector(".fight-for-life-btn");
  if (fightForLifeBtn) {
    fightForLifeBtn.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const actorId = button.dataset.actorId;
      
      const actor = game.actors.get(actorId);
      if (!actor) {
        ui.notifications.error("Actor not found!");
        return;
      }
      
      // Import rollAttribute function
      const { rollAttribute } = await import("./helpers/roll-mechanics.mjs");
      
      // Disable button to prevent multiple clicks
      button.disabled = true;
      button.style.opacity = "0.5";
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${game.i18n.localize('CONAN.FightForLife.rolling')}`;
      
      // Show difficulty dialog pre-filled with difficulty 8 for Grit test
      const { DifficultyDialog } = await import("./helpers/difficulty-dialog.mjs");
      const result = await DifficultyDialog.prompt(actor, { defaultDifficulty: 8 });
      
      if (result === null) {
        // User cancelled - re-enable button
        button.disabled = false;
        button.style.opacity = "1";
        button.innerHTML = `<i class="fas fa-dice-d20"></i> ${game.i18n.localize('CONAN.FightForLife.button')}`;
        return;
      }
      
      // Perform Grit roll
      const gritData = actor.system.attributes.grit;
      if (!gritData) {
        ui.notifications.error("Grit attribute not found");
        return;
      }
      
      const difficulty = result.difficulty || 8; // Default to 8
      let modifier = result.modifier || 0;
      
      // Apply poison effect 2: penalty to all rolls (multiplied)
      const effect2Multiplier = actor.system.poisonEffects?.effect2Multiplier || 1;
      const poisonPenalty = (actor.system.poisoned && actor.system.poisonEffects?.effect2) ? -(effect2Multiplier) : 0;
      
      const gritValue = gritData.value || 0;
      const gritDie = gritData.die || "d6";
      const flexDie = actor.system.flexDie || "d10";
      const flexDieDisabled = actor.system.poisoned && actor.system.poisonEffects?.effect5;
      
      // Roll formulas
      const formula = `1${gritDie} + ${gritValue}`;
      const flexFormula = flexDieDisabled ? null : `1${flexDie}[${getFlexDieColorset()}]`;
      
      // Evaluate rolls
      const mainRoll = await new Roll(formula).evaluate();
      const flexRoll = flexDieDisabled ? null : await new Roll(flexFormula).evaluate();
      
      const mainTotal = mainRoll.total + modifier + poisonPenalty;
      const flexResult = flexDieDisabled ? 0 : flexRoll.dice[0].total;
      const flexMax = flexDieDisabled ? 0 : parseInt(flexDie.substring(1));
      
      // Check for Winds of Fate
      const gritDieResult = mainRoll.dice[0].total;
      const windsOfFate = gritDieResult === 1;
      
      const success = windsOfFate ? false : (mainTotal >= difficulty);
      const flexTriggered = flexDieDisabled ? false : (flexResult === flexMax);
      
      // Show dice in 3D
      if (game.dice3d) {
        const promises = [];
        promises.push(game.dice3d.showForRoll(mainRoll, game.user, false));
        if (!flexDieDisabled) {
          promises.push(game.dice3d.showForRoll(flexRoll, game.user, false));
        }
        await Promise.all(promises);
      }
      
      // Prepare chat message
      const gritLabel = game.i18n.localize("CONAN.Attributes.grit.label");
      const gritAbbr = game.i18n.localize("CONAN.Attributes.grit.abbr");
      const displayName = game.i18n.lang === "pl" ? `${gritAbbr} (${gritLabel})` : gritLabel;
      const modifierText = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
      const isPoisoned = actor.system.poisoned && actor.system.poisonEffects?.effect2;
      
      let outcomeText = "";
      let outcomeClass = "";
      
      if (success) {
        outcomeText = game.i18n.localize('CONAN.FightForLife.unconscious');
        outcomeClass = "success";
      } else {
        outcomeText = game.i18n.localize('CONAN.FightForLife.death');
        outcomeClass = "failure";
      }
      
      const chatContent = `
        <div class="conan-roll-chat fight-for-life-roll ${isPoisoned ? 'poisoned-roll' : ''}">
          <div class="roll-header">
            <h3>
              <i class="fas fa-heart-broken" style="color: #dc143c;"></i>
              ${game.i18n.localize('CONAN.FightForLife.title')}
              ${isPoisoned ? '<i class="fas fa-skull-crossbones poison-skull" style="color: #15a20e;"></i>' : ''}
            </h3>
            <div class="attribute-info">${displayName}</div>
          </div>
          <div class="roll-details">
            <div class="dice-section">
              <div class="dice-roll attribute-die">
                <div class="die-label">${game.i18n.localize('CONAN.Roll.attributeDie')}</div>
                <div class="die-result">${gritDieResult}</div>
              </div>
              ${!flexDieDisabled ? `
              <div class="dice-roll flex-die ${flexTriggered ? 'flex-triggered' : ''}">
                <div class="die-label">${game.i18n.localize('CONAN.Roll.flexDie')}</div>
                <div class="die-result ${flexTriggered ? 'flex-max' : ''}">${flexResult}</div>
                ${flexTriggered ? `<div class="flex-effect-notice"><i class="fas fa-star"></i> ${game.i18n.localize('CONAN.Roll.flexEffect')}</div>` : ''}
              </div>
              ` : ''}
            </div>
            ${windsOfFate ? `<div class="winds-of-fate-banner"><i class="fas fa-wind"></i> ${game.i18n.localize('CONAN.Roll.windsOfFate')}</div>` : ''}
            <div class="roll-calculation">
              <span class="calc-component">${gritDieResult}</span>
              <span class="calc-operator">+</span>
              <span class="calc-component">${gritValue}</span>
              ${modifierText ? `<span class="calc-operator">+</span><span class="calc-component modifier">${modifierText}</span>` : ''}
              ${isPoisoned ? `<span class="calc-operator">-</span><span class="calc-component poison-penalty">1 <i class="fas fa-skull-crossbones"></i></span>` : ''}
              <span class="calc-operator">=</span>
              <span class="calc-total">${mainTotal}</span>
            </div>
            <div class="roll-outcome">
              <div class="difficulty-info">
                <span class="component-label">${game.i18n.localize('CONAN.Roll.targetDifficulty')}:</span>
                <span class="component-value">${difficulty}</span>
              </div>
              <div class="outcome-result ${outcomeClass}">
                ${outcomeText}
              </div>
            </div>
          </div>
        </div>
      `;
      
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: chatContent,
        flavor: game.i18n.localize('CONAN.FightForLife.title'),
        flags: {
          "conan-the-hyborian-age": {
            rollType: "fightForLife",
            success: success
          }
        }
      });
      
      // If flex triggered, show flex dialog
      if (flexTriggered) {
        const { FlexEffectDialog } = await import("./helpers/flex-dialog.mjs");
        const dialog = new FlexEffectDialog(actor, { mainRoll, flexRoll, success, isDamageRoll: false }, {
          rollContext: {
            isAttackRoll: false,
            isFightForLife: true,
            attributeLabel: gritLabel,
            attributeAbbr: gritAbbr,
            displayName: displayName,
            attributeResult: gritDieResult,
            attributeValue: gritValue,
            modifier: modifier,
            difficulty: difficulty,
            total: mainTotal,
            flexResult: flexResult,
            flexMax: flexMax
          }
        });
        dialog.render(true);
      }
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

/**
 * Dodaj przycisk "Opowieść" do paska Scene Controls (lewa kolumna Foundry).
 *
 * W Foundry VTT v13 controls to zwykły obiekt rekordów.
 * Nowa grupa wymaga pola `layer` oraz `tools: {}`.
 * Indywidualny przycisk (bez podmenu) deklarujemy wewnątrz tools z `button: true`.
 */
Hooks.on("getSceneControlButtons", (controls) => {
  controls.tale = {
    name: "tale",
    title: game.i18n.localize("CONAN.Tale.button"),
    icon: "fas fa-scroll",
    layer: "tale",
    visible: true,
    tools: {}
  };

  controls.tale.tools.openTale = {
    name: "openTale",
    title: game.i18n.localize("CONAN.Tale.button"),
    icon: "fas fa-scroll",
    visible: true,
    button: true,
    onChange: () => {
      if (game.user.isGM) {
        TaleDialog.open();
      } else {
        TalePlayerDialog.open();
      }
    }
  };
});

