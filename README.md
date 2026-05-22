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

## Uwaga merytoryczna

Kalkulator służy do orientacyjnej oceny opłacalności. Finalna decyzja powinna uwzględniać indywidualny profil godzinowy zużycia oraz konkretną ofertę sprzedawcy energii. Wartości domyślne odzwierciedlają realia rynkowe z 2026 r. (ceny instalacji, RCEm, uzyski regionalne wg map nasłonecznienia SolarGIS/PTPV).
