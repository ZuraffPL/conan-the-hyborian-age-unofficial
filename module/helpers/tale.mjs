/**
 * Tale Dialog for Conan: The Hyborian Age
 *
 * Wyświetla okno "Opowieść" z licznikiem czasu HH:MM:SS.
 * Stan timera jest trwały – przeżywa reload strony i restart Foundry:
 *  - Przy starcie zapisuje znacznik czasu (epoch ms) do game.settings.
 *  - Przy pauzie/stopie zapisuje naliczone sekundy i czyści znacznik.
 *  - Przy przywracaniu (ready) oblicza czas, który upłynął od ostatniego startu.
 */

// ---------------------------------------------------------------------------
// Klucz namespace dla ustawień
// ---------------------------------------------------------------------------
const NS = "conan-the-hyborian-age";

// ---------------------------------------------------------------------------
// Moduł-level runtime state (tylko czas życia karty przeglądarki)
// ---------------------------------------------------------------------------
const _state = {
  seconds:        0,
  running:        false,
  interval:       null,
  taleName:       "",
  _saveInterval:  null,      // co 5s zapis do settings
  _syncInterval:  null,      // co 15s socket sync do graczy
  _boundUnload:   null       // referencja do handlera beforeunload
};

// ---------------------------------------------------------------------------
// Player-side runtime state (klienci non-GM)
// ---------------------------------------------------------------------------
const _playerState = {
  seconds:  0,
  running:  false,
  interval: null,
  taleName: ""
};

// ---------------------------------------------------------------------------
// TaleDialog class
// ---------------------------------------------------------------------------
export class TaleDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {

  static DEFAULT_OPTIONS = {
    id: "tale-dialog",
    classes: ["conan", "dialog", "tale"],
    tag: "dialog",
    window: {
      title: "CONAN.Tale.title",
      contentClasses: ["standard-form"]
    },
    position: {
      width:  400,
      height: "auto",
      left:   15,
      top:    450
    },
    actions: {
      taleStart:    TaleDialog._onTaleStart,
      talePause:    TaleDialog._onTalePause,
      taleStop:     TaleDialog._onTaleStop,
      taleRecovery: TaleDialog._onTaleRecovery
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/tale-dialog.hbs"
    }
  };

  // Singleton – jeden egzemplarz na raz
  static _instance = null;

  // ---------------------------------------------------------------------------
  // Rejestracja ustawień (wywołaj raz w Hooks.once("init"))
  // ---------------------------------------------------------------------------

  static registerSettings() {
    // Nazwa opowieści
    game.settings.register(NS, "tale-name", {
      scope: "world",
      config: false,
      type: String,
      default: ""
    });
    // Naliczone sekundy w chwili ostatniego pauzy / stopu
    game.settings.register(NS, "tale-base-seconds", {
      scope: "world",
      config: false,
      type: Number,
      default: 0
    });
    // Znacznik czasu (epoch ms) startu aktywnego odliczania; 0 = timer zatrzymany
    game.settings.register(NS, "tale-start-timestamp", {
      scope: "world",
      config: false,
      type: Number,
      default: 0
    });
    // Flaga czy opowieść jest aktywna (dla playerów przy reconnect)
    game.settings.register(NS, "tale-is-running", {
      scope: "world",
      config: false,
      type: Boolean,
      default: false
    });
    // Liczba użyć Oddechu per postać { actorId: usesLeft }, reset przy Stop
    game.settings.register(NS, "tale-recovery-uses", {
      scope: "world",
      config: false,
      type: Object,
      default: {}
    });
  }

  // ---------------------------------------------------------------------------
  // Przywracanie stanu po przeładowaniu (wywołaj w Hooks.once("ready"))
  // ---------------------------------------------------------------------------

  static restoreState() {
    const name      = game.settings.get(NS, "tale-name");
    const base      = game.settings.get(NS, "tale-base-seconds");
    const startedAt = game.settings.get(NS, "tale-start-timestamp");
    const isRunning = game.settings.get(NS, "tale-is-running");

    if (game.user.isGM) {
      // --- GM: przywróć stan GM-a ---
      _state.taleName = name;
      _state.seconds  = base;
      _state.running  = false;

      if (startedAt > 0) {
        // Timer był aktywny przy zamknięciu – traktuj jako pauzę od ostatniego zapisu.
        game.settings.set(NS, "tale-start-timestamp", 0);
      }

      // Jeśli opowieść istniała – auto-otwórz dialog GM (setTimeout = czekamy na pełny DOM)
      const taleExistsForGM = isRunning || base > 0 || name.trim() !== "";
      if (taleExistsForGM) {
        setTimeout(() => TaleDialog.open(), 0);
      }
    } else {
      // --- Gracz: jeśli opowieść istnieje (aktywna LUB zapauzowana), otwórz widok ---
      // tale-is-running = true  → timer aktywnie biegł przed F5
      // base > 0               → timer był zapauzowany przed F5
      const taleExists = isRunning || base > 0;

      if (taleExists) {
        _playerState.taleName = name;
        // Zawsze zaczynamy od zamrożonego stanu – czekamy na Start od GM.
        // Nie próbujemy liczyć elapsed (race condition z GM restoreState,
        // który jednocześnie zeruje tale-start-timestamp).
        _playerState.seconds = base;
        _playerState.running = false;
        setTimeout(() => TalePlayerDialog.open(), 0);
        // Ticker NIE jest tu uruchamiany – wystartuje dopiero przy socket "taleStart".
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Zapis stanu do game.settings
  // ---------------------------------------------------------------------------

  static async _saveState() {
    await game.settings.set(NS, "tale-name",            _state.taleName);
    await game.settings.set(NS, "tale-base-seconds",    _state.seconds);
    // startTimestamp zapisują akcje start/pause/stop indywidualnie
  }

  // ---------------------------------------------------------------------------
  // Static interface
  // ---------------------------------------------------------------------------

  static open() {
    if (!TaleDialog._instance || !TaleDialog._instance.rendered) {
      TaleDialog._instance = new TaleDialog();
    }
    TaleDialog._instance.render(true);
    return TaleDialog._instance;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Zwraca listę { user, actor } dla wszystkich aktywnych postaci graczy (non-GM).
   */
  static getActivePlayerCharacters() {
    const characters = [];
    game.users.forEach(user => {
      if (user.isGM || !user.active) return;  // tylko aktywni (online) gracze
      const owned = game.actors.filter(a =>
        a.type === "character" &&
        a.ownership?.[user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      );
      owned.forEach(actor => characters.push({ user, actor }));
    });
    return characters;
  }

  static _formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [
      String(h).padStart(2, "0"),
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0")
    ].join(":");
  }

  // ---------------------------------------------------------------------------
  // Context
  // ---------------------------------------------------------------------------

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.taleName  = _state.taleName;
    context.time      = TaleDialog._formatTime(_state.seconds);
    context.isRunning = _state.running;

    // Sekcja Odpoczynek – załaduj aktywne postaci graczy z licznikami
    const recoveryUses = game.settings.get(NS, "tale-recovery-uses") ?? {};
    context.recoveryChars = TaleDialog.getActivePlayerCharacters().map(({ user, actor }) => {
      const usesLeft = recoveryUses[actor.id] ?? 2;
      return {
        actorId:       actor.id,
        name:          actor.name,
        img:           actor.img || "icons/svg/mystery-man.svg",
        usesLeft,
        usesExhausted: usesLeft <= 0,
        playerName:    user.name,
        hpValue:        actor.system.lifePoints?.actual ?? 0,
        hpMax:          actor.system.lifePoints?.max    ?? 0,
        hpEmptyPercent: 100 - Math.round(((actor.system.lifePoints?.actual ?? 0) / Math.max(actor.system.lifePoints?.max ?? 1, 1)) * 100)
      };
    });

    return context;
  }

  // ---------------------------------------------------------------------------
  // Render callback – synchronizuje stan po każdym renderze
  // ---------------------------------------------------------------------------

  async _onRender(context, options) {
    await super._onRender(context, options);

    const nameInput = this.element.querySelector(".tale-name-input");
    if (nameInput) {
      nameInput.value = _state.taleName;
      nameInput.addEventListener("input", async (e) => {
        _state.taleName = e.target.value;
        await game.settings.set(NS, "tale-name", _state.taleName);
        // Poinformuj graczy o zmianie nazwy
        game.socket.emit("system.conan-the-hyborian-age", {
          type: "taleNameUpdate",
          senderId: game.user.id,
          taleName: _state.taleName
        });
      });
    }

    TaleDialog._syncButtons(this.element);
  }

  // ---------------------------------------------------------------------------
  // Akcje przycisków
  // ---------------------------------------------------------------------------

  static async _onTaleStart(event, target) {
    if (_state.running) return;

    const now = Date.now();
    _state.running = true;

    // Zapisz punkt startu
    await game.settings.set(NS, "tale-base-seconds",    _state.seconds);
    await game.settings.set(NS, "tale-start-timestamp", now);
    await game.settings.set(NS, "tale-is-running",      true);

    // Otwórz widok graczy i poinformuj ich o starcie
    game.socket.emit("system.conan-the-hyborian-age", {
      type: "taleStart",
      senderId: game.user.id,
      seconds:  _state.seconds,
      taleName: _state.taleName
    });

    // --- Handler beforeunload: zapisuje czas tuż przed F5/zamknięciem karty ---
    _state._boundUnload = () => {
      game.settings.set(NS, "tale-base-seconds",    _state.seconds);
      game.settings.set(NS, "tale-start-timestamp", 0);
    };
    window.addEventListener("beforeunload", _state._boundUnload);

    // --- Zapis do settings co 5s (backup) ---
    _state._saveInterval = setInterval(() => {
      game.settings.set(NS, "tale-base-seconds", _state.seconds);
    }, 5_000);

    // --- Socket sync do graczy co 15s ---
    _state._syncInterval = setInterval(() => {
      game.socket.emit("system.conan-the-hyborian-age", {
        type: "taleSync",
        senderId: game.user.id,
        seconds:  _state.seconds,
        taleName: _state.taleName,
        running:  _state.running
      });
    }, 15_000);

    // Ticker
    _state.interval = setInterval(() => {
      _state.seconds++;
      TaleDialog._tickDisplay();
    }, 1000);

    TaleDialog._syncButtons(TaleDialog._instance?.element);
  }

  static async _onTalePause(event, target) {
    if (!_state.running) return;

    _state.running = false;
    clearInterval(_state.interval);
    _state.interval = null;
    clearInterval(_state._saveInterval);
    _state._saveInterval = null;
    clearInterval(_state._syncInterval);
    _state._syncInterval = null;
    if (_state._boundUnload) {
      window.removeEventListener("beforeunload", _state._boundUnload);
      _state._boundUnload = null;
    }

    await game.settings.set(NS, "tale-base-seconds",    _state.seconds);
    await game.settings.set(NS, "tale-start-timestamp", 0);
    await game.settings.set(NS, "tale-is-running",      false);

    // Poinformuj graczy o pauzie
    game.socket.emit("system.conan-the-hyborian-age", {
      type: "talePause",
      senderId: game.user.id
    });

    TaleDialog._syncButtons(TaleDialog._instance?.element);
  }

  static async _onTaleStop(event, target) {
    _state.running = false;
    clearInterval(_state.interval);
    _state.interval = null;
    clearInterval(_state._saveInterval);
    _state._saveInterval = null;
    clearInterval(_state._syncInterval);
    _state._syncInterval = null;
    if (_state._boundUnload) {
      window.removeEventListener("beforeunload", _state._boundUnload);
      _state._boundUnload = null;
    }
    _state.seconds = 0;

    await game.settings.set(NS, "tale-base-seconds",    0);
    await game.settings.set(NS, "tale-start-timestamp", 0);
    await game.settings.set(NS, "tale-is-running",      false);

    // Poinformuj graczy o stopie (zamknij ich okno)
    game.socket.emit("system.conan-the-hyborian-age", {
      type: "taleStop",
      senderId: game.user.id
    });

    // Zresetuj liczniki Oddechu dla nowej opowieści
    await game.settings.set(NS, "tale-recovery-uses", {});
    // Poinformuj graczy o resecie
    game.socket.emit("system.conan-the-hyborian-age", {
      type: "taleRecoveryUpdate",
      senderId: game.user.id,
      resetAll: true
    });

    TaleDialog._tickDisplay();
    TaleDialog._syncButtons(TaleDialog._instance?.element);
  }

  // ---------------------------------------------------------------------------
  // Akcja Odpoczynek
  // ---------------------------------------------------------------------------

  static async _onTaleRecovery(event, target) {
    const actorId = target.dataset.actorId;
    await TaleDialog._decrementRecovery(actorId);
  }

  /**
   * Dekrementuje licznik Oddechu dla aktora, zapisuje i emituje socket.
   */
  static async _decrementRecovery(actorId) {
    const uses = foundry.utils.duplicate(game.settings.get(NS, "tale-recovery-uses") ?? {});
    const current = uses[actorId] ?? 2;
    if (current <= 0) return;
    uses[actorId] = current - 1;
    await game.settings.set(NS, "tale-recovery-uses", uses);

    // --- Efekt mechaniczny (wykonuje wyłącznie GM, który ma uprawnienia do edycji) ---
    const actor = game.actors.get(actorId);
    if (actor) {
      const lpMax    = actor.system.lifePoints?.max    ?? 0;
      const lpActual = actor.system.lifePoints?.actual ?? 0;
      const stam     = actor.system.stamina?.value     ?? 0;

      // Gdy HP pełne – tylko +1 stamina, bez leczenia
      const atFullHP = lpActual >= lpMax;
      const heal     = atFullHP ? 0 : Math.ceil(lpMax / 2);
      const newLP    = Math.min(lpActual + heal, lpMax);
      const newStam  = stam + 1;

      await actor.update({
        "system.lifePoints.actual": newLP,
        "system.stamina.value":     newStam
      });
      // updateActor hook automatycznie odświeży wyświetlanie HP w dialogach

      // Wiadomość na czat
      const actualHeal = newLP - lpActual;
      const healLine = atFullHP
        ? `<div class="tale-recovery-chat-row tale-recovery-chat-full"><i class="fas fa-heart"></i> ${game.i18n.localize("CONAN.Tale.recoveryChatFullHP")}</div>`
        : `<div class="tale-recovery-chat-row tale-recovery-chat-heal"><i class="fas fa-heart"></i> ${game.i18n.format("CONAN.Tale.recoveryChatLP", { heal: actualHeal })}</div>`;
      const chatContent = `<div class="tale-recovery-chat"><div class="tale-recovery-chat-header"><i class="fas fa-bed"></i><span>${game.i18n.format("CONAN.Tale.recoveryChatHeader", { name: actor.name })}</span></div><div class="tale-recovery-chat-body">${healLine}<div class="tale-recovery-chat-row tale-recovery-chat-stam"><i class="fas fa-bolt"></i> ${game.i18n.localize("CONAN.Tale.recoveryChatStamina")}</div></div></div>`;
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: chatContent,
        flags: { "conan-the-hyborian-age": { taleRecovery: true } }
      });
    }

    // Odśwież DOM GM
    TaleDialog._refreshRecoveryDisplay();

    // Poinformuj graczy
    game.socket.emit("system.conan-the-hyborian-age", {
      type: "taleRecoveryUpdate",
      senderId: game.user.id,
      actorId,
      usesLeft: uses[actorId]
    });
  }

  /**
   * Wywoływana z socket gdy gracz żąda Oddechu – GM wykonuje dekrement.
   */
  static async handleRecoveryRequest(data) {
    if (!game.user.isGM) return;
    await TaleDialog._decrementRecovery(data.actorId);
  }

  /**
   * Odśwież wyniki HP dla danego aktora w otwartych dialogach (GM i gracz).
   * Wywoływana przez hook updateActor.
   */
  static _refreshHPDisplay(actor) {
    const lpActual   = actor.system.lifePoints?.actual ?? 0;
    const lpMax      = actor.system.lifePoints?.max    ?? 0;
    const hpText     = `${lpActual} / ${lpMax}`;
    const emptyPct   = lpMax > 0 ? Math.max(0, 100 - Math.round((lpActual / lpMax) * 100)) : 100;
    for (const el of [
      TaleDialog._instance?.element,
      TalePlayerDialog._playerInstance?.element
    ]) {
      if (!el) continue;
      const span = el.querySelector(`.tale-recovery-hp[data-actor-id="${actor.id}"]`);
      if (span) span.textContent = hpText;
      const track = el.querySelector(`.tale-recovery-hp-bar-track[data-actor-id="${actor.id}"]`);
      if (track) track.style.setProperty("--empty-pct", `${emptyPct}%`);
    }
  }

  /**
   * Odśwież sekcję Recovery w dialogu GM bez pełnego re-renderu.
   */
  static _refreshRecoveryDisplay() {
    const el = TaleDialog._instance?.element;
    if (!el) return;
    const uses = game.settings.get(NS, "tale-recovery-uses") ?? {};
    el.querySelectorAll(".tale-recovery-entry").forEach(entry => {
      const actorId = entry.dataset.actorId;
      const usesLeft = uses[actorId] ?? 2;
      const badge = entry.querySelector(".tale-recovery-badge");
      if (badge) badge.textContent = usesLeft;
      const btn = entry.querySelector(".tale-btn-recovery");
      if (btn) btn.disabled = usesLeft <= 0;
    });
  }

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------

  static _tickDisplay() {
    const el = TaleDialog._instance?.element;
    if (!el) return;
    const display = el.querySelector(".tale-timer-display");
    if (display) {
      display.textContent = TaleDialog._formatTime(_state.seconds);
    }
  }

  static _syncButtons(el) {
    if (!el) return;
    const startBtn = el.querySelector("[data-action='taleStart']");
    const pauseBtn = el.querySelector("[data-action='talePause']");
    const stopBtn  = el.querySelector("[data-action='taleStop']");

    if (startBtn) {
      startBtn.disabled = _state.running;
      startBtn.classList.toggle("active", _state.running);
    }
    if (pauseBtn) {
      pauseBtn.disabled = !_state.running;
    }
    if (stopBtn) {
      stopBtn.disabled = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  async close(options = {}) {
    TaleDialog._instance = null;
    return super.close(options);
  }

  // ---------------------------------------------------------------------------
  // Obsługa eventów socket (wywoływana z ConanSocket._handleSocketEvent)
  // ---------------------------------------------------------------------------

  static handleSocketEvent(data) {
    // Eventy tale obsługują TYLKO gracze (nie GM)
    if (game.user.isGM) return;

    switch (data.type) {
      case "taleStart": {
        _playerState.taleName = data.taleName ?? "";
        _playerState.seconds  = data.seconds  ?? 0;
        // Uruchom lokalny timer gracza
        clearInterval(_playerState.interval);
        _playerState.running  = true;
        _playerState.interval = setInterval(() => {
          _playerState.seconds++;
          TalePlayerDialog._tickDisplay();
        }, 1000);
        TalePlayerDialog.open();
        break;
      }
      case "talePause":
        _playerState.running = false;
        clearInterval(_playerState.interval);
        _playerState.interval = null;
        TalePlayerDialog._syncDisplay();
        break;

      case "taleStop":
        _playerState.running = false;
        clearInterval(_playerState.interval);
        _playerState.interval = null;
        _playerState.seconds  = 0;
        TalePlayerDialog.closeInstance();
        break;

      case "taleSync": {
        // Korekcja driftu co 15s + synchronizacja stanu running
        _playerState.seconds  = data.seconds  ?? _playerState.seconds;
        _playerState.taleName = data.taleName ?? _playerState.taleName;
        const gmRunning = data.running ?? false;

        if (gmRunning && !_playerState.running) {
          // GM ma uruchomiony timer, a gracz nie – uruchom ticker
          _playerState.running = true;
          clearInterval(_playerState.interval);
          _playerState.interval = setInterval(() => {
            _playerState.seconds++;
            TalePlayerDialog._tickDisplay();
          }, 1000);
          // Upewnij się, że dialog jest otwarty
          TalePlayerDialog.open();
        } else if (!gmRunning && _playerState.running) {
          // GM ma zatrzymany timer – zatrzymaj ticker gracza
          _playerState.running = false;
          clearInterval(_playerState.interval);
          _playerState.interval = null;
        }

        TalePlayerDialog._syncDisplay();
        break;
      }

      case "taleNameUpdate":
        _playerState.taleName = data.taleName ?? "";
        TalePlayerDialog._updateName();
        break;

      case "taleRecoveryUpdate":
        if (data.resetAll) {
          // Tale Stop – reset wszystkich odznak u gracza
          TalePlayerDialog._refreshRecoveryReset();
        } else {
          TalePlayerDialog._refreshRecovery(data.actorId, data.usesLeft ?? 0);
        }
        break;
    }
  }
}

// ===========================================================================
// TalePlayerDialog – widok tylko do odczytu dla graczy
// ===========================================================================
export class TalePlayerDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {

  static DEFAULT_OPTIONS = {
    id: "tale-player-dialog",
    classes: ["conan", "dialog", "tale", "tale-player"],
    tag: "dialog",
    window: {
      title: "CONAN.Tale.title",
      contentClasses: ["standard-form"]
    },
    position: {
      width:  400,
      height: "auto",
      left:   15,
      top:    450
    },
    actions: {
      taleRecovery: TalePlayerDialog._onTaleRecovery
    }
  };

  static PARTS = {
    form: {
      template: "systems/conan-the-hyborian-age/templates/dialogs/tale-player-dialog.hbs"
    }
  };

  static _playerInstance = null;

  static open() {
    if (!TalePlayerDialog._playerInstance || !TalePlayerDialog._playerInstance.rendered) {
      TalePlayerDialog._playerInstance = new TalePlayerDialog();
    }
    TalePlayerDialog._playerInstance.render(true);
    return TalePlayerDialog._playerInstance;
  }

  static closeInstance() {
    if (TalePlayerDialog._playerInstance?.rendered) {
      TalePlayerDialog._playerInstance.close();
    }
    TalePlayerDialog._playerInstance = null;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.taleName = _playerState.taleName;
    context.time     = TaleDialog._formatTime(_playerState.seconds);

    // Sekcja Odpoczynek – tylko własne postaci gracza
    const recoveryUses = game.settings.get(NS, "tale-recovery-uses") ?? {};
    const myChars = game.actors.filter(a =>
      a.type === "character" &&
      a.ownership?.[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    );
    context.myCharacters = myChars.map(actor => {
      const usesLeft = recoveryUses[actor.id] ?? 2;
      return {
        actorId:       actor.id,
        name:          actor.name,
        img:           actor.img || "icons/svg/mystery-man.svg",
        usesLeft,
        usesExhausted: usesLeft <= 0,
        hpValue:        actor.system.lifePoints?.actual ?? 0,
        hpMax:          actor.system.lifePoints?.max    ?? 0,
        hpEmptyPercent: 100 - Math.round(((actor.system.lifePoints?.actual ?? 0) / Math.max(actor.system.lifePoints?.max ?? 1, 1)) * 100)
      };
    });

    return context;
  }

  // Aktualizacja zegara bez re-renderu
  static _tickDisplay() {
    const el = TalePlayerDialog._playerInstance?.element;
    if (!el) return;
    const display = el.querySelector(".tale-timer-display");
    if (display) display.textContent = TaleDialog._formatTime(_playerState.seconds);
  }

  // Aktualizacja zarówno zegara jak i nazwy
  static _syncDisplay() {
    TalePlayerDialog._tickDisplay();
    TalePlayerDialog._updateName();
  }

  // Aktualizacja samej nazwy
  static _updateName() {
    const el = TalePlayerDialog._playerInstance?.element;
    if (!el) return;
    const nameEl = el.querySelector(".tale-player-name");
    if (nameEl) nameEl.textContent = _playerState.taleName;
  }

  // Obsługa kliknięcia Odpoczynek przez gracza – forward do GM przez socket
  static _onTaleRecovery(event, target) {
    const actorId = target.dataset.actorId;
    game.socket.emit("system.conan-the-hyborian-age", {
      type: "taleRecoveryRequest",
      senderId: game.user.id,
      actorId
    });
    // Optymistyczna blokada przycisku – odblokuje się przy taleRecoveryUpdate
    target.disabled = true;
  }

  // Aktualizacja odznaki Recovery dla konkretnego aktora
  static _refreshRecovery(actorId, usesLeft) {
    const el = TalePlayerDialog._playerInstance?.element;
    if (!el) return;
    const badge = el.querySelector(`.tale-recovery-entry[data-actor-id="${actorId}"] .tale-recovery-badge`);
    if (badge) badge.textContent = usesLeft;
    const btn = el.querySelector(`.tale-recovery-entry[data-actor-id="${actorId}"] .tale-btn-recovery`);
    if (btn) btn.disabled = usesLeft <= 0;
  }

  // Reset wszystkich odznak Recovery do 2 (po tale Stop)
  static _refreshRecoveryReset() {
    const el = TalePlayerDialog._playerInstance?.element;
    if (!el) return;
    el.querySelectorAll(".tale-recovery-entry").forEach(entry => {
      const badge = entry.querySelector(".tale-recovery-badge");
      if (badge) badge.textContent = "2";
      const btn = entry.querySelector(".tale-btn-recovery");
      if (btn) btn.disabled = false;
    });
  }

  async close(options = {}) {
    TalePlayerDialog._playerInstance = null;
    return super.close(options);
  }
}

// ---------------------------------------------------------------------------
// Hook: aktualizuj HP na żywo gdy zmieni się karta postaci gracza
// ---------------------------------------------------------------------------
Hooks.on("updateActor", (actor) => {
  if (actor.type === "character") {
    TaleDialog._refreshHPDisplay(actor);
  }
});

// ---------------------------------------------------------------------------
// Hook: odśwież sekcję Recovery w dialogu GM gdy gracz dołącza / wychodzi
// ---------------------------------------------------------------------------
Hooks.on("userConnected", (user, connected) => {
  if (!game.user.isGM) return;
  const instance = TaleDialog._instance;
  if (instance?.rendered) instance.render({ force: true });
});
