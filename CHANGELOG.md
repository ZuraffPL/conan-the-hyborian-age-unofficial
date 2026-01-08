# Changelog

## [0.0.50] - 2026-01-09

### Added

- Poison effect #5: Flex Die Lock functionality - blocks all flex die usage when active
- Visual indicators for poisoned status with flex die lock:
  - Grayed out flex die section with animated green glow and gradient background
  - Disabled flex die select with green-tinted background
  - Pulsing skull icon next to "Flex Die" subtitle
- Initiative roll message styling with animated orange pulse effect
- Full localization support for flex die lock (PL/EN/FR)

### Changed

- Enhanced flex die locked state with more visible green coloring
- Improved visual feedback for poison effect #5 with gradient backgrounds
- Moved initiative roll CSS styles from poisoned-effects.css to roll-chat.css for better organization

### Technical

- Added flex die disabled check in all roll functions (rollAttribute, rollInitiative, rollMeleeDamage, rollThrownDamage, rollRangedDamage)
- Flex die cannot trigger flex effect when poisoned with effect5
- flexTriggered is always false when flexDieDisabled is true
- Added `.flex-locked` CSS class for visual indication
- Enhanced initiative message with orange pulsing border animation
- Added flexDieLocked translation key in all language files

## [0.0.49] - 2026-01-08

### Added

- Poison effects system for player characters
- Poison dialog window for selecting poison effects (5 options)
- Poison effect #4: Stamina lock functionality - blocks all stamina spending when active
- Visual indicators for poisoned status with stamina lock:
  - Grayed out stamina section with animated green glow
  - Disabled stamina input field and "Spend" button
  - Pulsing skull icon next to "Stamina" subtitle
- Poison status toggle button with visual feedback:
  - Pulsing green glow animation when poison effects are active
  - Badge counter showing number of active poison effects (1-5)
  - Always opens dialog for configuring effects
- Chat notifications for poison status changes (applied/removed)
- Comprehensive stamina spending blocks across all game mechanics:
  - Manual stamina editing blocked
  - Stamina spend dialog blocked
  - Damage boosts blocked (context menu)
  - Roll boosts blocked (context menu)
  - Massive damage spending blocked
  - Spellcasting stamina usage blocked
- Full localization support (PL/EN/FR) for all poison-related UI elements

### Changed

- Poison toggle button now always opens configuration dialog instead of simple on/off toggle
- Stamina section styling enhanced with conditional poison effects
- Actor sheet template updated to show active poison indicators

### Technical

- Added `PoisonedDialog` class extending `ApplicationV2` with `HandlebarsApplicationMixin`
- Added `poisoned` boolean and `poisonEffects` object (effect1-effect5) to actor system data
- Added `_prepareContext()` enhancement to count active poison effects
- Added comprehensive CSS animations for poison visual effects
- Added socket-based chat message system for poison status notifications
- Added poison checks in: `stamina-spend-dialog.mjs`, `stamina-effects.mjs`, `spellcasting-dialog.mjs`, `actor-sheet.mjs`
- Added new CSS file: `styles/partials/poisoned-effects.css`
- Added new template: `templates/dialogs/poisoned-dialog.hbs`
- Added new module: `module/helpers/poisoned-dialog.mjs`

## [0.0.48] - 2026-01-07

### Fixed

- Fixed permission errors when players use owned minion NPCs to attack antagonists
- Fixed "User lacks permission to update Actor" errors during NPC damage application
- Players can now deal damage to enemy NPCs through their owned minions without GM intervention

### Changed

- NPC damage application now uses socket system for actor updates
- `applyNPCDamage()` function now uses `ConanSocket.requestActorUpdate()` instead of direct `target.update()`
- Proper token/actor distinction in damage button handlers (using `targets[0].document` instead of `targets[0].actor`)

### Added

- Added `requestActorUpdate()` socket method for players to update actors through GM
- Added `_handleActorUpdateRequest()` socket handler (GM-only) to process actor update requests
- Socket-based actor updates now work for all NPC types (characters, antagonists, minions)

### Technical

- All direct `target.update()` calls replaced with `ConanSocket.requestActorUpdate()` for proper permission handling
- Fixed duplicate case statement in socket switch (renamed "updateActor" to "requestActorUpdate")
- Socket system automatically routes player requests to GM for privileged actor operations
- Consistent with existing socket methods (`requestTokenUpdate`, `requestCombatantUpdate`)

## [0.0.46] - 2026-01-02

### Fixed

- Fixed equipped status being shared globally across all actors when same item (weapon/armor) was dragged from Items sidebar
- Fixed item equipped state affecting all characters who have that item instead of being per-actor

### Changed

- Weapons and armor dropped from Items sidebar now create independent copies for each actor (via `createEmbeddedDocuments`)
- Items dropped from other actors or reordered within same actor continue to use default behavior
- Equipped status reset to `false` when creating new copy to prevent inheriting equipped state from source
- `_onToggleEquipped` now uses `actor.updateEmbeddedDocuments()` instead of `item.update()` to ensure actor-specific updates
- Duplicate item check added for weapons/armor to prevent multiple copies with same name

### Added

- Added `CONAN.Notifications.itemAdded` localization key in PL/EN/FR for new item notifications
- Added visual notification when weapon/armor successfully added to character sheet

### Technical

- Modified `_onDropItem` to handle weapons/armor explicitly with copy creation logic
- Each actor now has truly independent item instances with separate equipped state
- Item embedded document architecture ensures equipped status is per-actor, not global
- AR (Armor Rating) and damage calculation systems unaffected - continue to work with embedded items correctly

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

## [0.0.16-0.0.21] - 2025-11-12 / 2025-11-18

### Added

- **Magic Damage System**: Complete sorcery damage implementation
  - Three damage types: Wits die, Custom die, Fixed value
  - Dynamic dialog with inline field switching (no window reload)
  - Modifier support (cumulative with slider)
  - Full chat integration with proper dice animation
  - Bilingual support (Polish/English)
- **Defence Toggle Button**: Active defense action on character sheet
  - Shield icon (+2 to Physical Defense when active, 1 Action cost)
  - Visual gold highlight with bonus indicator
  - Cannot be used when Immobilized (auto-disabled)
- **Immobilized Toggle Button**: Status effect for immobilized characters
  - Sets Physical Defense to 0 when active
  - Visual red highlight, automatically disables Defence
  - Original defense crossed out and grayed when active
- **Poisoned Status System**: Complete poison effects management
  - Poisoned toggle button (skull icon) with interactive dialog
  - 5 configurable poison effects
  - Combat Tracker icon display, visual green highlight
  - Full integration with all actor types
- **Damage Roll System**: Complete damage calculation and chat display
  - Damage button on character sheet with type selector (Melee/Thrown/Ranged/Sorcery)
  - Type-specific weapon parameters with automatic detection
  - Modifier slider (-3 to +3) for situational bonuses
  - Beautiful chat messages with highlighted damage total (golden gradient box)
  - Flex Die integration with 3D dice animation

### Changed

- **Magic Damage Architecture**: Fixed parameter passing and roll mechanics
  - Wits die rolls now correctly use both parameter and slider modifiers
  - Custom die and fixed value options work independently
  - All three types properly pass sorceryDamageType and sorceryCustomDie to handler
  - Works independently of weapons (weaponId can be null)
- **Terminology Update**: Wits → Wits throughout system
  - Changed all "Reason" references to "Wits" in UI and localization
  - Wits die styled consistently in dialogs
- **Damage Dialog Architecture**: Type-based parameter sections
  - Radio buttons for damage type selection
  - Dynamic section visibility, FormDataExtended compatibility
  - Separate damage functions: rollMeleeDamage, rollThrownDamage, rollRangedDamage
- **Weapon Detection Logic**: Type-specific weaponId extraction
  - Melee: formData.object.weaponId (can be "unarmed")
  - Thrown/Ranged: querySelector for hidden inputs in display:none sections
  - Prevents melee weaponId bleeding into other damage types
- **Flex Die Mechanics**: Fixed to use character's actual flex die type
  - Attack/spellcasting rolls now correctly use flexDie from actor.system.flexDie (was hardcoded to d10)
  - Flex Effect triggers on maximum value of specific die type (d10=10, d8=8, d6=6, d4=4)
- **CSS Organization**: Improved file structure
  - Created `styles/partials/` folder for imported CSS files
  - Moved actor-spell.css, combat-tracker.css, poisoned-effects.css to partials/
- **Defense Section Layout**: Redesigned visual organization
  - Toggle buttons in vertical column on left, defense fields on right
  - Wider spacing (30px gap) for better visual separation

### Fixed

- Magic damage dialog parameter passing issues
  - Fixed custom die and Wits die options not executing rolls
  - Fixed modifier not being included from parameters
  - Fixed dynamic field switching and layout overflow
- Critical JS errors in roll-mechanics.mjs (stray template code)
- FormDataExtended not capturing fields in display:none sections
- Ranged weapon damage modifier display (changed from damage.bonus to damageModifier)
- weaponId always returning melee weapon (fixed with type-based conditional logic)
- Critical syntax errors preventing sheets from rendering
  - Fixed attack-dialog.mjs template literal syntax error
  - Fixed npc-sheet.mjs class declaration syntax
- Radio button double-display in attack dialog
- Ranged weapon bonus alignment in chat (now perfectly inline with dice result)

### Technical

- New action handlers: toggleDefence, toggleImmobilized
- New data fields: system.defenceActive, system.immobilized, system.defense.basePhysical
- Poison effects stored in system.poisonEffects (5 boolean flags)
- Flex die type dynamically determined: flexMax = parseInt(flexDie.substring(1))
- CSS architecture: partials pattern for better organization
- Custom SVG icons stored in assets/icons/
- CSS classes: `.defence-toggle-btn`, `.immobilized-toggle-btn`, `.defence-bonus`, `.immobilized-indicator`
- Defence and Immobilized states persist across sessions

## Versions 0.0.11 - 0.0.15 Summary (2025-11-04 to 2025-11-07)

### Major Features Implemented

- **NPC System**: Complete Minion and Antagonist actor types with separate sheets, attributes (d4-d12 dice, values 1-20/1-50), NPCDifficultyDialog for tests, color-coded chat messages (green/red), tabbed interface (Statistics/Powers), damage sections (Melee/Ranged with N/A toggles), action economy tracking, Powers & Special Rules management with auto-resize textareas
- **NPC Combat Stats**: Minion (Physical/Sorcery Defence 0-20, Threshold 1-25, Armor 0-20, Wounded checkbox), Antagonist (Physical/Sorcery Defence 0-50, Armor 0-20, Life Points 0-999 with large 80×80px input), creature type system (6 types: Human, Inanimate, Undead, Monstrosity, Demon, Beast)
- **Sorcery System**: Origin-based magic restrictions (10 origins with varying magic access), discipline limits per origin, validation preventing forbidden spells, complete spellcasting dialog with LP/Stamina costs, magic attack rolls vs Sorcery Defense, Flex Die integration, chat message with spell cost display
- **Modern Chat Message System**: Unified `.conan-roll-chat` format for attribute tests and magic attacks, visual dice display (50×50px), complete calculation breakdown, color-coded success/failure, special condition animations (Winds of Fate shake, Flex Effect glow), distinctive headers (brown for tests, purple for magic)
- **Character Sheet Enhancements**: Defence toggle button (+2 Physical Defense, gold highlight, 1 Action cost), Immobilized toggle (sets Defense to 0, red highlight, prevents Defence), Notes tab with two-column layout (Biography/Notes side-by-side, auto-resize textareas), origin selector lock after creation
- **Item Synchronization System**: Bidirectional sync between world items and embedded items, ID-based matching, loop prevention with flags, automatic propagation, dynamic XP adjustment when editing embedded item costs, validation for XP sufficiency

### Technical Achievements

- **ApplicationV2 for NPCs**: Complete sheet implementation with tab management, `_onRender` for numeric validation, auto-resize textareas for Powers fields, setupNACheckboxes() helper for damage type toggles
- **Magic System Architecture**: CONFIG.CONAN.magicRestrictions object, `_preCreateEmbeddedDocuments` validation, Sorcery tab visibility control, SpellcastingDialog (ApplicationV2 with HandlebarsApplicationMixin)
- **Roll Mechanics Modernization**: Updated rollAttribute() to modern format, manual 3D dice invocation (prevents duplication), bronze Flex die colorset, removed deprecated `rolls` array from ChatMessage
- **CSS Organization**: Separated NPC styles to `actor-npc.css`, class-based selectors (`.minion`, `.antagonist`), Powers tab styling with gradient separators and decorative elements
- **Validation Systems**: NPC numeric input validation with auto-correction, attack/action validation (attacks ≤ actions), magic restriction validation, XP sufficiency checks for item cost changes
- **Modern API Usage**: FilePicker migration to `foundry.applications.apps.FilePicker.render(true)`, deprecated API elimination, Foundry v13 best practices

### UI/UX Improvements

- NPC sheets optimized to 640px width with compact layouts
- Tabbed interface with visual active state (brown underline)
- N/A strikethrough effect for disabled damage types (50% opacity, brown line)
- Auto-resize textareas (min 80px, max 400px) for Powers fields
- Defense toggle buttons with visual feedback (gold/red highlights)
- Chat messages 30% smaller for NPCs, color-coded by type
- Bilingual labels throughout (primary + subtitle)
- Origin selector disabled state with visual feedback

## Versions 0.0.5 - 0.0.10 Summary (2025-10-31 to 2025-11-04)

### Major Features Implemented

- **Complete Equipment System**: Full armor and weapon management with drag & drop, equip/unequip toggles, automatic damage calculation, combat statistics tracking (AR, Encumbrance), shield restrictions, weapon combination limits, and comprehensive validation systems
- **Weapon System Details**: Type selection (Melee/Thrown/Ranged), handedness (one-handed/two-handed), size categories (Light/Medium/Heavy), automatic damage assignment (1d4 to 1d12), range selection, improvised weapons, "Różna" (Various) option, stipulations with auto-resize, color-coded visual display
- **Armor System Details**: Type selection (Light/Medium/Heavy/Shield), material quality (Crude/Standard/Quality/Superior), AR and Encumbrance per item, visual armor list with images, overencumbered warnings, real-time stat calculations
- **Combat Rules Enforcement**: Shield restrictions (only one-handed melee, all thrown, light ranged), weapon combination limits (max 2 one-handed melee, max 1 melee+thrown, two-handed blocks all, heavy ranged blocks all), 9 warning messages explaining restrictions
- **Initiative System**: Custom Edge-based initiative button, InitiativeDialog with modifier slider (-3 to +3), Edge die + value + modifier roll, Flex Die integration, Combat Tracker override replacing d20 rolls, automatic initiative updates
- **Skills & Spells as Items**: Complete transformation to item-based management, skill item type with origin checkbox, spell item type with 5 disciplines (Alchemy, Black Magic, Demonology, Necromancy, White Magic), automatic XP validation/deduction/refund, default icons (aura.svg for skills, book.svg for spells)
- **Sorcery System**: Origin-based magic restrictions (10 origins with different magic access), discipline limits per origin, validation preventing forbidden spells, Sorcery tab visibility control, complete spellcasting dialog with LP/Stamina costs, magic attack rolls vs Sorcery Defense
- **Item Synchronization**: Bidirectional sync between world items and embedded items, ID-based matching, loop prevention with flags, automatic propagation of changes, notifications system
- **Notes & Biography System**: Two-column layout with vertical separator, auto-resize textareas (min 200px), bilingual labels and placeholders, full auto-save

### Technical Achievements

- **ApplicationV2 Excellence**: Complete ItemSheetV2 implementation with `_onChangeForm` for auto-save, PARTS compatibility for proper rendering, modern form handling without closing windows
- **Combat Integration**: Combat.rollInitiative override for custom initiative system, ApplicationV2 compatibility in Combat Tracker hooks (native DOM vs jQuery), proper hook usage for combat events
- **CSS Architecture Evolution**: Separated domain-specific stylesheets (`item-armor.css`, `item-weapon.css`, `actor-armor.css`, `actor-weapon.css`), inline styles for ApplicationV2 compatibility, flexbox mastery for responsive layouts
- **Tab Management**: Manual tab activation with click listeners, active state preservation in `this.tabGroups.primary`, prevention of unwanted tab switching on updates
- **XP Economy System**: `_preCreateEmbeddedDocuments` for validation before adding items, `_onDeleteEmbeddedDocuments` for refunds, `_onUpdateEmbeddedDocuments` for dynamic cost adjustments, origin skill bypass logic
- **Validation Systems**: Comprehensive rule checking (`_canEquipWeapon`, `_canUseWeaponWithShield`), overencumbered detection, magic restriction validation, XP sufficiency checks
- **Item Type Management**: Removed unused types (Equipment, Talent), streamlined to 4 core types (Weapon, Armor, Skill, Spell), updated all system files
- **Modern API Usage**: FilePicker migration to `foundry.applications.apps.FilePicker`, deprecated API elimination, Foundry v13 best practices
- **Origin Lock System**: Character creation flag prevents origin changes, visual feedback for disabled state, immutable foundational data protection

### UI/UX Improvements

- Responsive design with resizable windows, automatic scrolling, optimized dimensions (840x1000)
- Ultra-compact layouts maximizing information density
- Visual weapon/armor lists with color-coding (white/yellow/green for weapons)
- Two-row item layouts (main info + stats)
- Expandable details for stipulations
- Real-time stat updates (AR, Encumbrance, damage)
- Origin selector lock with visual feedback
- Tab organization refinements
- Field width optimization preventing layout shifts
- Consistent bilingual labeling throughout

### Added

- **Responsive Design**: Improved compatibility with different screen resolutions
  - Window is resizable, minimizable, and maximizable
  - Automatic scrolling when content exceeds window height
  - Optimized for 1080p but works on smaller/larger displays
  - Flexible layout prevents content overflow

### Changed

- **UI Refinements**: Further optimization of interface spacing
  - Tab button heights reduced by 50% (2.5px padding) with perfect vertical/horizontal centering
  - Section headers spacing reduced by 50% (7.5px margin-top)
  - Ultra-compact layout maximizes information density
  - Optimized window dimensions (840x1000)
- **Polish Terminology Updates**:
  - "Umiejętności Początkowe" (not "Startowe")
  - "Kość Brawury" and "Efekt Brawury" (not "Flex")
  - Consistent Polish naming throughout system
- **Visual Improvements**:
  - Tab labels perfectly centered with flexbox alignment
  - Reduced gaps throughout interface (1px label spacing)
  - Tighter integration between sections
  - Compact, information-dense presentation
- **CSS Architecture**: Improved flexbox layout for better responsiveness
  - Form uses `min-height` instead of fixed `height`
  - Sheet body has `flex: 1 1 auto` with `min-height: 0` for proper scrolling
  - Header and tabs have `flex-shrink: 0` to prevent collapsing

## Versions 0.0.1 - 0.0.4 Summary (2025-10-27 to 2025-10-30)

### Major Features Implemented

- **Core System Framework**: Complete 4-attribute system (Might, Edge, Grit, Wits) with variable die types (d6/d8/d10)
- **Character Creation Wizard**: Interactive dialog with 10 origin backgrounds, 16-point attribute distribution, automatic derived value calculation (Life Points, Defense, Stamina)
- **Flex Die Mechanics**: d10 Flex Die with special effects (Stamina recovery, bonus success) and 3D dice integration with custom bronze die
- **Difficulty Dialog System**: Attribute testing with difficulty selection, situational modifiers (-3 to +3), color-coded gradient slider, Winds of Fate (1 = auto-fail)
- **Starting Skills Management**: Complete CRUD system with automatic XP tracking, origin skills flagged as free, collapsible skill items with gold badges, validation preventing XP overspending
- **Value Change Tracking**: Visual highlighting (green for increases, red for decreases) tracking initial values from creation, Life Points validation with auto-adjustment
- **Full Bilingual Support**: Complete Polish/English localization with dual labels (primary + subtitle) throughout interface
- **Auto-Save Architecture**: Real-time change detection and persistence, ApplicationV2 form handling with `data-dtype` auto-conversion
- **Chat Message System**: Detailed roll results with dice visualization, attribute names in Polish with English in parentheses, success/failure determination

### Technical Achievements

- ApplicationV2 and HandlebarsApplicationMixin implementation
- Dialog V1 for stable form interactions (avoiding ApplicationV2 conflicts)
- ES6 module architecture with clean separation of concerns
- Native DOM manipulation (no jQuery)
- Modern CSS with flexbox layouts and CSS variables
- Dice So Nice integration with custom Flex Die content property
- Initial values storage system for change tracking
