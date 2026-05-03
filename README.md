# Kastelupäiväkirja 🌙

Yksinkertainen mobiili-PWA kastelupäiväkirjan pitämiseen. Lapsi kirjautuu Gmaililla,
vanhempi näkee kaikki merkinnät ja voi exportata CSV:ksi.

---

## 🚀 Yhden klikkauksen asennus Azureen

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSusijarvi%2Fwatering-diary-app%2Fmain%2Fdeploy%2Fazuredeploy.json)

Klikkaa nappia → täytä lomake Azure Portalissa → Deploy → ~5 minuutissa valmis.

### Mitä tarvitset
- **Azure-tilaus** (ilmainen tier riittää, ~0 €/kk)
- **GitHub Personal Access Token** — luo täällä: https://github.com/settings/tokens/new
  - Scopet: `repo`, `workflow`
  - Expiration: 90 päivää tai pidempi
- **Google OAuth Client ID** — ohjeet alla (vain Client ID tarvitaan, ei secretia)

### Suositeltu järjestys

#### 1. Klikkaa Deploy to Azure -nappi
Lomakkeessa täytä:
- **Subscription**: oma Azure-tilaus
- **Resource group**: `Create new` → esim. `kastelupaivakirja-rg`
- **Region**: `westeurope` tai `swedencentral`
- **App Name**: `kasteludiary` (tai oma valinta)
- **Admin Email**: sähköposti joka saa admin-roolin (CSV-export)
- **Child Email**: sähköposti joka saa user-roolin (peruskäyttäjä)
- **Google Client Id**: laita placeholder (`pending`) — täydennetään kohdassa 3
- **Session Secret**: jätä oletus (auto-generoitu)
- **Repository Url**: `https://github.com/Susijarvi/watering-diary-app`
- **Branch**: `main`
- **Repository Token**: GitHub PAT yltä

Klikkaa **Review + create** → **Create**. Provisiointi kestää ~3 min.

Provisioinnin jälkeen → Resource Group → **Deployments** → uusin deployment →
**Outputs** → näet:
- `webAppUrl` — sovelluksen osoite (esim. `https://stapp-kasteludiary-abc123.azurestaticapps.net`)
- `googleAuthorizedJavascriptOrigin` — käytä tätä Google OAuth -konfiguraatiossa

#### 2. Luo Google OAuth Client
- Mene → https://console.cloud.google.com/apis/credentials
- **Create Credentials** → **OAuth Client ID**
- Application type: **Web application**
- Name: `Kastelupäiväkirja`
- **Authorized JavaScript origins**:
  ```
  https://<webAppUrl Outputseista>
  ```
- **Authorized redirect URIs**: jätä tyhjäksi (emme käytä redirect-flow:ta)
- Klikkaa **Create**
- Kopioi **Client ID** (esim. `123456789-abcd.apps.googleusercontent.com`)

> Client Secret EI ole tarpeen — käytämme Google Identity Services -kirjastoa joka
> palauttaa ID tokenin suoraan selaimelle, ei käytä server-puolen token exchange -flow:ta.

#### 3. Päivitä Google Client ID Static Web Appiin
**Azure Portal** → Resource group → Static Web App → **Environment variables**
(tai vanhempi UI: Configuration → Application settings):
- Etsi `GOOGLE_CLIENT_ID`, klikkaa Edit, vaihda arvoksi yltä kopioitu Client ID
- **Save**

#### 4. Avaa sovellus ja kirjaudu Googlella

Tarkista että GitHub Actions on deployannut koodin:
- https://github.com/Susijarvi/watering-diary-app/actions

Avaa sovellus `webAppUrl`-osoitteesta. Klikkaa "Sign in with Google" → kirjaudu
sallitulla Gmail-tunnuksella → pääset sisään.

Asenna PWA puhelimelle: Chrome/Safari → "Lisää aloitusnäyttöön".

---

## Käyttöoikeudet

| Rooli | Asetus | Pääsy |
|---|---|---|
| Admin | `ADMIN_EMAIL` (asetetaan deploy-vaiheessa) | Kaikki merkinnät, CSV-export |
| User | `CHILD_EMAIL` (asetetaan deploy-vaiheessa) | Kaikki merkinnät |
| Muu | — | Pääsy estetty (login palauttaa 403) |

Sähköpostit annetaan Deploy to Azure -lomakkeella ja päätyvät Static Web Appin
Application Settings -arvoiksi (`ADMIN_EMAIL`, `CHILD_EMAIL`). Backend
(`api/src/shared/auth.ts:emailToRole`) vertaa sisäänkirjautuvan käyttäjän
sähköpostia näihin ja päättää roolin (admin / user / pääsy estetty).

Sähköpostien päivitys jälkikäteen: Azure Portal → Static Web App →
Environment variables → muokkaa → Save.

---

## Päivitykset

`git push` → GitHub Actions buildaa ja deployaa automaattisesti.

Sähköpostien tai muiden asetusten päivitys: Azure Portalissa SWA → Configuration →
Application settings → muokkaa → Save.

---

## Stack

| Kerros | Teknologia |
|---|---|
| Hosting | Azure Static Web Apps (Free) |
| API | Azure Functions v4 (Node 20, TypeScript) |
| Tietokanta | Azure Table Storage |
| Frontend | React 18 + Vite + TailwindCSS |
| Auth | Google Identity Services + signed session cookie (HS256, 7d) |
| Infra | Bicep (deploy/azuredeploy.bicep) |
| Deploy | GitHub Actions (auto-luotu SWA:n toimesta) |

---

## Tietomalli

Taulu **DiaryEntries** Azure Table Storagessa:

| Kenttä | Tyyppi | Kuvaus |
|---|---|---|
| `PartitionKey` | string | Googlen `userId` |
| `RowKey` | string | `YYYY-MM-DD` |
| `hadDiaper` | boolean | Oliko vaippa yöllä |
| `diaperWet` | boolean / null | Kastuiko vaippa (null = ei vaippaa) |
| `bedWet` | boolean | Kastuiko sänky |
| `userEmail` | string | Sähköposti (CSV:tä varten) |
| `updatedAt` | string | ISO-aikaleima |

---

## Kustannukset

| Komponentti | Hinta |
|---|---|
| Azure Static Web Apps Free tier | **0 €/kk** (100 GB liikennettä) |
| Azure Table Storage | **~0 €/kk** muutamalla sadalla rivillä |
| **Yhteensä** | **~0 €/kk** |

---

## Kehitys paikallisesti

```powershell
# Asenna riippuvuudet
npm install
npm run build:api          # asentaa myös api/-puolen

# Käynnistä Azure Static Web Apps CLI emulator
npm install -g @azure/static-web-apps-cli
swa start http://localhost:5173 --run "npm run dev" --api-location api
```

Avautuu osoitteessa `http://localhost:4280`.
Aseta `api/local.settings.json` (kopioi `local.settings.json.example`).

---

## ARM-templaatin uudelleenrakennus (kehittäjille)

Jos muokkaat `deploy/azuredeploy.bicep` -tiedostoa, käännä uusi JSON:

```powershell
& "$env:USERPROFILE\.bicep\bicep.exe" build deploy/azuredeploy.bicep
git add deploy/azuredeploy.json && git commit -m "Update ARM template"
git push
```

Bicep CLI: `Invoke-WebRequest https://github.com/Azure/bicep/releases/latest/download/bicep-win-x64.exe -OutFile $env:USERPROFILE\.bicep\bicep.exe`
