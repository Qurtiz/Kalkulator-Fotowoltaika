// ============== DANE BAZOWE ==============

// Profil produkcji PV w Polsce — udział procentowy każdego miesiąca w produkcji rocznej (suma 100%).
const PV_PROFILE = [3.0, 4.5, 8.0, 11.0, 13.5, 13.5, 13.0, 12.0, 9.5, 6.5, 3.5, 2.0];

// Profile zużycia per odbiornik — udział procentowy każdego miesiąca w zużyciu rocznym tego odbiornika (suma 100%).
// Każdy odbiornik ma własną krzywą; profil całkowity to ważona suma.
const APPLIANCE_PROFILES = {
  // Bazowe — w miarę płaski, lekki szczyt zimą (więcej oświetlenia, krótsze dni)
  base:     [9.3, 8.6, 8.5, 7.9, 7.7, 7.5, 7.5, 7.7, 8.0, 8.6, 9.3, 9.4],
  // Ogrzewanie elektryczne — silne szczyty zimowe, prawie zero w lecie
  heating:  [18, 16, 12, 6, 2, 0.5, 0.5, 0.5, 2, 8, 15, 19.5],
  // Pompa ciepła — szczyty zimowe ale złagodzone (COP wyższy w łagodne dni)
  hp:       [16, 14, 11, 7, 4, 2, 2, 2, 4, 8, 13, 17],
  // Klimatyzacja — szczyty letnie, czerwiec-sierpień
  ac:       [0, 0, 0, 2, 8, 22, 30, 25, 10, 3, 0, 0],
  // EV — w miarę równo, lekko więcej zimą (mniejszy zasięg + ogrzewanie kabiny)
  ev:       [10.5, 10, 9, 8, 7, 7, 7, 7, 7.5, 8.5, 9.5, 9],
  // Basen/jacuzzi — sezon letni
  pool:     [1, 1, 2, 5, 12, 18, 22, 20, 13, 4, 1, 1],
  // Warsztat — w miarę równo, lekka przewaga jesień-zima (więcej czasu w domu)
  workshop: [10, 9, 9, 8, 7.5, 7, 6.5, 7, 8, 9, 9.5, 9.5]
};

const MONTHS = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

// ====== WOJEWÓDZTWA — średni roczny uzysk PV [kWh/kWp] ======
// Wartości uśrednione dla instalacji południowej, oparte na mapach nasłonecznienia (SolarGIS/PTPV).
// Gradient: południowy wschód (~1080) -> północny zachód/pomorze (~970).
const VOIVODESHIPS = {
  dolnoslaskie:        { name: 'Dolnośląskie',         yield: 1020 },
  kujawskoPomorskie:   { name: 'Kujawsko-pomorskie',   yield: 995  },
  lubelskie:           { name: 'Lubelskie',            yield: 1075 },
  lubuskie:            { name: 'Lubuskie',             yield: 1005 },
  lodzkie:             { name: 'Łódzkie',              yield: 1030 },
  malopolskie:         { name: 'Małopolskie',          yield: 1060 },
  mazowieckie:         { name: 'Mazowieckie',          yield: 1040 },
  opolskie:            { name: 'Opolskie',             yield: 1045 },
  podkarpackie:        { name: 'Podkarpackie',         yield: 1080 },
  podlaskie:           { name: 'Podlaskie',            yield: 1015 },
  pomorskie:           { name: 'Pomorskie',            yield: 985  },
  slaskie:             { name: 'Śląskie',              yield: 1025 },
  swietokrzyskie:      { name: 'Świętokrzyskie',       yield: 1050 },
  warminskoMazurskie:  { name: 'Warmińsko-mazurskie',  yield: 980  },
  wielkopolskie:       { name: 'Wielkopolskie',        yield: 1010 },
  zachodniopomorskie:  { name: 'Zachodniopomorskie',   yield: 975  }
};

// ====== TYPY PANELI FOTOWOLTAICZNYCH ======
// Parametry oparte na danych rynkowych 2025/2026.
// Realny uzysk liczony jest z DWÓCH rozdzielnych czynników:
//   1. lightFactor — zachowanie przy świetle rozproszonym/zachmurzeniu (mnożnik, 1.00 = referencja Mono PERC)
//   2. tempCoef — współczynnik temperaturowy mocy γP [%/°C]; straty liczone miesiąc po miesiącu
//      względem temperatury ogniwa (= temp. powietrza + przyrost od nasłonecznienia)
// efficiency: sprawność modułu [%] -> przekłada się na powierzchnię (W/m²).
// degradation: roczny spadek mocy [%/rok].
// costFactor: względny mnożnik ceny za kWp (1.00 = Mono PERC bazowy).
const PANEL_TYPES = {
  poly: {
    name: 'Polikrystaliczny',
    short: 'Poly-Si',
    efficiency: 16,
    lightFactor: 0.97,   // słabsze zbieranie światła rozproszonego
    tempCoef: -0.40,     // najgorszy w upale
    degradation: 0.8,
    costFactor: 0.90,
    desc: 'Najtańszy, schodzący z rynku. Niska sprawność = więcej m² na tę samą moc.'
  },
  perc: {
    name: 'Mono PERC (half-cut)',
    short: 'Mono PERC',
    efficiency: 20,
    lightFactor: 1.00,   // referencja
    tempCoef: -0.35,
    degradation: 0.55,
    costFactor: 1.00,
    desc: 'Standard rynkowy 2026. Najlepszy stosunek ceny do uzysku.'
  },
  topcon: {
    name: 'TOPCon (N-type)',
    short: 'TOPCon',
    efficiency: 22,
    lightFactor: 1.03,   // lepsze światło rozproszone (bifacial-ready)
    tempCoef: -0.30,
    degradation: 0.40,
    costFactor: 1.10,
    desc: 'Nowa generacja. Wyższy uzysk, niższa degradacja, dłuższa żywotność.'
  },
  hjt: {
    name: 'HJT (heterozłącze)',
    short: 'HJT',
    efficiency: 23,
    lightFactor: 1.04,   // doskonałe światło rozproszone
    tempCoef: -0.25,     // najlepszy w upale
    degradation: 0.25,
    costFactor: 1.25,
    desc: 'Segment premium. Najwyższy uzysk i żywotność, najwyższa cena.'
  },
  thin: {
    name: 'Cienkowarstwowy (CdTe)',
    short: 'Thin-film',
    efficiency: 12,
    lightFactor: 1.06,   // najlepszy w zachmurzeniu/rozproszonym świetle
    tempCoef: -0.25,
    degradation: 0.50,
    costFactor: 0.85,
    desc: 'Doskonały w zachmurzeniu i upale, ale wymaga dużo powierzchni (niska sprawność).'
  }
};

// ====== PARAMETRY MAGAZYNU ENERGII ======
// Round-trip: straty ładowania/rozładowania baterii LiFePO4 ~10% (sprawność 90%).
// Model dobowy: bateria może na dobę przesunąć max swoją pojemność (× sprawność),
// ograniczone przez dostępną nadwyżkę PV i niepokryte wieczorne zużycie.
// Przy batKwh = 0 przesunięcie wynosi 0 -> scenariusz "PV+magazyn" = "PV".
const BAT_ROUNDTRIP = 0.90;     // sprawność round-trip ładowanie->rozładowanie

// Średnie miesięczne temperatury powietrza w Polsce [°C] (norma 1991-2020, centralna Polska).
const MONTHLY_TEMP = [-1.5, -0.4, 3.5, 9.0, 14.0, 17.5, 19.5, 19.0, 14.0, 9.0, 4.5, 0.0];

// Przyrost temperatury ogniwa ponad temperaturę powietrza w czasie produkcji [°C].
// W miesiącach o wyższym nasłonecznieniu ogniwo grzeje się mocniej (do ~30°C ponad powietrze w pełnym słońcu).
// Skalowane proporcjonalnie do udziału produkcji PV (lato = większy przyrost).
const CELL_TEMP_RISE = [12, 14, 18, 22, 26, 28, 28, 27, 23, 18, 13, 10];

const state = {
  tariff: 'G11',
  priceDay: 1.10,
  priceNight: 0.60,
  fixedFee: 35,
  rcem: 0.30,
  appliances: {
    base:     { on: true,  kwh: 2200 },
    heating:  { on: false, kwh: 8000 },
    hp:       { on: false, kwh: 3500 },
    ac:       { on: false, kwh: 800  },
    ev:       { on: false, kwh: 3000 },
    pool:     { on: false, kwh: 2500 },
    workshop: { on: false, kwh: 1500 }
  },
  customUse: null,
  customPv: null,
  pvKwp: 3.0,
  panelType: 'perc',
  voivodeship: 'mazowieckie',
  yieldKwp: 1040,   // uzysk bazowy — domyślnie z województwa mazowieckiego, użytkownik może nadpisać
  yieldManual: false,  // czy użytkownik ręcznie zmienił uzysk (odłącza od województwa)
  costKwp: 4500,
  autoUse: 30,
  grant: 0,
  batKwh: 10,
  batCostKwh: 2200,
  // Docelowa autokonsumpcja w miesiącach nadmiaru (cel, do którego dąży magazyn latem).
  // Nie jest sterowana suwakiem — realna autokonsumpcja wynika z modelu dobowego (pojemność + profil).
  autoBat: 80,
  useCredit: false,
  creditShare: 100,
  creditYears: 10,
  creditRate: 9.0,
  horizon: 15,
  priceGrowth: 4,
  degradation: 0.6
};

// Wylicza całkowite roczne zużycie ze wszystkich aktywnych odbiorników
function totalAnnualUse() {
  let sum = 0;
  for (const k in state.appliances) {
    if (state.appliances[k].on) sum += state.appliances[k].kwh;
  }
  return sum;
}

// Wylicza profil sezonowy jako ważoną sumę profili aktywnych odbiorników
// Zwraca tablicę 12 wartości w kWh (suma = totalAnnualUse).
function autoSeasonalProfile() {
  const result = new Array(12).fill(0);
  for (const k in state.appliances) {
    const app = state.appliances[k];
    if (!app.on) continue;
    const prof = APPLIANCE_PROFILES[k];
    for (let i = 0; i < 12; i++) {
      result[i] += app.kwh * prof[i] / 100;
    }
  }
  return result;
}

// ============== LOGIKA OBLICZEŃ ==============

// Miesięczny mnożnik strat temperaturowych dla danego typu panela.
// Strata = (T_ogniwa - 25°C) × γP, gdzie T_ogniwa = T_powietrza + przyrost od nasłonecznienia.
// W chłodne miesiące ogniwo bywa poniżej 25°C -> mnożnik > 1 (panel pracuje wydajniej niż w STC!).
// Zwraca tablicę 12 mnożników (np. 1.02 zimą, 0.94 latem).
function monthlyTempFactor() {
  const gamma = PANEL_TYPES[state.panelType].tempCoef; // %/°C, ujemny
  return MONTHLY_TEMP.map((airTemp, i) => {
    const cellTemp = airTemp + CELL_TEMP_RISE[i];
    const lossPct = (cellTemp - 25) * gamma; // np. (45-25)*(-0.35) = -7% strat
    return 1 + lossPct / 100;
  });
}

// Produkcja PV miesiąc po miesiącu [kWh] — uwzględnia profil sezonowy, światło rozproszone i straty temp.
// produkcja[i] = pvKwp × yieldBazowy × lightFactor × (profilPV[i]/100) × tempFactor[i]
function monthlyProduction() {
  const panel = PANEL_TYPES[state.panelType];
  const tempF = monthlyTempFactor();
  const pvProf = state.customPv || PV_PROFILE;
  const baseAnnual = state.pvKwp * state.yieldKwp * panel.lightFactor;
  return pvProf.map((share, i) => baseAnnual * share / 100 * tempF[i]);
}

// Roczna produkcja całej instalacji [kWh] — suma miesięcy (zawiera już straty temp. i światło)
function annualProduction() {
  return monthlyProduction().reduce((a, b) => a + b, 0);
}

// Roczny efektywny uzysk [kWh/kWp] — produkcja / moc (do wyświetlenia w specyfikacji)
function effectiveYield() {
  return state.pvKwp > 0 ? annualProduction() / state.pvKwp : 0;
}

// Degradacja roczna zależna od typu panela [%/rok]
function panelDegradation() {
  return PANEL_TYPES[state.panelType].degradation;
}

// Koszt instalacji PV [zł] z uwzgl. mnożnika cenowego typu panela
function pvInvestment() {
  const panel = PANEL_TYPES[state.panelType];
  return state.pvKwp * state.costKwp * panel.costFactor;
}

// Powierzchnia dachu wymagana dla danej mocy i typu panela [m²]
function requiredArea() {
  const panel = PANEL_TYPES[state.panelType];
  return state.pvKwp * 1000 / (1000 * panel.efficiency / 100);
}

function pmt(principal, annualRate, years) {
  // Rata stała kredytu
  if (annualRate === 0) return principal / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return principal * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
}

function effectiveSellPrice() {
  // RCEm + 23% ekw. VAT
  return state.rcem * 1.23;
}

function effectiveBuyPrice() {
  // Średnia ważona ceny — dla G11 to po prostu priceDay,
  // dla G12/G12W zakładamy 50/50 dzień-noc dla uproszczenia.
  if (state.tariff === 'G11') return state.priceDay;
  // G12: ~70% dzień, 30% noc, G12W: ~60/40 (przybliżenie)
  if (state.tariff === 'G12') return state.priceDay*0.65 + state.priceNight*0.35;
  return state.priceDay*0.55 + state.priceNight*0.45;
}

function monthlyData() {
  // Zwraca tablicę 12 miesięcy z: zużycie, produkcja PV, auto-kons. bez/z magazynem, oddana, dobrana
  // Profil zużycia: użytkownik może nadpisać ręcznie (customUse w kWh/miesiąc), inaczej kompozycja odbiorników.
  const useArr = state.customUse || autoSeasonalProfile();  // kWh/miesiąc
  const prodArr = monthlyProduction();                      // kWh/miesiąc (z temp. i światłem)
  const autoNoBat_pct = state.autoUse / 100;

  return MONTHS.map((m, i) => {
    const use = useArr[i];                              // już w kWh
    const pv = prodArr[i];                              // już w kWh, z mnożnikiem temp.

    // ====== Auto-konsumpcja BEZ magazynu ======
    let selfNoBat;
    if (pv <= use) {
      selfNoBat = Math.min(pv, use, pv * Math.min(1, autoNoBat_pct * 2.5));
    } else {
      selfNoBat = Math.min(use, pv * autoNoBat_pct);
    }
    const surplusNoBat = Math.max(0, pv - selfNoBat);
    const importNoBat = Math.max(0, use - selfNoBat);

    // ====== Auto-konsumpcja Z magazynem ======
    // Magazyn pracuje w cyklu dobowym: w dzień ładuje się nadwyżką PV (tym co przekracza
    // bieżące zużycie), wieczorem/nocą oddaje energię na pokrycie zużycia.
    // KLUCZOWE: korzyść z magazynu = ile dodatkowo zużyjemy ponad scenariusz bez baterii.
    // Przy batKwh = 0 ta korzyść wynosi 0, więc selfBat = selfNoBat (brak różnicy).
    //
    // Model dobowy uśredniony do miesiąca:
    //   - dzienna nadwyżka = (produkcja - bezpośrednia autokonsumpcja) / dni
    //   - bateria może w ciągu doby zmagazynować min(dzienna nadwyżka, pojemność) i oddać z round-trip
    //   - oddana energia pokrywa nocne/wieczorne zużycie, max do wielkości tego zużycia
    const daysInMonth = 30;
    const pvDaily = pv / daysInMonth;
    const useDaily = use / daysInMonth;
    // Bezpośrednia (równoczasowa) autokonsumpcja dzienna — to samo co bez magazynu
    const directDaily = selfNoBat / daysInMonth;
    // Dzienna nadwyżka dostępna do zmagazynowania
    const surplusDaily = Math.max(0, pvDaily - directDaily);
    // Dzienne zużycie jeszcze niepokryte (wieczór/noc), które bateria mogłaby pokryć
    const uncoveredDaily = Math.max(0, useDaily - directDaily);
    // Ile bateria realnie przesuwa na dobę: ograniczone pojemnością, nadwyżką i niepokrytym zużyciem
    const batThroughputDaily = Math.min(
      state.batKwh * BAT_ROUNDTRIP,   // pojemność × sprawność (0 gdy batKwh=0!)
      surplusDaily * BAT_ROUNDTRIP,   // tyle ile jest nadwyżki do zmagazynowania
      uncoveredDaily                  // tyle ile jest wieczornego zużycia do pokrycia
    );
    // Autokonsumpcja z magazynem = bezpośrednia + to co przesunęła bateria
    let selfBat = selfNoBat + batThroughputDaily * daysInMonth;
    selfBat = Math.min(selfBat, use, pv);  // nie więcej niż zużycie ani produkcja
    const surplusBat = Math.max(0, pv - selfBat);
    const importBat = Math.max(0, use - selfBat);

    return { month: m, use, pv, selfNoBat, surplusNoBat, importNoBat, selfBat, surplusBat, importBat };
  });
}

function yearlyTotals(degradationFactor = 1, priceMultiplier = 1) {
  // Oblicza roczne wartości finansowe dla 3 scenariuszy z uwzgl. degradacji i wzrostu cen
  // 
  // MODEL NET-BILLINGU:
  // Sprzedawca skupuje energię po cenie sell (RCEm+23%), a klient kupuje po cenie buy.
  // Wartość nadwyżki trafia do "depozytu prosumenckiego", którego można użyć tylko do pomniejszenia
  // rachunku za zakupioną energię. Niewykorzystany depozyt: 20% zwracane gotówką (max 12 mies.).
  //
  // W praktyce roczny bilans wygląda tak:
  //   - przychód z odsprzedaży = surplus_kWh * sell_zł
  //   - rachunek brutto = import_kWh * buy_zł
  //   - rachunek netto = max(0, brutto - przychód) - czyli depozyt redukuje rachunek do zera, ale nie poniżej
  //   - jeśli przychód > brutto, "nadmiar" * 0.20 wraca jako gotówka (zwrot wartości niewykorzystanej)
  //
  // Plus stałe opłaty dystrybucyjne (fixed) płaci się zawsze.

  const md = monthlyData();
  const buy = effectiveBuyPrice() * priceMultiplier;
  const sell = effectiveSellPrice() * priceMultiplier;
  const fixed = state.fixedFee * 12;

  let costNoPV = 0;
  let importPV = 0, surplusPV = 0;
  let importBat = 0, surplusBat = 0;

  for (const m of md) {
    costNoPV += m.use * buy;
    // Skala produkcji/autokonsumpcji wg degradacji
    const _selfNoBat = m.selfNoBat * degradationFactor;
    const _surplusNoBat = m.surplusNoBat * degradationFactor;
    importPV += Math.max(0, m.use - _selfNoBat);
    surplusPV += _surplusNoBat;

    const _selfBat = m.selfBat * degradationFactor;
    const _surplusBat = m.surplusBat * degradationFactor;
    importBat += Math.max(0, m.use - _selfBat);
    surplusBat += _surplusBat;
  }

  // Wartość depozytu (przychodu) ze sprzedaży nadwyżek
  const depositPV = surplusPV * sell;
  const depositBat = surplusBat * sell;
  // Wartość zakupionej energii brutto (przed użyciem depozytu)
  const grossImportPV = importPV * buy;
  const grossImportBat = importBat * buy;

  // Depozyt pokrywa rachunek za import, niewykorzystana część daje 20% zwrot
  const billPV = Math.max(0, grossImportPV - depositPV);
  const billBat = Math.max(0, grossImportBat - depositBat);
  const unusedDepositPV = Math.max(0, depositPV - grossImportPV);
  const unusedDepositBat = Math.max(0, depositBat - grossImportBat);
  const cashbackPV = unusedDepositPV * 0.20;   // 20% zwrotu z niewykorzystanej nadwyżki
  const cashbackBat = unusedDepositBat * 0.20;

  // Koszt netto = rachunek - cashback + opłaty stałe
  const netPV = billPV - cashbackPV + fixed;
  const netBat = billBat - cashbackBat + fixed;

  return {
    noPV: costNoPV + fixed,
    pv: netPV,
    pvBat: netBat,
    // Diagnostyka:
    grossImportPV, depositPV, billPV, cashbackPV,
    grossImportBat, depositBat, billBat, cashbackBat,
    surplusPV, surplusBat, importPV, importBat,
    selfNoBat: md.reduce((s,m)=>s+m.selfNoBat,0) * degradationFactor,
    selfBat: md.reduce((s,m)=>s+m.selfBat,0) * degradationFactor
  };
}

function fullSimulation() {
  // Symuluje cały okres analizy dla 3 scenariuszy: bez PV, PV, PV+magazyn
  const years = state.horizon;
  const pvInvest = pvInvestment() - state.grant;
  const batInvest = state.batKwh * state.batCostKwh;
  const pvBatInvest = pvInvest + batInvest;

  // Kredyt
  let pvCash = 0, pvBatCash = 0;
  let pvMonthly = 0, pvBatMonthly = 0;
  let creditYearsPv = 0, creditYearsBat = 0;

  if (state.useCredit) {
    const sharePv = pvInvest * state.creditShare / 100;
    const shareBat = pvBatInvest * state.creditShare / 100;
    pvCash = pvInvest - sharePv;  // wkład własny
    pvBatCash = pvBatInvest - shareBat;
    pvMonthly = pmt(sharePv, state.creditRate, state.creditYears);
    pvBatMonthly = pmt(shareBat, state.creditRate, state.creditYears);
    creditYearsPv = state.creditYears;
    creditYearsBat = state.creditYears;
  } else {
    pvCash = pvInvest;
    pvBatCash = pvBatInvest;
  }

  // Tablice skumulowanych przepływów (saldo: ujemne = wydatki przewyższają oszczędności)
  // Punkt 0 = początek inwestycji, wydatkujemy wkład własny
  const noPVCum = [0];
  const pvCum = [-pvCash];
  const pvBatCum = [-pvBatCash];

  for (let y = 1; y <= years; y++) {
    const priceMul = Math.pow(1 + state.priceGrowth/100, y-1);
    const degradFactor = Math.pow(1 - panelDegradation()/100, y-1);
    const yt = yearlyTotals(degradFactor, priceMul);

    // Roczna płatność kredytu (jeśli kredyt jest aktywny w tym roku)
    const creditPV = (state.useCredit && y <= creditYearsPv) ? pvMonthly*12 : 0;
    const creditBat = (state.useCredit && y <= creditYearsBat) ? pvBatMonthly*12 : 0;

    noPVCum.push(noPVCum[y-1] - yt.noPV);
    pvCum.push(pvCum[y-1] - yt.pv - creditPV);
    pvBatCum.push(pvBatCum[y-1] - yt.pvBat - creditBat);
  }

  // Saldo "scenariusz vs brak PV" — to mierzy faktyczną opłacalność PV
  // Saldo PV-względne = pvCum - noPVCum (jeśli >=0 -> PV się opłaca)
  const relPV = pvCum.map((v,i) => v - noPVCum[i]);
  const relPVbat = pvBatCum.map((v,i) => v - noPVCum[i]);

  // Czas zwrotu: pierwszy rok, gdy relPV >= 0 (porównanie inwestycyjne)
  // ALE: pvCum zaczyna od -pvCash, więc względnie startuje od -pvCash; szukamy pierwszego momentu gdy oszczędności
  // skompensują inwestycję.
  const paybackPV = findPayback(relPV);
  const paybackBat = findPayback(relPVbat);

  // Zysk netto po horyzoncie
  const npvPV = relPV[years];
  const npvBat = relPVbat[years];

  // Rok 1 oszczędności (vs brak PV) — bez kosztów kredytu/inwestycji
  const yt1 = yearlyTotals(1, 1);
  const savingsPV1 = yt1.noPV - yt1.pv;
  const savingsBat1 = yt1.noPV - yt1.pvBat;

  return {
    pvInvest, batInvest, pvBatInvest,
    pvCash, pvBatCash,
    pvMonthly, pvBatMonthly,
    noPVCum, pvCum, pvBatCum,
    relPV, relPVbat,
    paybackPV, paybackBat,
    npvPV, npvBat,
    savingsPV1, savingsBat1,
    // Rachunki roku 1 (bez inflacji, bez kredytu) — do prezentacji w UI
    billNoPV1: yt1.noPV,
    billPV1: yt1.pv,
    billBat1: yt1.pvBat,
    totalCostNoPV: -noPVCum[years],
    totalCostPV: -pvCum[years],
    totalCostPVbat: -pvBatCum[years]
  };
}

function findPayback(rel) {
  // Pierwszy rok kiedy wartość >= 0 (z interpolacją)
  for (let i = 1; i < rel.length; i++) {
    if (rel[i] >= 0 && rel[i-1] < 0) {
      const frac = -rel[i-1] / (rel[i] - rel[i-1]);
      return (i-1) + frac;
    }
  }
  if (rel[rel.length-1] >= 0) return 0;
  return null;
}

// ============== RYSOWANIE ==============

function fmt(n, dec=0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString('pl-PL', {minimumFractionDigits: dec, maximumFractionDigits: dec});
}

function fmtCurrency(n) { return fmt(n, 0) + ' zł'; }

function svgBarChart(containerId, data, opts={}) {
  const W = opts.width || 900;
  const H = opts.height || 280;
  const PAD = {top: 20, right: 20, bottom: 32, left: 60};
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const allVals = data.flatMap(d => d.values);
  const maxV = Math.max(...allVals, 1);

  const groups = data[0].values.length;
  const groupW = cw / groups;
  const seriesCount = data.length;
  const barW = (groupW - 8) / seriesCount;

  let bars = '';
  data.forEach((series, sIdx) => {
    series.values.forEach((v, gIdx) => {
      const x = PAD.left + gIdx*groupW + 4 + sIdx*barW;
      const h = (v / maxV) * ch;
      const y = PAD.top + ch - h;
      bars += `<rect x="${x}" y="${y}" width="${barW-1}" height="${h}" fill="${series.color}" rx="2"></rect>`;
    });
  });

  // X labels
  let xLabels = '';
  for (let i = 0; i < groups; i++) {
    const cx = PAD.left + i*groupW + groupW/2;
    xLabels += `<text x="${cx}" y="${H-12}" text-anchor="middle" fill="var(--text-dim)" font-family="var(--mono)" font-size="10">${opts.xLabels[i]}</text>`;
  }

  // Y axis ticks
  let yTicks = '';
  const tickCount = 4;
  for (let t = 0; t <= tickCount; t++) {
    const val = maxV * t / tickCount;
    const y = PAD.top + ch - (val/maxV)*ch;
    yTicks += `<line x1="${PAD.left}" y1="${y}" x2="${W-PAD.right}" y2="${y}" stroke="var(--border-soft)" stroke-width="1"></line>`;
    yTicks += `<text x="${PAD.left-8}" y="${y+4}" text-anchor="end" fill="var(--text-dim)" font-family="var(--mono)" font-size="10">${fmt(val,0)}</text>`;
  }

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${yTicks}${bars}${xLabels}
    </svg>`;
}

function svgLineChart(containerId, series, opts={}) {
  const W = opts.width || 900;
  const H = opts.height || 280;
  const PAD = {top: 20, right: 20, bottom: 32, left: 70};
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const allVals = series.flatMap(s => s.values);
  const minV = Math.min(...allVals, 0);
  const maxV = Math.max(...allVals, 0);
  const range = maxV - minV || 1;

  const N = series[0].values.length;
  const stepX = cw / (N - 1);

  const yScale = v => PAD.top + ch - ((v - minV)/range)*ch;
  const xScale = i => PAD.left + i*stepX;

  // Grid + Y ticks
  let grid = '';
  const tickCount = 5;
  for (let t = 0; t <= tickCount; t++) {
    const v = minV + (range * t / tickCount);
    const y = yScale(v);
    grid += `<line x1="${PAD.left}" y1="${y}" x2="${W-PAD.right}" y2="${y}" stroke="var(--border-soft)" stroke-width="1"></line>`;
    const lbl = Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : fmt(v,0);
    grid += `<text x="${PAD.left-8}" y="${y+4}" text-anchor="end" fill="var(--text-dim)" font-family="var(--mono)" font-size="10">${lbl}</text>`;
  }

  // Zero line
  if (minV < 0 && maxV > 0) {
    const zy = yScale(0);
    grid += `<line x1="${PAD.left}" y1="${zy}" x2="${W-PAD.right}" y2="${zy}" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3,3"></line>`;
    grid += `<text x="${PAD.left-8}" y="${zy-3}" text-anchor="end" fill="var(--text-muted)" font-family="var(--mono)" font-size="10" font-weight="700">0</text>`;
  }

  // Lines
  let lines = '';
  series.forEach(s => {
    const pts = s.values.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');
    lines += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
    // Dot at last point
    const lastV = s.values[s.values.length-1];
    lines += `<circle cx="${xScale(N-1)}" cy="${yScale(lastV)}" r="4" fill="${s.color}"></circle>`;
  });

  // X labels
  let xLabels = '';
  const xStep = Math.max(1, Math.floor(N / 8));
  for (let i = 0; i < N; i += xStep) {
    const cx = xScale(i);
    xLabels += `<text x="${cx}" y="${H-12}" text-anchor="middle" fill="var(--text-dim)" font-family="var(--mono)" font-size="10">${opts.xLabels[i]}</text>`;
  }
  // Last label
  if ((N-1) % xStep !== 0) {
    xLabels += `<text x="${xScale(N-1)}" y="${H-12}" text-anchor="middle" fill="var(--text-dim)" font-family="var(--mono)" font-size="10">${opts.xLabels[N-1]}</text>`;
  }

  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}${lines}${xLabels}
    </svg>`;
}

// ============== AKTUALIZACJA UI ==============

function buildProfileTable() {
  // Profil zużycia: kompozycja z odbiorników (chyba że user nadpisał ręcznie)
  const useArr = state.customUse || autoSeasonalProfile();
  const pvArr = state.customPv || PV_PROFILE;
  const tbody = document.querySelector('#profileTable tbody');
  tbody.innerHTML = MONTHS.map((m, i) => `
    <tr>
      <td class="month">${m}</td>
      <td><input type="number" data-use="${i}" value="${useArr[i].toFixed(0)}" step="1" min="0"></td>
      <td><input type="number" data-pv="${i}" value="${pvArr[i].toFixed(1)}" step="0.1" min="0"></td>
    </tr>
  `).join('');
  // Listenery
  tbody.querySelectorAll('input[data-use]').forEach(inp => {
    inp.addEventListener('input', () => {
      const arr = Array.from(tbody.querySelectorAll('input[data-use]')).map(i => parseFloat(i.value) || 0);
      state.customUse = arr;
      recompute();
    });
  });
  tbody.querySelectorAll('input[data-pv]').forEach(inp => {
    inp.addEventListener('input', () => {
      const arr = Array.from(tbody.querySelectorAll('input[data-pv]')).map(i => parseFloat(i.value) || 0);
      state.customPv = arr;
      recompute();
    });
  });
}

function recompute() {
  // Update wartości pomocniczych w UI
  document.getElementById('priceDayVal').textContent = state.priceDay.toFixed(2);
  document.getElementById('priceNightVal').textContent = state.priceNight.toFixed(2);
  document.getElementById('fixedFeeVal').textContent = state.fixedFee;
  document.getElementById('rcemVal').textContent = state.rcem.toFixed(2);

  // Suma odbiorników
  const annualUse = totalAnnualUse();
  document.getElementById('annualUseTotal').textContent = annualUse.toLocaleString('pl-PL');
  // Update wartości każdego odbiornika i status active/inactive
  for (const k in state.appliances) {
    const app = state.appliances[k];
    const valEl = document.getElementById('app' + k.charAt(0).toUpperCase()+k.slice(1)+'Val');
    if (valEl) valEl.textContent = app.kwh.toLocaleString('pl-PL');
    const detailEl = document.getElementById('app' + k.charAt(0).toUpperCase()+k.slice(1)+'Detail');
    const containerEl = document.querySelector(`.appliance[data-app="${k}"]`);
    if (k === 'base') {
      containerEl?.classList.add('active');
    } else {
      if (app.on) {
        containerEl?.classList.add('active');
        if (detailEl) detailEl.style.display = 'block';
        const statusEl = containerEl?.querySelector('.app-status');
        if (statusEl) statusEl.textContent = app.kwh.toLocaleString('pl-PL') + ' kWh/rok';
      } else {
        containerEl?.classList.remove('active');
        if (detailEl) detailEl.style.display = 'none';
        const statusEl = containerEl?.querySelector('.app-status');
        if (statusEl) statusEl.textContent = '—';
      }
    }
  }

  document.getElementById('pvKwpVal').textContent = state.pvKwp.toFixed(1);
  document.getElementById('yieldVal').textContent = state.yieldKwp;
  // Województwo: pokaż jego średni uzysk i czy uzysk jest ręczny czy z regionu
  const voiv = VOIVODESHIPS[state.voivodeship];
  document.getElementById('voivodeshipYield').textContent = voiv.yield + ' kWh/kWp';
  const yieldHint = document.getElementById('yieldHint');
  if (state.yieldManual) {
    yieldHint.textContent = `Ręczne nadpisanie (${voiv.name}: ${voiv.yield}). Wybierz województwo ponownie, aby zresetować.`;
    yieldHint.style.color = 'var(--sun)';
  } else {
    yieldHint.textContent = `Średnia dla: ${voiv.name}. Przesuń suwak, aby ustawić ręcznie.`;
    yieldHint.style.color = '';
  }
  document.getElementById('costKwpVal').textContent = state.costKwp;

  // Specyfikacja typu panela
  const panel = PANEL_TYPES[state.panelType];
  document.getElementById('panelTypeName').textContent = panel.short;
  document.getElementById('specEff').textContent = panel.efficiency + '%';
  document.getElementById('specYield').textContent = Math.round(effectiveYield()) + ' kWh/kWp';
  // Światło rozproszone jako odchylenie od referencji (Mono PERC = 1.00)
  const lightPct = Math.round((panel.lightFactor - 1) * 100);
  document.getElementById('specLight').textContent = (lightPct >= 0 ? '+' : '−') + Math.abs(lightPct) + '%';
  // Średnioważone straty temperaturowe w skali roku
  const tempF = monthlyTempFactor();
  const pvProf = state.customPv || PV_PROFILE;
  let wTemp = 0, wSum = 0;
  for (let i = 0; i < 12; i++) { wTemp += tempF[i]*pvProf[i]; wSum += pvProf[i]; }
  const avgTempLoss = Math.round((wTemp/wSum - 1) * 100);
  document.getElementById('specTempLoss').textContent = (avgTempLoss >= 0 ? '+' : '−') + Math.abs(avgTempLoss) + '%';
  document.getElementById('specTemp').textContent = '−' + Math.abs(panel.tempCoef).toFixed(2) + '%/°C';
  document.getElementById('specDeg').textContent = panel.degradation.toFixed(2) + '%/rok';
  document.getElementById('specArea').textContent = requiredArea().toFixed(1) + ' m²';
  document.getElementById('specProd').textContent = Math.round(annualProduction()).toLocaleString('pl-PL') + ' kWh';
  document.getElementById('panelDesc').textContent = panel.desc;
  document.getElementById('degradationVal').textContent = panel.degradation.toFixed(2);
  document.getElementById('autoVal').textContent = state.autoUse;
  document.getElementById('grantVal').textContent = state.grant;
  document.getElementById('batKwhVal').textContent = state.batKwh;
  document.getElementById('batCostKwhVal').textContent = state.batCostKwh;
  document.getElementById('creditShareVal').textContent = state.creditShare;
  document.getElementById('creditYearsVal').textContent = state.creditYears;
  document.getElementById('creditRateVal').textContent = state.creditRate.toFixed(1);
  document.getElementById('horizonVal').textContent = state.horizon;
  document.getElementById('horizonLabel').textContent = state.horizon;
  document.getElementById('priceGrowthVal').textContent = state.priceGrowth;
  document.getElementById('degradationVal').textContent = state.degradation.toFixed(1);

  // Odśwież tabelę profilu (gdy nie ma customUse)
  if (!state.customUse) {
    const useArr = autoSeasonalProfile();
    document.querySelectorAll('#profileTable input[data-use]').forEach((inp, i) => {
      inp.value = useArr[i].toFixed(0);
    });
  }

  // Pokaż/ukryj nocną cenę
  document.getElementById('priceNightWrap').style.display = state.tariff === 'G11' ? 'none' : 'block';
  document.getElementById('creditPanel').style.display = state.useCredit ? 'block' : 'none';

  // Pokaż/ukryj kafelek magazyn
  const hasBat = state.batKwh > 0;

  // === Symulacja ===
  const sim = fullSimulation();
  const md = monthlyData();

  // KPI
  document.getElementById('kpiYearly').textContent = fmt(sim.savingsPV1, 0);
  document.getElementById('kpiYearlyNote').textContent = `oszczędność na PV, rok 1`;

  document.getElementById('kpiPayback').textContent = sim.paybackPV ? sim.paybackPV.toFixed(1) : '∞';
  document.getElementById('kpiPaybackNote').textContent = `scenariusz: tylko PV`;

  document.getElementById('kpiNpv').textContent = fmt(sim.npvPV, 0);
  document.getElementById('kpiNpvNote').textContent = `PV, po ${state.horizon} latach`;

  // Najlepszy scenariusz: najniższy całkowity koszt
  // Gdy magazyn = 0 kWh, scenariusz "PV + magazyn" jest identyczny z "PV" — wykluczamy go z rywalizacji,
  // żeby nie wygrywał remisem ani nie mylił użytkownika.
  const hasBattery = state.batKwh > 0;
  const costs = [
    {name: 'Bez PV', cost: sim.totalCostNoPV, key: 'noPV', active: true},
    {name: 'PV', cost: sim.totalCostPV, key: 'pv', active: true},
    {name: 'PV + magazyn', cost: sim.totalCostPVbat, key: 'pvBat', active: hasBattery}
  ];
  // Wybór najlepszego tylko spośród aktywnych scenariuszy.
  // Przy remisie (różnica < 1 zł) preferujemy scenariusz o niższej inwestycji (prostszy).
  const activeCosts = costs.filter(c => c.active);
  const best = activeCosts.reduce((a, b) => {
    if (Math.abs(a.cost - b.cost) < 1) {
      // Remis kosztowy -> wybierz tańszy w inwestycji (noPV < pv < pvBat)
      const order = { noPV: 0, pv: 1, pvBat: 2 };
      return order[a.key] <= order[b.key] ? a : b;
    }
    return a.cost < b.cost ? a : b;
  });
  document.getElementById('kpiBest').textContent = best.name;
  const diff = sim.totalCostNoPV - best.cost;
  document.getElementById('kpiBestNote').textContent = diff > 0 ? `oszczędność ${fmt(diff,0)} zł vs brak PV` : 'brak korzyści';

  // Scenariusze (3 boxy)
  const box = document.getElementById('scenariosBox');
  box.innerHTML = costs.map(c => `
    <div class="scen ${c.key === best.key ? 'best' : ''} ${!c.active ? 'inactive' : ''}">
      ${c.key === best.key ? '<div class="scen-best-tag">NAJLEPSZY</div>' : ''}
      ${!c.active ? '<div class="scen-inactive-tag">DODAJ MAGAZYN</div>' : ''}
      <div class="scen-title">${c.name}</div>
      <div class="scen-cost">${c.active ? fmtCurrency(c.cost) : '—'}</div>
      <div class="scen-period">${c.active ? `koszt łączny przez ${state.horizon} lat` : 'ustaw pojemność magazynu w kafelku 4'}</div>
      ${!c.active ? '' : c.key === 'noPV' ? `
        <div class="scen-row"><span class="lab">Rachunek/rok (rok 1)</span><span class="v">${fmt(sim.billNoPV1, 0)} zł</span></div>
        <div class="scen-row"><span class="lab">Inwestycja</span><span class="v">0 zł</span></div>
        <div class="scen-row"><span class="lab">Czas zwrotu</span><span class="v">—</span></div>
      ` : c.key === 'pv' ? `
        <div class="scen-row"><span class="lab">Rachunek/rok (rok 1)</span><span class="v">${fmt(sim.billPV1, 0)} zł</span></div>
        <div class="scen-row"><span class="lab">Oszczędność/rok</span><span class="v">${fmt(sim.savingsPV1, 0)} zł</span></div>
        <div class="scen-row"><span class="lab">Inwestycja</span><span class="v">${fmt(sim.pvInvest, 0)} zł</span></div>
        ${state.useCredit ? `<div class="scen-row"><span class="lab">Rata kredytu</span><span class="v">${fmt(sim.pvMonthly, 0)} zł/mc</span></div>` : ''}
        <div class="scen-row"><span class="lab">Czas zwrotu</span><span class="v">${sim.paybackPV ? sim.paybackPV.toFixed(1)+' lat' : 'nie zwróci się'}</span></div>
        <div class="scen-row"><span class="lab">Zysk netto (${state.horizon} lat)</span><span class="v">${fmt(sim.npvPV, 0)} zł</span></div>
      ` : `
        <div class="scen-row"><span class="lab">Rachunek/rok (rok 1)</span><span class="v">${fmt(sim.billBat1, 0)} zł</span></div>
        <div class="scen-row"><span class="lab">Oszczędność/rok</span><span class="v">${fmt(sim.savingsBat1, 0)} zł</span></div>
        <div class="scen-row"><span class="lab">Inwestycja</span><span class="v">${fmt(sim.pvBatInvest, 0)} zł</span></div>
        ${state.useCredit ? `<div class="scen-row"><span class="lab">Rata kredytu</span><span class="v">${fmt(sim.pvBatMonthly, 0)} zł/mc</span></div>` : ''}
        <div class="scen-row"><span class="lab">Czas zwrotu</span><span class="v">${sim.paybackBat ? sim.paybackBat.toFixed(1)+' lat' : 'nie zwróci się'}</span></div>
        <div class="scen-row"><span class="lab">Zysk netto (${state.horizon} lat)</span><span class="v">${fmt(sim.npvBat, 0)} zł</span></div>
      `}
    </div>
  `).join('');

  // Wykres skumulowanego kosztu — linia magazynu tylko gdy magazyn istnieje
  const cumLines = [
    { color: 'var(--red)', values: sim.noPVCum.map(v => -v) },
    { color: 'var(--sun)', values: sim.pvCum.map(v => -v) }
  ];
  if (hasBattery) {
    cumLines.push({ color: 'var(--mint)', values: sim.pvBatCum.map(v => -v) });
  }
  svgLineChart('cumulativeChart', cumLines, {
    xLabels: Array.from({length: state.horizon+1}, (_,i) => `r.${i}`)
  });

  // Wykres sezonowy
  svgBarChart('seasonalChart', [
    { color: 'var(--blue)', values: md.map(m => m.use) },
    { color: 'var(--sun)', values: md.map(m => m.pv) },
    { color: 'var(--mint)', values: md.map(m => hasBat ? m.selfBat : m.selfNoBat) }
  ], { xLabels: MONTHS });

  // Wykres przepływów (PV + PV+bat względem braku PV — wartości dodatnie = zysk)
  svgLineChart('cashflowChart', [
    { color: 'var(--sun)', values: sim.relPV },
    { color: 'var(--mint)', values: sim.relPVbat }
  ], {
    xLabels: Array.from({length: state.horizon+1}, (_,i) => `r.${i}`)
  });
}

// ============== LISTENERS ==============

function bindRange(id, key, parseFn=parseFloat) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    state[key] = parseFn(el.value);
    recompute();
  });
}

document.querySelectorAll('#tariffGroup button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tariffGroup button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tariff = btn.dataset.tariff;
    document.getElementById('tariffName').textContent =
      state.tariff === 'G11' ? 'G11 (jednostrefowa)' :
      state.tariff === 'G12' ? 'G12 (dzień/noc)' : 'G12W (dzień/noc/weekend)';
    recompute();
  });
});

bindRange('priceDay', 'priceDay');
bindRange('priceNight', 'priceNight');
bindRange('fixedFee', 'fixedFee');
bindRange('rcem', 'rcem');
bindRange('pvKwp', 'pvKwp');
bindRange('costKwp', 'costKwp', parseInt);
bindRange('autoUse', 'autoUse', parseInt);
bindRange('grant', 'grant', parseInt);
bindRange('batKwh', 'batKwh', parseInt);
bindRange('batCostKwh', 'batCostKwh', parseInt);
bindRange('creditShare', 'creditShare', parseInt);
bindRange('creditYears', 'creditYears', parseInt);
bindRange('creditRate', 'creditRate');
bindRange('horizon', 'horizon', parseInt);
bindRange('priceGrowth', 'priceGrowth');

// Wybór typu panela
document.getElementById('panelType').addEventListener('change', (e) => {
  state.panelType = e.target.value;
  recompute();
});

// ====== WOJEWÓDZTWO ======
// Wypełnij select listą województw (posortowaną alfabetycznie po nazwie)
const voivSelect = document.getElementById('voivodeship');
Object.keys(VOIVODESHIPS)
  .sort((a, b) => VOIVODESHIPS[a].name.localeCompare(VOIVODESHIPS[b].name, 'pl'))
  .forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${VOIVODESHIPS[key].name} (${VOIVODESHIPS[key].yield} kWh/kWp)`;
    voivSelect.appendChild(opt);
  });
voivSelect.value = state.voivodeship;

// Wybór województwa ustawia uzysk bazowy (i kasuje ręczne nadpisanie)
voivSelect.addEventListener('change', (e) => {
  state.voivodeship = e.target.value;
  state.yieldManual = false;
  state.yieldKwp = VOIVODESHIPS[state.voivodeship].yield;
  document.getElementById('yieldKwp').value = state.yieldKwp;
  recompute();
});

// Ręczna zmiana suwaka uzysku — odłącza od województwa
document.getElementById('yieldKwp').addEventListener('input', (e) => {
  state.yieldKwp = parseInt(e.target.value);
  state.yieldManual = true;
  recompute();
});

// ====== ODBIORNIKI ENERGII ======
// Każdy odbiornik ma checkbox (poza "base") + slider z wielkością rocznego zużycia
const appKeys = ['base', 'heating', 'hp', 'ac', 'ev', 'pool', 'workshop'];
appKeys.forEach(k => {
  const cap = k.charAt(0).toUpperCase() + k.slice(1);
  // Slider kWh
  const slider = document.getElementById('app' + cap);
  if (slider) {
    slider.addEventListener('input', () => {
      state.appliances[k].kwh = parseInt(slider.value);
      state.customUse = null;  // ręczny profil zerujemy gdy zmieniasz odbiorniki
      recompute();
    });
  }
  // Checkbox (tylko dla nie-bazowych)
  if (k !== 'base') {
    const cb = document.getElementById('app' + cap + 'On');
    if (cb) {
      cb.addEventListener('change', () => {
        state.appliances[k].on = cb.checked;
        state.customUse = null;
        recompute();
      });
    }
  }
});

// Reset ręcznego profilu
document.getElementById('resetProfile').addEventListener('click', () => {
  state.customUse = null;
  state.customPv = null;
  buildProfileTable();
  recompute();
});

document.getElementById('useCredit').addEventListener('change', (e) => {
  state.useCredit = e.target.checked;
  recompute();
});

// Inicjalizacja
buildProfileTable();
recompute();
