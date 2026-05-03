// Azure Resource Manager template for one-click "Deploy to Azure".
// Provisions Storage Account + Table + Static Web App (linked to GitHub repo).
//
// Authentication is custom Google Sign-In (Google Identity Services + signed
// session cookie). SWA's built-in auth is NOT used — only GOOGLE_CLIENT_ID is
// needed (no client secret), plus an auto-generated SESSION_SECRET for signing
// session cookies.

@description('Short name for the app, used as a prefix in resource names')
@minLength(2)
@maxLength(20)
param appName string = 'kasteludiary'

@description('Azure region for all resources')
@allowed([
  'westeurope'
  'northeurope'
  'swedencentral'
  'francecentral'
  'germanywestcentral'
  'uksouth'
  'eastus2'
  'westus2'
])
param location string = 'westeurope'

@description('Email of the admin user — gets the admin role and CSV export')
param adminEmail string

@description('Email of the secondary user — gets the user role')
param childEmail string

@description('Google OAuth Client ID (from Google Cloud Console). Client secret NOT needed — we only validate ID tokens.')
param googleClientId string

@description('Auto-generated session signing secret. Leave default to generate a new one. Changing this invalidates active sessions.')
@secure()
param sessionSecret string = newGuid()

@description('GitHub repository URL, e.g. https://github.com/Susijarvi/watering-diary-app')
param repositoryUrl string

@description('Branch to deploy from')
param branch string = 'main'

@description('GitHub Personal Access Token with repo + workflow scopes — SWA uses it to create a deploy workflow')
@secure()
param repositoryToken string

var resourceToken = toLower(uniqueString(resourceGroup().id, appName))

// ---------- Storage ----------
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st${resourceToken}'
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    accessTier: 'Hot'
  }
  tags: { app: appName }
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource diaryTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'DiaryEntries'
}

var storageKey = storage.listKeys().keys[0].value
var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storageKey};EndpointSuffix=${environment().suffixes.storage}'

// ---------- Static Web App ----------
resource swa 'Microsoft.Web/staticSites@2024-04-01' = {
  name: 'stapp-${appName}-${resourceToken}'
  location: location
  sku: { name: 'Free', tier: 'Free' }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: 'dist'
    }
  }
  tags: { app: appName }
}

resource swaAppSettings 'Microsoft.Web/staticSites/config@2024-04-01' = {
  parent: swa
  name: 'appsettings'
  properties: {
    AZURE_STORAGE_CONNECTION_STRING: storageConnectionString
    ADMIN_EMAIL: adminEmail
    CHILD_EMAIL: childEmail
    GOOGLE_CLIENT_ID: googleClientId
    SESSION_SECRET: sessionSecret
  }
}

output webAppUrl string = 'https://${swa.properties.defaultHostname}'
output staticWebAppName string = swa.name
output storageAccountName string = storage.name
output googleAuthorizedJavascriptOrigin string = 'https://${swa.properties.defaultHostname}'
