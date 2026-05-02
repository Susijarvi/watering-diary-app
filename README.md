# Kastelupäiväkirja 🌙

Yksinkertainen mobiili-PWA kastelupäiväkirjan pitämiseen. Lapsi kirjautuu Gmaililla,
vanhempi näkee kaikki merkinnät ja voi exportata CSV:ksi.

## Stack

| Kerros | Teknologia |
|---|---|
| Hosting | Azure Static Web Apps (Free) |
| API | Azure Functions v4 (Node 20, TypeScript) |
| Tietokanta | Azure Table Storage |
| Frontend | React 18 + Vite + TailwindCSS |
| Auth | Google OAuth (SWA built-in) |
| Infra | Bicep + Azure Developer CLI (`azd`) |

---

## Käyttöönotto Azureen — yksi komento

### 1. Asenna työkalut (kerran)

```powershell
winget install Microsoft.Azd
winget install Git.Git
winget install OpenJS.NodeJS.LTS
```

> Käynnistä terminaali uudestaan asennusten jälkeen.
> Azure CLI:tä (`az`) ei tarvita — kaikki menee `azd`:llä.

### 2. Kirjaudu Azureen ja luo infrastruktuuri

```powershell
cd watering-diary-app
azd auth login
azd up
```

`azd up` kysyy ensimmäisellä kerralla:
- `Environment name` (esim. `prod`)
- `Azure subscription`
- `Location` (suositus: `westeurope` tai `swedencentral`)

Sitten se:
1. Luo Resource Groupin
2. Luo Storage Accountin + DiaryEntries-taulun
3. Luo Static Web Appin
4. Asettaa app settings (Storage, ADMIN_EMAIL, CHILD_EMAIL)
5. Buildaa frontendin + APIn ja deployaa
6. **Tulostaa Static Web Appin osoitteen** ja seuraavat askeleet

### 3. Luo Google OAuth -sovellus

`azd up` -komento tulostaa lopussa SWA:n osoitteen. Mene:

→ https://console.cloud.google.com/apis/credentials

- **Create Credentials** → **OAuth client ID**
- Application type: **Web application**
- Name: `Kastelupäiväkirja`
- Authorized JavaScript origins:
  ```
  https://<STATIC_WEB_APP_HOSTNAME>
  ```
- Authorized redirect URI:
  ```
  https://<STATIC_WEB_APP_HOSTNAME>/.auth/login/google/callback
  ```

Kopioi **Client ID** ja **Client Secret**.

### 4. Aseta credentialit ja redeployaa

```powershell
azd env set GOOGLE_CLIENT_ID "<client-id>"
azd env set GOOGLE_CLIENT_SECRET "<client-secret>"
azd up
```

`azd up` päivittää SWA:n app settings -arvot ilman uudelleenprovisiointia.

### 5. Avaa sovellus

```powershell
azd show
```

Asenna PWA puhelimelle Chromen/Safarin "Lisää aloitusnäyttöön" -toiminnolla.

---

## Käyttöoikeudet

| Käyttäjä | Sähköposti | Roolit | Pääsy |
|---|---|---|---|
| Vanhempi (admin) | mauri.jarvinen@gmail.com | `admin` | Omat + lapsen merkinnät, CSV-export |
| Lapsi | kauri.susijarvi@gmail.com | `user` | Omat merkinnät |
| Muu | — | — | Pääsy estetty |

Sähköpostit asetetaan Bicep-templaatissa
(`infra/main.bicep`, parametrit `adminEmail` ja `childEmail`) ja päätyvät
Static Web Appin App Settings -arvoiksi (`ADMIN_EMAIL`, `CHILD_EMAIL`),
joita SWA:n roles-funktio (`api/src/functions/roles.ts`) käyttää.

---

## Päivitykset

```powershell
# Pelkkä koodimuutos (frontend tai API)
azd deploy

# Infran muutos (Bicep) tai env-muuttujan päivitys
azd provision

# Molemmat
azd up
```

### Sähköpostien tai roolien muutos

```powershell
azd env set ADMIN_EMAIL "uusi@gmail.com"
azd env set CHILD_EMAIL "lapsi@gmail.com"
azd provision
```

---

## Kehitys paikallisesti

```powershell
# Asenna riippuvuudet
npm install
cd api && npm install && cd ..

# Käynnistä Azure Static Web Apps CLI emulator
npm install -g @azure/static-web-apps-cli
swa start http://localhost:5173 --run "npm run dev" --api-location api
```

Avautuu osoitteessa `http://localhost:4280`.

Aseta `api/local.settings.json` (kopioi `local.settings.json.example`).

---

## Tiedot

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
