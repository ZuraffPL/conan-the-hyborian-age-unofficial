# Conan: The Hyborian Age

An unofficial Foundry VTT implementation of **Conan: The Hyborian Age RPG** by Monolith Boardgames. Step into the savage world of Robert E. Howard's Conan the Barbarian and forge your legend in the Hyborian Age!

## Installation

### Method 1: Install via Foundry VTT (Recommended)

1. Open Foundry VTT and go to the **Game Systems** tab
2. Click **Install System**
3. Paste this manifest URL into the field:
  https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
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

### Latest Version: [0.0.42] - 2025-12-12

**Multiplayer Permission Fixes**
- **Fixed**: Permission errors preventing players from dealing damage to enemies during combat
- **Fixed**: "User lacks permission to update Token" errors for Player and Trusted Player roles
- **Fixed**: "User lacks permission to update Combatant" errors when marking enemies as defeated
- **Fixed**: 404 errors for missing parchment background images in CSS files
- **Added**: Socket system for GM delegation of privileged operations
- **Improved**: Players can now deal damage from chat messages and Flex Effects without permission errors
- **Technical**: All token and combatant updates now use socket system to route player requests through GM

### Key Features Summary

#### 🎲 **Complete Combat System**
- **Damage Application**: "Deal Damage" buttons for PC and NPC damage rolls with automatic armor reduction
- **Massive Damage**: Flex Effect option adds maximum weapon die value + modifier (or doubles fixed damage)
- **Unlinked Token Support**: Full support for independent NPC tokens with proper data handling
- **HP Indicator**: Visual red highlight when character is injured (actual < max HP)
- **Dead Overlay**: Skull icon overlay for defeated tokens (minions and antagonists)

#### ⚡ **Stamina Management System**
- **Tactical Spending**: Dedicated button for tactical options (extra movement, thrown weapon range boost, ignore encumbrance)
- **Context Menu Boosts**: Right-click on chat messages to spend 1-2 Stamina for:
- Roll boosts (+1/+2 to attribute tests, initiative, attacks)
- Damage boosts (+1d4/+2d4 to damage rolls)
- Massive Damage (when exactly 1 Stamina remains)
- **Stamina Effects**: Can stack with Flex Effect Massive Damage on same roll

#### 🧙 **Complete Sorcery System**
- **Spellcasting**: Purple "Spellcasting" button with Life Points/Stamina cost management
- **Flex Effect Recovery**: Sorcery option in Flex Effect dialog recovers spent spell costs
- **Three Damage Types**: Wits die, custom die, and fixed value options
- **Origin Restrictions**: 10 origins with varying magic access and discipline limits

#### 🛡️ **Defense & Status Effects**
- **Defence Toggle**: Active defense action (+2 Physical Defense, 1 Action cost)
- **Immobilized Status**: Sets Physical Defense to 0 when active
- **Poisoned Status**: UI toggle with 5 configurable poison effects (full logic coming soon)
- **NPC Defense Sync**: Proper synchronization between basePhysical and defense values

#### 🧪 **XP & Skill Management**
- **XP Refund**: Skills and spells refund XP cost when removed from character sheet
- **Initial Cost Tracking**: `initialCost` flag ensures accurate refunds
- **Bidirectional Sync**: Automatic synchronization between world items and character sheets
- **Origin Skills**: Free skills based on character origin with gold badge indicators

#### 🎯 **NPC System**
- **Two NPC Types**: Minions (simplified) and Antagonists (full stats)
- **Creature Types**: 6 categories (Human, Inanimate, Undead, Monstrosity, Demon, Beast)
- **Tabbed Interface**: Statistics and Powers tabs with auto-resize textareas
- **Combat Tracking**: Wounded/defeated status, action economy, damage calculations
- **Color-Coded Chat**: Green for minions, red for antagonists

#### 🌐 **Multi-Language Support**
- **Three Languages**: English, Polish, and French (complete 611-line translation)
- **Smart Subtitles**: English subtitles hidden when system language is English
- **Consistent Terminology**: Proper translations for all game terms

#### 🎨 **UI & UX Improvements**
- **CSS Organization**: Modular CSS structure with partials folder
- **Responsive Design**: Optimized for 1080p with resizable windows
- **Visual Feedback**: Color-coded buttons, gradients, animations
- **Auto-Save**: Real-time change detection and persistence
- **Compact Layout**: Information-dense design maximizes screen space

### Character Creation & Origins

Create your hero with the **interactive character creation wizard**:

- **Choose Your Origin**: Select from 10 unique backgrounds that shape your character
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

- **Distribute 16 Points**: Build your character by assigning points (1-6 each) across four attributes
- **Automatic Setup**: System calculates all derived values (Life Points, Defense, Stamina)
- **Starting Resources**: Begin with 3 XP to invest in starting skills
- **Origin Lock**: After character creation, origin selection becomes locked to prevent accidental changes

### The Four Attributes

Your character is defined by four key attributes, each with values from 1-8:

- **Might (Krzepa)**: Raw physical power, melee combat, feats of strength
- **Edge (Refleks)**: Speed, agility, ranged combat, dodging
- **Grit (Hart)**: Endurance, toughness, resisting pain and poison
- **Wits (Spryt)**: Intelligence, perception, cunning, sorcery resistance

Each attribute has its own die (d6/d8/d10) that improves as the value increases.

### The Flex Die System

The **Flex Die** (Kość Brawury) is a special d10 rolled alongside every test. When you roll a **10**, you trigger a powerful **Flex Effect**:

- **Stamina Boost**: Gain +1 stamina point to keep fighting
- **Convert to Success**: Turn a failed roll into a success
- **Sorcery Recovery**: Restore spent Life Points and Stamina from spellcasting
- **Massive Damage**: Add maximum weapon die value + modifier to damage (or double fixed damage)

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

#### 4. Manage Combat & Resources

- **Defence Action**: Click shield icon to activate +2 Physical Defense bonus (costs 1 Action)
- **Immobilized Status**: Click paralysis icon if character is immobilized (sets Defense to 0)
- **Stamina Spending**: Use right-click context menu on chat messages to boost rolls or damage
- **Damage Application**: Click "Deal Damage" buttons in chat to apply damage to targets

#### 5. Cast Spells (If Magical Origin)

1. Click the purple **"Spellcasting"** button
2. Enter Life Points and/or Stamina costs
3. Select target Sorcery Defense if attacking
4. Roll magic attack vs Sorcery Defense
5. If successful, roll magic damage (Wits die, custom die, or fixed value)

## Known Issues

- **Poisoned Status**: Currently UI-only - full mechanical effects not yet implemented
- **Flex Effect Dialog**: May show incorrect options if accessed from certain roll types

## Technical Details

### File Structure
conan-the-hyborian-age/
├── assets/
│ └── icons/
│ ├── damage.svg
│ ├── paralysis.svg
│ ├── Poisoned.svg
│ └── trap.svg
├── CHANGELOG.md
├── lang/
│ ├── en.json
│ ├── pl.json
│ └── fr.json
├── LICENSE.txt
├── module/
│ ├── conan.mjs
│ ├── documents/
│ │ ├── actor.mjs
│ │ └── item.mjs
│ ├── helpers/
│ │ ├── attack-dialog.mjs
│ │ ├── character-creation-dialog.mjs
│ │ ├── config.mjs
│ │ ├── damage-dialog.mjs
│ │ ├── difficulty-dialog.mjs
│ │ ├── flex-dialog.mjs
│ │ ├── initiative-dialog.mjs
│ │ ├── npc-attack-dialog.mjs
│ │ ├── npc-difficulty-dialog.mjs
│ │ ├── npc-damage-dialog.mjs
│ │ ├── poisoned-dialog.mjs
│ │ ├── roll-mechanics.mjs
│ │ ├── roll-sorcery-damage.mjs
│ │ ├── socket.mjs
│ │ ├── spellcasting-dialog.mjs
│ │ ├── stamina-effects.mjs
│ │ ├── stamina-spend-dialog.mjs
│ │ └── templates.mjs
│ └── sheets/
│ ├── actor-sheet.mjs
│ ├── item-sheet.mjs
│ └── npc-sheet.mjs
├── README.md
├── styles/
│ ├── actor-armor.css
│ ├── actor-npc.css
│ ├── actor-weapon.css
│ ├── character-creation-dialog.css
│ ├── conan.css
│ ├── flex-dialog.css
│ ├── item-armor.css
│ ├── item-skill.css
│ ├── item-weapon.css
│ ├── roll-chat.css
│ ├── roll-dialog.css
│ ├── stamina-effects.css
│ └── partials/
│ ├── actor-spell.css
│ ├── attack-dialog.css
│ ├── combat-tracker.css
│ ├── damage-dialog.css
│ ├── poisoned-effects.css
│ ├── spellcasting-dialog.css
│ └── stamina-spend-dialog.css
├── system.json
├── template.json
└── templates/
├── actor/
│ ├── actor-antagonist-sheet.hbs
│ ├── actor-character-sheet.hbs
│ ├── actor-minion-sheet.hbs
│ └── parts/
│ ├── actor-attributes.hbs
│ ├── actor-biography.hbs
│ ├── actor-effects.hbs
│ ├── actor-header.hbs
│ ├── actor-items.hbs
│ └── actor-skills.hbs
├── dialogs/
│ ├── attack-dialog.hbs
│ ├── character-creation-dialog.hbs
│ ├── damage-dialog.hbs
│ ├── difficulty-dialog.hbs
│ ├── flex-effect.hbs
│ ├── initiative-dialog.hbs
│ ├── npc-attack-dialog.hbs
│ ├── npc-difficulty-dialog.hbs
│ ├── npc-damage-dialog.hbs
│ ├── poisoned-dialog.hbs
│ ├── spellcasting-dialog.hbs
│ └── stamina-spend-dialog.hbs
└── item/
├── item-armor-sheet.hbs
├── item-skill-sheet.hbs
├── item-spell-sheet.hbs
├── item-weapon-sheet.hbs
└── parts/
├── item-description.hbs
└── item-header.hbs

### Architecture

This system is built with modern Foundry VTT best practices:

- **ES6 Modules**: Clean, modular JavaScript architecture
- **ApplicationV2**: Latest Foundry application framework for sheets and dialogs
- **HandlebarsApplicationMixin**: Efficient template rendering
- **Native DOM**: No jQuery dependency
- **Modern CSS**: Flexbox layouts, CSS variables, modular organization
- **Auto-save**: Real-time change detection and persistence
- **Dice So Nice Integration**: Custom 3D dice with bronze Flex Die
- **Socket Synchronization**: Real-time updates between actor and token sheets

## Support & Contributing

### Reporting Issues

Found a bug or have a feature request? Please create an issue on the project repository with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- System version and Foundry version

### Roadmap

Planned features for future updates:
- **Poisoned Status**: Full mechanical implementation with ongoing effects
- **Advanced NPC AI**: Automated behavior and tactical decision-making
- **Campaign Tools**: Journal integration, quest tracking, campaign management
- **Compendiums**: Pre-made characters, items, NPCs, and adventures
- **Macro Support**: Custom macro creation for complex actions

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

Current version: **0.0.40**

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.