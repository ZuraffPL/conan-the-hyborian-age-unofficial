# Release Notes - Conan: The Hyborian Age System

## Current Version: v0.0.53 - Stackable Poison System & Combat Enhancements

### Overview

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
- Wiadomości w czacie o utracie życia z ikoną czaszki

**Status Pokonany**:
- Antagoniści osiągający 0 LP otrzymują status "Defeated"
- Automatyczne oznaczenie tokenu ikoną czaszki
- Wykluczenie z dalszej walki

**Walka o Życie dla Graczy**:
- Postaci graczy osiągające 0 LP wykonują test Hartu (Grit)
- Trudność: 8
- Sukces: postać pozostaje przy życiu
- Porażka: postać ginie
- Animowana wiadomość w czacie z wynikiem testu

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
- Wynik w czacie zawiera kalkulację z widoczną karą
- Ikona czaszki w nagłówku przy aktywnej trucizny

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

1. **Efekt #1: Opcjonalne Obrażenia**
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
