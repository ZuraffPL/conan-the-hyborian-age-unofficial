# Release Notes

## Release v0.0.50 - Flex Die Lock Poison Effect

### New Feature - Poison Effect #5: Flex Die Disabled

#### Flex Die Lock Implementation

- **Complete Flex Die Blocking**: When poisoned with flex die lock (effect #5), flex die is completely disabled
- **No Flex Die Roll**: Flex die is not rolled in any game mechanics when effect is active
- **No Flex Effect**: Flex effect dialog cannot trigger when flex die is disabled
- **Comprehensive Coverage**: Blocks flex die across ALL game mechanics:
  - Attribute tests (rollAttribute)
  - Initiative rolls (rollInitiative)
  - Melee damage rolls (rollMeleeDamage)
  - Thrown weapon damage rolls (rollThrownDamage)
  - Ranged weapon damage rolls (rollRangedDamage)
  - Sorcery damage rolls (all variants)

#### Visual Indicators & Feedback

- **Flex Die Section Effects**:
  - Grayed out appearance with reduced grayscale filter for better color visibility
  - Animated green gradient background (15% to 25% opacity)
  - Enhanced green border glow with pulsing animation
  - Disabled select dropdown with green-tinted background
  - Pulsing skull icon next to "Flex Die" subtitle with green glow

- **Consistent Design**: Matches stamina lock visual style for unified poison effects appearance

#### Initiative Roll Enhancement

- **Styled Initiative Messages**: New CSS styling for initiative roll chat messages
- **Animated Orange Pulse**: Pulsing border effect with orange glow for visual attention
- **Professional Appearance**: Gradient background, rounded corners, and shadow effects
- **Flex Effect Indicator**: Special golden badge with pulsing star icon when flex triggers

#### User Experience

- **Clear Visual Feedback**: Immediate indication when flex die is disabled
- **Informative Styling**: Initiative messages now stand out in chat
- **Error Prevention**: System prevents flex die usage automatically
- **Multilingual Support**: Full translations in Polish, English, and French

### Technical Implementation - v0.0.50

#### Code Changes

- **rollAttribute**: Added `flexDieDisabled` check for `effect5`
- **rollInitiative**: Added `flexDieDisabled` check combining NPC check and `effect5`
- **rollMeleeDamage**: Updated `flexTriggered` logic to respect `flexDieDisabled`
- **rollThrownDamage**: Updated `flexTriggered` logic to respect `flexDieDisabled`
- **rollRangedDamage**: Already had proper implementation
- **roll-sorcery-damage.mjs**: Already had proper implementation

#### CSS Organization

- Moved initiative roll styles from `poisoned-effects.css` to `roll-chat.css`
- Enhanced `.flex-locked` class with gradient backgrounds and improved colors
- Added `initiative-pulse` keyframe animation
- Added `flex-star-pulse` keyframe animation for flex effect icons

#### Localization Updates

- **PL**: "Kość Brawury jest zablokowana przez truciznę!"
- **EN**: "Flex Die is locked by poison!"
- **FR**: "Le dé Flex est bloqué par le poison!"

### System Requirements - v0.0.50

- **Foundry VTT**: Version 13+ (tested on v13.350)
- **Multiplayer**: Full support with socket-based notifications
- **Browser**: Modern browsers with CSS animation support

### For Game Masters - v0.0.50

#### Using Poison Effect #5

1. Open player character sheet
2. Click the poison skull button
3. Select "Wyłączona Kość Brawury / Flex Die Disabled" (checkbox for effect #5)
4. Click "Apply" - chat message confirms activation
5. Player's flex die section becomes grayed with green glow
6. Flex die will not be rolled in any actions
7. To remove: Open dialog again, uncheck effect #5, click "Apply"

#### Visual Indicators

- Flex die box shows green glow and skull icon when locked
- Poison toggle button shows effect counter badge
- Initiative messages display with orange pulsing border
- All visual effects provide clear feedback to players

### Known Features - v0.0.50

- Poison effects #4 (Stamina Lock) and #5 (Flex Die Lock) fully implemented
- Other poison effects (attribute penalties, roll penalties, life drain) planned for future releases
- Poison effects currently apply only to player characters (not NPCs)

### Migration Notes - v0.0.50

- No data migration required
- Existing characters automatically support flex die lock
- Backward compatible with previous versions
- All poison effect data structures remain unchanged

## Release v0.0.49 - Poison Effects System for Player Characters

### New Feature - Comprehensive Poison System

#### Poison Dialog & Effect Selection

- **Poison Configuration Window**: New dialog for selecting and managing poison effects
- **5 Poison Options**: Multiple poison effect types (currently implementing effect #4 - Stamina Lock)
- **Easy Toggle Access**: Click poison skull button on character sheet to open configuration
- **Effect Management**: Apply multiple effects simultaneously or remove individual effects

#### Stamina Lock Implementation (Effect #4)

- **Complete Stamina Blocking**: When poisoned with stamina lock, all stamina spending is prevented
- **Comprehensive Coverage**: Blocks stamina use across ALL game mechanics:
  - Manual stamina value editing on character sheet
  - Stamina spend dialog (tactical options)
  - Roll boosts via context menu
  - Damage boosts via context menu
  - Massive damage last stamina spending
  - Spellcasting stamina costs

#### Visual Indicators & Feedback

- **Stamina Section Effects**:
  - Grayed out appearance with animated green border glow
  - Disabled stamina input field with special styling
  - Disabled "Spend" button (dimmed, crossed-out icon)
  - Pulsing skull icon next to "Stamina" subtitle with green glow

- **Poison Toggle Button**:
  - Animated green pulsing glow when any poison effect is active
  - Badge counter showing number of active effects (1-5)
  - Clear visual distinction between active/inactive states
  - Smooth CSS animations for professional appearance

- **Chat Notifications**:
  - Messages when poison effects are applied or removed
  - Green-themed background with animated border pulse
  - Pulsing skull icon in message header
  - Lists all active/removed effects with localized names

#### User Experience

- **Intuitive Controls**: Single button for all poison management
- **Clear Feedback**: Visual indicators prevent confusion about stamina availability
- **Informative Messages**: Chat notifications keep all players informed of status changes
- **Error Prevention**: System blocks invalid actions with helpful error messages
- **Multilingual Support**: Full translations in Polish, English, and French

### Technical Implementation - v0.0.49

#### New Components

- **PoisonedDialog Class**: ApplicationV2-based dialog with HandlebarsApplicationMixin
- **Actor System Data**: Added `poisoned` boolean and `poisonEffects` object (effect1-effect5)
- **CSS Animations**: Professional keyframe animations for poison visual effects
- **Template Updates**: Enhanced character sheet template with conditional poison styling
- **Localization**: 20+ new translation keys across 3 languages

#### Code Integration Points

- `module/helpers/poisoned-dialog.mjs` - Main dialog implementation
- `module/sheets/actor-sheet.mjs` - Sheet integration and poison checks
- `module/helpers/stamina-spend-dialog.mjs` - Stamina dialog blocking
- `module/helpers/stamina-effects.mjs` - Context menu blocking
- `module/helpers/spellcasting-dialog.mjs` - Spell stamina blocking
- `styles/partials/poisoned-effects.css` - All poison styling and animations
- `templates/dialogs/poisoned-dialog.hbs` - Dialog template
- Updated character sheet template with poison indicators

#### Architecture

- Socket-based chat message system for multiplayer synchronization
- Context-aware poison effect counting in `_prepareContext()`
- Form change listeners for preventing manual stamina editing
- Consistent poison checks across all stamina-consuming actions
- Clean separation of concerns with dedicated dialog class

### System Requirements - v0.0.49

- **Foundry VTT**: Version 13+ (tested on v13.350)
- **Multiplayer**: Full support with socket-based notifications
- **Recommended Module**: Dice So Nice (for 3D dice animations)

### For Game Masters - v0.0.49

#### Using the Poison System

1. Open player character sheet
2. Click the poison skull button (near life/power resources)
3. Select poison effect(s) from dialog (checkbox for effect #4: Stamina Lock)
4. Click "Apply" to activate - chat message confirms activation
5. Player will see visual indicators and be unable to spend stamina
6. To remove: Open dialog again, uncheck effects, click "Apply"

#### Player Experience

- Players with poisoned characters will see immediate visual feedback
- Attempting to spend stamina shows error message explaining poison block
- All stamina-related buttons and inputs become disabled
- Clear indication of poison status prevents confusion

### Migration Notes - v0.0.49

- No data migration required
- Existing characters automatically support new poison system
- New `poisoned` and `poisonEffects` fields added to actor system data
- Backward compatible with previous versions

### Known Limitations - v0.0.49

- Only poison effect #4 (Stamina Lock) is currently implemented
- Other poison effects (attribute penalties, roll penalties, etc.) planned for future releases
- Poison effects currently apply only to player characters (not NPCs)

### Coming Soon

- Additional poison effects implementation (effects #1-3, #5)
- Poison duration tracking and automatic expiration
- Poison severity levels
- NPC poison support

## Release v0.0.48 - Multiplayer Permission Fixes for NPCs

### Critical Fixes - NPC Damage Permissions

#### Fixed Permission Errors for Player-Controlled Minions

- **Minion Attack Fix**: Players can now use owned minion NPCs to attack antagonists without permission errors
- **No More "User lacks permission"**: Eliminated "User lacks permission to update Actor" errors during NPC damage application
- **Seamless Combat**: Players deal damage to enemy NPCs through their minions without requiring GM intervention
- **Socket Integration**: Damage application automatically routed through GM via socket system for proper authorization

#### Improved NPC Damage System

- **All NPC Types Supported**: Socket-based updates work for characters, antagonists, and minions
- **Automatic GM Delegation**: Player actions automatically request GM to perform privileged operations
- **Consistent Architecture**: Actor updates now follow same pattern as token and combatant updates
- **No User Intervention Required**: System handles permissions transparently in background

### Technical Implementation - v0.0.48

#### Socket System Enhancement

- Added `ConanSocket.requestActorUpdate()` method for players to update actors through GM
- Added `_handleActorUpdateRequest()` socket handler (GM-only) to process actor update requests
- All direct `target.update()` calls replaced with `ConanSocket.requestActorUpdate()` for proper permission handling
- Fixed duplicate case statement in socket switch (renamed "updateActor" to "requestActorUpdate")

#### Roll Mechanics Updates

- `applyNPCDamage()` function now uses `ConanSocket.requestActorUpdate()` instead of direct `target.update()`
- Proper token/actor distinction in damage button handlers (using `targets[0].document` instead of `targets[0].actor`)
- Character LP updates use socket requests
- Antagonist LP updates use socket requests
- Minion defeated/wounded status uses socket requests

#### Consistency Improvements

- Socket system automatically routes player requests to GM for privileged actor operations
- Consistent with existing socket methods (`requestTokenUpdate`, `requestCombatantUpdate`)
- Clean separation between client requests and GM-executed updates

### System Requirements - v0.0.48

- **Foundry VTT**: Version 13+ (tested on v13.350)
- **Multiplayer**: Requires at least one GM online for player damage dealing through socket system
- **Recommended Module**: Dice So Nice (for 3D dice animations)

### For Game Masters - v0.0.48

#### Improved Multiplayer Experience

- Players can fully participate in combat with owned minions without errors
- Damage dealing actions work seamlessly through socket delegation
- No need to grant elevated permissions to players
- All privileged operations handled transparently by system

#### Technical Details

- Socket requests processed only when GM is online
- Automatic fallback if no GM available (shows error message)
- All actor updates logged for debugging if needed
- Compatible with existing combat and damage systems

### Installation Instructions - v0.0.48

#### Via Foundry VTT (Recommended)

1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste manifest URL:

   ```text
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```

4. Click **Install**

#### Manual Installation - v0.0.48

1. Download `conan-the-hyborian-age-v0.0.48.zip` from [Releases](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases)
2. Extract to `FoundryVTT/Data/systems/`
3. Restart Foundry VTT

### Known Issues - v0.0.48

- None reported for this release

### Full Changelog - v0.0.48

See [CHANGELOG.md](CHANGELOG.md) for complete technical details.

---

## Release v0.0.46 - Per-Actor Equipped Status

### Critical Fixes - Equipped Status

#### Fixed Global Equipped Status Bug

- **Per-Actor Equipment**: Items (weapons/armor) dropped from Items sidebar now have independent equipped status for each character
- **No More Cross-Character Issues**: When one player equips a sword, other players with the same sword no longer see it as equipped
- **Proper Item Isolation**: Each actor now receives an independent copy of items with separate equipped state

#### Improved Item Drop Behavior

- **Automatic Copy Creation**: Weapons and armor dropped from Items sidebar automatically create independent copies for each actor
- **Duplicate Prevention**: System now checks for existing items with same name before allowing drop
- **Visual Feedback**: Added notification when item successfully added to character sheet
- **Reset Equipped State**: New copies start with `equipped: false` to prevent inheriting source item's state

### Technical Implementation - v0.0.46

#### Embedded Document Architecture

- Changed `_onToggleEquipped` to use `actor.updateEmbeddedDocuments()` instead of `item.update()`
- Ensures equipped status changes only affect the specific actor's copy
- Modified `_onDropItem` to explicitly handle weapons/armor with copy creation logic
- Items from same actor (reordering) continue to use default behavior

#### System Integrity

- **AR Calculation Unchanged**: Armor Rating calculation continues to work correctly with embedded items
- **Damage System Intact**: All damage and combat calculations unaffected by changes
- **Encumbrance Tracking**: Encumbrance system properly reads equipped status from actor's items

### Localization Updates - v0.0.46

- Added `CONAN.Notifications.itemAdded` in Polish, English, and French
- Notification format: "Item {name} added to character"

---

## Release v0.0.45 - Wounded Status Effect & Origin Abilities

### New Features - v0.0.45

#### Wounded Status Effect for Minions

- **Visual Status Indicator**: Minions now display a red blood drop icon when wounded
- **Automatic Token Updates**: Checking "ranny" (wounded) on minion sheets automatically adds the status effect to their tokens
- **Consistent Display**: Wounded icon appears on tokens, in combat tracker, and in the status effects panel
- **Manual Control**: Can also be toggled directly from token's status effects menu (right-click → Assign Status Effects)

#### Origin Ability Stamina Option

- **4th Stamina Spend Option**: Added "Activate Origin Ability" to stamina spending dialog
- **Character Origins**: Use this option to activate special powers from your character's origin/background
- **Full Localization**: Available in English, Polish, and French

### Visual Improvements - v0.0.45

#### Status Effect Icon Colors

- **Wounded Icon**: Displays in crimson red (#dc143c) across all UI contexts
- **Immobilized Icon**: Now shows in black in combat tracker for better contrast and consistency
- **No More Filter Issues**: Custom CSS ensures icons display in their intended colors

### Technical Changes - v0.0.45

#### Status Effect System Integration

- Wounded status registered as native Foundry VTT status effect
- Automatic synchronization between minion sheet checkbox and token status
- Removed duplicate icon rendering in combat tracker
- Clean integration with Foundry's built-in status effect system

---

## Release v0.0.44 - NPC Sheet Responsiveness & UX Improvements

### Critical Fixes - NPC Sheets

#### Fixed NPC Sheet Freezing Issues

- **Text Input Freeze**: NPC sheets (Minion/Antagonist) no longer freeze when typing weapon names, damage values, or power descriptions
- **Form Responsiveness**: Eliminated form submission loop that made sheets unresponsive during text editing
- **Textarea Auto-Resize**: Fixed textarea fields cutting off last line of text - now properly respects minimum height and expands smoothly
- **Skill Items**: Fixed auto-resize issues in skill item effect descriptions

#### Improved Text Field Behavior

- Text fields now save with 500ms delay (debounced) to prevent constant re-rendering while typing
- Numeric fields and dropdowns save immediately for responsive feel
- Fields no longer lose focus or flicker during editing
- Sheet maintains scroll position when fields are updated

### Enhanced Readability - v0.0.44

#### Increased Font Sizes (Better for 1440p)

- **NPC Powers & Special Actions**: 14px → **15px**
- **Player Biography & Notes**: 14px → **15px**
- **Skill Descriptions**: 13px → **14px**
- **Weapon/Armor Stipulations**: 14px → **15px**

#### Smarter Textarea Behavior

- Empty or small content: maintains comfortable minimum height (80px)
- Growing content: expands automatically without cutting text
- Large content: shows scrollbar only when exceeding max height (300-400px)
- No more manual resizing needed - fully automatic

### New Capabilities - v0.0.44

#### Advanced Form Handling

- Debounced text input with intelligent save timing
- Separate handling for text vs numeric/select fields
- Prevention of re-render loops during editing
- Blur event ensures save when leaving field

#### Implementation Details

- Custom `_setupNPCFormHandling()` method for NPC sheets
- Bypasses parent class's auto-submit to avoid conflicts
- Form update tracking with `_isUpdating` flag
- Enhanced auto-resize algorithm with min/max height respect

### Installation Instructions - v0.0.44

#### Install via Foundry VTT (Recommended)

1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste manifest URL:

   ```text
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```

4. Click **Install**

#### Install Manually

1. Download `conan-the-hyborian-age.zip` from [Releases](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases)
2. Extract to `FoundryVTT/Data/systems/`
3. Restart Foundry VTT

### For Game Masters - v0.0.44

#### Better NPC Management

- Create and edit NPC sheets without frustrating freezes
- Type weapon names and descriptions smoothly
- Powers and special abilities auto-expand to fit content
- All text fields more readable on high-resolution displays

#### Improved Workflow

- Quick numeric adjustments (attributes, damage) save instantly
- Text descriptions save automatically after brief pause
- No need to manually resize text boxes
- Focus stays in field while typing

### Known Issues - v0.0.44

- None reported for this release

### Full Changelog - v0.0.44

See [CHANGELOG.md](CHANGELOG.md) for complete technical details.

---

## Release v0.0.42 - Multiplayer Permission Fixes

### Critical Fixes - Permissions

#### Fixed Permission Errors for Players

- **Token Updates**: Players with "Player" or "Trusted Player" roles can now deal damage to enemies without "User lacks permission to update Token" errors
- **Combat Tracker**: Players can now mark enemies as defeated in combat tracker without "User lacks permission to update Combatant" errors
- **Flex Effects**: "Massive Damage" and other Flex Effects now work properly for players
- **404 Errors**: Removed references to missing parchment background images that caused console errors

### New Features - v0.0.42

#### Socket Delegation System

- Added automatic GM delegation for privileged operations
- Players' damage dealing actions are now routed through GM via socket system
- Seamless multiplayer experience - players don't need elevated permissions

#### Implementation Details - v0.0.42

- `ConanSocket.requestTokenUpdate()` - New method for token updates through GM
- `ConanSocket.requestCombatantUpdate()` - New method for combat tracker updates through GM
- Socket handlers for GM-side execution of player-initiated updates
- Removed non-existent background image references from CSS files

### Installation Instructions - v0.0.42

#### Install via Foundry VTT

1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste manifest URL:

   ```text
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```

4. Click **Install**

#### Install Manually - v0.0.42

1. Download `conan-the-hyborian-age-v0.0.42.zip` from this release
2. Extract to your Foundry `Data/systems` directory
3. Restart Foundry VTT
4. Create new world with **Conan: The Hyborian Age** system

### System Requirements - v0.0.42

- **Foundry VTT**: Version 13+ (tested on v13.350)
- **Multiplayer**: Requires at least one GM online for player damage dealing
- **Recommended Module**: Dice So Nice (for 3D dice animations)

### Full Changelog - v0.0.42

See [CHANGELOG.md](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/blob/main/CHANGELOG.md) for complete version history.

### Recent Features - v0.0.42

**Multiplayer Compatibility**: Players can now fully participate in combat without permission errors

- Deal damage from attack rolls
- Apply damage from Flex Effects
- Mark enemies as defeated
- All privileged operations automatically handled by GM through socket system

---

## Release v0.0.36 - Release Infrastructure Improvements

### Changes - v0.0.36

- **Updated Manifest URL**: Now uses `releases/latest/download/system.json` for automatic latest version detection
- **Updated Download URL**: Now uses `releases/latest/download/conan-the-hyborian-age.zip` (without version number)
- **Release Assets**: Include both versioned and non-versioned ZIP files for flexibility

### Fixes - v0.0.36

- **Known Issues Documentation**: Added Known Issues section documenting that Poisoned status is UI-only (full logic not yet implemented)

### Technical Details - v0.0.36

- Manifest and download URLs now point to `/latest/` instead of specific version
- GitHub release workflow aligned with best practices from other Foundry systems
- Improved automatic update detection for Foundry VTT users

### Installation Instructions - v0.0.36

#### Via Foundry VTT - v0.0.36

1. Open Foundry VTT → **Game Systems** tab
2. Click **Install System**
3. Paste manifest URL:

   ```text
   https://raw.githubusercontent.com/ZuraffPL/conan-the-hyborian-age-unofficial/main/system.json
   ```

4. Click **Install**

#### Manual Installation - v0.0.36

1. Download `conan-the-hyborian-age-v0.0.35.zip` from this release
2. Extract to your Foundry `Data/systems` directory
3. Restart Foundry VTT
4. Create new world with **Conan: The Hyborian Age** system

### System Requirements - v0.0.36

- **Foundry VTT**: Version 13+ (tested on v13.350)
- **Recommended Module**: Dice So Nice (for 3D dice animations)

### Full Changelog - v0.0.36

See [CHANGELOG.md](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/blob/main/CHANGELOG.md) for complete version history.

### Recent Features (v0.0.34)

**Stamina Spending System**: Comprehensive resource management via right-click context menu on chat messages:

- Spend 1-2 Stamina to boost rolls (+1/+2)
- Spend 1-2 Stamina to add damage (+1d4/+2d4)
- "Massive Damage" option for last Stamina point (stacks with Flex Effect!)
- **CRITICAL FIX**: Delta system for v13 - damage now properly applies to NPCs

### Known Issues - v0.0.36

**Poisoned Status**: The Poisoned status toggle and dialog are currently UI-only features. The full game logic for poison effects (damage over time, attribute penalties, etc.) has not been implemented yet and will be added in future versions.

Please report any other issues on the [GitHub Issues](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/issues) page.

### Credits

- **System Development**: Zuraff
- **Based on**: Conan: The Hyborian Age RPG by Monolith Boardgames
- **Setting**: Conan the Barbarian by Robert E. Howard

---

**Note**: This is an unofficial, fan-made system. Not affiliated with or endorsed by Monolith Boardgames.
