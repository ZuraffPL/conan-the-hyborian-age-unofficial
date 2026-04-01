# Conan: The Hyborian Age

An unofficial Foundry VTT implementation of **Conan: The Hyborian Age RPG** by Monolith Boardgames. Step into the savage world of Robert E. Howard's Conan the Barbarian and forge your legend in the Hyborian Age!

![Version](https://img.shields.io/badge/version-0.7.3-darkred)
![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v13%2B-orange)

## Installation

### Method 1: Install via Foundry VTT (Recommended)

1. Open Foundry VTT and go to the **Game Systems** tab
2. Click **Install System**
3. Paste this manifest URL:

   ```
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```

4. Click **Install** and wait for the download to complete

### Method 2: Manual Installation

1. Download the latest ZIP from [Releases](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases)
2. Extract and copy the `conan-the-hyborian-age` folder to your Foundry `Data/systems` directory
3. Restart Foundry VTT and create a new world with **Conan: The Hyborian Age** as the game system

## Requirements

- **Foundry VTT**: v13 or higher (tested on v13.351)
- **Recommended**: [Dice So Nice](https://foundryvtt.com/packages/dice-so-nice) for 3D dice animations with dynamic flex die colorsets

## About the Game

Conan: The Hyborian Age is a tabletop RPG set in the brutal world of Conan the Barbarian. Players forge their destiny through strength, cunning, and steel in a world of ancient sorcery, lost civilizations, and savage combat.

### Core Mechanics

Each character has **four attributes** (Might, Edge, Grit, Wits) rated 1–8:

1. **Roll your attribute die** (d6/d8/d10 based on rating) and add the attribute value
2. **Roll the Flex Die** (d10, degrades over time) simultaneously — max value triggers a Flex Effect
3. **Compare against difficulty** to determine success or failure
4. **Apply modifiers** for situational bonuses/penalties

---

## System Features

> **Current version: v0.7.3** — For a full history of changes see [CHANGELOG.md](CHANGELOG.md).

### Core Feature Reference

#### 🩸 Status Effect System

| Status | Icon | Mechanical Effect |
|--------|------|-------------------|
| **Poisoned** (Effect #1) | 💀 green skull | −1 to all attributes; green visual indicators on fields, circles, chat |
| **Wounded** | 🩸 red blood drop | Minion sheet checkbox syncs to token status effect |
| **Immobilized** | ⬛ black paralysis | Physical Defense set to 0; overrides Defence bonus |
| **Defeated** | 💀 skull overlay | Auto-applied when NPC reaches 0 LP / threshold |
| **Defence** | 🛡 gold highlight | +2 Physical Defense, costs 1 Action |

All statuses display in the **Combat Tracker** with preserved icon colours.

#### 🎲 Combat System

- **Damage Application**: "Deal Damage" buttons in chat messages, with automatic armor reduction
- **Massive Damage**: Flex Effect adds max weapon die + modifier (or doubles fixed damage)
- **Fight for Life**: Triggered automatically when character HP reaches 0 from any source
- **Unlinked Token Support**: Full `delta.system` path for independent NPC tokens
- **Socket Delegation**: Players can deal damage without GM-level permissions

#### ⚡ Stamina Management

- **Stamina Spend dialog** — 4 tactical options:
  - Extra Move (+2 m), Increase Range (+2 m), Ignore Encumbrance, Activate Origin Ability
- **Chat message context menu** — right-click to spend 1–2 Stamina for roll/damage boosts
- Stamina Massive Damage **stacks** with Flex Effect Massive Damage

#### 🧙 Sorcery System

- **Three damage types**: Wits die, custom die, fixed value
- **Flex Effect recovery**: Restore spent LP and Stamina from spellcasting
- **Origin restrictions**: 10 origins with varying magic access and discipline limits
- Magic attacks roll vs target's Sorcery Defense

#### 📊 Derived Stat Recalculation

- **Life Points max**: `origin_base + 2 × Grit + adjustment` — recalculated automatically
- **Physical Defense**: `Edge + 2` (min 5), +2 when Defence is active
- **Sorcery Defense**: `Wits + 2` (min 5)
- All values recalculate instantly on attribute change, poison toggle, or status change

#### 🧪 XP & Skill Management

- Skills/spells **refund XP** on deletion (tracked via `initialCost` flag)
- Origin Skills shown with gold badge — zero XP cost
- Bidirectional sync between world items and actor sheets

#### 🎯 NPC System

- **Two NPC types**: Minions (simplified) and Antagonists (full stats with `{ value, max }` HP)
- **Creature Types**: 6 categories — token overlay auto-updates on change
- Color-coded chat: green for minions, red for antagonists
- Debounced text inputs (500 ms) on NPC sheets to prevent freezing

#### 💀 Threat Engine (Skala Zagrożenia) — *new in v0.7.3*

The Threat Engine automatically randomises NPC statistics when a token is placed on the scene, creating unique encounters without manual setup. It applies to **unlinked tokens only**.

**Minion tiers** (sługus):

| Tier | Probability | Stat Bonus | Token suffix |
|------|-------------|------------|--------------|
| Weak (Słaby) | 50% | +0 | *(none)* |
| Strong (Silny) | 30% | +1 | `💀` |
| Elite (Elitarny) | 20% | +2 | `💀💀` |

**Antagonist tiers** (antagonista — unlinked tokens only):

| Tier | Probability | Stat Bonus | Token suffix |
|------|-------------|------------|--------------|
| Weak (Słaby) | 70% | +0 | `☠️` |
| Strong (Silny) | 20% | +1 | `☠️☠️` |
| Elite (Elitarny) | 10% | +2 | `☠️☠️☠️` |

The stat bonus applies to **Physical Defense**, **Sorcery Defense**, and **Armor** simultaneously. Base values are read directly from the actor sheet at placement time.

**Boss support** (linked antagonists): Linked tokens represent unique bosses — Threat Engine tier randomisation does not apply. Optionally, enabling **Boss Icon** in the Threat Engine section wraps the token name with skull icons: `💀Bhord the Merciless💀`.

**Enabling Threat Engine**:
- Check **"Enable Threat Engine"** in the NPC sheet's collapsible Threat Engine section
- The preview table shows the exact values each tier would produce, based on current base stats
- Each token placed on the scene is independent — re-placing creates a fresh roll

#### 🌐 Localization

- **Three languages**: English, Polish, French
- Smart subtitles: English subtitle hidden when system language is English
- All UI, dialogs, chat messages, and features fully localized

---

## Getting Started

### 1. Create Your Character

1. Create a new **Actor** (type: Character)
2. Click **"Stwórz / Create"** in the sheet header
3. In the creation wizard:
   - Select your **origin** (determines starting Life Points)
   - Distribute **16 points** among Might, Edge, Grit, Wits (1–6 per attribute)
   - Click **"Zatwierdź / Confirm"**

All derived values (LP max, Defense, Stamina) are calculated automatically.

### 2. Build Your Starting Skills

1. Open **Skills** tab → **"Dodaj / Add Skill"**
2. Fill in Name, XP Cost, Effect; check **Origin Skill** if free
3. XP is deducted automatically; refunded on deletion

### 3. Make a Test

1. Click any **attribute name** or its roll button
2. Set difficulty (1–30) and modifier; click Roll
3. If Flex Die hits max, choose a **Flex Effect** from the dialog

### 4. Token HP Bars

- In token configuration → **Bar 1** → attribute: **`lifePoints`** (or `lifePoints.value`)
- The bar shows current / max HP and max is freely editable
- Works for both linked and unlinked tokens on all actor types

### 5. Combat & Status

- **Defence**: Shield icon → +2 Physical Defense (1 Action cost, gold highlight)
- **Poisoned**: Poison icon → −1 all attributes, green visual indicators
- **Wounded** (minions): Tick "ranny" → red blood drop on token
- **Immobilized**: Paralysis icon → Physical Defense = 0
- **Damage**: "Deal Damage" in chat; automatically applies armor reduction
- **Stamina**: Stamina button for tactical options; right-click chat for boosts

### 6. Cast Spells

1. Click the purple **"Spellcasting"** button
2. Enter LP and/or Stamina costs; select target Sorcery Defense
3. Roll magic attack → on success, roll magic damage

---

## The Four Attributes

| Attribute | Polish | Primary Uses |
|-----------|--------|--------------|
| **Might** | Krzepa | Melee combat, feats of strength |
| **Edge** | Refleks | Speed, ranged combat, Physical Defense |
| **Grit** | Hart | Endurance, Max Life Points |
| **Wits** | Spryt | Sorcery, Sorcery Defense, perception |

Each attribute has a die (d6/d8/d10) that improves with value.  
When **Poisoned (Effect #1)**, all attributes are reduced by 1 — affecting rolls, derived stats, and visual indicators.

---

## The Flex Die

The **Flex Die** (Kość Brawury) rolls alongside every test. Starts as **d10** at character creation, degrades (d10 → d8 → d6 → d4) as fate is spent.

| Effect | Description |
|--------|-------------|
| **Sorcery Recovery** | Restore LP and Stamina spent on spellcasting |
| **Massive Damage** | Add max weapon die + modifier (or double fixed damage) |
| **Stamina Boost** | Gain +1 Stamina |
| **Convert to Success** | Turn a failed roll into a success |

With **Dice So Nice**, the flex die renders in a contrast-aware colorset chosen automatically per player.

---

## Origins

| Origin | LP Base |
|--------|---------|
| From the Hills | 30 |
| From the Streets | 22 |
| From the Steppes | 26 |
| From the North | 32 |
| From the Wilds | 30 |
| From a Civilized Land | 22 |
| From Parts Unknown | 26 |
| From the Blood of Jhebbal Sag | 28 |
| From the Blood of Acheron | 20 |
| From the Blood of Demon | 26 |

Origin is locked after character creation. Starting resources: **3 XP** for starting skills.

---

## File Structure

```text
conan-the-hyborian-age/
├── assets/
│   ├── icons/
│   │   ├── damage.svg
│   │   ├── paralysis.svg
│   │   ├── Poisoned.svg
│   │   ├── trap.svg
│   │   └── wounded.svg
│   └── img/
│       └── conan-the-hyborian-age-main.jpg
├── lang/
│   ├── en.json
│   ├── fr.json
│   └── pl.json
├── module/
│   ├── conan.mjs                          ← Main entry point, hooks, socket handlers
│   ├── documents/
│   │   ├── actor.mjs                      ← ConanActor — token setup, XP hooks, getRollData
│   │   └── item.mjs
│   ├── models/                            ← NEW (v0.7.0) — TypeDataModel classes
│   │   ├── actors/
│   │   │   ├── character.mjs              ← CharacterModel
│   │   │   ├── minion.mjs                 ← MinionModel
│   │   │   ├── antagonist.mjs             ← AntagonistModel
│   │   │   └── index.mjs
│   │   ├── items/
│   │   │   ├── base-item.mjs              ← BaseItemModel
│   │   │   ├── weapon.mjs                 ← WeaponModel
│   │   │   ├── armor.mjs                  ← ArmorModel
│   │   │   ├── skill.mjs                  ← SkillModel
│   │   │   ├── spell.mjs                  ← SpellModel
│   │   │   └── index.mjs
│   │   └── shared/
│   │       ├── poison-effects.mjs         ← PoisonEffectsModel (EmbeddedDataField)
│   │       └── index.mjs
│   ├── helpers/
│   │   ├── attack-dialog.mjs
│   │   ├── character-creation-dialog.mjs
│   │   ├── config.mjs
│   │   ├── damage-dialog.mjs
│   │   ├── dice-utils.mjs                 ← NEW (v0.0.61) — Dice So Nice colorset utilities
│   │   ├── difficulty-dialog.mjs
│   │   ├── flex-dialog.mjs
│   │   ├── initiative-dialog.mjs
│   │   ├── npc-attack-dialog.mjs
│   │   ├── npc-damage-dialog.mjs
│   │   ├── npc-difficulty-dialog.mjs
│   │   ├── poisoned-dialog.mjs
│   │   ├── roll-mechanics.mjs
│   │   ├── roll-sorcery-damage.mjs
│   │   ├── socket.mjs
│   │   ├── spellcasting-dialog.mjs
│   │   ├── stamina-effects.mjs
│   │   ├── stamina-spend-dialog.mjs
│   │   ├── starting-skills-dialog.mjs
    ├── tale.mjs                       ← TaleDialog & TalePlayerDialog
│   │   ├── threat-engine.mjs          ← NEW (v0.7.3) — Threat Engine tier logic
│   │   └── templates.mjs
│   └── sheets/
│       ├── actor-sheet.mjs
│       ├── item-sheet.mjs
│       └── npc-sheet.mjs
├── styles/
│   ├── actor-armor.css
│   ├── actor-npc.css
│   ├── actor-weapon.css
│   ├── character-creation-dialog.css
│   ├── conan.css
│   ├── flex-dialog.css
│   ├── item-armor.css
│   ├── item-skill.css
│   ├── item-weapon.css
│   ├── roll-chat.css
│   ├── roll-dialog.css
│   ├── stamina-effects.css
│   ├── starting-skills.css
│   ├── tale.css
│   └── partials/
│       ├── actor-spell.css
│       ├── attack-dialog.css
│       ├── combat-tracker.css             ← Combat tracker icons & overflow fixes
│       ├── damage-dialog.css
│       ├── poisoned-effects.css           ← Winds of Fate banner, poison UI
│       ├── spellcasting-dialog.css
│       └── stamina-spend-dialog.css
├── templates/
│   ├── actor/
│   │   ├── actor-antagonist-sheet.hbs
│   │   ├── actor-character-sheet.hbs
│   │   ├── actor-minion-sheet.hbs
│   │   └── parts/
│   │       ├── actor-attributes.hbs
│   │       ├── actor-biography.hbs
│   │       ├── actor-effects.hbs
│   │       ├── actor-items.hbs
│   │       └── actor-skills.hbs
│   ├── dialogs/
│   │   ├── attack-dialog.hbs
│   │   ├── character-creation-dialog.hbs
│   │   ├── damage-dialog.hbs
│   │   ├── difficulty-dialog.hbs
│   │   ├── flex-effect.hbs
│   │   ├── initiative-dialog.hbs
│   │   ├── npc-attack-dialog.hbs
│   │   ├── npc-damage-dialog.hbs
│   │   ├── npc-difficulty-dialog.hbs
│   │   ├── poisoned-dialog.hbs
│   │   ├── spellcasting-dialog.hbs
│   │   ├── stamina-spend-dialog.hbs
│   │   ├── starting-skills-dialog.hbs
    ├── tale-dialog.hbs
│   │   └── tale-player-dialog.hbs
│   └── item/
│       ├── item-sheet.hbs
│       └── parts/
│           ├── item-description.hbs
│           ├── item-effects.hbs
│           └── item-header.hbs
├── CHANGELOG.md
├── LICENSE.txt
├── README.md
├── RELEASE-NOTES.md
├── system.json
└── template.json
```

---

## Architecture

| Principle | Implementation |
|-----------|---------------|
| **ApplicationV2** | All sheets and dialogs use the modern Foundry v13 API |
| **TypeDataModel** | All Actor (character, minion, antagonist) and Item (weapon, armor, skill, spell) types backed by `TypeDataModel`; shared sub-schemas via `EmbeddedDataField` |
| **Native DOM** | No jQuery dependency — pure JavaScript throughout |
| **Modern CSS** | Flexbox layouts, CSS variables, modular partials |
| **Auto-save** | Real-time change detection with `foundry.utils.debounce()` form handling (500 ms for NPC sheets) |
| **Socket Delegation** | Permission-free player actions via GM delegation (`socket.mjs`) |
| **Token Delta** | Proper Foundry v13 unlinked token support via `delta.system` paths |
| **Custom Status Effects** | Registered in `CONFIG.statusEffects` with CSS filter colour preservation |
| **Dice So Nice** | Two custom colorsets (`conan_flex_dark`, `conan_flex_light`) registered at startup; contrast-aware selection via `dice-utils.mjs` |
| **Data Migrations** | `migrateData()` in TypeDataModel auto-migrates legacy data formats on first load |

---

## Known Issues

No known issues at this time.

---

## Roadmap

- **Additional Status Effects**: Prone, Mounted
- **Active Skill Effects**: Each character skill will automatically apply its corresponding mechanical effect when active
- **Fighting Styles**: Support for advanced rules fighting styles

---

## Support

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/issues) with:

- Description and steps to reproduce
- Expected vs actual behaviour
- Foundry VTT version and system version
- Screenshots if applicable

---

## License

This is an **unofficial** fan-made system for Foundry VTT.

**Conan: The Hyborian Age RPG** is created by Monolith Boardgames.  
**Conan the Barbarian** and the Hyborian Age are properties of Conan Properties International LLC.

This system is provided as-is for personal use. Not affiliated with or endorsed by Monolith Boardgames or Conan Properties International.

---

## Credits

- **System Developer**: Zuraff (Discord: `eliandir_`)
- **Game System**: Conan: The Hyborian Age RPG by Monolith Boardgames
- **Setting**: Based on Robert E. Howard's Conan the Barbarian
- **Platform**: Foundry Virtual Tabletop v13+

---

Current version: **0.0.61** — see [CHANGELOG.md](CHANGELOG.md) for full history.
