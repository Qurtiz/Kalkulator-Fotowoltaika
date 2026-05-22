# Kalkulator opłacalności fotowoltaiki (net-billing 2026)

Interaktywny kalkulator szacujący opłacalność instalacji fotowoltaicznej i magazynu energii w polskim systemie **net-billing**. Działa w całości w przeglądarce — bez backendu, bez bazy danych.

## Funkcje

- **Taryfy i cennik** — G11/G12/G12W, RCEm z ekwiwalentem VAT, opłaty stałe
- **Odbiorniki energii** — komponowanie profilu zużycia z odbiorników (pompa ciepła, EV, klimatyzacja, basen itd.)
- **Profil sezonowy** — automatyczny, z możliwością ręcznej edycji miesiąc po miesiącu
- **Typy paneli** — 5 technologii (Poly, Mono PERC, TOPCon, HJT, cienkowarstwowe) z realnym modelem sprawności, światła rozproszonego, strat temperaturowych i degradacji
- **Województwa** — uzysk bazowy zależny od regionu (16 województw)
- **Magazyn energii** — model dobowy autokonsumpcji z uwzględnieniem sezonowości
- **Porównanie scenariuszy** — bez PV / PV / PV + magazyn
- **Kredyt** — symulacja rat (RRSO, okres, udział kredytu)
- **Horyzont inwestycji** — wzrost cen prądu, degradacja, czas zwrotu, zysk netto

## Pliki

| Plik | Zawartość |
|------|-----------|
| `index.html` | struktura strony |
| `style.css`  | wygląd |
| `script.js`  | cała logika obliczeń |

## Jak uruchomić lokalnie

Wystarczy otworzyć `index.html` w przeglądarce — dwuklik na pliku. Nie wymaga serwera ani instalacji.

## Hosting na GitHub Pages

1. Załóż konto na [github.com](https://github.com) (jeśli nie masz).
2. Utwórz nowe repozytorium, np. `kalkulator-pv` (może być publiczne).
3. Wgraj do niego pliki `index.html`, `style.css`, `script.js` (oraz `.nojekyll` i ten `README.md`).
   - Najprościej: na stronie repo kliknij **Add file → Upload files**, przeciągnij wszystkie pliki, zatwierdź (**Commit changes**).
4. Wejdź w **Settings → Pages** (menu po lewej).
5. W sekcji **Build and deployment**, pod **Source**, wybierz **Deploy from a branch**.
6. W **Branch** wybierz `main` (lub `master`), folder `/ (root)`, kliknij **Save**.
7. Odczekaj ~1 minutę. Strona pojawi się pod adresem:
   ```
   https://TWOJA-NAZWA.github.io/kalkulator-pv/
   ```

Każdy kolejny commit na gałąź automatycznie odświeży stronę.

## Uwaga merytoryczna

Kalkulator służy do orientacyjnej oceny opłacalności. Finalna decyzja powinna uwzględniać indywidualny profil godzinowy zużycia oraz konkretną ofertę sprzedawcy energii. Wartości domyślne odzwierciedlają realia rynkowe z 2026 r. (ceny instalacji, RCEm, uzyski regionalne wg map nasłonecznienia SolarGIS/PTPV).
