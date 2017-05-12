const Gio = imports.gi.Gio;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const FolderProvider = Self.imports.providers.folderProvider.Provider;

let currentProviderType;
let currentProvider;

const providers = {
  "Folder": new FolderProvider()
}

function getProvider(providerType) {
  if (providerType !== currentProviderType) {
    currentProvider = providers[providerType] || null;
  }
  return currentProvider;
}

function makeDirectory(path) {
  const dir = Gio.File.new_for_path(path);

  if (!dir.query_exists(null)) {
    dir.make_directory_with_parents(null);
  } else if (dir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) !== Gio.FileType.DIRECTORY) {
    throw new Error('Not a directory: ' + path);
  }
  return dir;
}