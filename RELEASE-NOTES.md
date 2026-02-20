# Release Notes - Conan: The Hyborian Age System

## Current Version: v0.0.61 - Token Bars, Combat Icons & Flex Die Colorsets

### Overview

System Conan: The Hyborian Age to nieoficjalna implementacja gry fabularnej **Conan** firmy Monolith dla Foundry VTT v13+. Wersja 0.0.61 naprawia obsługę pasków HP na tokenach dla wszystkich typów aktorów, dodaje ikony stanów w trackerze walki oraz wprowadza inteligentny dobór koloru kości Flex w Dice So Nice.

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
