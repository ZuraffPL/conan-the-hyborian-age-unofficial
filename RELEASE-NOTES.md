# Release v0.0.35 - CHANGELOG Cleanup & French Translation

## 🎉 What's New

### Added
- **Complete French Translation** (lang/fr.json) with 611 lines covering all system features
- System now supports **3 languages**: English, Polish, and French
- French language registration in system.json

### Changed
- **CHANGELOG Cleanup**: Condensed multiple version entries for better readability:
  - Versions 0.0.16-0.0.21 combined (Magic Damage System, Defence/Immobilized toggles, Poisoned status, Damage Roll System)
  - Versions 0.0.22-0.0.25 combined (Modularized Sorcery Damage, "Deal Damage" button, visual improvements, sheet synchronization)
  - Versions 0.0.26-0.0.29 combined (Complete damage application system for PC/NPC, token configuration, HP indicator)
- Improved CHANGELOG structure for easier navigation

### French Translations
- **Attributes**: Force (Might), Agilité (Edge), Résistance (Grit), Astuce (Wits)
- **Resources**: Endurance (Stamina), Points de Vie (Life Points)
- **Features**: Effet de Souplesse (Flex Effect), Dégâts Massifs (Massive Damage)
- All UI elements, dialogs, chat messages, and system features fully localized

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

None at this time. Please report issues on the [GitHub Issues](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/issues) page.

## 🙏 Credits

- **System Development**: Zuraff
- **Based on**: Conan: The Hyborian Age RPG by Monolith Boardgames
- **Setting**: Conan the Barbarian by Robert E. Howard

---

**Note**: This is an unofficial, fan-made system. Not affiliated with or endorsed by Monolith Boardgames.
