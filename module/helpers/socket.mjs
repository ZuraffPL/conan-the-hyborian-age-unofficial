/**
 * Socket handler for Conan: The Hyborian Age
 * Handles communication between clients for multiplayer features
 */

import { TaleDialog } from "./tale.mjs";

export class ConanSocket {
  static SOCKET_NAME = "system.conan-the-hyborian-age";

  /**
   * Initialize the socket handler
   */
  static initialize() {
    game.socket.on(this.SOCKET_NAME, (data) => {
      this._handleSocketEvent(data);
    });
  }

  /**
   * Handle incoming socket events
   * @param {Object} data - The socket data
   */
  static _handleSocketEvent(data) {
    if (!data || !data.type) {
      console.warn("Conan | Invalid socket data received", data);
      return;
    }

    switch (data.type) {
      case "roll":
        this._handleRoll(data);
        break;
      case "updateActor":
        this._handleActorUpdate(data);
        break;
      case "syncActorUpdate":
        this._handleSyncActorUpdate(data);
        break;
      case "updateToken":
        this._handleTokenUpdate(data);
        break;
      case "tokenUpdateComplete":
        // Optional: handle confirmation of token update
        break;
      case "updateCombatant":
        this._handleCombatantUpdate(data);
        break;
      case "requestActorUpdate":
        this._handleActorUpdateRequest(data);
        break;
      case "taleStart":
      case "talePause":
      case "taleStop":
      case "taleSync":
      case "taleNameUpdate":
      case "taleRecoveryUpdate":
        TaleDialog.handleSocketEvent(data);
        break;
      case "taleRecoveryRequest":
        // Gracz żąda Oddechu – przetwarza tylko pierwszy aktywny GM (unika duplikatów gdy jest wielu GM)
        if (game.user.isGM && game.user === game.users.find(u => u.isGM && u.active)) TaleDialog.handleRecoveryRequest(data);
        break;
      case "notification":
        this._handleNotification(data);
        break;
      default:
        console.warn(`Conan | Unknown socket event type: ${data.type}`);
    }
  }

  /**
   * Emit a socket event to all clients
   * @param {string} type - The event type
   * @param {Object} payload - The event payload
   */
  static emit(type, payload = {}) {
    const data = {
      type: type,
      senderId: game.user.id,
      timestamp: Date.now(),
      ...payload
    };

    game.socket.emit(this.SOCKET_NAME, data);
  }

  /**
   * Handle roll events from other clients
   * @param {Object} data - The roll data
   */
  static _handleRoll(data) {
    if (!data.roll || !data.actorId) {
      console.warn("Conan | Invalid roll data", data);
      return;
    }

    // Display the roll result for all players
    ui.notifications.info(`${data.actorName} rolled ${data.roll.total}`);
  }

  /**
   * Handle actor update events
   * @param {Object} data - The update data
   */
  static _handleActorUpdate(data) {
    if (!data.actorId) {
      console.warn("Conan | Invalid actor update data", data);
      return;
    }

    // Refresh the actor sheet if it's open
    const actor = game.actors.get(data.actorId);
    if (actor && actor.sheet.rendered) {
      actor.sheet.render(false);
    }
  }

  /**
   * Handle actor update request events (GM only)
   * @param {Object} data - The actor update data
   */
  static async _handleActorUpdateRequest(data) {
    // Only GM can execute actor updates
    if (!game.user.isGM) {
      return;
    }

    if (!data.actorId || !data.updateData) {
      console.warn("Conan | Invalid actor update request data", data);
      return;
    }

    try {
      const actor = game.actors.get(data.actorId);
      if (!actor) {
        console.warn(`Conan | Actor not found: ${data.actorId}`);
        return;
      }

      await actor.update(data.updateData);
    } catch (error) {
      console.error("Conan | Error updating actor:", error);
    }
  }

  /**
   * Handle sync actor update events
   * @param {Object} data - The sync update data
   */
  static _handleSyncActorUpdate(data) {
    if (!data.actorId || !data.updateData) {
      console.warn("Conan | Invalid sync actor update data", data);
      return;
    }

    const actor = game.actors.get(data.actorId);
    if (actor) {
      actor.update(data.updateData);
      // Refresh the actor sheet if it's open
      if (actor.sheet.rendered) {
        actor.sheet.render(false);
      }
    }
  }

  /**
   * Handle token update events (GM only)
   * @param {Object} data - The token update data
   */
  static async _handleTokenUpdate(data) {
    // Only GM can execute token updates
    if (!game.user.isGM) {
      return;
    }

    if (!data.sceneId || !data.tokenId || !data.updateData) {
      console.warn("Conan | Invalid token update data", data);
      return;
    }

    try {
      const scene = game.scenes.get(data.sceneId);
      if (!scene) {
        console.warn(`Conan | Scene not found: ${data.sceneId}`);
        return;
      }

      const token = scene.tokens.get(data.tokenId);
      if (!token) {
        console.warn(`Conan | Token not found: ${data.tokenId}`);
        return;
      }

      await token.update(data.updateData);
    } catch (error) {
      console.error("Conan | Error updating token:", error);
    }
  }

  /**
   * Handle combatant update events (GM only)
   * @param {Object} data - The combatant update data
   */
  static async _handleCombatantUpdate(data) {
    // Only GM can execute combatant updates
    if (!game.user.isGM) {
      return;
    }

    if (!data.combatantId || !data.updateData) {
      console.warn("Conan | Invalid combatant update data", data);
      return;
    }

    try {
      const combat = game.combat || game.combats.get(data.combatId);
      if (!combat) {
        console.warn(`Conan | Combat not found`);
        return;
      }

      const combatant = combat.combatants.get(data.combatantId);
      if (!combatant) {
        console.warn(`Conan | Combatant not found: ${data.combatantId}`);
        return;
      }

      await combatant.update(data.updateData);
    } catch (error) {
      console.error("Conan | Error updating combatant:", error);
    }
  }

  /**
   * Handle notification events
   * @param {Object} data - The notification data
   */
  static _handleNotification(data) {
    if (!data.message) {
      console.warn("Conan | Invalid notification data", data);
      return;
    }

    const type = data.level || "info";
    ui.notifications[type](data.message);
  }

  /**
   * Broadcast a roll to all clients
   * @param {Actor} actor - The actor performing the roll
   * @param {Roll} roll - The roll result
   * @param {string} rollType - The type of roll (attribute, skill, damage, etc.)
   */
  static broadcastRoll(actor, roll, rollType) {
    this.emit("roll", {
      actorId: actor.id,
      actorName: actor.name,
      roll: {
        formula: roll.formula,
        total: roll.total,
        terms: roll.terms
      },
      rollType: rollType
    });
  }

  /**
   * Notify all clients of an actor update
   * @param {string} actorId - The actor ID
   */
  static notifyActorUpdate(actorId) {
    this.emit("updateActor", {
      actorId: actorId
    });
  }

  /**
   * Send a notification to all clients
   * @param {string} message - The notification message
   * @param {string} level - The notification level (info, warn, error)
   */
  static sendNotification(message, level = "info") {
    this.emit("notification", {
      message: message,
      level: level
    });
  }

  /**
   * Request token update through GM (for players without token update permissions)
   * @param {string} sceneId - The scene ID
   * @param {string} tokenId - The token ID
   * @param {Object} updateData - The update data
   * @returns {Promise<void>}
   */
  static async requestTokenUpdate(sceneId, tokenId, updateData) {
    // If user is GM, update directly
    if (game.user.isGM) {
      const scene = game.scenes.get(sceneId);
      if (!scene) {
        throw new Error(`Scene not found: ${sceneId}`);
      }
      const token = scene.tokens.get(tokenId);
      if (!token) {
        throw new Error(`Token not found: ${tokenId}`);
      }
      return await token.update(updateData);
    }

    // Otherwise, send request to GM via socket
    this.emit("updateToken", {
      sceneId: sceneId,
      tokenId: tokenId,
      updateData: updateData
    });

    // Wait a bit to allow GM to process the request
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Request combatant update through GM (for players without combatant update permissions)
   * @param {string} combatantId - The combatant ID
   * @param {Object} updateData - The update data
   * @param {string} combatId - Optional combat ID (uses active combat if not provided)
   * @returns {Promise<void>}
   */
  static async requestCombatantUpdate(combatantId, updateData, combatId = null) {
    // If user is GM, update directly
    if (game.user.isGM) {
      const combat = combatId ? game.combats.get(combatId) : game.combat;
      if (!combat) {
        throw new Error(`Combat not found`);
      }
      const combatant = combat.combatants.get(combatantId);
      if (!combatant) {
        throw new Error(`Combatant not found: ${combatantId}`);
      }
      return await combatant.update(updateData);
    }

    // Otherwise, send request to GM via socket
    this.emit("updateCombatant", {
      combatId: combatId,
      combatantId: combatantId,
      updateData: updateData
    });

    // Wait a bit to allow GM to process the request
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Request actor update through GM (for players without actor update permissions)
   * @param {string} actorId - The actor ID
   * @param {Object} updateData - The update data
   * @returns {Promise<void>}
   */
  static async requestActorUpdate(actorId, updateData) {
    // If user is GM, update directly
    if (game.user.isGM) {
      const actor = game.actors.get(actorId);
      if (!actor) {
        throw new Error(`Actor not found: ${actorId}`);
      }
      return await actor.update(updateData);
    }

    // Otherwise, send request to GM via socket
    this.emit("requestActorUpdate", {
      actorId: actorId,
      updateData: updateData
    });

    // Wait a bit to allow GM to process the request
    return new Promise(resolve => setTimeout(resolve, 100));
  }
}
