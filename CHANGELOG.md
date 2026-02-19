# Changelog

## [0.0.60] - 2026-02-19

### Added

- **Recovery Section in the Tale dialog**
  - GM sees all currently connected players with their characters
  - Player sees only their own character
  - Bed icon button (🛏) with tooltip — 2 uses per tale, resets on Tale End
  - Use counter displayed as a badge on the button
- **HP Display in Recovery Section**
  - `actual / max` text with live updates via `updateActor` hook
  - Animated health bar: red→orange→yellow→green gradient; green shrinks first as HP drops; CSS `transition: width 0.4s ease`
- **Recovery Mechanics**
  - HP < max: restores `ceil(max / 2)` Life Points (capped at max) + 1 Stamina
  - HP = max: only +1 Stamina, no healing
  - Styled chat message with HTML: header with character name, row with recovered LP (or "full HP" info), row for `+1 Stamina`
  - Chat message localized in PL / EN / FR
- **Tale dialog — auto-restore on F5**
  - GM: dialog reopens automatically after page reload if a tale was active
  - Player: player view opens automatically and stays frozen waiting for GM's Start signal
  - Default dialog position: `left: 15, top: 450`

### Fixed

- **Timer sync after F5**
  - Player no longer starts the timer independently after F5 — always waits for `taleStart` socket from GM
  - `taleSync` now carries a `running` flag so players joining mid-tale correctly start or stop their local ticker
- **Multiplayer — GM dialog refresh**
  - `userConnected` hook (replacing the incorrect `updateUser`) calls `render({ force: true })` on the GM dialog when a player joins or leaves the session
  - `setTimeout(..., 0)` defers auto-render after `ready` until Foundry DOM is fully initialized (fixes `Cannot read properties of null (reading 'offsetWidth')`)
- **Player dialog width**
  - `TalePlayerDialog` widened to 400px (was 360px) — character name always fully visible

### Removed

- **Dead code**
  - `health` and `power` fields removed from the base template in `template.json` (never used)
  - `templates/actor/parts/actor-header.hbs` deleted (the only file referencing the removed fields)

### New Files

- `module/helpers/tale.mjs` — `TaleDialog` (GM) and `TalePlayerDialog` (player) classes with full timer and Recovery logic
- `templates/dialogs/tale-dialog.hbs` — GM dialog template
- `templates/dialogs/tale-player-dialog.hbs` — player dialog template
- `styles/tale.css` — styles for both dialogs, Recovery section, and chat message

---

## [0.0.59] - 2026-02-18

### Added

- **System Opowieści (Tale Timer)**
  - Nowe okno `Opowieść` dostępne dla GM z paska narzędzi (ikona zwoju)
  - Licznik czasu HH:MM:SS z przyciskami Start / Pauza / Koniec Opowieści
  - Stan timera trwały między sesjami (zapisywany w `game.settings`, world scope)
  - Przy starcie: zapisywany epoch timestamp; backup co 5s; synchronizacja z graczami co 15s
  - Przy pauzie/stopie: naliczone sekundy zapisane, timestamp zerowany
- **Widok gracza – tylko do odczytu**
  - `TalePlayerDialog` otwiera się automatycznie po otrzymaniu socketu `taleStart`
  - Pokazuje nazwę opowieści i bieżący czas (synchronizowany z GM)
  - Zamykany automatycznie po `taleStop`
- **Komunikacja przez socket**
  - Eventy: `taleStart`, `talePause`, `taleStop`, `taleSync`, `taleNameUpdate`
  - Handler w `socket.mjs` kieruje eventy do `TaleDialog.handleSocketEvent()`

---

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

## [0.0.22-0.0.35] - 2025-11-21 / 2025-12-09

### Added

- **Modularized Sorcery Damage System**: Three independent options — Wits die, custom die, fixed value; roll logic moved to `roll-mechanics.mjs` and `roll-sorcery-damage.mjs`
- **"Deal Damage" Button**: Chat message integration for PC, NPC, and magic attacks; flag-based one-time use; armor reduction with minimum 1 damage
- **Complete NPC Damage System**: `NPCDamageDialog` for melee/ranged; color-coded chat messages (green for minions, red for antagonists); automatic "Roll Damage" prompt after successful hits
- **Visual HP Indicator**: Red `.life-injured` highlight on character sheet when `actual < max`
- **Automatic Token Configuration**: Characters get linked tokens, NPCs get unlinked by default via `_preCreate` hook
- **Unlinked Token Support**: Token-specific data, `tokenId`/`sceneId` flags, correct actor resolution for linked vs. unlinked
- **Stamina Spending System**: Context menu on chat messages to spend 1–2 Stamina for +1/+2 roll boosts or +1d4/+2d4 damage; "Massive Damage" option when exactly 1 Stamina remains; Stamina Massive Damage stacks with Flex Effect
- **Flex Effect Enhancements**: Sorcery option for spell cost recovery (LP and Stamina); Massive Damage option; color-coded buttons (blue/green/purple/red); gradient header with sword elements
- **Spell Cost Recovery**: Temporary cost storage in actor flags; purple-themed chat breakdown on recovery
- **XP Refund for Spells**: `initialCost` flag on spell items; automatic XP restore on deletion with localized notification
- **Minion Defeated Status**: `defeated` field in template; skull overlay on tokens; combat tracker sync by `tokenId`
- **French Translation (v0.0.35)**: Complete `lang/fr.json` (611 lines) — Force, Agilité, Résistance, Astuce; Endurance, Effet de Souplesse, Dégâts Massifs

### Changed

- Magic damage chat headers: distinct purple pulsating style; melee/ranged/thrown colors restored with higher CSS specificity
- Attribute display: `label` as main text, `abbr` as smaller caption below
- Radio button styling in damage dialog: consistent dark center, shadow, proper alignment
- Sheet synchronization: socket-based bidirectional sync between actor and token sheets using `baseActor` pattern
- Hook migration: `renderChatMessage` → `renderChatMessageHTML`; context menu via direct `ChatLog.prototype._getEntryContextOptions` override (v13 compatible)
- Die parsing: robust regex `/(\d*)d(\d+)/i` for formats `d6`, `1d6`, `2d8` with proper multi-die calculation

### Fixed

- Fixed-value magic damage always returning zero from chat
- Antagonist life points using wrong data structure (object → number)
- Character HP not updating after damage (`lifePoints.current` → `lifePoints.actual`)
- Unlinked token damage path (`actorData.system` → `delta.system`)
- Ranged damage returning `undefined` (`totalDamage` → `damageTotal`)
- Duplicate `applySorceryEffect` method blocking recovery
- Defeated banner appearing when minion only wounded
- Context menu not shown in Foundry v13 (deprecated hook)
- Double 3D dice animation on NPC rolls
- `targetToken.update is not a function` error
- Spell XP not refunding on deletion; missing Polish/English localization keys

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
