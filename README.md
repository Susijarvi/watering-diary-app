# Kastelupäiväkirja 🌙

Yksinkertainen mobiili-PWA kastelupäiväkirjan pitämiseen. Lapsi kirjautuu Gmaililla,
vanhempi näkee kaikki merkinnät ja voi exportata CSV:ksi.

---

## 🚀 Yhden klikkauksen asennus Azureen

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSusijarvi%2Fwatering-diary-app%2Fmain%2Fdeploy%2Fazuredeploy.json)

Klikkaa nappia → täytä lomake Azure Portalissa → Deploy → ~5 minuutissa valmis.

### Mitä tarvitset
- **Azure-tilaus** (ilmainen tier riittää)
- **GitHub Personal Access Token** — luo täällä: https://github.com/settings/tokens/new
  - Scopet: `repo`, `workflow`
  - Expiration: 30 päivää tai pidempi
- **Google OAuth Client** — ohjeet alla (luo ennen Deploy-nappia, koska redirect URL tarvitsee SWA:n osoitteen — tai käytä alla olevaa kahden vaiheen ohjetta)

### Suositeltu järjestys

#### 1. Klikkaa Deploy to Azure -nappi
Lomakkeessa täytä:
- **Subscription**: oma Azure-tilaus
- **Resource group**: `Create new` → esim. `kastelupaivakirja-rg`
- **Region**: `westeurope` tai `swedencentral`
- **App Name**: `kasteludiary` (tai oma valinta)
- **Admin Email**: `mauri.jarvinen@gmail.com`
- **Child Email**: `kauri.susijarvi@gmail.com`
- **Google Client Id / Secret**: jätä tyhjäksi tai laita placeholder (`pending`) — täydennetään myöhemmin
- **Repository Url**: `https://github.com/Susijarvi/watering-diary-app`
- **Branch**: `main`
- **Repository Token**: GitHub PAT yltä

Klikkaa **Review + create** → **Create**. Provisiointi kestää ~3 min.

Provisioinnin jälkeen Resource Groupin `Outputs`-välilehdellä näet:
- `webAppUrl` — sovelluksen osoite
- `googleRedirectUri` — käytä tätä Google OAuth -konfiguraatiossa

#### 2. Luo Google OAuth Client
- https://console.cloud.google.com/apis/credentials → **Create Credentials** → **OAuth Client ID**
- Application type: **Web application**
- Authorized redirect URI: `<googleRedirectUri Outputseista>`
  - Esim. `https://stapp-kasteludiary-abc123.azurestaticapps.net/.auth/login/google/callback`
- Authorized JavaScript origin: `https://stapp-kasteludiary-abc123.azurestaticapps.net`
- Kopioi **Client ID** ja **Client Secret**

#### 3. Aseta OAuth-credit Static Web Appiin
Mene **Azure Portal** → Resource group → SWA → **Configuration** → **Application settings**:
- Päivitä `GOOGLE_CLIENT_ID` ja `GOOGLE_CLIENT_SECRET`
- Klikkaa **Save**

#### 4. Avaa sovellus ja kirjaudu Googlella

GitHub Actions on saattanut jo deployata appin. Tarkista:
- https://github.com/Susijarvi/watering-diary-app/actions

Sovellus löytyy osoitteesta `webAppUrl`. Asenna PWA puhelimelle Chromen tai Safarin
"Lisää aloitusnäyttöön" -toiminnolla.

---

## Käyttöoikeudet

| Käyttäjä | Sähköposti | Roolit | Pääsy |
|---|---|---|---|
| Vanhempi | mauri.jarvinen@gmail.com | `admin` | Omat + lapsen merkinnät, CSV-export |
| Lapsi | kauri.susijarvi@gmail.com | `user` | Omat merkinnät |
| Muu | — | — | Pääsy estetty |

Sähköpostit asetetaan Bicep-templaatissa
(`deploy/azuredeploy.bicep`) ja päätyvät Static Web Appin App Settings -arvoiksi
(`ADMIN_EMAIL`, `CHILD_EMAIL`), joita SWA:n roles-funktio
(`api/src/functions/roles.ts`) käyttää roolituksessa.

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
| Auth | Google OAuth (SWA built-in) |
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
