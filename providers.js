const Self = imports.misc.extensionUtils.getCurrentExtension();
const FolderProvider = Self.imports.folderProvider.Provider;

let currentProviderType;
let currentProvider;

let providers = {
  "Folder": new FolderProvider()
}

function getWallpaperProvider(providerType) {
  if (providerType !== currentProviderType) {
    currentProvider = providers[providerType] || null;
  }
  return currentProvider;
}