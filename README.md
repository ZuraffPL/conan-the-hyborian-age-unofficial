# Conan: The Hyborian Age

An unofficial Foundry VTT implementation of **Conan: The Hyborian Age RPG** by Monolith Boardgames. Step into the savage world of Robert E. Howard's Conan the Barbarian and forge your legend in the Hyborian Age!

## Installation

### Method 1: Install via Foundry VTT (Recommended)

1. Open Foundry VTT and go to the **Game Systems** tab
2. Click **Install System**
3. Paste this manifest URL into the field:

   <https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json>

4. Click **Install** and wait for the download to complete

### Method 2: Manual Installation

1. Download the latest release ZIP file from: [Releases](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases)
2. Extract the ZIP file
3. Copy the `conan-the-hyborian-age` folder to your Foundry `Data/systems` directory
4. Restart Foundry VTT
5. Create a new world and select **Conan: The Hyborian Age** as the game system

## System Requirements

- **Foundry VTT**: Version 13 or higher (tested on v13.350)
- **Recommended Modules**:
  - Dice So Nice (for 3D dice animations)

## About the Game

Conan: The Hyborian Age is a tabletop role-playing game set in the brutal and mysterious world of Conan the Barbarian. Players take on the roles of heroes forging their destiny through strength, cunning, and steel in a world of ancient sorcery, lost civilizations, and savage combat.

### Core Mechanics

The game uses a unique dice system where each character has **four core attributes** (Might, Edge, Grit, Wits) rated from 1-8. When making a test:

1. **Roll your attribute die** (d6, d8, or d10 based on rating) and add the attribute value
2. **Roll the Flex Die** (d10) simultaneously - if you roll maximum, trigger special effects
3. **Compare against difficulty** to determine success or failure
4. **Apply modifiers** for situational advantages or disadvantages

This creates dynamic, exciting tests where even desperate situations can turn around with a well-timed Flex effect!

## System Features

### Latest Version: [0.0.60] - 2026-02-19

#### Tale Timer & Recovery System

- **Tale Timer**: GM-controlled session timer (HH:MM:SS) accessible from the toolbar scroll icon
  - Start / Pause / End Tale controls with persistent state across reloads
  - Player read-only view opens automatically on Tale Start, closes on Tale End
  - Timer syncs to all players every 15s via socket; drift-corrected
- **Recovery Section**: Appears in both GM and player Tale dialogs
  - GM sees all online players' characters; Player sees only their own character
  - Live HP display (`actual / max`) with animated gradient health bar (green→red as HP drops)
  - Bed icon button (🛏) with use counter badge — 2 uses per tale, resets on Tale End
- **Recovery Mechanics**:
  - HP < max: restores `ceil(max / 2)` Life Points (capped at max) + 1 Stamina
  - HP = max: only +1 Stamina, no healing
  - Styled chat message shows recovered LP and +1 Stamina with localized text (PL/EN/FR)

#### Poison Effect #1 - Attribute Penalty System

- **Attribute Penalties**: Poison effect #1 applies -1 penalty to all four attributes (Might, Edge, Grit, Wits)
- **Effective Values**: All dice rolls use `effectiveValue` (base attribute value minus poison penalty)
- **Visual Indicators**:
  - 💀 Pulsing green skull icon next to poisoned attributes
  - 🟢 Green-tinted attribute input fields with glowing border
  - ⬇️ Green down arrow (↓) inside attribute circle showing active penalty
  - 📊 Green highlighting of poisoned values in chat message calculations
- **Roll Integration**: All attribute tests, attacks, and damage rolls automatically use reduced values
- **Poison Warnings**: Dialogs display clear warnings when poison penalty is active

#### Automatic Derived Stat Recalculation

- **Life Points Maximum**: Automatically recalculates based on Grit attribute (origin_base + 2 × Grit)
- **Physical Defense**: Dynamically updates based on Edge attribute with Defence bonus integration
- **Sorcery Defense**: Dynamically updates based on Wits attribute
- **Real-time Updates**: All derived stats recalculate immediately when:
  - Attributes change (character development/leveling)
  - Poison effect #1 is activated or deactivated
  - Defence or Immobilized status changes

#### Status Effect Integration

- **Defence & Poison**: Defence bonus (+2) now works seamlessly with poison penalties
- **Immobilized & Poison**: Immobilized status (Defense = 0) overrides all other modifiers including poison
- **NPC Support Fixed**: Minions and antagonists now properly calculate `effectiveValue` (fixed type detection bug)

#### Previous Release: [0.0.48] - 2026-01-07

#### Multiplayer Permission Fixes for NPCs

- **Fixed Permission Errors**: Players can now use owned minion NPCs to attack antagonists without "User lacks permission" errors
- **Socket Integration**: NPC damage application automatically routed through GM via socket system
- **Seamless Combat**: All NPC types (characters, antagonists, minions) now work properly in multiplayer sessions

#### Previous Release: [0.0.45] - 2025-01-01

#### Wounded Status Effect & Origin Abilities

- **Added**: Custom "wounded" status effect with red blood drop icon for minion tokens
- **Added**: Checkbox "ranny" (wounded) on minion sheets automatically applies/removes status effect on tokens
- **Added**: Wounded status displays consistently: red icon on tokens, in combat tracker, and status effects panel
- **Added**: 4th stamina spend option - "Activate Origin Ability" for using character origin special powers
- **Added**: Status effect icon in token status effects panel, can be manually toggled
- **Improved**: Icon colors - wounded displays in crimson red, immobilized in black for better contrast
- **Technical**: Custom status effect registered in CONFIG.statusEffects, CSS filters disabled for proper color display

### Key Features Summary

#### 🩸 Status Effect System

- **Poisoned Status (Effect #1)**: Green skull icon with full mechanical implementation
  - Applies -1 penalty to all four attributes (Might, Edge, Grit, Wits)
  - Green visual indicators: tinted fields, skull icons, down arrow (↓) in attribute circles
  - Affects all attribute-based rolls, attacks, damage, and derived stats
  - Automatic recalculation of Life Points max and Defense values
  - Poison warnings in roll dialogs and green highlighting in chat messages
- **Wounded Status**: Red blood drop icon for injured minions, syncs between sheet checkbox and token
- **Immobilized Status**: Black paralysis icon, sets Physical Defense to 0 when active
- **Defeated Status**: Skull icon overlay for dead tokens (minions and antagonists)
- **Manual Control**: Toggle status effects via token right-click menu or character sheet
- **Combat Tracker Integration**: All status icons display in combat tracker with proper colors

#### 🎲 Complete Combat System

- **Damage Application**: "Deal Damage" buttons for PC and NPC damage rolls with automatic armor reduction
- **Massive Damage**: Flex Effect option adds maximum weapon die value + modifier (or doubles fixed damage)
- **Unlinked Token Support**: Full support for independent NPC tokens with proper data handling
- **HP Indicator**: Visual red highlight when character is injured (actual < max HP)
- **Socket System**: Permission-free damage application - players can damage enemies without GM permissions

#### ⚡ Stamina Management System

- **Tactical Options**: Dedicated button with 4 choices:
  - Extra Move: Gain additional 2m movement
  - Increase Range: Extend thrown weapon range by 2m
  - Ignore Encumbrance: Negate penalties from heavy armor/equipment
  - **Activate Origin Ability**: Use special powers from character's origin/background
- **Context Menu Boosts**: Right-click chat messages to spend 1-2 Stamina for:
  - Roll boosts (+1/+2 to attribute tests, initiative, attacks)
  - Damage boosts (+1d4/+2d4 to damage rolls)
  - Massive Damage (when exactly 1 Stamina remains)
- **Stacking Effects**: Stamina Massive Damage can stack with Flex Effect Massive Damage
- **Full Localization**: All options available in English, Polish, and French

#### 🧙 Complete Sorcery System

- **Spellcasting**: Purple "Spellcasting" button with Life Points/Stamina cost management
- **Flex Effect Recovery**: Sorcery option in Flex Effect dialog recovers spent spell costs (LP and Stamina)
- **Three Damage Types**: Wits die, custom die, and fixed value options for magic damage
- **Origin Restrictions**: 10 origins with varying magic access and discipline limits
- **Magic Attack Rolls**: Roll vs target's Sorcery Defense with success/failure determination
- **Visual Effects**: Purple-themed chat messages with pulsating headers for spell effects

#### 🛡️ Defense & Status Effects

- **Defence Toggle**: Active defense action (+2 Physical Defense, 1 Action cost, gold highlight)
- **Immobilized Status**: Sets Physical Defense to 0 when active (red highlight, prevents Defence)
- **Wounded Status**: Red blood drop icon for injured minions (automatic token sync)
- **Poisoned Status**: UI toggle with 5 configurable poison effects (full logic coming soon)
- **Defeated Status**: Skull icon overlay automatically applied when NPCs reach 0 LP/threshold
- **NPC Defense Sync**: Proper synchronization between basePhysical and defense values
- **Status Panel Integration**: All effects available in token right-click menu

#### 🧪 XP & Skill Management

- **XP Refund**: Skills and spells automatically refund XP cost when removed from character sheet
- **Initial Cost Tracking**: `initialCost` flag ensures accurate refunds even if item cost changes
- **Bidirectional Sync**: Automatic synchronization between world items and character sheets
- **Dynamic Cost Adjustment**: XP validates when editing embedded item costs
- **Origin Skills**: Free skills based on character origin with gold badge indicators
- **Spell Removal**: Localized notifications display refunded XP amount

#### 🎯 NPC System

- **Two NPC Types**: Minions (simplified) and Antagonists (full stats)
- **Creature Types**: 6 categories (Human, Inanimate, Undead, Monstrosity, Demon, Beast) with automatic token overlay updates
- **Action Economy**: Track attacks, actions, and movement allowances
- **Damage Sections**: Melee and Ranged with N/A toggles, automatic damage calculations
- **Color-Coded Chat**: Green messages for minions, red for antagonists
- **NPC Sheets**: Optimized 640px width with compact layouts, debounced form handling
- **Status Synchronization**: Sheet checkboxes automatically update token status effects
- **Powers & Special Actions**: Tabbed interface with auto-resize textareas
- **Combat Tracking**: Wounded/defeated status, action economy, damage calculations

#### 🌐 Multi-Language Support

- **Three Languages**: English, Polish, and French (complete 611-line translation)
- **Smart Subtitles**: English subtitles hidden when system language is English
- **Bilingual Labels**: Primary language + English subtitle (in non-English modes)
- **CSS Localization**: Language-specific rules using `html[lang="en"]` selectors
- **Terminology**: Proper translations (Force/Might, Agilité/Edge, Résistance/Grit, Astuce/Wits)
- **Complete Coverage**: All UI, dialogs, chat messages, and system features fully localized
- **Organized Stylesheets**: Moved dialog styles to `styles/partials/` folder for organized styling

### User Interface

- **Responsive Design**: Optimized for 1080p and 1440p with resizable windows
- **Visual Feedback**: Color-coded buttons, gradients, animations, status highlights
- **Auto-Save**: Real-time change detection and persistence without sheet refresh
- **Compact Layout**: Information-dense design maximizes screen space
- **Font Sizing**: Increased readability - 15px for descriptions, 14px for details
- **NPC Form Handling**: Debounced text inputs (500ms) prevent sheet freezing during typing
- **Textarea Auto-Resize**: Respects min-height, expands smoothly, shows scrollbar only when needed
- **Status Icons**: Custom colors preserved - red for wounded, black for immobilized

### Character Creation & Origins

Create your hero with the **interactive character creation wizard**:

**Choose Your Origin**: Select from 10 unique backgrounds that shape your character

- **From the Hills** - Hardy mountain folk (30 LP base)
- **From the Streets** - Urban survivors (22 LP base)
- **From the Steppes** - Nomadic riders (26 LP base)
- **From the North** - Fierce northern warriors (32 LP base)
- **From the Wilds** - Untamed wilderness dwellers (30 LP base)
- **From a Civilized Land** - Educated city folk (22 LP base)
- **From Parts Unknown** - Mysterious wanderers (26 LP base)
- **From the Blood of Jhebbal Sag** - Beast-touched (28 LP base)
- **From the Blood of Acheron** - Ancient sorcerous lineage (20 LP base)
- **From the Blood of Demon** - Infernal heritage (26 LP base)

**Distribute 16 Points**: Build your character by assigning points (1-6 each) across four attributes

**Automatic Setup**: System calculates all derived values (Life Points, Defense, Stamina)

**Starting Resources**: Begin with 3 XP to invest in starting skills

**Origin Lock**: After character creation, origin selection becomes locked to prevent accidental changes

### The Four Attributes

Your character is defined by four key attributes, each with values from 1-8:

- **Might (Krzepa)**: Raw physical power, melee combat, feats of strength
- **Edge (Refleks)**: Speed, agility, ranged combat, dodging
- **Grit (Hart)**: Endurance, toughness, resisting pain and poison, determines maximum Life Points
- **Wits (Spryt)**: Intelligence, perception, cunning, sorcery resistance

Each attribute has its own die (d6/d8/d10) that improves as the value increases.

**Attribute Penalties**: When poisoned (Effect #1), all attributes are reduced by 1, affecting:
- Roll modifiers (tests, attacks, damage)
- Derived stats (Life Points max = origin_base + 2 × Grit, Defense = Edge/Wits + 2)
- Visual indicators show the penalty with green highlighting and down arrows

### The Flex Die System

The **Flex Die** (Kość Brawury) is a special die rolled alongside every test that represents your character's destiny and luck. It starts as a **d10** at character creation but can degrade to **d8, d6, or even d4** as your character faces hardships and spends their destiny throughout the campaign.

When you roll the **maximum value** on your current Flex Die (10 on d10, 8 on d8, 6 on d6, 4 on d4), you trigger a **Flex Effect** and choose one powerful option:

- **Sorcery Recovery**: Restore spent Life Points and Stamina from spellcasting (purple option)
- **Massive Damage**: Add maximum weapon die value + modifier to damage (or double fixed damage, red option)
- **Stamina Boost**: Gain +1 stamina point to keep fighting
- **Convert to Success**: Turn a failed roll into a success

The degrading Flex Die mechanic creates a sense of tension and character arc - fresh heroes have fate on their side with d10, while weathered veterans running on fumes might be down to d4, making each Flex Effect trigger increasingly rare and precious.

### Equipment & Combat System

- **Weapon Management**: Complete system with type selection, handedness, size categories, and damage calculation
- **Armor System**: Light/Medium/Heavy/Shield types with material quality and encumbrance tracking
- **Combat Rules**: Shield restrictions, weapon combination limits, overencumbered warnings
- **Initiative System**: Edge-based initiative with Combat Tracker integration
- **Automatic Calculations**: Real-time AR, Encumbrance, and combat stat updates

### Notes & Biography

- **Two-Column Layout**: Biography and Notes displayed side-by-side
- **Auto-Resizing Fields**: Text areas grow with your content
- **Automatic Saving**: Changes save instantly as you type
- **Bilingual Labels**: Polish and English labels throughout

## Getting Started

### Quick Start Guide

#### 1. Create Your Character

1. Create a new **Actor** (type: Character)
2. Click the **"Stwórz / Create"** button in the sheet header
3. In the creation wizard:
   - Select your origin (determines starting Life Points)
   - Distribute 16 points among Might, Edge, Grit, and Wits (1-6 per attribute)
   - Click **"Zatwierdź / Confirm"**

4. Your character is ready! All derived values are calculated automatically

#### 2. Build Your Starting Skills

1. Open the **Skills** tab
2. Click **"Dodaj / Add Skill"** in the Starting Skills section
3. Enter skill details:
   - **Name**: What the skill is called
   - **XP Cost**: How many points it costs (required)
   - **Effect**: What the skill does
   - **Origin Skill**: Check if this is a free skill from your origin

4. System automatically deducts XP from your pool
5. Edit or delete skills as needed - XP is refunded on deletion

#### 3. Make Your First Test

1. Click on any **attribute name** or its roll button
2. In the difficulty dialog:
   - Choose a difficulty level (or enter custom 1-30)
   - Adjust the modifier slider if you have bonuses/penalties
   - Click **"Rzuć / Roll"**

3. Watch the dice roll (both attribute die and Flex Die)
4. Check the chat for results:
   - Success or Failure
   - If Flex Die shows 10, choose your Flex Effect!

#### 4. Combat & Status Management

- **Defence Action**: Click shield icon to activate +2 Physical Defense bonus (costs 1 Action, gold highlight)
- **Immobilized Status**: Click paralysis icon if character is immobilized (sets Defense to 0, red highlight)
- **Poisoned Status**: Toggle poison icon to activate poison penalties
  - Effect #1: -1 to all attributes (Might, Edge, Grit, Wits)
  - Visual indicators: green skull, tinted fields, down arrow (↓) in circles
  - Automatically reduces Life Points max and Defense based on affected attributes
  - Affects all rolls, attacks, and damage calculations
- **Wounded Status (Minions)**: Check "ranny" checkbox to mark minion as wounded (red blood drop icon on token)
- **Stamina Spending**:
  - Click Stamina button for tactical options (extra move, range boost, ignore encumbrance, origin ability)
  - Right-click chat messages to boost rolls (+1/+2) or damage (+1d4/+2d4)
- **Damage Application**: Click "Deal Damage" buttons in chat to apply damage to targets
- **Status Effects**: Right-click tokens → Assign Status Effects to manually toggle wounded/immobilized/poisoned

#### 5. Cast Spells (If Magical Origin)

1. Click the purple **"Spellcasting"** button
2. Enter Life Points and/or Stamina costs
3. Select target Sorcery Defense if attacking
4. Roll magic attack vs Sorcery Defense
5. If successful, roll magic damage (Wits die, custom die, or fixed value)

**NPC Text Input**: Sheet may feel slightly laggy during text typing (500ms debounce for smooth operation)

## Known Issues

- **Poison Effects #2-5**: Currently UI-only - full mechanical effects not yet implemented (Effect #1 is complete)
- **Flex Effect Dialog**: May show incorrect options if accessed from certain roll types

## Technical Details

### File Structure

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
├── CHANGELOG.md
├── lang/
│   ├── en.json
│   ├── pl.json
│   └── fr.json
├── LICENSE.txt
├── module/
│   ├── conan.mjs
│   ├── documents/
│   │   ├── actor.mjs
│   │   └── item.mjs
│   ├── helpers/
│   │   ├── attack-dialog.mjs
│   │   ├── character-creation-dialog.mjs
│   │   ├── config.mjs
│   │   ├── damage-dialog.mjs
│   │   ├── difficulty-dialog.mjs
│   │   ├── flex-dialog.mjs
│   │   ├── initiative-dialog.mjs
│   │   ├── npc-attack-dialog.mjs
│   │   ├── npc-difficulty-dialog.mjs
│   │   ├── npc-damage-dialog.mjs
│   │   ├── poisoned-dialog.mjs
│   │   ├── roll-mechanics.mjs
│   │   ├── roll-sorcery-damage.mjs
│   │   ├── socket.mjs
│   │   ├── spellcasting-dialog.mjs
│   │   ├── stamina-effects.mjs
│   │   ├── stamina-spend-dialog.mjs
│   │   ├── starting-skills-dialog.mjs
│   │   ├── tale.mjs                        ← NEW (v0.0.59)
│   │   └── templates.mjs
│   └── sheets/
│       ├── actor-sheet.mjs
│       ├── item-sheet.mjs
│       └── npc-sheet.mjs
├── README.md
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
│   ├── tale.css                             ← NEW (v0.0.59)
│   └── partials/
│       ├── actor-spell.css
│       ├── attack-dialog.css
│       ├── combat-tracker.css
│       ├── damage-dialog.css
│       ├── poisoned-effects.css
│       ├── spellcasting-dialog.css
│       └── stamina-spend-dialog.css
├── system.json
├── template.json
└── templates/
    ├── actor/
    │   ├── actor-antagonist-sheet.hbs
    │   ├── actor-character-sheet.hbs
    │   ├── actor-minion-sheet.hbs
    │   └── parts/
    │       ├── actor-attributes.hbs
    │       ├── actor-biography.hbs
    │       ├── actor-effects.hbs
    │       ├── actor-items.hbs
    │       └── actor-skills.hbs
    ├── dialogs/
    │   ├── attack-dialog.hbs
    │   ├── character-creation-dialog.hbs
    │   ├── damage-dialog.hbs
    │   ├── difficulty-dialog.hbs
    │   ├── flex-effect.hbs
    │   ├── initiative-dialog.hbs
    │   ├── npc-attack-dialog.hbs
    │   ├── npc-difficulty-dialog.hbs
    │   ├── npc-damage-dialog.hbs
    │   ├── poisoned-dialog.hbs
    │   ├── spellcasting-dialog.hbs
    │   ├── stamina-spend-dialog.hbs
    │   ├── starting-skills-dialog.hbs
    │   ├── tale-dialog.hbs                  ← NEW (v0.0.59)
    │   └── tale-player-dialog.hbs           ← NEW (v0.0.59)
    └── item/
        ├── item-sheet.hbs
        └── parts/
            ├── item-description.hbs
            ├── item-effects.hbs
            └── item-header.hbs
```

### Architecture

This system is built with modern Foundry VTT best practices:

- **ApplicationV2**: All sheets and dialogs use the modern API with proper hooks
- **Native DOM**: No jQuery dependency, pure JavaScript
- **Modern CSS**: Flexbox layouts, CSS variables, modular organization with partials
- **Auto-save**: Real-time change detection and persistence
- **Debounced Form Handling**: NPC sheets use 500ms debounce to prevent freezing during text input
- **Custom Status Effects**: Registered in CONFIG.statusEffects with proper color preservation
- **Dice So Nice Integration**: Custom 3D dice with bronze Flex Die colorset
- **Socket Synchronization**: Real-time updates, permission-free player actions via GM delegation
- **Token Delta System**: Proper Foundry v13 unlinked token support with actorData.system path

## Support & Contributing

### Reporting Issues

Found a bug or have a feature request? Please create an issue on the project repository with:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- System version and Foundry VTT version

## Roadmap

Planned features for future updates:

- **Poison Effects #2-5**: Complete mechanical implementation of remaining poison effects
- **Additional Status Effects**: Stunned, Blinded, Prone, and other combat conditions
- **Advanced NPC AI**: Automated behavior patterns and tactical decision-making
- **Campaign Tools**: Enhanced journal integration, quest tracking, campaign arc management
- **Compendiums**: Pre-made characters, NPCs, weapons, armor, spells, and adventures
- **Macro Support**: Custom macro library for complex actions and automation
- **Character Sheet Variants**: Alternative layouts for different play styles

## License

This is an **unofficial** fan-made system for Foundry VTT.

**Conan: The Hyborian Age RPG** is created by Monolith Boardgames.
**Conan the Barbarian** and the Hyborian Age are properties of Conan Properties International LLC.

This system is provided as-is for personal use. Not affiliated with or endorsed by Monolith Boardgames or Conan Properties International.

## Credits

- **System Developer**: Zuraff (Discord: eliandir_)
- **Game System**: Conan: The Hyborian Age RPG by Monolith Boardgames
- **Setting**: Based on Robert E. Howard's Conan the Barbarian
- **Platform**: Foundry Virtual Tabletop v13+

## Version

Current version: **0.0.60**

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.
