# Release Process Guide

## Przygotowanie do Release v0.0.35

### Co zostało już zrobione

1. ✅ Zaktualizowano wersję w `system.json` na 0.0.35
2. ✅ Dodano wpis do `CHANGELOG.md` dla wersji 0.0.35
3. ✅ Zaktualizowano `README.md` z instrukcjami instalacji
4. ✅ Dodano linki do repozytorium w `system.json`:
   - `url`: Link do repozytorium
   - `manifest`: Link do system.json
   - `download`: Link do pliku ZIP (będzie dostępny po utworzeniu release)
5. ✅ Utworzono plik `.gitignore`
6. ✅ Utworzono pakiet ZIP: `conan-the-hyborian-age-v0.0.35.zip`

### Kroki do wykonania

#### 1. Commit i Push do GitHuba

```powershell
# Sprawdź status
git status

# Dodaj wszystkie zmiany
git add .

# Commit
git commit -m "Release v0.0.35 - French translation and CHANGELOG cleanup"

# Push do main branch
git push origin main
```

#### 2. Utwórz Tag

```powershell
# Utwórz tag
git tag -a v0.0.35 -m "Release v0.0.35"

# Push tag do GitHuba
git push origin v0.0.35
```

#### 3. Utwórz Release na GitHubie

1. Przejdź do: <https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/new>

2. Wypełnij formularz:
   - **Tag**: Wybierz `v0.0.35` z listy (lub wpisz jeśli nie ma)
   - **Release title**: `v0.0.35 - French Translation & CHANGELOG Cleanup`
   - **Description**: Skopiuj zawartość z pliku `RELEASE-NOTES.md`

3. **Upload pliku ZIP**:
   - Kliknij w obszar "Attach binaries"
   - Wybierz plik: `conan-the-hyborian-age-v0.0.35.zip`
   - Poczekaj na upload

4. **Publikacja**:
   - Upewnij się, że checkbox "Set as the latest release" jest zaznaczony
   - Kliknij **Publish release**

#### 4. Weryfikacja

Po opublikowaniu release:

1. Sprawdź czy plik ZIP jest dostępny pod linkiem:

   ```text
   https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/download/v0.0.35/conan-the-hyborian-age-v0.0.35.zip
   ```

2. Sprawdź czy manifest jest dostępny:

   ```text
   https://raw.githubusercontent.com/ZuraffPL/conan-the-hyborian-age-unofficial/main/system.json
   ```

3. **Test instalacji w Foundry**:
   - Otwórz Foundry VTT
   - Przejdź do Game Systems → Install System
   - Wklej URL manifestu
   - Kliknij Install
   - Sprawdź czy system instaluje się poprawnie

#### 5. Aktualizacja README.md na GitHubie (opcjonalne)

Jeśli chcesz, możesz zaktualizować główny README.md repozytorium, dodając:

- Badge z wersją
- Bezpośredni link do najnowszego release
- Screenshot systemu

### Checklist przed publikacją

- [ ] Wszystkie zmiany są zacommitowane
- [ ] Tag v0.0.35 został utworzony i wysłany na GitHub
- [ ] Release został utworzony na GitHubie
- [ ] Plik ZIP został załączony do release
- [ ] Link do ZIP w system.json jest poprawny
- [ ] System można zainstalować z manifestu w Foundry
- [ ] Testowo utworzony world z systemem działa poprawnie

### W razie problemów

Jeśli link do ZIP nie działa:

1. Sprawdź nazwę pliku ZIP w release (musi być dokładnie: `conan-the-hyborian-age-v0.0.35.zip`)
2. Sprawdź czy release jest opublikowany (nie draft)
3. Odczekaj kilka minut (GitHub czasem potrzebuje chwili na propagację)

### Po sukcesie

- Możesz ogłosić release na Discord/forach Foundry
- System będzie dostępny dla wszystkich użytkowników Foundry VTT
- Użytkownicy z już zainstalowanym systemem zobaczą powiadomienie o aktualizacji

---

## Przyszłe Release

Przy kolejnych wersjach:

1. Zaktualizuj wersję w `system.json`
2. Dodaj wpis do `CHANGELOG.md`
3. Uruchom: `.\create-release.ps1`
4. Wykonaj kroki 1-4 z tej instrukcji (z nowym numerem wersji)
