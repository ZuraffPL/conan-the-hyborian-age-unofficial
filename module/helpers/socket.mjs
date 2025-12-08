/**
 * Socket handler for Conan: The Hyborian Age
 * Handles communication between clients for multiplayer features
 */

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
}
