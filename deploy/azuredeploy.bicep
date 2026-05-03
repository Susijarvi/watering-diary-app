// Azure Resource Manager template for one-click "Deploy to Azure".
// Provisions Storage Account + Table + Static Web App (linked to GitHub repo).
//
// SWA reads the GitHub PAT, creates a workflow file in the repo, and the
// workflow then builds + deploys the app on every push to the chosen branch.

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

@description('Email of the admin user (gets the admin role and CSV export)')
param adminEmail string = 'mauri.jarvinen@gmail.com'

@description('Email of the child user (gets the user role)')
param childEmail string = 'kauri.susijarvi@gmail.com'

@description('Google OAuth Client ID (from Google Cloud Console)')
param googleClientId string

@description('Google OAuth Client Secret (from Google Cloud Console)')
@secure()
param googleClientSecret string

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
    GOOGLE_CLIENT_SECRET: googleClientSecret
  }
}

output webAppUrl string = 'https://${swa.properties.defaultHostname}'
output staticWebAppName string = swa.name
output storageAccountName string = storage.name
output googleRedirectUri string = 'https://${swa.properties.defaultHostname}/.auth/login/google/callback'
