const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Self = imports.misc.extensionUtils.getCurrentExtension();

const homePath = GLib.getenv("HOME");

let providers;
let currentProviderType;
let currentProvider;

function getProviders() {
  if (providers) {
    return providers;
  }

  providers = {};
  for (let p in Self.imports.providers) {
    const provider = new Self.imports.providers[p].Provider();
    if (provider instanceof Self.imports.wallpaperProvider.Provider) {
      providers[provider.__name__] = provider;
    }
  }
  return providers;
}

function getProvider(providerType) {
  if (providerType !== currentProviderType) {
    currentProvider = this.getProviders()[providerType] || null;
  }
  return currentProvider;
}

function getSettings(provider) {
  let sub = "";
  if (provider) {
    sub = ".providers." + provider.__name__.toLowerCase();
  }
  const schema = 'org.gnome.shell.extensions.wallpaper-changer' + sub;

  const GioSSS = Gio.SettingsSchemaSource;

  const schemaDir = Self.dir.get_child('schemas');
  let schemaSource;
  if (schemaDir.query_exists(null)) {
    schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
      GioSSS.get_default(),
      false);
  } else {
    schemaSource = GioSSS.get_default();
  }

  const schemaObj = schemaSource.lookup(schema, true);
  if (!schemaObj) {
    throw new Error('Schema ' + schema + ' could not be found for extension ' +
      Self.metadata.uuid + '. Please check your installation.');
  }

  return new Gio.Settings({ settings_schema: schemaObj });
}

function realPath(path) {
  return path.startsWith('~')
    ? homePath + path.slice(1)
    : path;
}