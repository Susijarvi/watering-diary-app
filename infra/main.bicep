targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment used as a suffix on resources')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Email of the admin user (gets admin role)')
param adminEmail string = 'mauri.jarvinen@gmail.com'

@description('Email of the child user (gets user role)')
param childEmail string = 'kauri.susijarvi@gmail.com'

@description('Google OAuth Client ID (from Google Cloud Console). Empty until OAuth is created.')
param googleClientId string = ''

@description('Google OAuth Client Secret (from Google Cloud Console). Empty until OAuth is created.')
@secure()
param googleClientSecret string = ''

@description('Optional Static Web App SKU. Free or Standard.')
@allowed([
  'Free'
  'Standard'
])
param staticWebAppSku string = 'Free'

var tags = {
  'azd-env-name': environmentName
  app: 'watering-diary'
}

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

module resources 'resources.bicep' = {
  name: 'resources'
  scope: rg
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    abbrs: abbrs
    adminEmail: adminEmail
    childEmail: childEmail
    googleClientId: googleClientId
    googleClientSecret: googleClientSecret
    staticWebAppSku: staticWebAppSku
  }
}

output AZURE_LOCATION string = location
output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_STORAGE_ACCOUNT_NAME string = resources.outputs.storageAccountName
output STATIC_WEB_APP_NAME string = resources.outputs.staticWebAppName
output STATIC_WEB_APP_HOSTNAME string = resources.outputs.staticWebAppHostname
output STATIC_WEB_APP_DEPLOYMENT_TOKEN string = resources.outputs.staticWebAppDeploymentToken
