# Release v0.0.46 - Per-Actor Equipped Status

## 🔧 Critical Fixes

### Fixed Global Equipped Status Bug
- **Per-Actor Equipment**: Items (weapons/armor) dropped from Items sidebar now have independent equipped status for each character
- **No More Cross-Character Issues**: When one player equips a sword, other players with the same sword no longer see it as equipped
- **Proper Item Isolation**: Each actor now receives an independent copy of items with separate equipped state

### Improved Item Drop Behavior
- **Automatic Copy Creation**: Weapons and armor dropped from Items sidebar automatically create independent copies for each actor
- **Duplicate Prevention**: System now checks for existing items with same name before allowing drop
- **Visual Feedback**: Added notification when item successfully added to character sheet
- **Reset Equipped State**: New copies start with `equipped: false` to prevent inheriting source item's state

## 🎯 Technical Improvements

### Embedded Document Architecture
- Changed `_onToggleEquipped` to use `actor.updateEmbeddedDocuments()` instead of `item.update()`
- Ensures equipped status changes only affect the specific actor's copy
- Modified `_onDropItem` to explicitly handle weapons/armor with copy creation logic
- Items from same actor (reordering) continue to use default behavior

### System Integrity
- **AR Calculation Unchanged**: Armor Rating calculation continues to work correctly with embedded items
- **Damage System Intact**: All damage and combat calculations unaffected by changes
- **Encumbrance Tracking**: Encumbrance system properly reads equipped status from actor's items

## 🌐 Localization
- Added `CONAN.Notifications.itemAdded` in Polish, English, and French
- Notification format: "Item {name} added to character"

---

# Release v0.0.45 - Wounded Status Effect & Origin Abilities

## ✨ New Features

### Wounded Status Effect for Minions
- **Visual Status Indicator**: Minions now display a red blood drop icon when wounded
- **Automatic Token Updates**: Checking "ranny" (wounded) on minion sheets automatically adds the status effect to their tokens
- **Consistent Display**: Wounded icon appears on tokens, in combat tracker, and in the status effects panel
- **Manual Control**: Can also be toggled directly from token's status effects menu (right-click → Assign Status Effects)

### Origin Ability Stamina Option
- **4th Stamina Spend Option**: Added "Activate Origin Ability" to stamina spending dialog
- **Character Origins**: Use this option to activate special powers from your character's origin/background
- **Full Localization**: Available in English, Polish, and French

## 🎨 Visual Improvements

### Status Effect Icon Colors
- **Wounded Icon**: Displays in crimson red (#dc143c) across all UI contexts
- **Immobilized Icon**: Now shows in black in combat tracker for better contrast and consistency
- **No More Filter Issues**: Custom CSS ensures icons display in their intended colors

## 🔧 Technical Improvements

### Status Effect System Integration
- Wounded status registered as native Foundry VTT status effect
- Automatic synchronization between minion sheet checkbox and token status
- Removed duplicate icon rendering in combat tracker
- Clean integration with Foundry's built-in status effect system

---

# Release v0.0.44 - NPC Sheet Responsiveness & UX Improvements

## 🔧 Critical Fixes

### Fixed NPC Sheet Freezing Issues
- **Text Input Freeze**: NPC sheets (Minion/Antagonist) no longer freeze when typing weapon names, damage values, or power descriptions
- **Form Responsiveness**: Eliminated form submission loop that made sheets unresponsive during text editing
- **Textarea Auto-Resize**: Fixed textarea fields cutting off last line of text - now properly respects minimum height and expands smoothly
- **Skill Items**: Fixed auto-resize issues in skill item effect descriptions

### Improved Text Field Behavior
- Text fields now save with 500ms delay (debounced) to prevent constant re-rendering while typing
- Numeric fields and dropdowns save immediately for responsive feel
- Fields no longer lose focus or flicker during editing
- Sheet maintains scroll position when fields are updated

## 🎨 Enhanced Readability

### Increased Font Sizes (Better for 1440p)
- **NPC Powers & Special Actions**: 14px → **15px**
- **Player Biography & Notes**: 14px → **15px**
- **Skill Descriptions**: 13px → **14px**
- **Weapon/Armor Stipulations**: 14px → **15px**

### Smarter Textarea Behavior
- Empty or small content: maintains comfortable minimum height (80px)
- Growing content: expands automatically without cutting text
- Large content: shows scrollbar only when exceeding max height (300-400px)
- No more manual resizing needed - fully automatic

## 🆕 What's New

### Advanced Form Handling
- Debounced text input with intelligent save timing
- Separate handling for text vs numeric/select fields
- Prevention of re-render loops during editing
- Blur event ensures save when leaving field

### Technical Improvements
- Custom `_setupNPCFormHandling()` method for NPC sheets
- Bypasses parent class's auto-submit to avoid conflicts
- Form update tracking with `_isUpdating` flag
- Enhanced auto-resize algorithm with min/max height respect

## 📦 Installation

### Via Foundry VTT (Recommended)
1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste manifest URL:
   ```
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```
4. Click **Install**

### Manual Installation
1. Download `conan-the-hyborian-age.zip` from [Releases](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases)
2. Extract to `FoundryVTT/Data/systems/`
3. Restart Foundry VTT

## 🎮 For Game Masters

### Better NPC Management
- Create and edit NPC sheets without frustrating freezes
- Type weapon names and descriptions smoothly
- Powers and special abilities auto-expand to fit content
- All text fields more readable on high-resolution displays

### Improved Workflow
- Quick numeric adjustments (attributes, damage) save instantly
- Text descriptions save automatically after brief pause
- No need to manually resize text boxes
- Focus stays in field while typing

## 🐛 Known Issues
- None reported for this release

## 📝 Full Changelog
See [CHANGELOG.md](CHANGELOG.md) for complete technical details.

---

# Release v0.0.42 - Multiplayer Permission Fixes

## 🔧 Critical Fixes

### Fixed Permission Errors for Players
- **Token Updates**: Players with "Player" or "Trusted Player" roles can now deal damage to enemies without "User lacks permission to update Token" errors
- **Combat Tracker**: Players can now mark enemies as defeated in combat tracker without "User lacks permission to update Combatant" errors
- **Flex Effects**: "Massive Damage" and other Flex Effects now work properly for players
- **404 Errors**: Removed references to missing parchment background images that caused console errors

## 🆕 What's New

### Socket System Enhancement
- Added automatic GM delegation for privileged operations
- Players' damage dealing actions are now routed through GM via socket system
- Seamless multiplayer experience - players don't need elevated permissions

### Technical Improvements
- `ConanSocket.requestTokenUpdate()` - New method for token updates through GM
- `ConanSocket.requestCombatantUpdate()` - New method for combat tracker updates through GM
- Socket handlers for GM-side execution of player-initiated updates
- Removed non-existent background image references from CSS files

## 📦 Installation

### Via Foundry VTT (Recommended)
1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste manifest URL:
   ```
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```
4. Click **Install**

### Manual Installation
1. Download `conan-the-hyborian-age-v0.0.42.zip` from this release
2. Extract to your Foundry `Data/systems` directory
3. Restart Foundry VTT
4. Create new world with **Conan: The Hyborian Age** system

## 🔧 System Requirements

- **Foundry VTT**: Version 13+ (tested on v13.350)
- **Multiplayer**: Requires at least one GM online for player damage dealing
- **Recommended Module**: Dice So Nice (for 3D dice animations)

## 📝 Full Changelog

See [CHANGELOG.md](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/blob/main/CHANGELOG.md) for complete version history.

## 🎮 Recent Features

**Multiplayer Compatibility**: Players can now fully participate in combat without permission errors
- Deal damage from attack rolls
- Apply damage from Flex Effects
- Mark enemies as defeated
- All privileged operations automatically handled by GM through socket system

# Release v0.0.36 - Release Infrastructure Improvements

## 🔧 What's New

### Changed
- **Updated Manifest URL**: Now uses `releases/latest/download/system.json` for automatic latest version detection
- **Updated Download URL**: Now uses `releases/latest/download/conan-the-hyborian-age.zip` (without version number)
- **Release Assets**: Include both versioned and non-versioned ZIP files for flexibility

### Fixed
- **Known Issues Documentation**: Added Known Issues section documenting that Poisoned status is UI-only (full logic not yet implemented)

### Technical
- Manifest and download URLs now point to `/latest/` instead of specific version
- GitHub release workflow aligned with best practices from other Foundry systems
- Improved automatic update detection for Foundry VTT users

## 📦 Installation

### Via Foundry VTT (Recommended)
1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste manifest URL:
   ```
   https://raw.githubusercontent.com/ZuraffPL/conan-the-hyborian-age-unofficial/main/system.json
   ```
4. Click **Install**

### Manual Installation
1. Download `conan-the-hyborian-age-v0.0.35.zip` from this release
2. Extract to your Foundry `Data/systems` directory
3. Restart Foundry VTT
4. Create new world with **Conan: The Hyborian Age** system

## 🔧 System Requirements

- **Foundry VTT**: Version 13+ (tested on v13.350)
- **Recommended Module**: Dice So Nice (for 3D dice animations)

## 📝 Full Changelog

See [CHANGELOG.md](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/blob/main/CHANGELOG.md) for complete version history.

## 🎮 Recent Features (v0.0.34)

**Stamina Spending System**: Comprehensive resource management via right-click context menu on chat messages:
- Spend 1-2 Stamina to boost rolls (+1/+2)
- Spend 1-2 Stamina to add damage (+1d4/+2d4)
- "Massive Damage" option for last Stamina point (stacks with Flex Effect!)
- **CRITICAL FIX**: Delta system for v13 - damage now properly applies to NPCs

## 🐛 Known Issues

**Poisoned Status**: The Poisoned status toggle and dialog are currently UI-only features. The full game logic for poison effects (damage over time, attribute penalties, etc.) has not been implemented yet and will be added in future versions.

Please report any other issues on the [GitHub Issues](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/issues) page.

## 🙏 Credits

- **System Development**: Zuraff
- **Based on**: Conan: The Hyborian Age RPG by Monolith Boardgames
- **Setting**: Conan the Barbarian by Robert E. Howard

---

**Note**: This is an unofficial, fan-made system. Not affiliated with or endorsed by Monolith Boardgames.
