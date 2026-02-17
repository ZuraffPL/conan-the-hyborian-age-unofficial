# Changelog

## [0.0.58] - 2026-02-16

### Fixed

- **NPC Name Validation**
  - Fixed validation error when clearing NPC name field ("name: may not be undefined")
  - Name field now reverts to previous value if cleared, preventing empty names
  - Applies to both Minion and Antagonist actor sheets
  - Changes reflected in sidebar after name update

## [0.0.57] - 2026-02-16

### Fixed

- **Weapon Range Display Bug**
  - Fixed `[object Object]` display issue for weapon range on character sheets
  - Changed `range` field from object `{value: 0, long: 0}` to string in template.json
  - Added automatic migration in item.mjs for existing weapons with old format
  - Range now correctly displays localized values:
    * Melee: "Zwarcie" (Touch)
    * Thrown: "Bliski/1 Obszar" (Close/1 Zone)
    * Ranged Light/Medium: "Średni/3 Obszary" (Medium/3 Zones)
    * Ranged Heavy: "Odległy/8 Obszarów" (Distant/8 Zones)
  - All existing weapon items automatically migrated on load

## [0.0.56] - 2026-02-16

### Added

- **Life Points Adjustment System**
  - Added `lifePoints.adjustment` field to track manual modifications (e.g., +3 from skills, items)
  - Automatic calculation now uses formula: `origin_base + (2 × effectiveGrit) + adjustment`
  - Allows manual editing of max life points while preserving poison penalty effects
  - Backward compatibility migration for existing characters in `prepareBaseData()`

### Changed

- **Life Points Maximum Calculation**
  - Restored automatic recalculation to account for poison effect #1 (Grit penalty)
  - Manual changes now update `adjustment` field instead of directly setting max
  - System preserves manual bonuses (e.g., from skills) while applying poison penalties
  - Example workflow:
    * Character created: 42 max LP (base 32 + Grit 5×2)
    * Skill acquired: manually set to 45 → adjustment = +3
    * Poison activated: effectiveGrit = 4 → max = 32 + 8 + 3 = 43 LP
    * Poison removed: effectiveGrit = 5 → max = 32 + 10 + 3 = 45 LP

- **UI Logic Refactoring**
  - Moved `life-injured` condition from hardcoded Handlebars to JavaScript
  - Added `lifePointsActual` to `valueChanges` in `_prepareValueComparisons()`
  - Cleaner template with consistent pattern: `class="life-actual {{valueChanges.lifePointsActual}}"`
  - All visualization logic now in CSS, presentation logic in JavaScript

### Fixed

- **Poison Effect #1 Integration**
  - Fixed issue where poison attribute penalty didn't affect max life points
  - Grit penalty (-1) now properly reduces max LP by 2 points during poisoning
  - Manual modifications preserved across poison activation/deactivation cycles

## [0.0.55] - 2026-02-09

### Added

- **Poison Effect #1 - Attribute Penalty System**
  - Implemented poison effect #1: -1 penalty to all four attributes (Might, Edge, Grit, Wits)
  - All attribute-based rolls now use `effectiveValue` (base value minus poison penalty)
  - Visual indicators on character sheets:
    * Pulsing green skull icon next to poisoned attributes
    * Green-tinted attribute input fields when poisoned
    * CSS animations with poison-themed color (#15a20e)
  - Poison warnings in roll dialogs showing attribute penalty information
  - Chat messages highlight poisoned attribute values in calculations (green highlighting)
  
- **Automatic Derived Stat Recalculation**
  - Maximum Life Points now automatically recalculate based on Grit attribute
    * Formula: origin_base + (2 × effectiveGrit)
    * Accounts for poison penalties (effect #1) and attribute increases from leveling
  - Physical Defense automatically recalculates based on Edge attribute
    * Formula: max(effectiveEdge + 2, 5)
    * Includes Defence bonus (+2 when active)
  - Sorcery Defense automatically recalculates based on Wits attribute
    * Formula: max(effectiveWits + 2, 5)
  - All derived stats update immediately when:
    * Attributes change (character development/leveling)
    * Poison effect #1 is activated/deactivated
    * Defence or Immobilized status changes

- **Enhanced Combat Status Integration**
  - Defence (+2 physical defense) now integrates with automatic recalculation
  - Immobilized (defense = 0) properly overrides all other defense modifiers
  - Status flags (defenceActive, immobilized) now control derived data instead of direct value modification
  - Prevents conflicts between manual adjustments and automatic calculations

### Changed

- **Character Data Preparation**
  - Added `effectiveValue` field to all attributes (accounts for poison penalty)
  - Added `isPoisonedAttributes` flag to attributes for UI indication
  - Modified `_prepareCharacterData()` to calculate effective values first
  - Modified `_prepareNpcData()` to support minion and antagonist types (fixed type check bug)
  - Health max calculation updated to use Grit instead of Might
  - Defense calculations moved from sheet handlers to `prepareDerivedData()` for consistency

- **Roll Mechanics Updates**
  - All roll functions updated to use `effectiveValue || value` pattern:
    * `rollAttribute()` - attribute tests
    * `rollMeleeDamage()` - melee damage rolls

- **CSS Organization Improvements**
  - Consolidated all poison effect styles into `poisoned-effects.css` for better maintainability
  - Moved poison arrow indicator styles from `conan.css` and `actor-npc.css` to `styles/partials/poisoned-effects.css`
  - Eliminated duplicate `@keyframes poison-arrow-pulse` definitions
  - Centralized all poison-related visual effects (borders, backgrounds, arrows, animations) in dedicated file
    * `rollThrownDamage()` - ranged damage rolls
    * `rollWeaponDamage()` - weapon damage with might bonus
  - Chat message templates enhanced with `.poisoned-value` CSS class
  - NPC attribute test function (`rollNPCAttribute`) updated with poison support

- **Dialog Context Enhancements**
  - Attack dialog now passes `isPoisonedAttributes` to template
  - Difficulty dialog shows attribute penalty warnings
  - NPC attack dialog updated with effectiveValue usage
  - NPC damage dialog uses effectiveValue for brawn calculation
  - NPC difficulty dialog enhanced with attribute penalty warnings

- **Visual Styling**
  - Added `.poisoned-attribute` class for tinted input fields
  - Added `.poison-skull-pulse` animation (2s cycle)
  - Added `.poisoned-value` class for calculation highlighting in chat
  - Added `.poison-arrow-indicator` element for down arrow (↓) inside attribute circle
    * Implemented as real HTML `<span>` element (pseudo-elements don't work on `<input>`)
    * Positioned with `.attribute-circle-wrapper` for proper layout
    * Green pulsing animation matching poison theme
  - Roll chat CSS updated with effect-specific comments:
    * Effect #1 styles: `.calc-part.poisoned-value` (calculation highlighting only)
    * Effect #2 styles: `.dice-roll.poisoned-attribute`, `.die-result.poisoned` (dice box highlighting)

### Fixed

- **NPC Type Detection Bug**
  - Fixed `_prepareNpcData()` checking for nonexistent "npc" type instead of "minion"/"antagonist"
  - NPC attributes now correctly calculate effectiveValue with poison penalties
  - NPC roll mechanics now properly apply poison effect #1
  - Visual poison indicators now work for all NPC types

- **Sheet Handler Conflicts**
  - Removed direct defense value manipulation from `_onToggleDefence()` handlers
  - Removed direct defense value manipulation from `_onToggleImmobilized()` handlers
  - Sheet handlers now only toggle status flags, letting `prepareDerivedData()` handle calculations
  - Prevents defense value conflicts between different systems (poison, Defence, Immobilized, attribute changes)

### Technical Details

- **Architecture Changes**
  - Centralized derived stat calculation in `prepareDerivedData()` lifecycle method
  - Separation of concerns: sheet handlers manage flags, data preparation calculates values
  - Consistent use of `effectiveValue` throughout codebase for poison-aware attribute access
  - CSS organization improved with clear documentation of effect-specific styles

- **Localization**
  - Added "attributePenalty" key: "Kara do atrybutów przez truciznę" (PL), "Attribute penalty from poison" (EN), "Pénalité d'attribut du poison" (FR)
  - Added "toAttributes" key: "do wszystkich atrybutów" (PL), "to all attributes" (EN), "à tous les attributs" (FR)

## [0.0.54] - 2026-02-03

### Fixed

- **Stamina-Enhanced Attack Damage Display**
  - Fixed error when dealing damage after converting a failed attack to success using stamina
  - Damage messages after stamina-enhanced attacks now display with proper CSS styling
  - Added support for damage modifier parameter in `rollWeaponDamage` function
  - Damage chat messages now show formatted components breakdown (weapon damage, bonus, modifier)
  - Consistent styling across all damage message types with "Deal Damage" button
  - Fixed parameter passing issue where weaponId string was sent instead of weapon object

## [0.0.53] - 2026-01-16

### Added

- **Poison Effect Multipliers - Stackable Poison System**
  - Effect #2 (Roll Penalty) and Effect #3 (Life Drain) now support multipliers (x1, x2, x3, etc.)
  - Inline multiplier controls (+/-) next to effect names in poison dialog
  - Multiplier badges on character sheets showing current multiplier level (x2, x3, etc.)
  - Multipliers apply correctly to all roll types: attribute tests, initiative, attacks, damage, spellcasting
  - Visual indicators with pulsing animations for multiplied poison effects
  
- **Combat System Enhancements**
  - Poison life drain automatically applied at start of each combat round (multiplied by effect #3 multiplier)
  - "Defeated" status for antagonists reaching 0 Life Points
  - "Fight for Life" mechanic for player characters at 0 LP (Grit test against difficulty 8)
  - Combat tracker properly uses base actor for poison calculations (supports linked/unlinked tokens)
  
- **Initiative System Improvements**
  - Initiative rolls from combat tracker now correctly apply poison penalties
  - Initiative dialog shows poison warning with actual multiplier value
  - Enhanced initiative chat messages with three-line layout:
    * Line 1: Dice results (Edge die + Flex die for players, Edge die + Edge value for NPCs)
    * Line 2: Calculation breakdown with all components including poison penalty
    * Line 3: Final initiative result prominently displayed
  - Dice displayed in boxes side-by-side matching other roll types

### Changed

- All poison penalty calculations now use actual multiplier values instead of hardcoded -1
- All roll dialogs (difficulty, initiative, attack, damage, spellcasting) display correct multiplier in warnings
- All chat messages show accurate poison penalty in calculations (e.g., -3 instead of -1)
- NPCDifficultyDialog now receives actor parameter for proper poison status detection
- Initiative dice layout uses flex-wrap for better responsiveness
- Attack roll calculation components use flex-wrap to prevent overflow with long penalty values

### Fixed

- Fixed multipliers showing as -1 in all contexts (11+ locations updated)
- Fixed poison penalty not applying in initiative rolls from combat tracker
- Fixed NPC damage rolls not applying poison penalty correctly
- Fixed NPC dialog not showing poison information before rolls
- Fixed attack roll components overflowing chat window with focused attack + poison penalty
- Fixed initiative chat message layout for better clarity and visual hierarchy

### Technical

- Added effect2Multiplier and effect3Multiplier to actor.system.poisonEffects
- Updated rollAttribute, rollInitiative, rollWeaponDamage, rollNPCDamage with multiplier support
- Updated all dialog contexts to include poisonMultiplier variable
- Updated all Handlebars templates to display {{poisonMultiplier}} instead of hardcoded values
- Added multiplier-controls-inline CSS for +/- buttons (24x24px, inline layout)
- Added poison-multiplier badge styles with multiplier-pulse animation
- Enhanced .calculation CSS with flex-wrap for responsive layout
- Enhanced .initiative-dice-line CSS with flex-wrap and white-space: nowrap
- Combat.rollInitiative override uses base actor: game.actors.get(combatant.actor.id) for linked tokens
- All sorcery damage functions include poison multiplier in chat output

## [0.0.52] - 2026-01-14

### Added

- Poison effect #2 (Roll Penalty) support for magic attacks and sorcery damage
  - Magic attack button shows pulsing green glow when effect #2 active
  - Poison warning banner in spellcasting dialog with skull icon
  - -1 penalty applied to magic attack rolls (Wits-based)
  - -1 penalty applied to all sorcery damage rolls (Wits die, custom die, fixed value)
  - Skull icon and penalty visualization in chat messages
  - Flex die disabled state properly shown in magic attack/damage messages

### Changed

- Spellcasting dialog now displays isPoisoned context for effect #2
- Magic attack rolls include poisonPenalty in total calculation
- All three sorcery damage functions (rollSorceryWitsDamage, rollSorceryCustomDieDamage, rollSorceryFixedDamage) apply poison penalty
- Chat messages for magic attacks show poison skull and penalty breakdown

### Fixed

- Magic attacks were missing poison effect #2 implementation (now consistent with physical attacks)
- Sorcery damage was not affected by poison penalty (now applies -1 like other damage types)
- Flex die disabled state not properly visualized in magic attack messages

### Technical

- Added poisonPenalty variable to _performMagicAttackRoll function
- Added isPoisoned flag to spellcasting dialog context
- Modified all three sorcery damage functions to include poison penalty
- Added poison penalty to damage formulas: `formula = "..." + poisonPenalty`
- Added conditional poison skull icons and penalty display in chat templates
- Added poisoned-penalty-button class to spellcasting button in character sheet

## [0.0.51] - 2026-01-09

### Added

- Poison effect #2: Roll Penalty system - applies -1 penalty to all rolls when active
  - Penalty applies to: attribute tests, initiative rolls, attack rolls, damage rolls
  - Visual skull icons appear on all affected roll buttons
  - Poison warning banners in roll dialogs (attack, difficulty, initiative)
  - Chat messages display skull icon and -1 penalty in roll calculation
- Poison effect counter badge for NPC sheets (minion and antagonist)
- Life Drain effect (effect #3) disabled for Minions as they don't have life points

### Changed

- Fixed poison button behavior for NPCs - now always opens dialog like character sheet
- Fixed Handlebars context issue - use @root.system in attribute loops for proper poison effect detection
- NPC sheets now properly show poison effect counter badge (not just on hover)
- Minions cannot select Life Drain poison effect (checkbox disabled and option grayed out)
- Enhanced poison effect dialog with disabled state styling for unavailable options

### Technical

- Added poison penalty logic to all roll functions in roll-mechanics.mjs
- Added isPoisoned context flag to all roll dialogs
- Modified difficulty-dialog.mjs and initiative-dialog.mjs to accept actor parameter
- Added debug logging removed after verification
- Fixed _onTogglePoisoned in both minion and antagonist sheets
- Added isMinion context flag to poisoned-dialog.mjs
- Added CSS styles for disabled poison options with strikethrough effect
- Added notAvailableMinion translation key in PL/EN/FR

## Versions 0.0.46 - 0.0.50 Summary (2026-01-02 to 2026-01-09)

### Major Features Implemented

- **Poison Effects System**: Complete 5-effect poison system for player characters
  - Configurable poison dialog with checkbox selection (effects 1-5)
  - Poison status toggle button with pulsing green glow animation
  - Badge counter showing number of active effects (1-5)
  - Chat notifications for poison status changes
  - Full localization support (PL/EN/FR)
- **Poison Effect #4: Stamina Lock**: Comprehensive stamina spending prevention
  - Grayed out stamina section with animated green glow
  - Disabled stamina input field and "Spend" button
  - Pulsing skull icon next to "Stamina" subtitle
  - Blocks: manual editing, spend dialog, damage boosts, roll boosts, massive damage, spellcasting
- **Poison Effect #5: Flex Die Lock**: Complete flex die usage prevention
  - Grayed out flex die section with green gradient background
  - Disabled flex die select with green-tinted background
  - Pulsing skull icon next to "Flex Die" subtitle
  - Flex die cannot trigger flex effect when locked
  - Initiative roll messages with animated orange pulse effect
- **Socket-Based Permission System**: Player-to-GM actor update delegation
  - Players can deal damage to enemies without permission errors
  - `requestActorUpdate()` socket method for privileged operations
  - Automatic GM routing for actor updates
  - Works for all NPC types (characters, antagonists, minions)
- **Item Independence System**: Per-actor equipped status for weapons/armor
  - Weapons and armor from Items sidebar create independent copies
  - Each actor has separate equipped state for same item
  - Prevents global equipped status sharing across characters

### Technical Improvements

- **Poison System Architecture**:
  - `PoisonedDialog` class extending `ApplicationV2` with `HandlebarsApplicationMixin`
  - Added `poisoned` boolean and `poisonEffects` object (effect1-effect5) to actor data
  - Comprehensive poison checks in stamina/spellcasting systems
  - New files: `poisoned-dialog.mjs`, `poisoned-dialog.hbs`, `poisoned-effects.css`
- **Socket System Enhancement**:
  - `requestActorUpdate()` method for player-initiated actor updates
  - `_handleActorUpdateRequest()` GM-only handler
  - Proper token/actor distinction (`targets[0].document` vs `targets[0].actor`)
  - Fixed duplicate case statement in socket switch
- **Item System Refactoring**:
  - Modified `_onDropItem` to handle weapons/armor with copy creation logic
  - `_onToggleEquipped` uses `actor.updateEmbeddedDocuments()` for actor-specific updates
  - Duplicate item check prevents multiple copies with same name
  - Embedded document architecture ensures per-actor item state

### UI/UX Improvements

- **Visual Poison Indicators**:
  - Pulsing green glow animations for active poison effects
  - Skull icons for stamina/flex die locks
  - Animated gradient backgrounds for locked sections
  - Badge counter on poison toggle button
- **Improved CSS Organization**:
  - Moved initiative roll styles from poisoned-effects.css to roll-chat.css
  - Added `.flex-locked` CSS class for visual indication
  - Enhanced locked state visibility with green coloring
- **Notification System**:
  - Item added notifications with localization
  - Poison status change chat messages
  - Visual feedback for system state changes

### Bug Fixes

- Fixed permission errors during NPC damage application by players
- Fixed equipped status being shared globally across actors for same item
- Fixed "User lacks permission to update Actor" errors
- Fixed item equipped state affecting all characters instead of per-actor
- Fixed NPC damage application not working for owned minions

### Localization

- Added poison-related translation keys in PL/EN/FR
- Added `CONAN.Notifications.itemAdded` localization key
- Added `flexDieLocked` translation key in all languages
- Full poison dialog and UI element translations

## Versions 0.0.42 - 0.0.45 Summary (2025-12-12 to 2026-01-01)

### Major Features Implemented

- **Multiplayer Permission System**: Complete socket-based delegation for player actions
  - Players can deal damage to enemies without "User lacks permission" errors
  - Token and Combatant updates routed through GM via socket system
  - Seamless combat experience for Player and Trusted Player roles
  - Automatic GM delegation for privileged operations
- **Wounded Status Effect for Minions**: Native Foundry status effect integration
  - Custom red blood drop icon for wounded minions
  - Automatic token synchronization when checking "ranny" checkbox on sheets
  - Consistent display across tokens, combat tracker, and status effects panel
  - Manual toggle available from token's status effects menu
- **NPC Sheet Text Editing Overhaul**: Complete responsiveness restoration
  - Fixed freezing issues when editing weapon names, damage values, power descriptions
  - Debounced form handling (500ms delay) prevents constant re-rendering during typing
  - Textarea auto-resize with proper min/max height respect
  - No more text cutoff or focus loss during editing
- **Origin Ability Stamina Option**: 4th stamina spend option for character special powers
  - "Activate Origin Ability" added to stamina spending dialog
  - Full localization in English, Polish, and French
  - Integrated with existing stamina spend system

### Technical Improvements

- **Socket System Architecture**: Unified permission delegation model
  - `requestTokenUpdate()` - Players request token updates through GM
  - `requestCombatantUpdate()` - Players request combatant updates through GM
  - `_handleTokenUpdate()` - GM-only handler for token update requests
  - `_handleCombatantUpdate()` - GM-only handler for combatant update requests
  - All damage application now uses socket methods instead of direct updates
- **Status Effect System Integration**: Native Foundry implementation
  - Wounded status registered in CONFIG.statusEffects during initialization
  - `_onToggleWounded` method uses `actor.toggleStatusEffect("wounded")`
  - CSS filters disabled for wounded/immobilized icons to preserve colors
  - Removed duplicate icon rendering - now uses native status effect system
- **NPC Form Handling**: Custom ApplicationV2 form processing
  - `_setupNPCFormHandling()` method bypasses parent's auto-submit
  - Text inputs use 'input' event with debounce + 'blur' for immediate save on exit
  - Numeric fields and selects save immediately for responsive feel
  - `_isUpdating` flag prevents re-render loops during form updates
  - Textarea auto-resize: `Math.max(minHeight, Math.min(scrollHeight + 2, maxHeight))`
- **CSS Cleanup**: Removed non-existent background image references
  - Fixed 404 errors for missing parchment.webp and parchment.jpg
  - Custom icon styling for wounded (#dc143c red) and immobilized (black)

### UI/UX Improvements

- **Enhanced Readability at 1440p**: Increased font sizes across NPC and character sheets
  - NPC powers & special actions: 14px → 15px
  - Player biography & notes: 14px → 15px
  - Skill descriptions: 13px → 14px
  - Weapon/armor stipulations: 14px → 15px
- **Improved Textarea Behavior**: Intelligent overflow and resize
  - Empty/small content maintains comfortable minimum height (80px)
  - Growing content expands automatically without cutting text
  - Large content shows scrollbar only when exceeding max-height (300-400px)
  - No manual resizing needed - fully automatic
- **Status Effect Visual Consistency**: Color-coded status icons
  - Wounded displays in crimson red across all UI contexts
  - Immobilized shows in black for better combat tracker contrast
  - No more filter issues - CSS ensures intended colors display correctly

### Bug Fixes

- Fixed permission errors preventing players from marking enemies as defeated
- Fixed NPC sheets becoming unresponsive during text field editing
- Fixed textarea fields cutting off last line of text in powers/actions
- Fixed form submission loop causing sheet freezes
- Fixed skill item effect description auto-resize issues
- Fixed 404 console errors from missing background images

### Localization

- Added `activateOriginAbility` and `activateOriginAbilityDesc` keys in EN/PL/FR
- Stamina spend dialog now includes origin ability option with proper translations

## Versions 0.0.36 - 0.0.40 Summary (2025-12-08 to 2025-12-10)

### Major Features Implemented

- **Stamina Tactical Options System**: Complete tactical spend dialog with 3 options (1 Stamina each):
  - Extra movement action for battlefield repositioning
  - Increase thrown weapon range by 1 level or 2 zones
  - Ignore encumbrance effect for 1 round
  - Icon-only button on character sheet with tooltip
  - Streamlined yellow-themed chat messages with character name highlight
  - ApplicationV2 dialog with radio button selection UI
- **CSS Organization & Localization**: Complete stylesheet reorganization and language-specific UI
  - Moved dialog styles to `styles/partials/` folder (attack-dialog, spellcasting-dialog, stamina-spend-dialog)
  - Conditional hiding of English subtitles when system language is English
  - `html[lang="en"]` selectors for language-specific CSS rules
  - Hidden bilingual labels in: Attack/Damage dialogs, Spellcasting, Character sheet sections, NPC sheets
- **NPC Sheet Performance Fixes**: Complete resolution of freezing and synchronization issues
  - Disabled ApplicationV2 auto-submit (`submitOnChange: false`) to prevent UI blocking
  - Wounded checkbox uses dedicated action handler with non-blocking async updates
  - Defense value synchronization: basePhysical properly updates on manual edits
  - Immediate CSS feedback, deferred Combat Tracker refresh
- **Release System Improvements**: Automatic version detection and deployment
  - Manifest URL changed to `releases/latest/download/system.json`
  - Download URL changed to `releases/latest/download/conan-the-hyborian-age.zip`
  - Release assets include both versioned and non-versioned ZIP files

### Technical Improvements

- **Handlebars Helper Compatibility**: Removed conflicting helpers overriding Foundry VTT v13 built-ins
  - Removed: `concat`, `eq`, `ne`, `gt`, `lt`, `select` (now using Foundry's built-in versions)
  - Kept only custom implementations: `times` and `includes`
  - Better compatibility with Foundry VTT v13+
- **NPC Defense Management**: Improved basePhysical synchronization logic
  - Defense.physical field listener syncs basePhysical when no effects active
  - Defence/Immobilized toggles only set basePhysical on first use (no overwrite)
  - Eliminated event listener multiplication in wounded checkbox
- **Stamina Dialog Architecture**: Modern ApplicationV2 implementation
  - HandlebarsApplicationMixin for template rendering
  - Chat messages with flags for tracking spent Stamina and selected option
  - Replaced deprecated `FormDataExtended` with `foundry.applications.ux.FormDataExtended`
  - Button integrated into `.stamina-controls` wrapper with flexbox layout
- **Code Cleanup**: Removed unused variables and optimized async operations
  - Removed unused `originalCombatRollInitiative` in combat override
  - Optimized wounded toggle: CSS immediate, actor update non-blocking, tracker deferred
  - Fixed radio button icon alignment (no overlap)
  - Fixed chat message cost display (hardcoded value instead of template variable)

### UI/UX Improvements

- NPC sheets now responsive without freezing during text field edits
- Modifier slider colors fixed in attack dialog (`!important` for gradient)
- Clean UI when using English language (no redundant subtitles)
- Improved CSS organization with partials folder for maintainability
- Smooth wounded checkbox toggling with visual feedback

### Documentation & Release

- Added Known Issues section documenting Poisoned status as UI-only
- Updated README.md file structure reflecting new CSS organization
- GitHub release workflow aligned with Foundry system best practices
- Added 14 new localization keys for Stamina tactical spend (PL/EN/FR)
- System versions bumped from 0.0.36 to 0.0.40

## [0.0.35] - 2025-12-08

### Added

- Added complete French translation (lang/fr.json) with 611 lines covering all system features.
- System now supports 3 languages: English, Polish, and French.
- Added French language registration in system.json.

### Changed

- Condensed CHANGELOG entries for better readability:
  - Versions 0.0.16-0.0.21 combined into single comprehensive entry (Magic Damage System, Defence/Immobilized toggles, Poisoned status, Damage Roll System).
  - Versions 0.0.22-0.0.25 combined into single entry (Modularized Sorcery Damage, "Deal Damage" button, visual improvements, sheet synchronization).
  - Versions 0.0.26-0.0.29 combined into single entry (Complete damage application system for PC/NPC, token configuration, HP indicator).
  - Versions 0.0.30-0.0.35 combined into single entry (Stamina Spending System, Flex Effect enhancements, Spell Cost Recovery, French translation).
- Improved CHANGELOG structure for easier navigation and understanding of system evolution.

### Technical

- French translations include proper terminology: Force (Might), Agilité (Edge), Résistance (Grit), Astuce (Wits).
- Stamina → Endurance, Flex Effect → Effet de Souplesse, Massive Damage → Dégâts Massifs.
- All UI elements, dialogs, chat messages, and system features fully localized in French.

### Release

- Bumped system version to 0.0.35 in `system.json`.

## [0.0.30-0.0.35] - 2025-12-05 / 2025-12-09

### Major Features Implemented

- **Stamina Spending System**: Complete context menu integration for boosting rolls and damage
  - Right-click chat messages to spend 1-2 Stamina points for +1/+2 roll boosts
  - Add 1d4/2d4 damage dice to damage rolls by spending Stamina
  - "Massive Damage" option when exactly 1 Stamina remains (max die value or double fixed damage)
  - Massive Damage from Stamina stacks with Flex Effect Massive Damage
  - Gradient card styling, animations, and 10+ localization keys (PL/EN)
- **Flex Effect System Enhancements**: Complete magical recovery and damage options
  - Sorcery option for recovering spell costs (Life Points and Stamina) via Flex Effect
  - Massive Damage option for all damage rolls (adds max die value + modifier, or doubles fixed damage)
  - Color-coded buttons: blue (stamina), green (success), purple (sorcery), red (massive)
  - Improved header with gradient background, decorative sword elements, animated icon
  - Dedicated `flex-dialog.css` with elegant box design and better typography
- **Spell Cost Recovery**: Temporary storage of spell costs for Flex Effect recovery
  - Costs stored in actor flags (`flags.conan-the-hyborian-age.lastSpellCost`)
  - Purple-themed chat messages with detailed recovery breakdown
  - Full integration with sorcery damage system
- **XP Refund for Spells**: Automatic XP restoration when spells removed from character
  - Spells store `initialCost` flag when added to track exact XP paid
  - Localized notifications for spell removal with cost display
  - Unified XP refund logic for both skills and spells
- **French Translation**: Complete system localization
  - All UI elements, dialogs, chat messages fully translated
  - Proper terminology: Force (Might), Agilité (Edge), Résistance (Grit), Astuce (Wits)
  - Stamina → Endurance, Flex Effect → Effet de Souplesse, Massive Damage → Dégâts Massifs

### Combat & Token System

- **Minion Defeated Status**: Proper combat tracker synchronization
  - Added `defeated` field to minion template
  - Dead overlay effect (skull icon) for defeated tokens
  - Correct status updates after second wound
  - Combatants found by `tokenId` for unlinked tokens
- **Improved Damage Application**: Fixed critical issues with NPC damage
  - Changed `actorData.system` to `delta.system` for Foundry v13 unlinked tokens
  - Proper handling of linked vs unlinked token data structures
  - Removed race conditions by reordering chat message updates
  - Type safety with `parseInt()` conversions

### Technical Improvements

- **ApplicationV2 Context Menu**: Modern ChatLog integration for Foundry v13
  - Migrated from deprecated `getChatLogEntryContext` hook
  - Direct prototype override: `ChatLog.prototype._getEntryContextOptions`
  - Context menu initialization moved to `init` hook (before ChatLog instances created)
  - Button handlers use `li.dataset.messageId` instead of jQuery `.data()`
- **Enhanced Die Parsing**: Robust regex `/(\d*)d(\d+)/i` handles all formats ("d6", "1d6", "2d8")
  - Proper multiple dice calculation (2d8 = 16, not 8)
  - Fixed string concatenation bugs with `parseInt()` conversions
  - Weapon die info passed via `rollContext` structure
- **Damage Roll Architecture**: All functions (melee, ranged, thrown, sorcery) unified
  - `rollContext`: `{originalDamage, weaponDie, weaponModifier, isFixedDamage, attackType}`
  - Massive Damage logic: `(dieCount × dieSize) + weaponModifier` or double fixed
  - Proper handling of ranged weapon variables (`weaponDice`/`weaponBonus`)
- **Token Update System**: Correct delta system for Foundry v13
  - Unlinked tokens: `targetToken.update({"actorData.system.*": value})`
  - Linked tokens: `target.update({"system.*": value})` + separate overlay update
  - Dead overlay: `{"overlayEffect": CONFIG.controlIcons.defeated}`
- **Stamina System Implementation**: Complete validation and boost mechanics
  - `canSpendStamina()`: validates eligibility (type, available points, not boosted)
  - `spendStaminaToBoost()`: boosts result, updates initiative, creates styled message
  - `canSpendStaminaOnDamage()`, `spendStaminaToDamage()`: damage dice logic
  - `canSpendLastStaminaOnMassiveDamage()`: validates exactly 1 point remaining
  - `extractDamageRollData()`: parses die info from message content
  - Flag system prevents double-boosting same roll

### Fixed Issues

- Fixed damage not applying to antagonist NPCs (delta.system path issue)
- Fixed minion status updates using wrong path for unlinked tokens
- Fixed context menu not appearing in v13 (deprecated hook)
- Fixed ranged damage using wrong variable names
- Fixed die parsing failing for "1d6" format (substring bug)
- Fixed string concatenation causing "961" instead of 16
- Fixed defeated status not updating in combat tracker
- Fixed `targetToken.update is not a function` error
- Fixed duplicate `applySorceryEffect` method preventing recovery
- Fixed Flex Effect CSS not applying (selector mismatch)
- Fixed spell XP not refunding when deleted
- Fixed missing Polish translations

### Release

- Versions 0.0.30 through 0.0.35 released with incremental improvements.

## [0.0.26-0.0.29] - 2025-11-28 / 2025-12-03

### Added

- **Complete Damage Application System**: "Deal Damage" buttons for both PC and NPC damage rolls
  - PC damage buttons for all types (melee, ranged, thrown, sorcery)
  - NPC damage buttons for calculated damage application
  - Flag-based button deactivation (one-time use, stays disabled on chat refresh)
  - Armor reduction with minimum 1 damage on successful hit
  - Type-specific damage mechanics for characters, antagonists, and minions
- **NPC Damage Roll System**: Complete dialog and chat integration
  - NPCDamageDialog for melee and ranged attacks
  - Damage roll buttons on NPC sheets (minion and antagonist)
  - Melee: Brawn value + weapon die + modifiers
  - Ranged: weapon die + modifiers (no Brawn)
  - Color-coded chat messages (green for minions, red for antagonists)
  - damage.svg icon for NPC damage buttons
- **"Roll Damage" Button**: Automatic damage prompts after successful attacks
  - Appears on successful NPC attack chat messages
  - Opens damage dialog and executes roll
- **Visual HP Indicator**: Character sheet health status display
  - Red highlight when character injured (actual < max HP)
  - `.life-injured` CSS class with red background, border, and glow
  - Conditional handlebars `{{#if (lt actual max)}}` helper
- **Automatic Token Configuration**: Default settings based on actor type
  - Characters: linked tokens by default (`actorLink: true`)
  - NPCs: unlinked tokens by default (`actorLink: false`)
  - Added `_preCreate` hook to ConanActor
- **Unlinked Token Support**: Proper data handling for independent tokens
  - Damage rolls use token-specific data
  - Token ID and scene ID tracking in chat flags
  - Correct actor instance resolution (linked vs unlinked)

### Changed

- **Hook Migration**: Updated to `renderChatMessageHTML` (deprecated `renderChatMessage`)
- **PC Attack Dialog**: Button class changed from `.deal-damage-btn` to `.roll-damage-btn` to prevent handler conflicts
- **Armor Calculation**: Improved for characters
  - Now includes equipped armor items plus base armor value
  - Proper calculation from all equipped armor pieces
- **Character Sheet Updates**: Automatic refresh when HP changes from damage application
- **NPC Damage Dialog**: Enhanced display
  - Shows weapon information and Brawn value (melee attacks)
  - Improved CSS with slider, scale markers, proper layout
- **Magic Damage Animation**: Pulse effect now only applies to spellcasting rolls (not NPC damage)
- **NPC Sheet Synchronization**: Proper token linking behavior
  - Linked tokens sync with base actor
  - Unlinked tokens are independent
  - Buttons (Defence, Immobilized, Poisoned) work correctly from token sheets
- **All PC Damage Functions**: Updated to include damage buttons with proper flags
  - rollMeleeDamage, rollRangedDamage, rollThrownDamage
  - rollSorceryFixedDamage, rollSorceryCustomDieDamage, rollSorceryWitsDamage

### Fixed

- Character life points not updating after damage (changed `lifePoints.current` to `lifePoints.actual`)
- Antagonist life points using wrong data structure (object → number)
- Armor not calculated from equipped items for player characters
- Double 3D dice animation on NPC damage rolls (removed manual dice3d call)
- Damage application not using correct actor data for unlinked tokens
- "attackerNotFound" error from duplicate button class handlers
- NPC attack dialog using wrong actor ID for unlinked tokens (now uses `this.actor._stats.systemId`)
- Minion showing "DEFEATED" banner when only wounded (now correctly sets `defeated: false`)
- rollRangedDamage returning undefined (changed `totalDamage` to `damageTotal`)
- Character HP not updating correctly after receiving damage (actorLink issue)
- Damage calculation ignoring pending form edits (added blur() before applying damage)
- Defence and Immobilized buttons not working on NPC token sheets
- NPC sheets incorrectly synchronizing when tokens not linked to actor data
- Duplicate translation keys in language files (weaponName, damageDie, damageModifier)
- Missing "modifier" translation in Dialog.difficulty section
- CSS issues in NPC damage dialog (missing styles for sections and buttons)
- Damage-result section styling in chat messages

### Technical

- Added `.life-injured` CSS class with rgba red background and box-shadow
- Added `.deal-pc-damage-btn` CSS styling (red gradient matching damage theme)
- Modified character sheet template for conditional HP class application
- Added `dealPCDamageBtn` handler in conan.mjs renderChatMessageHTML hook
- Chat message flags: `damageDealt`, `totalDamage`, `attackerId`, `tokenId`, `sceneId`
- Both PC and NPC damage button handlers check `damageDealt` flag on render and after click
- Token configuration via `_preCreate` hook
- Improved damage application with automatic sheet re-rendering
- Blur() mechanism to save pending form edits before damage application
- Removed orphaned code from roll-mechanics.mjs

## [0.0.22-0.0.25] - 2025-11-21 / 2025-11-25

### Added

- **Modularized Sorcery Damage System**: Complete refactoring with three independent options
  - Wits die, custom die, and fixed value options
  - Exported all roll logic to `roll-mechanics.mjs` and `roll-sorcery-damage.mjs`
  - Full localization support (PL/EN)
- **"Deal Damage" Button**: Chat message integration after successful attacks
  - Works for PCs, NPCs, and magic attacks
  - Opens damage dialog and executes the roll automatically
  - Token-based item ID support

### Changed

- **Magic Damage Chat Messages**: Visual improvements
  - Purple, pulsating header with distinct styling
  - Darker purple for better visibility with magical effect
  - Type-specific CSS for magic damage sections
- **Attribute Display**: Updated character sheet layout
  - Attribute `label` now shown as main (large) text
  - `abbr` displayed as smaller caption below
  - Improved visual hierarchy
- **Chat Header Colors**: Restored distinct colors for damage types
  - Melee, ranged, thrown, and magic each have unique colors
  - Improved CSS specificity to prevent color override
- **Radio Button Styling**: Enhanced damage dialog appearance
  - Always visually aligned with dark center
  - Visible shadow and consistent look for all states
  - Better visual feedback
- **Sheet Synchronization**: Socket-based bidirectional sync
  - All changes between actor sheets (actors tab) and token sheets synchronized
  - Always updates baseActor for data consistency
  - Damage dialog: correct weapon preselection and parameter passing for all attack types
- **Code Architecture**: Improved modularity and maintainability
  - Better separation of concerns
  - Cleaner dialog logic for parameter passing and result handling
  - Updated all sheet actions to use baseActor

### Fixed

- Fixed-value magic damage from chat now uses entered value (was always zero)
- Chat message header color for melee/ranged/thrown no longer overridden by magic purple
- Radio button visual bugs (misaligned, wrong color, missing shadow)
- Bidirectional sync: changes from token sheet now update main actor and vice versa
- Dialog parameter passing for magic and ranged damage from chat
- Parameter passing and dialog resolve logic for all three magic damage options
- Localization key usage and added missing keys for new features
- Chat message display and button logic for token-based item IDs
- Pełna lokalizacja opcji stałych obrażeń magicznych (fixed value) w pl.json i en.json
- Poprawki wyświetlania i przekazywania parametrów dla wszystkich trzech typów obrażeń magicznych

### Technical

- Roll logic fully exported to dedicated modules
- CSS specificity improvements for chat message headers
- Socket-based synchronization for actor/token sheet consistency
- BaseActor pattern for all sheet operations

## [0.0.1-0.0.21] - 2025-10-27 / 2025-11-18

### Core System Foundation (v0.0.1-0.0.4)

- **4-Attribute System**: Might, Edge, Grit, Wits with variable die types (d6/d8/d10)
- **Character Creation**: Interactive wizard with 10 origins, 16-point distribution, automatic derived values
- **Flex Die Mechanics**: d10 Flex Die with special effects and 3D dice integration
- **Difficulty System**: Attribute testing with modifiers (-3 to +3) and Winds of Fate (1 = auto-fail)
- **Starting Skills**: CRUD system with automatic XP tracking and origin skills
- **Bilingual Support**: Complete Polish/English localization throughout
- **ApplicationV2 Architecture**: Modern Foundry v13 implementation with auto-save

### Equipment & Combat (v0.0.5-0.0.10)

- **Armor & Weapons**: Complete management with drag & drop, equip/unequip, automatic calculations
- **Combat Rules**: Shield restrictions, weapon combination limits, validation systems
- **Initiative System**: Edge-based initiative with Combat Tracker integration
- **Skills & Spells as Items**: Item-based management with XP economy
- **Item Synchronization**: Bidirectional sync between world and embedded items

### NPC & Magic Systems (v0.0.11-0.0.15)

- **NPC Types**: Minion and Antagonist actors with separate sheets and attributes (d4-d12)
- **Sorcery System**: Origin-based magic restrictions with 5 disciplines
- **Spellcasting**: Complete dialog with LP/Stamina costs and magic attacks
- **Modern Chat**: Unified roll format with visual dice display and success/failure

### Advanced Features (v0.0.16-0.0.21)

- **Magic Damage**: Wits die, Custom die, and Fixed value damage options
- **Status Effects**: Defence (+2), Immobilized (Defense = 0), Poisoned toggles
- **Damage System**: Type selector (Melee/Thrown/Ranged/Sorcery) with chat integration
- **CSS Organization**: Modular structure with partials folder

### Technical Achievements

- ApplicationV2 and HandlebarsApplicationMixin throughout
- Combat Tracker integration with custom initiative
- Comprehensive validation systems
- Modern CSS with flexbox layouts
- Native DOM manipulation (no jQuery)
- Dice So Nice integration with custom bronze Flex die
