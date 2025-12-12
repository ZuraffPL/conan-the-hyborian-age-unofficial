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
