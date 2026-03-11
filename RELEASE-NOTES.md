# Release Notes - Conan: The Hyborian Age System

## Current Version: v0.7.1 — Token Status Effects & Fight for Life Fixes

### Overview

Version 0.7.1 is a bugfix release for v0.7.0. It fixes a regression with status effect icons on tokens (skull, wounded, defence, immobilized, poisoned), resolves the Fight for Life loop when attacking an already-unconscious character, and adds GM socket routing for `toggleStatusEffect`.

---

### What's New in v0.7.1

#### Token Status Icons

- Skull (antagonist / minion defeated) — `toggleStatusEffect("dead")`
- Blood (wounded minion below threshold) — `toggleStatusEffect("wounded")`
- Defence, immobilized, poisoned — three new system statuses visible directly on tokens
- `paralysis.svg` fixed (removed DOCTYPE preamble, black fill + white stroke for visibility on both light and dark backgrounds)

#### Fight for Life — Full Cycle Fix

| Situation | Before | After |
|-----------|--------|-------|
| Failed Fight for Life | No death icon | `toggleStatusEffect("dead")` → skull on token |
| Next attack on unconscious character | Another Fight for Life dialog | No FfL prompt, immediately applies `dead` |
| Attack difficulty vs unconscious target | Normal defence | 0 (every attack hits automatically) |
| Successful Fight for Life | No status applied | `toggleStatusEffect("unconscious")` |
| Successful FfL via Flex conversion | No status applied | `toggleStatusEffect("unconscious")` |

#### ConanSocket — New Method

`requestToggleStatusEffect(sceneId, tokenId, actorId, effectId, active)` — players without Owner permission can trigger status effect toggles via GM socket relay.

---


#### `PoisonEffectsModel` — Shared Sub-Schema

New `module/models/shared/poison-effects.mjs`:

- `PoisonEffectsModel extends foundry.abstract.DataModel` — embedded into every actor model via `EmbeddedDataField`
- Schema: `effect1`–`effect5` (BooleanField), `effect2Multiplier` / `effect3Multiplier` (NumberField 1–5)
- Computed getters eliminating duplicated logic across three actor models:
  - `attributePenalty` — `1` if effect1, else `0`
  - `rollPenalty` — multiplier if effect2 active
  - `lifeDrain` — multiplier if effect3 active
  - `staminaLocked` — `effect4`
  - `flexDieLocked` — `effect5`
  - `isAnyActive` — `true` if any effect is on

#### `WeaponModel.damage` Field Type Change

Changed from `SchemaField({ dice, bonus, type })` to `StringField({ initial: "1d6" })`:

- The UI has always written flat strings like `"1d8"` — the old SchemaField caused `[object Object]` display and `1d6` fallback on every roll
- `migrateData()` converts any legacy `{ dice: "1d8" }` object to `"1d8"` automatically
- All HBS compat-checks `{{#if weapon.system.damage.dice}}...{{else}}...{{/if}}` removed

#### `template.json` Simplified

Reduced from ~260 lines to 8 lines — only `Actor.types` / `Item.types` declarations remain. All field definitions are now exclusively in TypeDataModel `defineSchema()` methods.

---

### Bug Fixes

- **`Item.roll()` crash** — `item.mjs` accessed `.damage.dice` on a `StringField`; fixed to use `damage` directly
- **Might not added to melee damage** (from stamina-effects) — routing fixed to call `rollMeleeDamage` / `rollThrownDamage` / `rollRangedDamage` instead of the now-removed `rollWeaponDamage`

---

### Code Cleanup

| File | Change |
|------|--------|
| `starting-skills-dialog.mjs` | `new Dialog` (V1) + jQuery `.find()` → `DialogV2.wait()` + native DOM |
| `npc-sheet.mjs` | local `function debounce()` → `foundry.utils.debounce()` |
| `tale.mjs` | `foundry.utils.duplicate()` (3×) → `foundry.utils.deepClone()` |
| `roll-mechanics.mjs` | removed exported `rollWeaponDamage` (never imported, ~170 lines) |
| `actor.mjs` | removed empty `@deprecated` stub `_prepareNpcData()` |
| `damage-dialog.hbs` | removed 6× compat-check `damage.dice` |
| `actor-character-sheet.hbs` | removed 1× compat-check `damage.dice` |

---

## v0.0.64 - Tale Dialog UX Fixes

### Overview

Version 0.0.64 improves the Tale dialog layout (Recovery label above buttons), resets the Recovery counter after Respite, and unifies chat message icon colours.

### What's New in v0.0.64

#### "Recovery" label moved above buttons

- The Recovery section header (bed icon + label) is now rendered in a separate row above the "+1 Recovery" and "Respite" action buttons
- Buttons no longer overflow the dialog window

#### Respite resets Recovery uses to 2/2

- After executing Respite, each active player character's Recovery use counter is restored to the maximum (2)
- The reset is immediately synchronised via socket to all connected client views

#### Chat message icon colours for Respite

- Heart icon (LP restored to max) — red, consistent with the Recovery chat message
- Bolt icon (Stamina restored to Grit) — blue, consistent with the Recovery chat message
- Vial icon (poison effects cleared) — green

---

## v0.0.63 - Respite, +1 Recovery, XP & GM Fixes

### What's New in v0.0.63

#### "+1 Recovery" button in the GM Tale dialog

- New button in the Recovery section header of the GM Tale dialog
- One click increments the Recovery use counter by 1 (up to max 2) for **all** active player characters at once
- State is immediately synchronised via socket to player view windows

#### Respite button in the GM Tale dialog

- New button next to "+1 Recovery" in the GM Tale dialog
- One click executes a full Respite for **all** active player characters at once:
  - LP restored to maximum
  - Stamina restored to Grit value
  - Defence deactivated
  - Immobilized removed
  - Poison effects cleared
- A chat message is generated per character listing all applied effects

#### XP award on Respite

- Clicking Respite opens a dialog prompting the GM for a number of XP to award
- The GM enters a value and confirms — each active player character receives the entered XP amount
- If XP > 0, an XP entry appears in the per-character chat message
- The dialog is styled to match the Tale dialog theme

#### Fix: Dice So Nice animations not visible to GM

- When a player rolled, the GM did not see the 3D dice animation in Dice So Nice
- The third argument of `showForRoll(roll, user, synchronize)` was `false` or omitted everywhere
- Fixed: `true` in all call sites in `roll-mechanics.mjs`, `spellcasting-dialog.mjs`, `npc-attack-dialog.mjs`, `roll-sorcery-damage.mjs`, `conan.mjs`

#### Fix: Roll result notification always in English

- The blue "X rolled Y" notification shown to the GM always appeared in English regardless of game language
- Added `CONAN.Notifications.rolledResult` key to en/pl/fr language files
- `socket.mjs` now uses `game.i18n.format()` instead of hardcoded text

---

### What's New in v0.0.62

#### Ranged Weapon Damage Fix

- Ranged weapons (e.g. Long Bow `1d8+2`) displayed the correct damage in the dialog but rolled `1d6+2`
- Cause: `rollRangedDamage()` referenced `weapon.system.damage?.dice` with no fallback for a plain string — when `damage` is stored as `"1d8"` rather than an object the method returned `undefined` and fell through to the hardcoded `1d6`
- Fix: `weapon.system.damage?.dice || weapon.system.damage || "1d6"` — now consistent with `rollMeleeDamage` and `rollThrownDamage`

#### Double Recovery Fix

- When two users with the GM role were both active, a player's Rest request was processed twice: double HP, double Stamina and two chat messages
- Fix: the `taleRecoveryRequest` is now handled only by the **first active GM** (`game.users.find(u => u.isGM && u.active)`) — guard added in both `socket.mjs` and `tale.mjs`

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
