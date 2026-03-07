# Release Notes - Conan: The Hyborian Age System

## Current Version: v0.0.64 - Poprawki UX Opowieści

### Overview

Wersja 0.0.64 poprawia układ okna Opowieści (etykieta Odpoczynek nad przyciskami), resetuje licznik Oddechu po Wytchnieniu oraz ujednolica kolory ikon w wiadomościach czatu.

### What's New in v0.0.64

#### Etykieta „Odpoczynek" przeniesiona nad przyciski

- Nagłówek sekcji Odpoczynek (ikona łóżka + napis) jest teraz wyświetlany w osobnym wierszu powyżej przycisków „+1 Odpoczynek" i „Wytchnienie"
- Przyciski nie wychodzą już poza granice okna dialogowego

#### Wytchnienie resetuje licznik Oddechu

- Po wykonaniu Wytchnienia licznik użyć Oddechu jest przywracany do 2/2 dla wszystkich aktywnych postaci graczy
- Reset jest natychmiast synchronizowany przez socket do widoków graczy

#### Kolory ikon w wiadomości czatu Wytchnienia

- Ikona serca (LP przywrócone do max) — czerwona, spójna z wiadomością Odpoczynku
- Ikona błyskawicy (Wytrzymałość przywrócona do Sprytu) — niebieska, spójna z wiadomością Odpoczynku
- Ikona fiolki (efekty trucizny wyczyszczone) — zielona

---

## v0.0.63 - Wytchnienie, +1 Odpoczynek, PD & Poprawki MG

### What's New in v0.0.63

#### Przycisk +1 Odpoczynek

- Nowy przycisk w nagłówku sekcji Odpoczynek w oknie MG Opowieści
- Jednym kliknięciem zwiększa licznik Oddechu o 1 (do maks. 2) dla **wszystkich** aktywnych postaci graczy
- Stan jest natychmiast synchronizowany przez socket do okienek widoku gracza

#### Przycisk Wytchnienie

- Nowy przycisk obok „+1 Odpoczynek" w oknie MG Opowieści
- Jednym kliknięciem wykonuje pełne Wytchnienie dla **wszystkich** aktywnych postaci graczy:
  - LP przywrócone do maksimum
  - Wytrzymałość przywrócona do wartości Sprytu
  - Obrona dezaktywowana
  - Unieruchomienie usunięte
  - Efekty trucizny wyczyszczone
- Dla każdej postaci generowana jest wiadomość na czacie z listą wykonanych akcji

#### Przyznawanie PD przy Wytchnieniu

- Po kliknięciu Wytchnienia pojawia się okienko z pytaniem o liczbę PD do przyznania
- MG wpisuje wartość i potwierdza — każda aktywna postać gracza otrzymuje podaną liczbę PD
- Jeśli PD > 0, wpis o przyznanym doświadczeniu pojawia się w wiadomości czatu per postać
- Okienko stylizowane jest zgodnie z motywem wizualnym okna Opowieści

#### Poprawka: Animacje kości niewidoczne u MG (Dice So Nice)

- Gdy gracz wykonywał rzut, MG nie widział animacji 3D kości w Dice So Nice
- Trzeci argument `showForRoll(roll, user, synchronize)` był wszędzie `false` lub pominięty
- Naprawione: `true` we wszystkich wywołaniach w `roll-mechanics.mjs`, `spellcasting-dialog.mjs`, `npc-attack-dialog.mjs`, `roll-sorcery-damage.mjs`, `conan.mjs`

#### Poprawka: Komunikat o rzucie tylko po angielsku

- Niebieskie powiadomienie „X rolled Y" pojawiało się u MG zawsze w języku angielskim
- Dodano klucz `CONAN.Notifications.rolledResult` do plików językowych (en/pl/fr)
- `socket.mjs` używa teraz `game.i18n.format()` zamiast zakodowanego tekstu

---

### What's New in v0.0.62

#### Ranged Weapon Damage Fix

- Broń dystansowa (np. Długi Łuk `1d8+2`) wyświetlała poprawne obrażenia w dialogu, ale rzut wykonywała na `1d6+2`
- Przyczyna: `rollRangedDamage()` odwoływał się do `weapon.system.damage?.dice` bez fallbacku na surowy string — gdy pole `damage` jest przechowywane jako `"1d8"`, a nie obiekt, metoda zwracała `undefined` i wpadała na hardcodowane `1d6`
- Poprawka: `weapon.system.damage?.dice || weapon.system.damage || "1d6"` — spójne z `rollMeleeDamage` i `rollThrownDamage`

#### Double Recovery Fix (Rest / Odpoczynek)

- Gdy w sesji aktywnych było dwóch użytkowników z rolą GM, kliknięcie przycisku Odpoczynek przez gracza było przetwarzane dwukrotnie: podwójne HP, podwójny punkt Staminy, dwie wiadomości na czacie
- Poprawka: żądanie `taleRecoveryRequest` obsługuje teraz tylko **pierwszy aktywny GM** (`game.users.find(u => u.isGM && u.active)`) — guard dodany zarówno w `socket.mjs` jak i `tale.mjs`

---

### What's New in v0.0.61

#### Token HP Bars — Native Foundry Support

- **`lifePoints.value`** — renamed from `lifePoints.actual` across the entire system; Foundry now natively recognises `{ value, max }` and renders the HP bar correctly
- HP bar works for **characters**, **antagonists** (migrated from scalar to object), and can be manually configured in token settings
- Existing characters and antagonists are **auto-migrated** on first load — no manual intervention needed
- The `getBarAttribute` override hack is removed; `system.json` `primaryTokenAttribute` points to `lifePoints.value`

#### Combat Tracker Status Icons

| Icon | Condition | Actor Types |
|------|-----------|-------------|
| `wounded.svg` | Active `wounded` status effect | Minion |
| `Poisoned.svg` | `system.poisoned === true` | All types |

- Icons fully visible in both sidebar tracker and detached popout (overflow clipping fixed)

#### Flex Die Dynamic Colorset (Dice So Nice)

- New `dice-utils.mjs` utility reads the player's DSN background colour and picks one of two custom colorsets for the flex die:
  - **`conan_flex_dark`** — very dark body with gold pips (for light DSN backgrounds)
  - **`conan_flex_light`** — warm cream body with dark crimson pips (for dark DSN backgrounds)
- Contrast is computed from relative luminance (WCAG formula) so the flex die is always visually distinct from the attribute die
- Applied to all flex die rolls: attack, and all three sorcery damage types

#### Fight for Life — Full Trigger Coverage

- Fight for Life dialog now triggers when **any** source of damage (NPC attack, poison drain) reduces a character's HP to 0
- Previously only triggered from the poison drain path; NPC damage path was missing the check

#### Winds of Fate Layout Fix

- "Winds of Fate" banner moved outside the dice flex row — no longer causes misaligned layout in fight-for-life chat cards
- Styled as a standalone dark-red gradient banner below the dice section

### Requirements

- **Foundry VTT**: v13 or higher (tested on v13.351)
- **Recommended**: [Dice So Nice](https://foundryvtt.com/packages/dice-so-nice) for 3D dice animations with dynamic flex die colorsets

### Installation

#### Via Foundry VTT (Recommended)

1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste the manifest URL:

   ```
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```

4. Click **Install**

#### Manual Installation

1. Download `conan-the-hyborian-age-v0.0.61.zip` from [Releases](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases)
2. Extract to `FoundryVTT/Data/systems/`
3. Restart Foundry VTT

### Migration Notes for Existing Worlds

#### `lifePoints.actual` → `lifePoints.value`

Characters saved with the old `lifePoints.actual` field are **automatically migrated** on first load via `prepareBaseData()` — the value is copied to `lifePoints.value` if the new field doesn't exist yet. No manual action required.

If a character's token still shows an empty HP bar, open the token configuration and set **Bar 1** attribute to `lifePoints` (or `lifePoints.value`). Newly created tokens will use the correct path automatically.

#### Antagonist `lifePoints`

Antagonists that previously stored `lifePoints` as a plain number are **automatically converted** to `{ value, max }` on first load. The original value is used for both `value` and `max`.

### For Game Masters

#### Poison System (Effect #1 — Implemented)

Effect #1 is fully functional: toggleing the Poisoned status on a character applies −1 to all four attributes (Might, Edge, Grit, Wits). This automatically:

- Reduces roll modifiers for all attribute tests, attacks, and damage
- Recalculates Life Points max (`origin_base + 2 × effectiveGrit + adjustment`)
- Recalculates Physical and Sorcery Defense
- Displays green visual indicators: skull icon, tinted attribute fields, down arrow in circles, highlighting in chat messages

Effects #2–5 are UI-only and not yet mechanically wired.

#### Tale Timer & Recovery

- Start a **Tale** from the toolbar scroll icon (GM only)
- Timer persists across page reloads; players receive the current time automatically on reconnect
- **Recovery (Odpoczynek)**: each character has 2 uses per tale — clicking the bed icon restores `ceil(max LP / 2)` Life Points + 1 Stamina (or just +1 Stamina if at full HP)
- Uses reset when the tale ends; a styled chat message is posted on each use

#### Combat Tracker

- **Wounded** (minions) and **Poisoned** (all types) status icons appear directly in the combat tracker row
- Icons visible in both the sidebar tracker and the detached popout window

#### Multiplayer

- Players can use their owned minions to attack antagonists without Permission errors
- All privileged operations (damage application, token updates) are automatically delegated to the GM via the socket system
- At least one GM must be online for socket delegation to work

### Known Issues

- **Poison Effects #2–5**: Currently UI-only — Effect #1 is fully implemented; #2–5 mechanics are not yet wired

Report bugs at [GitHub Issues](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/issues).

### Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for the complete technical history of all changes.
