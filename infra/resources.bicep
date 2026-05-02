@description('Primary location for all resources')
param location string

@description('Tags to apply to all resources')
param tags object

@description('Resource token for unique naming')
param resourceToken string

@description('Resource name abbreviations')
param abbrs object

@description('Admin email')
param adminEmail string

@description('Child email')
param childEmail string

@description('Google OAuth Client ID')
param googleClientId string

@description('Google OAuth Client Secret')
@secure()
param googleClientSecret string

@description('Static Web App SKU')
param staticWebAppSku string

// ----- Storage Account -----
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: '${abbrs.storageStorageAccounts}${resourceToken}'
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
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

// ----- Static Web App -----
resource swa 'Microsoft.Web/staticSites@2024-04-01' = {
  name: '${abbrs.webStaticSites}${resourceToken}'
  location: location
  tags: union(tags, { 'azd-service-name': 'web' })
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  properties: {
    provider: 'None'
  }
}

// App Settings on the Static Web App expose env vars to the managed Functions API
// (entries / export / roles) via process.env.
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

output storageAccountName string = storage.name
output staticWebAppName string = swa.name
output staticWebAppHostname string = swa.properties.defaultHostname
@secure()
output staticWebAppDeploymentToken string = swa.listSecrets().properties.apiKey
