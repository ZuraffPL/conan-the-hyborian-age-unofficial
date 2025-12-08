# Conan: The Hyborian Age

An unofficial Foundry VTT implementation of **Conan: The Hyborian Age RPG** by Monolith Boardgames. Step into the savage world of Robert E. Howard's Conan the Barbarian and forge your legend in the Hyborian Age!

## Installation

### Method 1: Install via Foundry VTT (Recommended)

1. Open Foundry VTT and go to the **Game Systems** tab
2. Click **Install System**
3. Paste this manifest URL into the field:
   ```
   https://raw.githubusercontent.com/ZuraffPL/conan-the-hyborian-age-unofficial/main/system.json
   ```
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

**[0.0.36]**: Release infrastructure update! Updated manifest and download URLs to use GitHub's `/latest/` endpoint for automatic version detection. Added Known Issues documentation for Poisoned status. Improved release workflow alignment with Foundry VTT best practices.

**[0.0.35]**: CHANGELOG cleanup! Condensed multiple version entries (0.0.16-0.0.21, 0.0.22-0.0.25, 0.0.26-0.0.29) for better readability while preserving all key features and fixes. Added complete French translation (fr.json) with 611 lines covering all system features. System now supports 3 languages (English, Polish, French). See CHANGELOG.md for full details.

**[0.0.34]**: Stamina Spending System! Added comprehensive stamina resource management via right-click context menu on chat messages. Spend 1-2 Stamina to boost roll results (+1/+2) for attribute tests, initiative, and attacks. Spend 1-2 Stamina to add 1d4/2d4 damage to damage rolls. Special "Massive Damage" option when exactly 1 Stamina remains - works like Flex Effect Massive Damage (max die value or double fixed) and CAN STACK with Flex Effect on same roll! New stamina-effects.mjs module with Foundry v13 ApplicationV2 ChatLog integration. Blue/gold gradient cards with animations. **CRITICAL FIX**: Delta system implementation - damage now properly applies to antagonist NPCs (was `actorData.system`, now `delta.system` for v13 unlinked tokens). Context menu shows 5 options based on message type. 10+ localization keys added. See CHANGELOG.md for full details.

**[0.0.32]**: Spell XP Refund! Spells now correctly refund their XP cost when removed from character sheet, matching skill behavior. Added `initialCost` flag tracking for accurate refunds and localized notifications (PL: "Zaklęcie usunięte, zwrócono X PD", EN: "Spell removed, refunded X XP"). Unified XP refund logic in `_onItemDelete` for skills and spells with fallback to `system.xpCost`. Fixed missing Polish translation key.

**[0.0.31]**: Massive Damage Flex Effect! Added "Massive Damage" (Kolosalne Obrażenia) option to Flex Effect dialog for all damage rolls - adds maximum weapon die value + modifier to damage, or doubles fixed damage. Red gradient button styling, chat message with damage breakdown. Complete unlinked token support: minion/antagonist defeated status now syncs to combat tracker with skull icon overlay. Fixed die parsing for all formats (d6, 1d6, 2d8), string concatenation bugs, and token update errors. Added `defeated` field to minion template. Enhanced damage application with proper TokenDocument handling and race condition prevention.

**[0.0.30]**: Sorcery cost recovery via Flex Effect! Added "Sorcery" option to Flex Effect dialog for magic attacks and spell damage - restores spent Life Points and Stamina when Flex Die shows maximum. Spell costs stored in actor flags during casting and recovered with detailed chat messages. Complete CSS overhaul: color-coded buttons (blue stamina, green success, purple sorcery), improved header with gradient and decorative elements, fixed text wrapping. New flex-dialog.css file, updated translations (PL/EN), fixed duplicate methods and button handler conflicts. Mobile responsive design.

**[0.0.29]**: Complete PC damage system & visual HP indicator! Added "Deal Damage" buttons to all PC damage roll messages (melee, ranged, thrown, sorcery) with automatic damage application to targets. Full armor reduction, type-specific mechanics (character HP, antagonist combat tracker, minion wounds), and one-click-only system with flag-based deactivation. Visual HP indicator: Life Points box shows red highlight when injured (actual < max HP). Fixed critical bugs: attackerNotFound error, unlinked token actor IDs, minion defeated banner, HP update issues, pending form edits. Added blur() mechanism for form sync. See CHANGELOG.md for full details.

**[0.0.28]**: Damage application & token system overhaul! Added "Deal Damage" button to NPC damage chat messages for automatic damage application with armor reduction. Added "Roll Damage" button to successful attack messages. Character tokens now linked by default, NPC tokens unlinked. Full support for token-specific data in damage calculations. Fixed character HP updates, armor calculation from equipped items, and double dice animations. Automatic sheet refresh on damage. See CHANGELOG.md for full details.

**[0.0.27]**: NPC damage roll system! Added complete damage roll functionality for NPCs with dedicated dialog showing weapon stats and Brawn value. Melee attacks include Brawn + weapon die + modifiers, ranged attacks use weapon die + modifiers. New damage buttons with damage.svg icon on NPC sheets. Color-coded chat messages (green for minions, red for antagonists). Fixed magic damage animation bleeding into NPC rolls. Fixed duplicate translations and missing modifier labels. See CHANGELOG.md for full details.

**[0.0.26]**: NPC token sheet improvements! Fixed NPC sheet synchronization to respect token linking settings - linked tokens sync with base actor, unlinked tokens are independent. Fixed Defence, Immobilized, and Poisoned buttons not working on NPC token sheets. Ensured proper actor instance handling based on token linking status. See CHANGELOG.md for details.

**[0.0.24]**: Visual and sync improvements! Radio buttons in the damage dialog are now always visually aligned, with a dark center and visible shadow, regardless of selection state. All changes on actor sheets (from actors tab or token) are now synchronized in real time via socket, always updating the base actor. Damage dialog fixes: correct weapon preselection and parameter passing for all attack types and token actors. All sheet actions now use baseActor for data consistency. See CHANGELOG.md for details.

**[0.0.23]**: Major update! Modularized and improved the sorcery (magic) damage roll system, supporting three independent options: Wits die, custom die, and fixed value. Added a visually distinct, purple, pulsating header for magic damage chat messages. Implemented a "Deal Damage" button in chat messages after successful attacks (including magic), for both PCs and NPCs, which opens the damage dialog and executes the roll. All magic damage options and UI elements are fully localized (PL/EN). Refactored and exported all roll logic for better modularity. Updated attribute display on character sheets (label as main, abbr as caption). Improved CSS for chat messages, buttons, and attribute display. Fixed bugs with parameter passing, dialog resolve logic, and token-based item IDs. See CHANGELOG.md for full details.

**[0.0.22]**: Nagłówek komunikatu obrażeń magicznych w czacie jest teraz ciemniejszy, pulsujący fiolet. Pełna lokalizacja opcji stałych obrażeń magicznych. Poprawki przekazywania parametrów i wyświetlania dla wszystkich trzech typów obrażeń magicznych.

**[0.0.21]**: Naprawiono przekazywanie parametrów z dialogu obrażeń magicznych: oba typy rzutu (kość sprytu i własna kość) działają poprawnie i niezależnie. Usprawniono logikę dialogu, aby zawsze przekazywał sorceryDamageType i sorceryCustomDie do handlera. Błąd: wybór opcji "własna kość" lub "kość sprytu" nie wykonywał rzutu – poprawiono przekazywanie parametrów i obsługę w actor-sheet.mjs.

**[0.0.20]**: Naprawiono logikę obrażeń magicznych (kość sprytu): rzut uwzględnia teraz zarówno modyfikator z parametrów, jak i z suwaka. Poprawiono dialog i handler, aby oba modyfikatory były przekazywane do funkcji rzutu. Działa niezależnie od broni.

**[0.0.19]**: Dynamiczny dialog obrażeń magicznych (wszystkie opcje: kość sprytu, własna kość, wartość stała) z przełączaniem bez przeładowania, wszystkie pola w jednej linii, dedykowany styl kości sprytu, tłumaczenia Spryt/kość sprytu, poprawki UI/UX i CSS.

**[0.0.18]**: Ranged weapon damage modifier now displays perfectly inline with the dice result in chat. Improved CSS for weapon bonus. Fixed all JS errors and ensured full sheet compatibility after chat message changes.

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
- **Origin Lock**: After character creation, origin selection becomes locked to prevent accidental changes to foundational character data

### The Four Attributes

Your character is defined by four key attributes, each with values from 1-8:

- **Might (Krzepa)**: Raw physical power, melee combat, feats of strength
- **Edge (Refleks)**: Speed, agility, ranged combat, dodging
- **Grit (Hart)**: Endurance, toughness, resisting pain and poison
- **Wits (Spryt)**: Intelligence, perception, cunning, sorcery resistance

Each attribute has its own die (d6/d8/d10) that improves as the value increases.

### Combat & Resources

- **Initiative System**: Custom Edge-based initiative for combat
  - Initiative button on character sheet (below attributes)
  - Integrated with Combat Tracker - replaces standard d20 rolls
  - Dialog shows Edge attribute with modifier slider (-3 to +3)
  - Rolls Edge die + Edge value + modifier
  - Flex Die included for potential Flex effects
  - Automatically updates Combat Tracker initiative value
  - Simple chat message display
- **Life Points**: Origin base + (2 × Grit) - tracks your health in combat
- **Stamina**: Used for special actions and recovering from exhaustion (max 100)
- **Physical Defense**: Edge + 2 (minimum 5) - difficulty to hit you in melee/ranged
  - **Defence Action (1 Action)**: Toggle button to add +2 bonus to Physical Defense
  - Shield icon button - gold highlight when active
  - Cannot be used when Immobilized
- **Immobilized Status**: Toggle button to mark character as immobilized
  - Paralysis icon button - red highlight when active
  - Sets Physical Defense to 0 (original value crossed out)
  - Prevents Defence action while active
- **Sorcery Defense**: Wits + 2 (minimum 5) - resistance to magical attacks
- **Experience Points**: Spend XP to gain skills, talents, and improve your character

### NPC System

Create and manage adversaries with two distinct NPC types:

- **Minions (Sługusy)**: Rank-and-file enemies and lesser foes
  - Attributes: Values 1-20 with die types (d4/d6/d8/d10/d12)
  - Physical Defence (0-20) - resistance to attacks
  - Sorcery Defence (0-20) - resistance to magic
  - Threshold (1-25) - damage absorption before wounds
  - **Armor (Pancerz/Armor) (0-20)**: Damage reduction value
  - **Wounded Status**: Checkbox for tracking minion injuries
  - Streamlined for quick combat resolution
  - No flex die (simplified rolling for GM efficiency)
  
- **Antagonists (Antagoniści)**: Major villains and powerful enemies
  - Attributes: Values 1-50 with die types (d4/d6/d8/d10/d12)
  - Physical Defence (0-50) - enhanced protection
  - Sorcery Defence (0-50) - powerful magical resistance
  - **Armor (Pancerz/Armor) (0-20)**: Damage reduction value
  - Life Points (0-999) - health tracking for extended combats
  - Designed for memorable boss encounters
  - No flex die (keeps focus on player heroes)

- **Tabbed Interface**: Organized content with two-tab system
  - **Statistics Tab**: All combat-relevant information
    - Attributes section with roll buttons
    - Defense values (Physical/Sorcery/Threshold/Armor/Life Points)
    - Damage section (Melee and Ranged with die/modifier)
    - Actions section (per round and number of attacks)
  - **Powers Tab**: Narrative abilities and special rules
    - Magic Powers section with large textarea
    - Special Actions section with large textarea
    - Decorative separator between sections
    - Auto-resize textareas (80px-400px height range)

- **Combat Tracking**: Complete damage and action management
  - **Damage Section**: Melee and Ranged subsections
    - Weapon name field for reference
    - Damage die selector (d4 through d12)
    - Damage modifier for bonuses/penalties
    - N/A checkbox with strikethrough effect for unused types
  - **Actions Section**: Action economy tracking
    - Actions per Round (1-10)
    - Number of Attacks (1-10)
    - Automatic validation: attacks ≤ actions

- **Creature Types**: Six categories for mechanical differentiation
  - Human, Inanimate (Konstrukt), Undead (Nieumarły), Monstrosity (Monstrum), Demon, Beast (Bestia)
  
- **NPC Rolling**: Simplified attribute tests
  - Roll: Attribute value + die + modifier vs difficulty
  - Modifier slider (-3 to +3) for situational adjustments
  - Winds of Fate active (1 on die = auto-fail)
  - Chat messages scaled smaller and color-coded (green=minion, red=antagonist)
  - Compact 640px wide × 1000px tall sheets optimized for GM workflow

- **Visual Features**:
  - N/A strikethrough effect: Disabled damage types show visual line through row
  - Auto-resize textareas: Powers fields grow with content (max 400px)
  - Color-coded tabs: Brown underline for active tab
  - Optimized field widths: No label truncation or wrapping
  - Subsection headers: Gradient backgrounds with icons

- **Technical Features**:
  - Numeric input validation enforces min/max ranges for all fields
  - setupNACheckboxes() helper function for shared logic
  - Auto-resize JavaScript for dynamic textarea heights
  - Tab activation with ApplicationV2 architecture
  - Token bars configured for life points and armor rating
  - Separate CSS architecture for maintainability (.minion and .antagonist classes)

### Skills & Development

- **Starting Skills**: Begin with origin-specific and chosen starting skills
  - Origin skills are free (marked with gold badge)
  - Purchase additional skills with starting XP
  - Each skill has a cost and describes its effects
  - Manage with easy add/edit/delete interface
- **Character Advancement**: As you adventure, spend earned XP to:
  - Learn new skills and combat techniques
  - Acquire talents with special abilities
  - Improve your attributes and capabilities
- **Dynamic XP Management**: 
  - XP automatically adjusts when you edit skill/spell costs
  - Prevents spending more XP than available
  - Real-time validation with helpful notifications
  - Origin skills remain free even if costs change

### Character Notes & Biography

Manage your character's story and important details in the **Notes tab**:

- **Two-Column Layout**: Biography and Notes displayed side-by-side with elegant vertical separator
- **Character Background**: Document your hero's origin story, personality, motivations, and history
- **Session Notes**: Track ongoing plots, reminders, clues, and campaign-specific information
- **Auto-Resizing Fields**: Text areas automatically grow with your content (minimum 200px height)
- **Automatic Saving**: Changes save instantly as you type
- **Bilingual Labels**: Polish and English labels with helpful subtitles

### The Flex Die System

The **Flex Die** (Kość Brawury) is a special d10 rolled alongside every test. When you roll a **10**, you trigger a powerful **Flex Effect**:

- **Stamina Boost**: Gain +1 stamina point to keep fighting
- **Convert to Success**: Turn a failed roll into a success - snatching victory from defeat!

*Future effects coming soon: Sorcery refund, Massive Damage*

### Dice Rolling & Tests

When you click any attribute to test it:

1. **Set Difficulty**: Choose from preset ranges or custom value (1-30)
   - Easy: 4-6
   - Moderate: 7-9
   - Tough: 10-12
   - Legendary: 13+
2. **Apply Modifiers**: Use the slider to add situational bonuses/penalties (-3 to +3)
3. **Roll**: Both dice animate simultaneously (with Dice So Nice integration)
4. **Modern Chat Display**: Beautiful, color-coded chat messages show:
   - Roll type (Attribute Test with brown header / Magic Attack with purple header)
   - Large, visual dice results (Attribute/Wits die + Flex die)
   - Complete calculation breakdown (die + attribute + modifier = total)
   - Difficulty comparison
   - Success/Failure result with color coding (green/red)
   - Special effects: Winds of Fate warning, Flex Effect notification
5. **Special Conditions**:
   - **Winds of Fate**: Rolling 1 on attribute/Wits die = automatic failure
   - **Flex Effect**: Rolling 10 on Flex die = trigger special effect dialog

### Item Synchronization System

Manage your hero's gear across four item types:

- **Weapons**: Complete weapon management system
  - Weapon types: Melee (white), Thrown (yellow), Ranged (green)
  - Handedness (one-handed/two-handed) for melee weapons
  - Weapon size categories (light/medium/heavy) with automatic damage calculation
  - Range selection based on weapon type and size
  - Damage modifier field for ranged weapons
  - Improvised weapon checkbox for thrown weapons
  - "Różna" (Various) size for thrown weapons with automatic rule notes
  - Stipulations field for special weapon properties
  - Auto-resize textarea for detailed descriptions
  - Equip/unequip toggle with visual feedback
- **Armor**: Full armor management system with drag & drop
  - Armor types: Light, Medium, Heavy, Shield
  - Material quality: Crude, Standard, Quality, Superior
  - Armor Rating (AR) and Encumbrance tracking
  - Equip/unequip toggle with visual feedback
  - Automatic combat statistics calculation
  - Stipulations for special armor properties
- **Skills**: Character abilities with XP costs
  - XP cost field with automatic deduction from character XP pool
  - Origin skill checkbox - skills from character origin are free (no XP cost)
  - Effect description with auto-resize textarea
  - Automatic XP refund when skill is deleted
  - Full validation - prevents adding skill if insufficient XP
  - Default aura.svg icon for visual identification
  - **Bidirectional sync**: Changes sync automatically between character sheets and world items
- **Spells**: Sorcery system with discipline categorization
  - Five magic disciplines: Alchemy, Black Magic, Demonology, Necromancy, White Magic
  - XP cost field with automatic deduction from character XP pool
  - Effect description with auto-resize textarea
  - Automatic XP refund when spell is deleted
  - Full validation - prevents learning spell if insufficient XP
  - Default book.svg icon for visual identification
  - Dedicated Sorcery tab on character sheet for spell management
  - **Bidirectional sync**: Changes sync automatically between character sheets and world items
  - **Magic restrictions by origin**: Some origins cannot use magic or are limited to specific disciplines

### Sorcery & Spellcasting System

The system features a complete magic system with origin-based restrictions and interactive spellcasting:

- **Magic Restrictions by Origin**:
  - **From a Civilized Land**: Alchemy only (1 discipline)
  - **From Parts Unknown**: Any 2 disciplines
  - **From the Blood of Jhebbal Sag**: Alchemy + White Magic (2 disciplines)
  - **From the Blood of Acheron**: All 5 disciplines allowed
  - **From the Blood of Demon**: Black Magic + Demonology (2 disciplines)
  - **Other origins**: Cannot use magic at all
  - System prevents adding spells from forbidden disciplines
  - Sorcery tab is hidden for non-magical origins
  
- **Spellcasting Dialog**:
  - **Purple "Spellcasting" button** next to Initiative on character sheet
  - Disabled for non-magical origins
  - Interactive dialog shows:
    - Current Wits attribute value (used for magic attacks)
    - Life Points cost input
    - Stamina cost input
    - Magic Attack checkbox (for offensive spells)
    - Target Sorcery Defense input (when attacking)
    - Modifier slider (-3 to +3)
  
- **Cost Management**:
  - Automatically deducts Life Points and/or Stamina when casting
  - Validates sufficient resources before casting
  - Shows cost in chat message
  
- **Magic Attack Rolls**:
  - Rolls Wits die + Wits value + modifier vs Target Sorcery Defense
  - Includes Flex Die for potential Flex effects
  - Winds of Fate: Rolling 1 on Wits die = automatic failure
  - **Distinctive purple header** on chat messages (vs brown for regular tests)
  - Detailed calculation display with dice results
  - Success/failure determination with visual feedback

### Dice Rolling & Tests

The system features **automatic bidirectional synchronization** between world items and character sheets:

- **Character Sheet → World Items**: When you edit an item on a character sheet (weapon, armor, skill, or spell), those changes automatically update the original item in the Items directory
- **World Items → Character Sheets**: When you edit an item in the Items directory, those changes automatically propagate to all characters who have that item
- **ID-Based Matching**: Synchronization uses item IDs (not names) for accuracy and reliability
- **Smart Loop Prevention**: Built-in flags prevent infinite update loops
- **Visual Notifications**: System shows notifications when items are synchronized
- **Data Integrity**: Ensures all copies of an item stay consistent across your world
- **Works for All Types**: Weapons, Armor, Skills, and Spells all synchronize automatically

### Armor & Combat Statistics

The system features comprehensive armor and weapon management:

- **Armor Section**: Dedicated equipment tab section for armor items
  - Drag & drop armor from inventory or compendiums
  - Visual display of equipped armor with item images
  - One-click equip/unequip toggle
  - Expandable stipulations for special properties
- **Weapon Section**: Complete weapon management system
  - Drag & drop weapons from inventory or compendiums
  - Visual display with color-coded weapon types
  - Weapon statistics: Type, Handedness, Size, Range, Damage
  - Shield restriction: Only one-handed melee, thrown, or light ranged can be used with shield
  - Weapon combination limits: Realistic equipment restrictions
    - Max 2 one-handed melee weapons
    - Max 1 one-handed melee + 1 thrown weapon
    - Max 1 two-handed weapon (blocks other weapons)
    - Max 1 heavy ranged weapon (blocks other weapons)
    - Max 1 light/medium ranged weapon (solo only)
  - Expandable stipulations for weapon rules
- **Automatic Calculations**: Real-time combat statistics
  - **Armor Rating (AR)**: Total protection from all equipped armor
  - **Encumbrance**: Combined weight of equipped armor
  - **Overencumbered Status**: Warning when encumbrance exceeds Might value
- **Visual Feedback**: 
  - Green equip button when armor/weapon is equipped
  - Red warning with icon when overencumbered
  - Color-coded weapon types (white/yellow/green)
  - Stats displayed prominently in character header

### User Interface

- **Authentic Aesthetic**: Parchment-themed UI with brown/sepia medieval styling
- **Responsive Design**: Optimized for 1080p but adapts to different screen sizes
  - Resizable window with automatic scrolling
  - Content adjusts to available space
  - Works on smaller or larger displays
- **Bilingual**: Full Polish and English support throughout
  - Polish labels with English subtitles
  - Complete localization of all text
- **Tabbed Layout**: Organize character info across Skills, Equipment, Sorcery, and Notes tabs
- **Auto-Save**: All changes save automatically as you type
- **Visual Feedback**: 
  - Green highlighting for increased values since creation
  - Red highlighting for decreased values
  - Track changes to all attributes and resources
- **Compact Design**: Information-dense layout maximizes screen space
- **3D Dice**: Full Dice So Nice integration with custom bronze Flex Die

## Getting Started

### Installation

1. In Foundry VTT, go to **Game Systems** tab
2. Click **Install System**
3. Paste the manifest URL (or manually copy files to `Data/systems/conan-the-hyborian-age`)
4. Create a new world and select **"Conan: The Hyborian Age"** as the system
5. *(Optional)* Install **"Dice So Nice"** module for 3D dice effects

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

#### 4. Manage Resources

- **Life Points**: Edit actual/max values directly in the sheet
  - Auto-updates when Grit increases
  - Cannot exceed maximum
- **Stamina**: Track usage during adventures
  - Recovers with Flex effects or rest
- **Experience**: Spend on skills and talents as you advance

#### 5. Equip Your Hero

- Click **"Create Item"** buttons to add:
  - Weapons for combat
  - Armor for protection
  - Equipment for adventuring gear
- Drag items from compendiums (when available)
- Edit item sheets for full customization

## Technical Details

### System Requirements

- **Foundry VTT**: Version 13 or higher
- **Recommended Modules**:
  - Dice So Nice (for 3D dice visualization)

### File Structure

```
conan-the-hyborian-age/
├── assets/
│   └── icons/
│       ├── damage.svg
│       ├── paralysis.svg
│       ├── Poisoned.svg
│       └── trap.svg
├── CHANGELOG.md
├── lang/
│   ├── en.json
│   └── pl.json
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
│   │   ├── poisoned-dialog.mjs
│   │   ├── roll-mechanics.mjs
│   │   ├── roll-sorcery-damage.mjs
│   │   ├── socket.mjs
│   │   ├── spellcasting-dialog.mjs
│   │   ├── stamina-effects.mjs
│   │   ├── starting-skills-dialog.mjs
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
│   ├── attack-dialog.css
│   ├── character-creation-dialog.css
│   ├── conan.css
│   ├── flex-dialog.css
│   ├── item-armor.css
│   ├── item-skill.css
│   ├── item-weapon.css
│   ├── roll-chat.css
│   ├── roll-dialog.css
│   ├── spellcasting-dialog.css
│   ├── stamina-effects.css
│   ├── starting-skills.css
│   └── partials/
│       ├── actor-spell.css
│       ├── combat-tracker.css
│       ├── damage-dialog.css
│       └── poisoned-effects.css
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
    │       ├── actor-header.hbs
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
    │   ├── poisoned-dialog.hbs
    │   └── spellcasting-dialog.hbs
    └── item/
        ├── item-armor-sheet.hbs
        ├── item-equipment-sheet.hbs
        ├── item-sheet.hbs
        ├── item-skill-sheet.hbs
        ├── item-talent-sheet.hbs
        ├── item-weapon-sheet.hbs
        └── parts/
            ├── item-description.hbs
            ├── item-effects.hbs
            └── item-header.hbs
```

### Architecture

This system is built with modern Foundry VTT best practices:

- **ES6 Modules**: Clean, modular JavaScript architecture
- **ApplicationV2**: Latest Foundry application framework for sheets
- **Dialog V2**: Modern ApplicationV2 dialogs for form interactions
- **HandlebarsApplicationMixin**: Efficient template rendering
- **Native DOM**: No jQuery dependency
- **Modern CSS**: Flexbox layouts, CSS variables, no preprocessors
- **Auto-save**: Real-time change detection and persistence
- **Dice So Nice Integration**: Custom 3D dice with bronze Flex Die

### Key Design Decisions

- All form inputs use `data-dtype` for automatic type conversion
- Change listeners trigger `actor.update()` for seamless persistence
- Initial values stored for visual change tracking (green/red highlights)
- Auto-calculations apply only after character creation is complete
- Flex Die uses `content` property (not `rolls` array) to prevent duplicates
- Starting skills stored in actor data with UUID-based identification
- Native `window.confirm()` for better cross-browser compatibility
- XP automatically recalculated on all skill operations

## Support & Contributing

### Reporting Issues

Found a bug or have a feature request? Please create an issue on the project repository with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- System version and Foundry version

### Roadmap

Planned features for future updates:
- **Advanced Skills System**: Expand skill management with more progression options
- **Combat Mechanics**: Damage application, armor mitigation, wound effects
- **NPC Abilities**: Special actions, talents, and unique powers for adversaries
- **Compendiums**: Pre-made characters, items, NPCs, and content
- **Flex Effect Expansion**: Sorcery refund and Massive Damage options

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

Current version: **0.0.34**

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.
