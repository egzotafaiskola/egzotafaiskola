# CLAUDE.md — Egzóta Díszfaiskola weboldal + CMS

Ez a fájl a projekt működésének részletes leírása Claude (és bármely fejlesztő) számára.
**Nyelv:** a projekt teljesen magyar (UI szövegek, kód kommentek, változónevek is részben magyarul).

---

## 1. Mi ez a projekt?

Egy **statikus, Webflow-ból exportált weboldal** az Egzóta Díszfaiskola (Nagykanizsa) számára,
plusz egy **saját, böngészőben futó CMS**, amely a GitHub Contents API-n keresztül ír JSON
"cikkeket" (növényeket) és képeket egy GitHub repóba. A weboldal futásidőben, a látogató
böngészőjéből kéri le ugyanezeket a JSON fájlokat és abból rendereli a növénykatalógust.

Nincs build lépés, nincs package.json, nincs backend. Minden fájl közvetlenül kiszolgálható.

### Deploy / hoszting
- GitHub repo: `egzotafaiskola/egzotafaiskola`, branch: `main`
- GitHub Pages: `https://egzotafaiskola.github.io/egzotafaiskola/`
- A feltöltött képek URL-je a CMS-ben így áll össze:
  `https://{username}.github.io/{repo}/static/uploads/{timestamp}-{fájlnév}`
- A Cloudflare email-obfuszkáció nyomai (`/cdn-cgi/l/email-protection`, `email-decode.min.js`)
  arra utalnak, hogy az oldal (legalábbis korábban) Cloudflare mögött is futott.

---

## 2. ⚠️ FONTOS: a lokális mappa NEM teljes másolata a repónak

Ezt mindig tartsd észben, mielőtt "hiányzó fájl" hibára következtetnél:

| Hiányzik lokálisan | Hivatkozik rá |
|---|---|
| `js/webflow.js` | **minden** HTML oldal |
| `js/vasarlo-modal.js` | `index.html`, `kapcsolat.html`, `rolunk.html`, `products-cegeknek.html`, `products-maganszemelyeknek.html` |
| `images/` szinte teljes tartalma (logó, ikonok, `DSC000xx-export*` képek, `-p-500/800/1080/1600` variánsok, `.avif`-ek, `favicon.ico`, `webclip.png`) | HTML-ek és CSS |
| `content/items/*.json` | a CMS írja, a weboldal olvassa — csak a GitHub repóban létezik |
| `static/uploads/*` | a feltöltött növényképek — csak a GitHub repóban |

A lokális `images/` mappában **csak nyers forrásfotók** vannak (`DSC08824.JPG` … `DSC08848.JPG`,
egyenként 4–15 MB). Ezekre egyetlen HTML sem hivatkozik. Ha az oldalt lokálisan nyitod meg,
a képek és a Webflow interakciók törtek lesznek — ez **nem** hiba, amit javítani kell.

Ha ezekhez a fájlokhoz kell nyúlni, előbb le kell kérni őket a repóból, pl.:
`https://raw.githubusercontent.com/egzotafaiskola/egzotafaiskola/main/js/vasarlo-modal.js`

### `js/vasarlo-modal.js` — mit csinál (2026-07-30-án a repóból ellenőrizve)

Ez a fájl a kulcs ahhoz, hogy a szegmentált katalógusoldalak egyáltalán elérhetők legyenek:

- Azonnal kilép, ha az aktuális oldal `products.html`.
- Injektál egy `#vasarlo-overlay` + `#vasarlo-modal` elemet **"Hogyan vásárol?"** címmel,
  két gombbal: *Magánszemélyként* → `products-maganszemelyeknek.html`,
  *Cégként* → `products-cegeknek.html`, plusz egy "Mégsem".
- **Minden `<a href="products.html">` linkre rárak egy click-listenert**, ami `preventDefault()`-tal
  a modalt nyitja meg helyette. Egy `MutationObserver` a később bekerülő linkeket is bekötí.

**Ezért helyes**, hogy a menü és a footer mindenhol `products.html`-re mutat: a link soha nem
sül el, a modal fogja el. **Következmény:** ha egy oldal nem tölti be ezt a scriptet, azon az
oldalon a "Növényeink" link tényleg a régi `products.html`-re visz. (A `termsofservice.html`-ből
pontosan ez hiányzott — pótolva, lásd 11. pont.)

A modalnak nincs Esc-billentyűs bezárása és nincs fókuszcsapdája (kisebb akadálymentességi hiány).

---

## 3. Fájlstruktúra

```
faiskola/
├── index.html                          Kezdőlap
├── products.html                       ⚠️ RÉGI, HASZNÁLATON KÍVÜL – ne módosítsd (lásd 6.3)
├── products-cegeknek.html              Növénykatalógus – nagyker (bruttó nagyker ár)
├── products-maganszemelyeknek.html     Növénykatalógus – kisker (ár × 2)
├── kapcsolat.html                      Kapcsolat
├── rolunk.html                         Rólunk / történet / csapat
├── termsofservice.html                 ÁSZF + adatkezelési tájékoztató
├── style-guide.html                    Webflow style guide (279 KB) – NEM része a nav-nak
├── css/
│   ├── normalize.css                   Webflow export, ne módosítsd
│   ├── webflow.css                     Webflow export, ne módosítsd
│   ├── egzota-faiskola.webflow.css     Webflow export (260 KB), ne módosítsd kézzel
│   ├── egzota-responsive.css           KÉZI reszponzív felülírások – ide írj
│   └── CMSITEMS.css                    KÉZI stílus a katalógushoz + popuphoz – ide írj
├── images/                             (lásd 2. pont – hiányos)
└── CMS_20260505/
    ├── CMS_token.txt                   ⚠️ élő GitHub PAT plaintextben (lásd 8. pont)
    └── CMS_edited/
        ├── start.html                  A CMS fő felülete (cikkek CRUD)
        ├── imagemanager.html           Képkezelő (static/uploads listázás + törlés)
        ├── app.js                      window.APP_CONFIG (username/repo/branch)
        ├── styles.css                  start.html stílusa
        ├── imagemanager.css            imagemanager.html stílusa
        ├── fix_images.js               22 KB, sehonnan nincs betöltve (holt kód?)
        └── webzignfeliratferdekorulvagott.png   CMS logó
```

### Melyik CSS hova van belinkelve
- `normalize.css`, `webflow.css`, `egzota-faiskola.webflow.css`, `egzota-responsive.css` → **minden** oldal
- `CMSITEMS.css` → **csak** a `products*.html` oldalak

---

## 4. Az adatmodell (item JSON)

A CMS `content/items/item-{timestamp}.json` néven ment. A mezők (az `itemData` objektum az
`uploadItemAndImage()`-ben áll össze):

| Mező | Típus | CMS input id | Megjegyzés |
|---|---|---|---|
| `ID` | string | – | `generateUniqueId()`: base36 timestamp + random |
| `title` | string | `itemTitle` | **kötelező** |
| `latin` | string | `item-latin` | |
| `description` | string | `itemDescription` | **kötelező** (rövid leírás) |
| `descriptionall` | string | `itemDescriptionall` | teljes leírás |
| `category` | string | `itemCategory` / `newCategory` | *egyedi* kategória; új felülírja a legördülőt |
| `categoriesquality` | string | `itemCategory-quality` | `Szabadföldi` \| `Konténeres` \| `Szabadföldi és Konténeres` |
| `categorieslevel` | string | `itemCategory-level` | `Levél` \| `Tűlevél` |
| `categoriesnoves` | string | `itemCategory-noves` | `Lassú` \| `Közepes` \| `Gyors` |
| `selectedCategoryFromDropdown` | string | `itemCategories` | a **"rendes" kategória** — a weboldal fő szűrője ezt nézi |
| `itemsizes` | string[] | `itemsizes` | vesszővel elválasztott inputból parseolva, cm-ben értendő |
| `itemprices` | string[] | `itemprices` | index szerint párosul az `itemsizes`-zal, Ft, **bruttó nagyker** |
| `categorieshakonteneres` | string | `itemCategory-hakonteneres` | vesszős lista, pl. `"2,9.5,3"`. **Régi cikkekben lezáró vessző is lehet** (`"2,9.5,3,"`) – a weboldal `kontenerLista()`-ja mindkettőt kezeli |
| `itemkontenerek` | string[] | – | a `categorieshakonteneres` tömbösített változata; **a weboldal nem használja** (az a `data-value`-ból bontja ki) |
| `categorieshakonteneres2` | string | `itemCategory-hakonteneres2` | konténeres típus: Fenyő/Rózsák/Törzsesek/Cserjék/Díszfák |
| `categorieshanemkonteneres` | string | `itemCategory-hanemkonteneres` | szabadföldi típus: Fenyő/Törzsesek/Oszlopos/Formafa/Kúszó/Gömb |
| `itemlight` | string | `itemlight` | fényigény |
| `itemground` | string | `itemground` | talajigény |
| `itemusage` | string | `itemusage` | felhasználás |
| `itemlabels` | string | `itemlabels` | címkék (csak a CMS kártyán jelenik meg) |
| `showonweb` | boolean | `itemShowOnWeb` | ha `false`, a cegeknek/maganszemelyeknek oldal kihagyja |
| `image` | string (URL) | `imageFile` | a **fő kép** teljes github.io URL-je; mindig `= images[0]` |
| `images` | string[] | `imageFile` (multiple) | **2026-07-30 óta:** a növény összes képe, az első a fő kép. A régi cikkekben nincs — az olvasó oldal ilyenkor `[image]`-ként kezeli (`kepLista()`) |

**Képek — `image` vs `images`:** a CMS 2026-07-30 óta több képet is ment növényenként az
`images` tömbbe, és az `image` mezőt is kiírja (`= images[0]`) a visszafelé kompatibilitás
miatt. **A repóban lévő 215 régi cikkben csak `image` van, ezeket nem kell migrálni.**
Mindhárom helyen (CMS `start.html`, `products-cegeknek.html`, `products-maganszemelyeknek.html`)
ugyanaz a `kepLista(item)` segédfüggvény olvassa ki egységesen — **új képmezőt olvasó kód mindig
ezen keresztül menjen**, ne közvetlenül az `item.image`-ből.

**Ár-logika:** a JSON-ben tárolt `itemprices` a **bruttó nagykereskedelmi** ár.
- `products-cegeknek.html` → `${itemData.itemprices[i]} Ft`, fejléc: "Bruttó nagykereskedelmi ár"
- `products-maganszemelyeknek.html` → `${2*itemData.itemprices[i]} Ft`, fejléc: "Bruttó kiskereskedelmi ár"

Vagyis a **kisker ár a nagyker duplája**. A szorzó mindkét oldal tetején egy nevesített
konstans: `const AR_SZORZO = 1;` (cégeknek) és `const AR_SZORZO = 2;` (magánszemélyeknek).
Árrés-változtatáshoz **csak ezt az egy számot kell átírni.**

---

## 5. A CMS működése (`CMS_20260505/CMS_edited/`)

Egyetlen HTML fájl inline `<script>`-ekkel, nincs framework. A felhasználó kézzel bemásol egy
GitHub Personal Access Tokent a `#token` mezőbe, minden API hívás azzal fut.

### `start.html` — fő funkciók
| Függvény | Mit csinál |
|---|---|
| `loadItems(forceReload)` | `GET contents/content/items` → minden JSON-t letölt egyesével, `addCard()`-ot hív. A `status2` mezőben számolja, hány cikk töltődött be (türelem-visszajelzés). Kihagyja a `placeholder`-t tartalmazó fájlneveket. |
| `enqueueUploadItem()` | Promise-láncba (`queue`) fűzi az `uploadItemAndImage()`-et, hogy a párhuzamos mentések ne ütközzenek. |
| `uploadItemAndImage()` | 1) a `szerkesztettKepek` listán **sorosan** végigmegy: a már feltöltött képek URL-jét változatlanul átveszi, az újakat `feltoltKep()`-pel tölti fel, 2) JSON-t `PUT content/items/item-{Date.now()}.json`. Szerkesztésnél `editingPath` + `editingSha` alapján felülír. Sikeres mentés után **kiüríti az összes mezőt**. |
| `kepLista(item)` | Egységes képlista: `images` tömb, ha van, különben `[image]`, különben `[]`. |
| `kepekHozzaadasa()` | A file input tartalmát **hozzáfűzi** a `szerkesztettKepek`-hez (nem cseréli le), FileReader-rel előnézetet készít, majd üríti az inputot. |
| `renderKepSav()` | Kirajzolja a `#kepSav` miniatűröket (✕ törlés, ◀ ▶ sorrend, első = „Fő kép"). |
| `kepTorles(i)` / `kepMozgatas(i, irany)` | Tömbművelet + újrarajzolás. |
| `feltoltKep(file, token, username, repo, branch)` | Egy kép feltöltése, visszaadja a github.io URL-t. **Sorosan kell hívni** — a GitHub Contents API ugyanarra a branchre párhuzamosan indított commitokat 409-cel utasíthatja el. |
| `editItem(path)` | Letölti a JSON-t, feltölti vele az űrlapot, beállítja `editingPath`/`editingSha`-t. A képeket **nem tölti le**: a `szerkesztettKepek` csak az URL-eket kapja meg. |
| `deleteItem(path)` | `GET` a sha-ért, majd `DELETE`. |
| `addCard(item, path, replace)` | Kártyát renderel az árlistával együtt (`ar-tablazat-popupon`). |
| `filterItems()` | Kliensoldali szűrés: név/latin (h3/h4 szövegéből), `data-showonweb`, `data-category`. |
| `updateCategorySelect()` | Egyesíti a `defaultCategories` tömböt a JSON-ökből összegyűjtött `categories` Set-tel, és feltölti vele az `#itemCategory` + `#filterCategory` legördülőket. |
| `normalizeCardLayout()` | Soronként azonos magasságra igazítja a kártyákat (load + resize eseményre). |

### UTF-8 kezelés (fontos, ne rontsd el)
- **Írás:** `btoa(unescape(encodeURIComponent(itemContent)))`
- **Olvasás:** `atob()` → `Uint8Array.from(decoded, c => c.charCodeAt(0))` → `new TextDecoder().decode(...)`

Ha ezt elrontod, minden ékezet elromlik a meglévő cikkekben is.

### Feltételes mezők
A `#itemCategory-quality` értéke vezérli, mi látszik:
- `Konténeres` → `#hakontener` (konténer méret) + `#hakontener2` (konténeres típus) látszik, `#hanemkontener` rejtve
- bármi más → fordítva

A `change` eseményt **egyetlen, globális listener** kezeli a fájl végén. Az `editItem()`-en belül
maradt egy `updateVisibility()` függvény, de az már csak egyszer, betöltés után futtatja le az
állapotbeállítást — listenert **nem** köt be (korábban igen, és minden szerkesztéskor
halmozódtak; lásd 9. pont / 17.).

### `imagemanager.html`
Listázza a `static/uploads` tartalmát és egyesével törli őket. Nincs kapcsolat a JSON
cikkekkel — **egy kép törlése után a rá hivatkozó cikk `image` URL-je törött marad.**

### `app.js`
```js
window.APP_CONFIG = { username: "egzotafaiskola", repo: "egzotafaiskola", branch: "main" };
```
Ha a repó/branch változik, **itt kell átírni** — és a `products*.html` tetején lévő
`const username/repo/branch` hármast is (ott duplikálva van, nem innen olvassa).

---

## 6. A weboldal működése

### 6.1 Katalógus renderelés (`products-cegeknek.html`, `products-maganszemelyeknek.html`)
```
loadItems()  →  GET api.github.com/.../contents/content/items?ref=main      (1 db API-hívás)
             →  a .json fájlokat PÁRHUZAMOSAN fetcheli a download_url-ről   (raw.githubusercontent)
             →  showonweb === false  →  kihagyva
             →  <div class="item-card" data-id data-item='{teljes JSON}'> a #items konténerbe
```
A teljes item JSON a `div.dataset.item`-ben utazik, a popup ebből olvas — nem kell újra hálózni.

**Rate limit — pontosítás:** csak a mappalistázás megy az `api.github.com`-ra (autentikáció
nélkül **60 kérés/óra/IP**), az egyes cikkek `download_url`-je viszont a
`raw.githubusercontent.com`-ra mutat, ami nem ugyanez a kvóta. Tehát **oldalletöltésenként 1 db**
API-hívás fogy, nem N+1. Megosztott IP (céges háló, CGNAT) mögül még így is elfogyhat — ha üres
katalógust jelentenek, a böngésző-konzolban a 403-as választ kell keresni.

Hibás vagy üres állapot esetén a konténerben `.items-uzenet` osztályú szöveg jelenik meg
(„Nem sikerült betölteni…” / „Jelenleg nincs megjeleníthető növény.”).

### 6.2 Szűrés (`filterItems()`)
Tisztán DOM-alapú: a kártyákba kirenderelt szövegből olvassa vissza az értékeket.

| Szűrő `id` | Miből olvas | Összehasonlítás |
|---|---|---|
| `item-filter-Categories` | `.rendes-kategoriak` szövege `:` után | `normalizeKategoria()` mindkét oldalon, majd `===` |
| `item-filter-Category-quality` | `.categoriesquality` | `===`, plusz mindig átmegy a `Szabadföldi és Konténeres` |
| `item-filter-Category-level` | `.categorieslevel` | `===` |
| `item-filter-Category-noves` | `.categoriesnoves` | `===` |
| `item-filter-Category-hakonteneres` | `.categorieshakonteneres` **`data-value`** attribútuma | `kontenerLista()`-ra bontva, `normalizeKontener()`-rel, elemre pontos egyezés |
| `item-filter-Category-hakonteneres2` | `.categorieshakonteneres2` (rejtett div) | `===` |
| `item-filter-Category-hanemkonteneres` | `.categorieshanemkonteneres` (rejtett div) | `===` |
| `search-category` | `.item-title` + `.item-latin` | `.includes()`, lowercase, Enterre is fut |

#### A normalizáló segédfüggvények (mindkét products oldalon, azonos kóddal)

| Függvény | Mit csinál | Miért kell |
|---|---|---|
| `normalizeKategoria(v)` | kisbetű + ékezetek le (NFD) + záró `k` levágása → `"Díszfa"` és `"Díszfák"` is `"diszfa"` | a CMS ma `Díszfa`/`Fák`-ot ment, a régi cikkekben `Díszfák` áll. **Sima `.includes()` nem elég**, mert a magyar többes szám az ékezetet is váltja: `"Díszfák".includes("Díszfa") === false` |
| `normalizeKontener(v)` | trim + kisbetű + záró `l`/`liter` levágása → `"2 L"` és `"2"` is `"2"` | a CMS szabad szövegként `"2,9.5,3"`-at ment, a szűrő értéke `"2 L"` |
| `kontenerLista(v)` | `"2,9.5,3,"` → `["2","9.5","3"]` | elemre pontos egyezés kell, különben a `"2"` szűrő a `"24"`-re is találna |
| `kontenerFelirat(v)` | `"2,9.5,3,"` → `"2, 9.5, 3"` | megjelenítéshez, a záró vessző nélkül |
| `formatAr(ar, szorzo)` | üres → `—`, nem szám → nyers szöveg, szám → `szám*szorzó + " Ft"` | |
| `arTablazatSorok(item, szorzo)` | méret/ár párokból `<tr>`-ek, üres méretű sorok kihagyva, semmi esetén „Nincs adat” | |
| `kepLista(item)` | `images` tömb, ha van, különben `[image]`, különben `[]` | a régi cikkekben csak `image` van, az újakban `images` — lásd 4. pont |

A `products-cegeknek.html`-ben `AR_SZORZO = 1`, a `products-maganszemelyeknek.html`-ben
`AR_SZORZO = 2`. **Árrés-változtatáshoz csak ezt az egy konstanst kell átírni.**

A `hakonteneres2` / `hanemkonteneres` értékek **rejtett `<div style="display:none">`**-ként
kerülnek a kártyába (csak a cegeknek/maganszemelyeknek verzióban) — kizárólag azért, hogy
legyen mit szűrni. A `products.html`-ben ezek a divek **hiányoznak**, ott a két típusszűrő
mindig üresre fut → minden kártyát elrejt.

`showhidefilters()` a `.displayhidden` osztályt kapcsolgatja a `.form-group`-okon
("További szűrők" / "Kevesebb szűrő").

### 6.3 A három products oldal viszonya — ⚠️ `products.html` HASZNÁLATON KÍVÜL

**A `products.html` a régi, már nem használt verzió** (a tulajdonos megerősítette 2026-07-30-án).
Helyette a `products-cegeknek.html` és a `products-maganszemelyeknek.html` az élő oldalak;
oda a `vasarlo-modal.js` választója visz (lásd 2. pont).

**A `products.html`-t NE módosítsd**, és ne is használd mintaként — nincs benne
karbantartva sem a `showonweb` szűrés, sem a hibajavítások, és a fájl vége is csonka.
A két élő oldal tartalmaz két, a kódban megjelölt bővítést (`MÓDOSÍTÁS 1` / `MÓDOSÍTÁS 2`):
1. `showonweb === false` esetén a kártya be sem kerül a DOM-ba, és a szűrőben is ki van zárva.
2. A rejtett `categorieshakonteneres2` / `categorieshanemkonteneres` divek kirenderelése.

**Katalógus-módosításnál tehát 2 fájlt kell szinkronban tartani**, nem hármat.
A `products.html` továbbra is a helyén marad, mert a menü/footer linkek rá mutatnak — de
azokat a linkeket a `vasarlo-modal.js` elfogja, így a lap valójában soha nem töltődik be.

### 6.4 Popup (részletek modal)
`.details-btn` kattintásra event delegation (`document.addEventListener("click", ...)`),
`data-id` → `.item-card` → `JSON.parse(card.dataset.item)` → `#modal-img` + `#modal-body` feltöltése,
`#item-modal.active` + `#overlay.active` + `body.no-scroll`.
Bezárás: `#modal-close`, az overlay vagy `Esc` — mindhárom a közös `bezarModal()`-t hívja.
A scrollbar szélessége `--scrollbar-width` CSS változóba kerül.

#### Képgaléria a popupban (2026-07-30)
A `#modal-img` már nem közvetlenül kap `src`-t: a megnyitáskor `galeriaBetolt(itemData)` fut.

| Elem | Megjegyzés |
|---|---|
| Állapot | `galeriaKepek` (URL-tömb) + `galeriaIndex`, a popup script-blokk tetején |
| `galeriaMutat(i)` | körbeforgó index, `#modal-img` + `#galeria-szamlalo` + aktív pötty frissítése, a **következő kép előtöltése** |
| `galeriaLep(irany)` / `galeriaBetolt(item)` | lapozás / lista- és pöttyépítés |
| Vezérlők | `#galeria-elozo`, `#galeria-kovetkezo`, `#galeria-szamlalo`, `#galeria-pottyok` |

**Fontos szerkezeti szabály:** a vezérlők az `.img-container` (`#modal-galeria`) **belsejében**
vannak, **nem** a `#modal-body`-ban — annak az `innerHTML`-jét minden megnyitás felülírja, ott
kitörlődnének. Az `.img-container` ezért kapott `position: relative`-t a `CMSITEMS.css`-ben.

Ha `kepLista(item).length <= 1`, a `#modal-galeria` megkapja a `.galeria-egykepes` osztályt,
ami CSS-ből elrejti a nyilakat, a számlálót és a pöttyöket — **a 215 régi, egyképes cikk
megjelenése így pontosan a korábbival azonos.**

Billentyűzet: egyetlen `document` `keydown`, ami **csak akkor lép működésbe, ha `#item-modal`
`.active`** — különben a `◀ ▶` elrontaná a gépelést a `#search-category` keresőmezőben.
Mobil: swipe az `#modal-galeria`-n, 40px küszöb, és csak ha `|dx| > |dy|` (hogy a függőleges
görgetés megmaradjon); `preventDefault()` nincs.

### 6.5 Egyéb közös script
- **Scroll reveal:** `IntersectionObserver` a `.reveal` osztályon → `.visible`. Minden oldalon.
- **Hash-nav fallback** (csak `index.html`, `kapcsolat.html`, `rolunk.html`, `termsofservice.html`):
  `file://` protokollon a `#products` típusú hash-t `products.html`-re irányítja.
- `filterItemsBySearch()` — a két élő products oldalról **törölve** (csonka holt kód volt,
  lásd 9. pont / 9.). A `products.html`-ben még benne van.
- `filterItemsregi()` (CMS) — **holt kód**, a szerzők is így jelölték (`//nem hasznalt`);
  meghagyva.

---

## 7. Kontaktadatok (több helyen duplikálva)

| Adat | Érték |
|---|---|
| Cím | 8800 Nagykanizsa, Kaposvári út 82. |
| Telefon (fő) | `tel:+36204823646` |
| Telefon (footer ikon, products oldalak) | `tel:06302004646` |
| E-mail | `egzota.nemeth@gmail.com` |

Ha bármelyik változik: **minden HTML-ben** át kell írni (`index.html`, `kapcsolat.html`,
`rolunk.html`, `termsofservice.html`, mindhárom `products*.html`). A `kapcsolat.html`-ben az
e-mail részben Cloudflare-obfuszkált formában is szerepel
(`/cdn-cgi/l/email-protection#...`) — azt a hexet nem lehet kézzel átírni, ott a sima
`mailto:` linket kell használni helyette.

---

## 8. ⚠️ Biztonsági megjegyzések

1. **`CMS_20260505/CMS_token.txt` egy élő GitHub Personal Access Tokent tartalmaz
   plaintextben** (`ghp_...`). Ha ez a fájl valaha felkerült a publikus repóba, a tokent
   **azonnal vissza kell vonni** a GitHub beállításokban és újat generálni. Javaslat: a fájl
   kerüljön `.gitignore`-ba, és soha ne kerüljön be a repóba. (Ezt a felhasználó döntésére
   hagytam — nem módosítottam semmit.)
2. A CMS a tokent a böngésző memóriájában tartja, és **minden művelet a felhasználó
   böngészőjéből, közvetlenül a GitHub API-ra megy**. Ha a CMS-t valaha publikusan hosztolnák,
   bárki, aki ismeri a token-t, teljes írási joggal rendelkezik a repóhoz.
3. Az XSS-felület jelentős: a CMS-ből jövő szöveg mindenhol `innerHTML`-lel kerül a DOM-ba,
   escaping nélkül (weboldal és CMS oldalon egyaránt). Mivel csak a tulajdonos ír a CMS-be,
   ez gyakorlatban alacsony kockázat, de új mező hozzáadásánál érdemes szem előtt tartani.

---

## 9. Javítások naplója (2026-07-30)

Az alábbi hibákat végignéztük és **kijavítottuk**. Ha valami mégis rosszul viselkedik,
itt látszik, mi változott és miért.

### Weboldal — `products-cegeknek.html` + `products-maganszemelyeknek.html` (mindkettőben azonosan)

| # | Hiba | Javítás |
|---|---|---|
| 1 | **Kategóriaszűrő nem talált.** A CMS `Díszfa`/`Fák` értéket ment, a weboldal `Díszfák`-at kínált és `.includes()`-szal hasonlított. A magyar többes szám az ékezetet is váltja, ezért `"Díszfák".includes("Díszfa")` **hamis** → a díszfák egyáltalán nem voltak szűrhetők, a `Fák` opció pedig hiányzott. | Új `normalizeKategoria()` (kisbetű + ékezetek le + záró `k` levágása) mindkét oldalon, `===` összehasonlítással. Így a régi `Díszfák` és az új `Díszfa` adat is előjön ugyanarra az opcióra. Felvéve a hiányzó `Fák` opció. |
| 2 | **Konténerméret-szűrő soha nem talált.** Adat: `"2,9.5,3,"`, szűrőérték: `"2 L"` → `.includes()` hamis. | `kontenerLista()` + `normalizeKontener()`: az adatot elemekre bontjuk, mindkét oldalt normalizáljuk, és **elemre pontosan** egyeztetünk (így a `2` szűrő nem talál rá a `24`-re sem). |
| 3 | **Üres sor az ártáblázatban.** A CMS lezáró vesszője miatt a méret/ár tömb végén üres elem maradt → a popupban egy ` cm` / ` Ft` sor jelent meg. Ezen felül a `... + " Ft" \|\| "—"` kifejezés sosem adhatott `—`-t, hiányzó ár esetén `undefined Ft` / `NaN Ft` jött. | Új `arTablazatSorok()` + `formatAr()`: üres méretű sorok kimaradnak, üres ár → `—`, nem szám → a nyers szöveg, szám → szorozva + `" Ft"`. Semmi adat esetén „Nincs adat”. |
| 4 | **Egyetlen hibás fájl megbuktatta az egész katalógust.** A `loadItems()` minden fájlt JSON-ként próbált parseolni (egy README/`.gitkeep` is elég volt), és a közös `try` blokk miatt ilyenkor **nulla** növény jelent meg. | Csak `.json` fájlok (a `placeholder` kihagyva), és fájlonként külön `try/catch` — egy sérült cikk csak önmagát viszi. |
| 5 | **Végtelen „Betöltés…”.** Hiba esetén csak `console.error` futott, a placeholder szöveg örökre ott maradt. | Hibaüzenet és üres állapot a `.items-uzenet` elemben (új stílus a `CMSITEMS.css`-ben). |
| 6 | **Soros letöltés.** A cikkek egyesével, egymásra várva töltődtek. | `Promise.all` — párhuzamos letöltés, a megjelenítési sorrend változatlan. |
| 7 | **`getAttribute("data-value").trim()`** hiányzó attribútum esetén kivételt dobott volna. | Null-biztos olvasás. |
| 8 | **Sablonmaradványok a lap közepén:** a Webflow-ból örökölt második footer (Webzign logó, idegen TikTok/Instagram link, „© 2025 Webzign”, működésképtelen Privacy/Terms/Cookies linkek) **és** egy angol nyelvű `$0 / $9 / $19 / $29` előfizetési árcsomag-blokk („Starter/Basic/Team/Business”). Mindkettő a növénykatalógus és a fotósáv **között** jelent meg. | Törölve. A valódi footer (`<footer class="footer is-inverse">`) érintetlen. Mellékhatásként a `<div>` egyensúly is helyreállt (193/194 → 131/131). |
| 9 | **A fájl a JavaScript közepén, lezáró tagek nélkül ért véget.** Az utolsó `<script>` blokk a `//nem hasznalt`-nak jelölt, félbevágott `filterItemsBySearch()`-öt tartalmazta → az a blokk szintaktikai hiba miatt sosem futott le, és nem volt `</script></body></html>`. | A holt kód törölve, a dokumentum szabályosan lezárva. |
| 10 | **`Kategória(rendes):`** fejlesztői felirat jelent meg a látogatóknak a popupban. | `Egyedi kategória:` / `Kategória:` |
| 11 | Minden szűréskor, kártyánként `console.log` ment az éles oldalon. | Kikommentelve. |

### `termsofservice.html`
| # | Hiba | Javítás |
|---|---|---|
| 12 | **Hiányzott a `js/vasarlo-modal.js`.** Emiatt erről az egy oldalról a „Növényeink” linkek (menü, hero-gomb, footer — 3 db) tényleg a használaton kívüli `products.html`-re vittek a vásárlóválasztó helyett. | Script felvéve a `</body>` elé. |
| 13 | Lezáratlan `<div class="container">` (a böngésző csak a `</section>`-nél zárta le). | Pótolva. |

### `kapcsolat.html`, `rolunk.html`
| # | Hiba | Javítás |
|---|---|---|
| 14 | **7323 db NUL bájt** a `</html>` után mindkét fájlban (megszakadt fájlírás nyoma). A böngésző ignorálta, de a `grep`/szerkesztők binárisnak látták a fájlt. | Levágva (43 307 → 35 984, illetve 47 049 → 39 726 bájt). |

### CMS — `CMS_20260505/CMS_edited/start.html` (+ `styles.css`)
| # | Hiba | Javítás |
|---|---|---|
| 15 | **Üres mező → üres tömbelem.** A kézi, karakterenkénti feldolgozás üres mezőnél is `[""]`-t adott, ez ment el a JSON-be és okozta a weboldalon a 3. pontban leírt üres táblázatsort. | Új `vesszosLista()` helyettesíti a három while-ciklust; az üres elemek kimaradnak, és a tárolt `categorieshakonteneres` sem kap többé lezáró vesszőt. |
| 16 | **`undefined` szöveg az űrlapban.** Régi, hiányos mezőjű cikk szerkesztésekor az `input.value = content.xy` szó szerint az `"undefined"` sztringet írta be — és így is mentődött vissza. | Mindenhol `|| ""`; a tömbmezők `vesszosLista(...).join(", ")`-tal töltődnek. |
| 17 | **Halmozódó eseményfigyelők.** Az `editItem()` minden egyes szerkesztésnél újra bekötött egy `change` figyelőt ugyanarra a mezőre. | A bekötés törölve (a figyelő globálisan már be van kötve), csak az aktuális állapot beállítása maradt. |
| 18 | Ugyanaz az ártáblázat-hiba, mint a weboldalon (3. pont). | Ugyanaz a `arTablazatSorok()` / `formatAr()` megoldás. |
| 19 | A kategóriaszűrő itt is pontos egyezést várt (`Díszfa` vs `Díszfák`). | `normalizeKategoria()` itt is. |
| 20 | A betöltésszámláló a kihagyott fájlokat is beleszámolta, többet mutatott a valósnál. | A számláló a szűrés után növekszik. |
| 21 | **Az összes `<script>` a `</html>` után állt**, egy korábbi `</body></html>` páron kívül. | A felesleges korai zárótagok törölve, a scriptek a `<body>`-n belül. |
| 22 | A „Teljes leírás” egysoros `<input>` volt. | `<textarea rows="4">` + stílus a `styles.css`-ben. |
| 23 | Kikommentezett, holt `updateCategorySelect()` duplikátum. | Törölve (az élő változat a szűrőket is frissítő blokkban van). |

### Ellenőrzés
- Minden módosított fájl összes inline scriptje átmegy a `node --check` szintaxisellenőrzésen.
- `<div>` / `<body>` / `<html>` / `<section>` tagek egyensúlyban minden módosított fájlban.
- Az új segédfüggvényekre és a **valódi `filterItems()`-re** (DOM-shimmel futtatva) 40+ egységteszt
  fut le hibátlanul: kategória-, konténerméret-, név- és összetett szűrés, `showonweb` elrejtés,
  ártáblázat élhelyzetei.
- **Ami nem lett tesztelve:** az élő GitHub API-hívások, a képfeltöltés és a CMS mentési útvonala —
  ezek valódi tokent és hálózatot igényelnek.

### Nem javított, tudatosan meghagyott
- **`products.html`** — a tulajdonos jelezte, hogy használaton kívül van, ezért érintetlen maradt.
  Megjegyzendő, hogy a fenti hibák nagy része (csonka fájlvég, `showonweb`, szűrők, ártáblázat)
  **továbbra is benne van**.
- **`fix_images.js`** — sehonnan nincs betöltve, feltehetően egyszeri migrációs script. Nem töröltem.
- **`style-guide.html`** — Webflow style guide, semmi nem hivatkozik rá.
- **XSS-felület** — a CMS-ből jövő szöveg escaping nélkül kerül `innerHTML`-be. Mivel csak a
  tulajdonos ír a CMS-be, ez alacsony kockázat, viszont az escaping bevezetése megváltoztatná a
  megjelenítést ott, ahol esetleg szándékosan van HTML a leírásban — ezért nem nyúltam hozzá.
- **A `CMS_token.txt`-ben lévő token** — lásd 8. pont, ez a tulajdonos döntése.

---

## 9/b. Többképes galéria (2026-07-30)

Növényenként több kép tölthető fel, és a popupban lapozni lehet közöttük.

### Mi változott
| Fájl | Változás |
|---|---|
| `CMS_edited/start.html` | `<input type="file" multiple>` + `#kepSav` miniatűr-sáv (✕ törlés, ◀ ▶ sorrend, első = „Fő kép"). Új: `kepLista()`, `kepekHozzaadasa()`, `renderKepSav()`, `kepTorles()`, `kepMozgatas()`, `feltoltKep()`. A JSON `images` tömböt is kap. |
| `CMS_edited/styles.css` | `#kepSav`, `.kep-elem`, `.kep-gomb`, `.kep-szam` szabályok a fájl végén |
| `products-cegeknek.html`, `products-maganszemelyeknek.html` | galéria markup az `.img-container`-ben + `kepLista()` + galéria-JS a popup blokkban (lásd 6.4) |
| `css/CMSITEMS.css` | `.img-container { position: relative }` + galéria-blokk a fájl végén (`.galeria-nyil`, `.galeria-szamlalo`, `.galeria-pottyok`, `.galeria-egykepes`, 991/620px töréspontok) |

### Egyben javított régi hiba: árva képek
Korábban az `editItem()` **letöltötte** a képet blobként, és minden mentés **újra feltöltötte**
új néven → minden egyes szerkesztés egy sehol nem hivatkozott fájlt hagyott a
`static/uploads`-ban. Most a `szerkesztettKepek` a már feltöltött képek **URL-jét** tárolja,
és csak a ténylegesen újonnan kiválasztott fájlok mennek fel. Az `editingCache` megszűnt.

### Amire új képmezőnél figyelni kell
- Képet olvasó kód **mindig** a `kepLista(item)`-en keresztül menjen, ne az `item.image`-ből.
- A galéria vezérlői **nem** kerülhetnek a `#modal-body`-ba (felülíródik) — lásd 6.4.
- A feltöltés maradjon **soros** (GitHub 409 conflict).
- A CMS `#status` a feltöltés közben a haladást írja ki („Kép feltöltése 2/4…").

### Ellenőrzés, ami lefutott
- Mind a 3 módosított HTML összes inline scriptje átment a `node --check`-en; a CSS-ek
  zárójel-egyensúlya rendben; a két `products*` fájl galéria-régiói **betűre azonosak**.
- 23 egységteszt a valódi galéria-kódra (DOM-shimmel): régi egyképes cikk, `images` tömb,
  lapozás körbeéréssel, pöttyök, hiányzó/üres kép, Esc, „nyíl csak nyitott popupnál".
- 27 egységteszt a valódi CMS-kódra: hozzáfűzés/törlés/sorrendezés, új cikk 2 képpel,
  **szerkesztéskor 0 újrafeltöltés**, szerkesztés + 1 új kép → pontosan 1 feltöltés,
  validáció kép nélkül, UTF-8 ékezetek.
- **Nem lett tesztelve:** az élő GitHub API (valódi token kell) és a böngészős megjelenés.

## 10. Munkamódszer ebben a projektben

- **Nincs build, nincs teszt, nincs csomagkezelő.** A változtatás = fájl szerkesztése.
- **Nincs git a mappában** (`git status` nem működik) → nincs undo. Nagyobb módosítás előtt
  érdemes másolatot készíteni a fájlról.
- **Ellenőrzés:** a katalógusoldalak lokálisan `file://`-ról korlátozottan működnek (hiányzó
  `js/`, hiányzó képek, de a GitHub API hívás CORS-szal működik). Reális teszthez lokális
  webszerver kell (`python -m http.server`).
- **Duplikáció-szabály:** a katalóguslogika **2× létezik** – `products-cegeknek.html` és
  `products-maganszemelyeknek.html`. A kettőt **mindig szinkronban kell tartani**; az egyetlen
  szándékos eltérés az `AR_SZORZO` és a táblázat fejléce. A `products.html` használaton kívül
  van, azt hagyd ki. A nav és a footer viszont **minden** oldalon duplikálva van.
- **Új mező felvétele end-to-end** a következő helyeket érinti:
  1. `start.html` — input elem + a `uploadItemAndImage()` olvasás + `itemData` objektum +
     a mezőürítő blokk + `editItem()` visszatöltés + `addCard()` megjelenítés
  2. `products-cegeknek.html` és `products-maganszemelyeknek.html` — `loadItems()` render,
     opcionálisan `filterItems()` + szűrő `<select>`, popup `modal-body`
  3. `css/CMSITEMS.css` — stílus, ha látszó elem
- **Stílusváltoztatás:** ne a `egzota-faiskola.webflow.css`-be írj (Webflow újraexportnál
  felülíródik), hanem az `egzota-responsive.css`-be vagy a `CMSITEMS.css`-be.
- **Kommentelési szokás:** a projekt magyar kommenteket használ, a módosításokat gyakran
  `<!-- MÓDOSÍTÁS N: ... -->` formában jelölik. Érdemes ezt követni.
