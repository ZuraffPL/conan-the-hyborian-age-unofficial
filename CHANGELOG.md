# [0.0.40] - 2025-12-10
### Fixed
- Fixed NPC defense value synchronization bug: basePhysical now properly updates when defense value is manually edited on NPC sheet (both Minion and Antagonist).
- Fixed NPC sheet freezing issues: disabled ApplicationV2 auto-submit (`submitOnChange: false`) to prevent UI blocking during field edits.
- Fixed NPC (Minion) wounded checkbox freezing issue: replaced event listener approach with dedicated action handler, removed blocking `await` on update.
- Removed conflicting Handlebars helpers that were overriding Foundry VTT v13 built-in helpers (`concat`, `eq`, `ne`, `gt`, `lt`, `select`).
- Removed unused variable `originalCombatRollInitiative` in combat override code.

### Changed
- NPC defense.physical field now includes listener to sync basePhysical when no effects (Defence/Immobilized) are active.
- Wounded checkbox in Minion sheet now uses `data-action="toggleWounded"` with dedicated handler instead of relying on ApplicationV2 auto-submit.
- Wounded checkbox update now asynchronous (non-blocking) with immediate CSS feedback and deferred Combat Tracker refresh.
- NPC sheets (Minion and Antagonist) now use `submitOnChange: false` for smooth editing without UI freezes.
- Handlebars helpers reduced to only custom implementations: `times` and `includes` (all others now use Foundry's built-in versions).

### Technical
- Improved NPC defense management: Defence and Immobilized toggles only set basePhysical on first use (no longer overwrite existing value).
- Eliminated event listener multiplication in NPC wounded checkbox handling.
- Disabled ApplicationV2 auto-submit for NPC sheets to prevent re-render on every field change.
- Optimized wounded toggle: CSS update immediate, actor update non-blocking, combat tracker refresh deferred to `.then()`.
- Better compatibility with Foundry VTT v13+ by using built-in Handlebars helpers.

# [0.0.38] - 2025-12-09
### Added
- Added missing `flexDie` localization key to English translation.
- Added CSS rules to hide redundant English subtitles when system language is set to English.

### Changed
- Reorganized CSS structure: moved dialog stylesheets to `styles/partials/` folder.
- Moved `attack-dialog.css` to `styles/partials/` and imported in `conan.css`.
- Moved `spellcasting-dialog.css` to `styles/partials/` and imported in `conan.css`.
- Moved `stamina-spend-dialog.css` to `styles/partials/` and imported in `conan.css`.
- Updated `system.json` to reflect new CSS structure (removed direct references to moved files).

### Fixed
- Fixed modifier slider colors in attack dialog (added `!important` to gradient background).
- Hidden English subtitle labels in English language mode for:
  - Attack and Damage dialogs (subtitle/subtitle-label)
  - Spellcasting dialog (subtitle-label)
  - Character sheet sections: Life Points, Defense, Armor & Encumbrance
  - Character sheet action buttons: Initiative, Attack, Damage Roll, Spellcasting
  - NPC sheets: Actor type, Creature type, Wounded status, Damage rows, Actions

### Technical
- CSS now uses `html[lang="en"]` selectors to conditionally hide English subtitles.
- Improved CSS organization with partials folder for dialog-specific styles.
- Updated README.md file structure to reflect new CSS organization.

### Release
- Bumped system version to 0.0.38 in `system.json`.

# [0.0.37] - 2025-12-08
### Added
- Added Stamina tactical spend button to character sheet.
- Added Stamina spend dialog with 3 tactical options (1 Stamina each):
  - Extra movement action
  - Increase thrown weapon range by 1 level or 2 zones
  - Ignore encumbrance effect for 1 round
- Added stamina-spend-dialog.mjs module with ApplicationV2 dialog implementation.
- Added stamina-spend-dialog.hbs template with radio button selection UI.
- Added stamina-spend-dialog.css with complete styling for dialog and chat messages.
- Added 14 new localization keys for Stamina spend system (PL/EN/FR).

### Changed
- Icon-only Stamina spend button on character sheet with tooltip for compact display.
- Streamlined chat message format (removed header, kept character name highlighted).
- Updated yellow color scheme with black text-shadow for better contrast.

### Fixed
- Replaced deprecated `FormDataExtended` with `foundry.applications.ux.FormDataExtended`.
- Fixed radio button icon alignment in dialog (icons no longer overlap radio buttons).
- Fixed chat message to display hardcoded cost value (1) instead of template variable.

### Technical
- Stamina spend dialog follows ApplicationV2 pattern with HandlebarsApplicationMixin.
- Chat messages include flags for tracking spent Stamina and selected option.
- Button integrated into `.stamina-controls` wrapper with flexbox layout.

### Release
- Bumped system version to 0.0.37 in `system.json`.

# [0.0.36] - 2025-12-08
### Changed
- Updated manifest URL to use `releases/latest/download/system.json` for automatic latest version detection.
- Updated download URL to use `releases/latest/download/conan-the-hyborian-age.zip` (without version number).
- Release assets now include both versioned and non-versioned ZIP files for flexibility.

### Fixed
- Added Known Issues section documenting that Poisoned status is UI-only (full logic not yet implemented).

### Technical
- Manifest and download URLs now point to `/latest/` instead of specific version.
- GitHub release workflow aligned with best practices from other Foundry systems.

### Release
- Bumped system version to 0.0.36 in `system.json`.

# [0.0.35] - 2025-12-08
### Added
- Added complete French translation (lang/fr.json) with 611 lines covering all system features.
- System now supports 3 languages: English, Polish, and French.
- Added French language registration in system.json.

### Changed
- Condensed CHANGELOG entries for better readability:
  - Versions 0.0.16-0.0.21 combined into single comprehensive entry (Magic Damage System, Defence/Immobilized toggles, Poisoned status, Damage Roll System).
  - Versions 0.0.22-0.0.25 combined into single entry (Modularized Sorcery Damage, "Deal Damage" button, visual improvements, sheet synchronization).
  - Versions 0.0.26-0.0.29 combined into single entry (Complete damage application system for PC/NPC, token configuration, HP indicator).
- Improved CHANGELOG structure for easier navigation and understanding of system evolution.

### Technical
- French translations include proper terminology: Force (Might), Agilité (Edge), Résistance (Grit), Astuce (Wits).
- Stamina → Endurance, Flex Effect → Effet de Souplesse, Massive Damage → Dégâts Massifs.
- All UI elements, dialogs, chat messages, and system features fully localized in French.

### Release
- Bumped system version to 0.0.35 in `system.json`.

# [0.0.34] - 2025-12-08
### Added
- Added comprehensive Stamina spending system via right-click context menu on chat messages.
- Added ability to spend 1-2 Stamina points to boost roll results (+1/+2) for attribute tests, initiative, and attacks.
- Added ability to spend 1-2 Stamina points to add 1d4/2d4 damage to damage rolls.
- Added "Massive Damage" option for spending last Stamina point (when exactly 1 point remains).
- Massive Damage from Stamina works identically to Flex Effect Massive Damage (max die value or double fixed damage).
- Massive Damage from Stamina can stack with Massive Damage from Flex Effect on same roll.
- Added stamina-effects.mjs module with full context menu integration for Foundry v13.
- Added stamina-effects.css with gradient card styling and animations.
- Added 10+ new localization keys for Stamina system (PL/EN).

### Changed
- Updated ChatLog integration to use v13 ApplicationV2 architecture (`ChatLog.prototype._getEntryContextOptions`).
- Moved stamina initialization from `ready` to `init` hook to ensure proper ChatLog prototype extension.
- Changed from deprecated `getChatLogEntryContext` hook to direct prototype override for v13 compatibility.
- Updated button handlers to use `li.dataset.messageId` instead of jQuery `.data()` method.
- Enhanced damage roll data extraction to parse weapon die information from chat message HTML.

### Fixed
- **CRITICAL:** Fixed damage not being applied to antagonist NPCs - changed `actorData.system` to `delta.system` for Foundry v13 unlinked tokens.
- Fixed minion status updates (wounded/defeated) using wrong path for unlinked tokens.
- Fixed context menu not appearing in v13 due to deprecated hook system.
- Fixed stamina boost preventing double-boosting via flag system.
- Fixed damage buttons styled to be visible on dark backgrounds (red gradient instead of matching container color).

### Technical
- Implemented `canSpendStamina()` - validates roll boost eligibility (roll type, stamina available, not already boosted).
- Implemented `spendStaminaToBoost()` - boosts roll results, updates initiative tracker, creates styled chat message.
- Implemented `canSpendStaminaOnDamage()` - validates damage boost eligibility.
- Implemented `spendStaminaToDamage()` - rolls additional d4 dice, adds to damage, creates message with "Deal Damage" button.
- Implemented `canSpendLastStaminaOnMassiveDamage()` - validates exactly 1 stamina point remaining.
- Implemented `spendStaminaToMassiveDamage()` - applies massive damage effect, depletes stamina to 0.
- Implemented `extractDamageRollData()` - parses damage die info from message content for bonus calculation.
- All damage buttons (.deal-pc-damage-btn) handled by global renderChatMessage hook in conan.mjs.
- Context menu shows 5 options: +1/+2 for rolls, +1d4/+2d4 for damage, Massive Damage for last point.
- Foundry v13 delta system properly implemented for all token updates.

### Release
- Bumped system version to 0.0.34 in `system.json`.

# [0.0.32] - 2025-12-06
### Added
- Added XP refund functionality for spell items when removed from character sheet.
- Spells now store `initialCost` flag when added to track exact XP paid.
- Added localized notifications for spell removal (PL: "Zaklęcie usunięte, zwrócono {cost} PD", EN: "Spell removed, refunded {cost} XP").

### Changed
- Extended `_onItemDelete` handler to process both skills and spells uniformly.
- XP refund logic now falls back to `system.xpCost` when `initialCost` flag is unavailable.

### Fixed
- Fixed spell items not refunding XP cost when deleted from Sorcery tab.
- Fixed missing Polish translation for spell removal notification.

### Technical
- Unified XP refund logic in `_onItemDelete` for skills and spells.
- Added `CONAN.Spells.spellRemoved` localization key in both language files.

### Release
- Bumped system version to 0.0.32 in `system.json`.

# [0.0.31] - 2025-12-05
### Added
- Added "Massive Damage" (Kolosalne Obrażenia) Flex Effect option for all damage rolls.
- Massive Damage adds maximum weapon die value + modifier to damage, or doubles fixed damage.
- Added `defeated` status field to minion template for proper combat tracker synchronization.
- Added dead overlay effect (skull icon) to defeated tokens (minions and antagonists).
- Added red gradient button styling for Massive Damage option in Flex Effect dialog.
- Added `.flex-massive-damage` chat message styling with damage breakdown display.
- Added translations for Massive Damage (PL: "Kolosalne Obrażenia", EN: "Massive Damage").

### Changed
- Enhanced die parsing with regex `/(\d*)d(\d+)/i` to handle all formats: "d6", "1d6", "2d8".
- Updated all damage roll functions (melee, ranged, thrown, sorcery) to pass `rollContext` with weapon die info.
- Changed damage application to use `TokenDocument` instead of actor for proper unlinked token support.
- Combatants now found by `tokenId` instead of `actorId` for correct unlinked token handling.
- Moved `damageDealt` flag setting before `applyNPCDamage` to prevent race conditions.

### Fixed
- Fixed ranged weapon damage using wrong variable names (`weaponDamage`/`weaponMod` → `weaponDice`/`weaponBonus`).
- Fixed die parsing failing for "1d6" format (was using `substring(1)` which gave "d6").
- Fixed multiple dice calculation (2d8 now correctly gives 16, not 8).
- Fixed string concatenation bug causing "961" instead of 16 by adding `parseInt()` conversions.
- Fixed minion defeated status not updating in combat tracker after second wound.
- Fixed unlinked token data not persisting - now updates `actorData.system` for unlinked tokens.
- Fixed `Cannot read properties of null (reading 'querySelector')` error by reordering chat message updates.
- Fixed `targetToken.update is not a function` error by using `targets[0].document` instead of `targets[0]`.
- Fixed defeated tokens not showing dead overlay effect.

### Technical
- `rollContext` structure: `{originalDamage, weaponDie, weaponModifier, isFixedDamage, attackType}`.
- Massive Damage logic: dice weapons get `(dieCount × dieSize) + weaponModifier` bonus, fixed damage doubles.
- Unlinked tokens updated via `targetToken.update({"actorData.system.*": value})`.
- Linked tokens updated via `target.update({"system.*": value})` + separate token overlay update.
- Dead overlay applied via `targetToken.update({"overlayEffect": CONFIG.controlIcons.defeated})`.
- Added type safety with `parseInt()` on `originalDamage` and `weaponModifier`.

### Release
- Bumped system version to 0.0.31 in `system.json`.

# [0.0.30] - 2025-12-05
### Added
- Added Sorcery option to Flex Effect dialog for magic attacks and damage rolls.
- Sorcery option allows recovery of spell costs (Life Points and Stamina) when Flex Effect is triggered.
- Spell costs are temporarily stored in actor flags for potential recovery via Flex Effect.
- Added chat message for sorcery cost recovery with detailed breakdown of restored resources.
- Added purple color-coded button for Sorcery option in Flex Effect dialog.
- Added translations for sorcery option (PL: "Czarnoksięstwo", EN: "Sorcery").
- Created dedicated `flex-dialog.css` file for Flex Effect dialog styling.
- Added color-coded Flex Effect buttons: blue (stamina), green (success), purple (sorcery).
- Added improved header styling with gradient background, decorative elements, and animated icon.

### Changed
- Updated spellcasting system to save spell costs in actor flags for Flex Effect recovery.
- Modified all three sorcery damage functions (rollSorceryFixedDamage, rollSorceryCustomDieDamage, rollSorceryWitsDamage) to pass spell costs to FlexEffectDialog.
- Enhanced Flex Effect dialog header with elegant box design, sword decorations, and better typography.
- Changed magic attack "Roll Damage" button class from `deal-damage-btn` to `sorcery-damage-btn` to avoid handler conflicts.
- Added `white-space: nowrap` to sorcery damage button to prevent text wrapping.
- Improved sorcery recovery chat message styling with purple theme and detailed recovery information.

### Fixed
- Fixed duplicate `applySorceryEffect` method that was preventing sorcery cost recovery from working.
- Fixed Flex Effect dialog CSS not applying due to incorrect selectors (changed from `.flex-effect-dialog` to `.flex-effect`).
- Fixed sorcery recovery chat message header text wrapping and visibility issues.
- Removed unused `isAttackRoll` variable from `_prepareContext` method to eliminate TypeScript warnings.

### Technical
- Added `flags.conan-the-hyborian-age.lastSpellCost` to store lifePointsCost and staminaCost.
- Flex Effect dialog now checks for `attackType === 'sorcery'` and `hasSorceryCost` to show sorcery option.
- `applySorceryEffect` method restores both Life Points (to max) and Stamina (to 100).
- Added `.flex-sorcery-recovery` CSS class with purple gradient theme and detailed styling.
- Sorcery option uses `fa-wand-sparkles` icon with purple gradient background.
- Added `system.json` entry for `styles/flex-dialog.css`.

### Release
- Bumped system version to 0.0.30 in `system.json`.

# [0.0.26-0.0.29] - 2025-11-28 / 2025-12-03

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

# [0.0.22-0.0.25] - 2025-11-21 / 2025-11-25

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

### Technical
- Roll logic fully exported to dedicated modules
- CSS specificity improvements for chat message headers
- Socket-based synchronization for actor/token sheet consistency
- BaseActor pattern for all sheet operations

### Fixed
- Pełna lokalizacja opcji stałych obrażeń magicznych (fixed value) w pl.json i en.json
- Poprawki wyświetlania i przekazywania parametrów dla wszystkich trzech typów obrażeń magicznych

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

# Versions 0.0.11 - 0.0.15 Summary (2025-11-04 to 2025-11-07)

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

# Versions 0.0.5 - 0.0.10 Summary (2025-10-31 to 2025-11-04)

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

# Versions 0.0.1 - 0.0.4 Summary (2025-10-27 to 2025-10-30)

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
