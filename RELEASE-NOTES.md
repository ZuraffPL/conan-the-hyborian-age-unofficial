# Release Notes - Conan: The Hyborian Age System

## Current Version: v0.0.60 - Tale Timer & Recovery System

### Overview

System Conan: The Hyborian Age to nieoficjalna implementacja gry fabularnej **Conan** firmy Monolith dla Foundry VTT v13+. Wersja 0.0.60 wprowadza kompletny system Opowieści z timerem sesji oraz sekcją Odpoczynek dla postaci graczy.

### What's New in v0.0.60

#### Tale Timer — Session Timer for GM

- New **Tale dialog** accessible from the toolbar (scroll icon) — GM only
- HH:MM:SS countdown timer with **Start / Pause / End Tale** controls
- Timer state is **persistent across reloads** (stored in `game.settings`, world scope)
- Auto-restores on F5: GM dialog reopens automatically if a tale was active; player view opens frozen and waits for GM's Start signal
- Default dialog position: left sidebar, below the toolbar

#### Recovery Section

- Appears inside the Tale dialog for both GM and players
- **GM** sees all currently connected players with their characters
- **Player** sees only their own character
- Live HP display (`actual / max`) with **animated gradient health bar** — green shrinks first as HP drops, revealing red
- Bed icon button (🛏) with tooltip — **2 uses per tale**, resets on Tale End

#### Recovery Mechanics

| Condition | Effect |
|-----------|--------|
| HP < max  | Restore `ceil(max / 2)` Life Points (capped at max) + 1 Stamina |
| HP = max  | +1 Stamina only, no healing |

- Styled **chat message** on use: character name header, recovered LP row, +1 Stamina row
- Fully localized in **PL / EN / FR**

#### Multiplayer Reliability Fixes

- `userConnected` hook triggers `render({ force: true })` on GM dialog when a player joins or leaves
- `setTimeout(..., 0)` defers auto-render after `ready` to fix `Cannot read properties of null (reading 'offsetWidth')` error
- Player dialog widened to 400px — character name always fully visible

#### Dead Code Removed

- `health` and `power` fields removed from `template.json` base template (never used)
- `templates/actor/parts/actor-header.hbs` deleted (only file referencing removed fields)

### Previous Version (v0.0.59) — Tale Timer Initial Release

- Tale Timer core: GM dialog, player read-only view, persistent state, socket events (`taleStart`, `talePause`, `taleStop`, `taleSync`, `taleNameUpdate`)

### Previous Version (v0.0.58) — NPC Name Validation Fix

#### NPC Name Validation

**Mechanika**:
- Dodano pole `lifePoints.adjustment` do śledzenia ręcznych modyfikacji
- Formuła: **max = baza_pochodzenia + (2 × Hart_efektywny) + adjustment**
- Umożliwia ręczną edycję max LP z zachowaniem efektów trucizny
- Automatyczna migracja dla istniejących postaci

**Przykład działania**:
```
1. Postać stworzona:
   - Pochodzenie Hills (baza 32) + Hart 5 = 42 LP max
   
2. Wykup umiejętności (+3 LP):
   - Ręczna zmiana: 42 → 45
   - System zapisuje: adjustment = +3
   
3. Aktywacja trucizny (efekt #1):
   - Hart efektywny: 4 (5-1)
   - Auto-przeliczenie: 32 + 8 + 3 = 43 LP max ✅
   
4. Wyłączenie trucizny:
   - Hart efektywny: 5
   - Auto-przeliczenie: 32 + 10 + 3 = 45 LP max ✅
   - Bonus +3 zachowany!
```

**Korzyści**:
- ✅ Ręczna edycja max LP możliwa w każdej chwili
- ✅ Trucizna automatycznie obniża max LP (efekt #1 → Hart -1 → LP -2)
- ✅ Modyfikacje z umiejętności/przedmiotów są zachowane
- ✅ Po wyłączeniu trucizny wszystko wraca do normy

#### Refaktoryzacja UI

**Przeniesienie logiki z Handlebars do JavaScript**:
- Warunek `life-injured` (czerwone tło gdy actual < max) teraz w `valueChanges`
- Template czystszy: `class="life-actual {{valueChanges.lifePointsActual}}"`
- Cała wizualizacja zdefiniowana w CSS, logika w JavaScript
- Lepsza organizacja kodu i łatwiejsza konserwacja

### Poprzednia Wersja (v0.0.55)

#### Efekt Zatrucia #1 - Kara do Atrybutów

**Mechanika**:
- Aktywacja efektu #1 nakłada **karę -1 do wszystkich czterech atrybutów** (Krzepa, Zręczność, Hart, Spryt)
- Wszystkie rzuty i kalkulacje używają `effectiveValue` (wartość bazowa minus kara z trucizny)
- Kara wpływa na wszystkie testy atrybutów, ataki, obrażenia i statystyki pochodne

**Wizualizacja**:
- 💀 **Pulsująca zielona czaszka** obok zatruconych atrybutów na karcie postaci
- 🟢 **Zielone podświetlenie** pól atrybutów objętych karą
- ⬇️ **Zielona strzałka w dół (↓)** wewnątrz kółka atrybutu przy aktywnej karze
- 📊 **Zielone wartości w kalkulacjach** w wiadomościach czatu
- ⚠️ **Ostrzeżenia w dialogach** rzutów informujące o aktywnej karze
- 🎨 Animacje CSS z tematycznym kolorem trucizny (#15a20e - zielony)

**Przykład działania**:
```
Krzepa bazowa: 5
Krzepa efektywna (z zatruciem #1): 4
Test Krzepy: 1d6 + 4 (zamiast + 5)
Obrażenia wręcz: +4 bonusu (zamiast +5)
```

#### Automatyczne Przeliczanie Statystyk Pochodnych

**Maksymalne Punkty Życia (Life Points Max)**:
- Formuła: `baza_z_pochodzenia + (2 × Hart_efektywny)`
- Przykład:
  * Pochodzenie Hills (baza 30) + Hart 5 = 40 LP max
  * Z zatruciem #1: Hart efektywny 4 = 38 LP max (-2)
  * Po rozwoju do Hart 6: 42 LP max (bez trucizny) lub 40 LP max (z trucizną)

**Obrona Fizyczna (Physical Defense)**:
- Formuła: `max(Zręczność_efektywna + 2, 5)`
- Współpracuje z modyfikatorem Defence (+2) i Unieruchomieniem (0)
- Przykład:
  * Zręczność 5 = OF 7
  * Z zatruciem #1: Zręczność efektywna 4 = OF 6
  * Z Defence aktywną: OF 8 (bez trucizny) lub OF 7 (z trucizną)
  * Unieruchomienie: OF 0 (nadpisuje wszystko)

**Obrona przed Magią (Sorcery Defense)**:
- Formuła: `max(Spryt_efektywny + 2, 5)`
- Przeliczanie analogiczne do obrony fizycznej

**Automatyczne aktualizacje**:
- ✅ Zmiana atrybutu (rozwój postaci, przyrost z XP)
- ✅ Aktywacja/deaktywacja zatrucia #1
- ✅ Włączenie/wyłączenie Defence
- ✅ Włączenie/wyłączenie Unieruchomienia

#### Poprawki dla NPC (Miniony i Antagoniści)

**Naprawiono krytyczny błąd**:
- Funkcja `_prepareNpcData()` sprawdzała nieistniejący typ "npc" zamiast "minion" i "antagonist"
- NPC nigdy nie otrzymywały obliczenia `effectiveValue` - trucizna nie działała
- Efekt: kara do atrybutów z zatrucia #1 nie była stosowana dla NPC

**Po naprawie**:
- ✅ NPC (miniony i antagoniści) prawidłowo obliczają `effectiveValue`
- ✅ Testy atrybutów NPC uwzględniają karę z trucizny
- ✅ Ataki NPC używają obniżonych wartości atrybutów
- ✅ Wiadomości czatu pokazują wizualne wskaźniki zatrucia
- ✅ Dialogi ostrzegają o aktywnej karze do atrybutów

#### Integracja z Efektami Walki

**Defence (Obrona)**:
- Przycisk przełącza **flagę** `defenceActive`
- System automatycznie dodaje +2 do obrony fizycznej
- Współpracuje z przeliczaniem na podstawie atrybutów
- Wyłącza się automatycznie przy Unieruchomieniu

**Immobilized (Unieruchomienie)**:
- Przycisk przełącza **flagę** `immobilized`
- System automatycznie ustawia obronę fizyczną na 0
- Nadpisuje wszystkie inne modyfikatory (Defence, trucizna, atrybuty)
- Wyłącza Defence automatycznie

**Przykład Integracji**:
```
Zręczność 5, OF bazowa: 7
+ Defence: OF 9
+ Zatrucie #1: Zręczność efektywna 4, OF 6, + Defence = OF 8
+ Unieruchomienie: OF 0 (ignoruje wszystko inne)
```

#### Szczegóły Techniczne

**Architektura**:
- Centralizacja obliczeń w `prepareDerivedData()` (lifecycle Foundry)
- Rozdzielenie odpowiedzialności: handlery zarządzają flagami, prepareDerivedData oblicza wartości
- Spójne użycie `effectiveValue` w całym kodzie
- Zapobieganie konfliktom między różnymi systemami (trucizna, Defence, Immobilized, rozwój)

**Zmienione moduły**:
- `actor.mjs`: dodano obliczenia effectiveValue, automatyczne przeliczanie statystyk pochodnych
- `roll-mechanics.mjs`: aktualizacja wszystkich funkcji rzutów do użycia effectiveValue
- `attack-dialog.mjs`, `difficulty-dialog.mjs`: dodano context isPoisonedAttributes
- `npc-attack-dialog.mjs`, `npc-damage-dialog.mjs`: wsparcie dla effectiveValue
- `npc-sheet.mjs`: funkcja `rollNPCAttribute` z pełnym wsparciem trucizny
- `actor-sheet.mjs`: uproszczone handlery Defence/Immobilized (tylko flagi)
- Wszystkie szablony Handlebars: wizualne wskaźniki trucizny
  * `actor-character-sheet.hbs`, `actor-minion-sheet.hbs`, `actor-antagonist-sheet.hbs`: dodano `<span class="poison-arrow-indicator">` z wrapperem dla strzałki

**CSS**:
- Wszystkie style efektów trucizny scentralizowane w `styles/partials/poisoned-effects.css`
- `.poisoned-attribute`: zielone tło pól atrybutów
- `.poison-arrow-indicator`: strzałka w dół (↓) wewnątrz kółka atrybutu
- `.attribute-circle-wrapper`: wrapper dla prawidłowego pozycjonowania strzałki
- `.poison-skull-pulse`: pulsująca animacja czaszek (2s cykl)
- `.poisoned-value`: zielone podświetlenie wartości w kalkulacjach (efekt #1)
- `.dice-roll.poisoned-attribute`: zielony box kości (efekt #2)
- `@keyframes poison-pulse-die`: animacja pulsowania kości
- `@keyframes poison-arrow-pulse`: animacja strzałki kary (opacity + ruch w dół)
- Refactoring: usunięto duplikaty kodu z `conan.css` i `actor-npc.css`

**Lokalizacja**:
- Polski: "Kara do atrybutów przez truciznę", "do wszystkich atrybutów"
- Angielski: "Attribute penalty from poison", "to all attributes"
- Francuski: "Pénalité d'attribut du poison", "à tous les attributs"

---

## Previous Version: v0.0.54 - Stamina Attack Fixes

### Overview

System Conan: The Hyborian Age to nieoficjalna implementacja gry fabularnej **Conan** firmy Monolith dla Foundry VTT v13+. Wersja 0.0.54 naprawia krytyczny błąd związany z zadawaniem obrażeń po użyciu staminy do poprawienia nieudanego ataku.

### Najnowsze Zmiany (v0.0.54)

#### Poprawki Obrażeń po Użyciu Staminy

**Problem**:
- Gdy postać wydała punkt staminy, aby zamienić nieudany atak w sukces (np. 6→7 z +1), kliknięcie przycisku "Rzuć na Obrażenia" powodowało błąd: `Cannot read properties of undefined (reading 'damage')`
- Wiadomości czatu z obrażeniami po użyciu staminy nie miały stylów CSS

**Rozwiązanie**:
- Naprawiono przekazywanie parametrów do funkcji `rollWeaponDamage` (obiekt weapon zamiast weaponId)
- Dodano obsługę modyfikatora obrażeń w funkcji `rollWeaponDamage`
- Wiadomości o obrażeniach wyświetlają się teraz w spójnym formacie z resztą systemu:
  * Nagłówek z nazwą broni
  * Szczegółowy breakdown (kostka obrażeń, bonus z broni, modyfikator)
  * Wynik końcowy w wyróżnionym polu
  * Przycisk "Zadaj Obrażenia" do aplikacji damage na cele
  * Pełne wsparcie dla efektów trucizny (ikona czaszki)

---

## Previous Version: v0.0.53 - Stackable Poison System & Combat Enhancements

System Conan: The Hyborian Age to nieoficjalna implementacja gry fabularnej **Conan** firmy Monolith dla Foundry VTT v13+. Wersja 0.0.53 wprowadza wielokrotne stackowalne efekty trucizny, ulepszenia systemu walki oraz poprawki w wyświetlaniu inicjatywy i obrażeń.

### Najnowsze Zmiany (v0.0.53)

#### System Stackowalnych Mnożników Trucizny

Efekty trucizny #2 (Kara do Rzutów) i #3 (Utrata Życia) mogą teraz być wielokrotnie stosowane:

**Mnożniki Efektów**:
- Kontrolki +/- bezpośrednio przy nazwach efektów w dialogu trucizny
- Wartości mnożników: x1, x2, x3 i więcej
- Znaczniki mnożników (x2, x3) na kartach postaci z pulsującą animacją
- Automatyczne zastosowanie mnożników we wszystkich typach rzutów

**Efekt #2 - Kara do Rzutów (Mnożona)**:
- x1 = -1 do wszystkich rzutów
- x2 = -2 do wszystkich rzutów
- x3 = -3 do wszystkich rzutów
- Kara wyświetlana poprawnie w dialogach i wynikach czatu
- Dotyczy: testów atrybutów, inicjatywy, ataków, obrażeń, czarowania

**Efekt #3 - Utrata Życia (Mnożona)**:
- x1 = -1 LP na początku tury
- x2 = -2 LP na początku tury  
- x3 = -3 LP na początku tury
- Automatyczna utrata życia w każdej rundzie walki
- Ikona czaszki z efektem świetlnym przy aktywnym efekcie

#### Ulepszenia Systemu Walki

**Automatyczne Efekty Trucizny w Walce**:
- Utrata życia od trucizny (#3) automatycznie stosowana na początku rundy
- Wartość utraty mnoży się przez mnożnik efektu
- Wiadomości na czacie o utracie życia z ikoną czaszki

**Status Pokonany**:
- Antagoniści osiągający 0 LP otrzymują status "Defeated"
- Automatyczne oznaczenie tokena ikoną czaszki
- Wykluczenie z dalszej walki

**Walka o Życie dla Graczy**:
- Postaci graczy osiągające 0 LP wykonują test Hartu (Grit)
- Trudność: 8
- Sukces: postać pozostaje przy życiu
- Porażka: postać ginie
- Animowana wiadomość na czacie z wynikiem testu

#### Ulepszenia Inicjatywy

**Inicjatywa z Combat Trackera**:
- Poprawnie używa bazowego aktora dla obliczeń trucizny
- Działa zarówno dla tokenów połączonych jak i niepołączonych
- Dialog inicjatywy pokazuje ostrzeżenie z aktualnym mnożnikiem kary

**Nowy Układ Wiadomości Inicjatywy**:
- **Linia 1**: Kości w boxach obok siebie
  * Gracze: Kość Edge + Kość Brawury (Flex Die)
  * NPC: Kość Edge + Wartość Edge
- **Linia 2**: Kalkulacja z wszystkimi składowymi
  * Wynik kości + wartość atrybutu + modyfikatory - kara za truciznę
- **Linia 3**: Końcowy wynik inicjatywy (duża, wyeksponowana wartość)
- Elastyczny układ z zawijaniem długich kalkulacji

#### Poprawki Obrażeń NPC

**Obrażenia od NPC**:
- Kara za truciznę poprawnie stosowana do rzutów obrażeń
- Dialog obrażeń pokazuje ostrzeżenie z mnożnikiem kary (-3, -2, -1)
- Wynik na czacie zawiera kalkulację z widoczną karą
- Ikona czaszki w nagłówku przy aktywnej truciznie

#### Ulepszenia UI/UX

**Responsywne Kalkulacje**:
- Składowe ataków i rzutów zawijają się przy długich wartościach
- Focused Attack + Kara za Truciznę mieszczą się w oknie czatu
- Wszystkie elementy kalkulacji w boxach z flex-wrap

**Wizualne Wskaźniki**:
- Znaczniki mnożników na kartach postaci
- Pulsujące animacje przy aktywnych efektach
- Spójne ikony czaszek we wszystkich kontekstach
- Kolory: zielony dla trucizny, czerwony dla kary

### System Zatrucia - Wszystkie 5 Efektów

System wprowadzony w v0.0.49-0.0.51 i rozszerzony w v0.0.53:

1. **Efekt #1: Kara do atrybutów**
   - Oznaczenie jako "optional" (niebieska ramka przerywana)
   - Nie stackuje się
   - GM decyduje o zastosowaniu

2. **Efekt #2: Kara do Rzutów** ✨ STACKOWALNY (v0.0.53)
   - Mnożnik: x1, x2, x3...
   - Kara -1/-2/-3... do wszystkich rzutów
   - Ataki fizyczne, dystansowe, magiczne
   - Wszystkie typy obrażeń
   - Testy atrybutów i inicjatywa

3. **Efekt #3: Utrata Życia** ✨ STACKOWALNY (v0.0.53)
   - Mnożnik: x1, x2, x3...
   - Automatyczna utrata -1/-2/-3... LP na początku rundy
   - Ikona czaszki z pulsującą animacją
   - Wiadomości w czacie

4. **Efekt #4: Blokada Staminy dla Walki** ✅ v0.0.50
   - Opcje wydawania Staminy zablokowane w ataku i obrażeniach
   - Całkowite wyłączenie przycisków z wizualnym wskaźnikiem
   - Nie stackuje się

5. **Efekt #5: Blokada Flex Die** ✅ v0.0.50
   - Flex Die automatycznie zablokowana w dialogach
   - Nie można wydać ostatniego punktu Staminy na "Massive Damage"
   - Dotyczy zarówno ataków fizycznych jak i magicznych
   - Nie stackuje się

### Historia Wersji - Podsumowanie

#### v0.0.53 (Current)
- System stackowalnych mnożników dla efektów trucizny #2 i #3
- Automatyczna utrata życia w rundach walki
- Status "Defeated" dla antagonistów i "Fight for Life" dla graczy
- Poprawiona inicjatywa z combat trackera
- Nowy układ wiadomości inicjatywy (3 linie)
- Poprawki obrażeń NPC z karą za truciznę
- Responsywne kalkulacje w UI

#### v0.0.52
- Pełna integracja kar za zatrucie z magią
- Rozszerzenie efektu #2 na ataki magiczne i obrażenia od czarów
- Spójne wizualne wskaźniki we wszystkich UI

#### v0.0.51
- Implementacja efektu zatrucia #2 dla ataków fizycznych i dystansowych
- Poprawki uprawnień NPC dla graczy z minionami
- System socket dla aktualizacji aktorów

#### v0.0.50
- Implementacja efektu zatrucia #5 (blokada Flex Die)
- Udoskonalenie mechaniki blokowania Staminy (efekt #4)
- Wizualne wskaźniki dla zablokowanych opcji

#### v0.0.49
- Fundament systemu zatrucia (5 efektów)
- Dialog wyboru efektów zatrucia
- Integracja z kartami postaci i tokenami

#### v0.0.48
- Poprawki uprawnień dla graczy w trybie multiplayer
- System socket dla aktualizacji tokenów i combatantów
- Obsługa minionów przez graczy

#### v0.0.46-0.0.47
- Poprawki statusu ekwipunku (per-actor)
- Niezależne kopie przedmiotów dla każdej postaci
- Ulepszone zarządzanie przedmiotami

#### v0.0.45
- Status "Wounded" dla minionów
- Opcja "Activate Origin Ability" w dialogu Staminy
- Poprawki kolorów ikon statusów

#### v0.0.44
- Poprawki responsywności arkuszy NPC
- Zwiększone rozmiary czcionek dla lepszej czytelności
- Automatyczne rozszerzanie pól tekstowych

#### v0.0.42-0.0.43
- System delegacji socket dla uprawnień
- Poprawki błędów 404 dla brakujących obrazów
- Ulepszona kompatybilność multiplayer

#### v0.0.34-0.0.41
- System wydawania Staminy
- Poprawki delta dla Foundry VTT v13
- Podstawowe mechaniki systemu i obrażeń

### Wymagania Systemowe

- **Foundry VTT**: Wersja 13+ (testowane na v13.350)
- **Architektura**: ApplicationV2 z HandlebarsApplicationMixin
- **Multiplayer**: Wymaga przynajmniej jednego GM online dla systemu socket
- **Zalecany Moduł**: Dice So Nice (animacje rzutów 3D)

### Instalacja

#### Przez Foundry VTT (Zalecane)

1. Otwórz Foundry VTT → zakładka **Game Systems**
2. Kliknij **Install System**
3. Wklej URL manifestu:

   ```text
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/latest/download/system.json
   ```

4. Kliknij **Install**

#### Instalacja Manualna

1. Pobierz `conan-the-hyborian-age-v0.0.52.zip` z [Releases](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases)
2. Rozpakuj do `FoundryVTT/Data/systems/`
3. Zrestartuj Foundry VTT

### Dla Mistrzów Gry

#### System Zatrucia

Zatruty aktor może doświadczyć jednego lub więcej z 5 efektów:

1. **Obrażenia**: 1 LP na początku tury (wymaga ręcznej aplikacji)
2. **Kary**: -1 do wszystkich ataków i obrażeń (automatyczne)
3. **Stamina**: Zmniejszona maksymalna wartość o 1 (wymaga ręcznej modyfikacji)
4. **Blokada Staminy**: Nie można wydawać na walkę/obrażenia (automatyczne)
5. **Blokada Flex**: Zablokowana Flex Die i Massive Damage (automatyczne)

#### Multiplayer

- Gracze mogą używać swoich minionów do atakowania antagonistów
- Wszystkie uprzywilejowane operacje automatycznie delegowane do GM
- System socket zapewnia płynne doświadczenie bez błędów uprawnień
- Wymaga obecności przynajmniej jednego GM online

### Znane Problemy

Brak zgłoszonych problemów dla wersji 0.0.52.

Zgłaszaj błędy na [GitHub Issues](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/issues).

### Pełny Changelog

Zobacz [CHANGELOG.md](CHANGELOG.md) dla szczegółowej historii zmian technicznych.

### Wsparcie i Zgłoszenia

- **GitHub Repository**: [conan-the-hyborian-age-unofficial](https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial)
- **Issues**: Zgłaszaj błędy i propozycje na GitHub Issues
- **Discussions**: Dyskusje i pytania w sekcji GitHub Discussions

### Autorzy i Licencja

- **System Development**: Zuraff
- **Oparte na**: Conan: The Hyborian Age RPG autorstwa Monolith Boardgames
- **Setting**: Conan Barbarzyńca autorstwa Roberta E. Howarda
- **Licencja**: Zobacz [LICENSE.txt](LICENSE.txt)

---

**Uwaga**: To nieoficjalny system społecznościowy, niezwiązany z Monolith Boardgames ani Conan Properties International LLC.
