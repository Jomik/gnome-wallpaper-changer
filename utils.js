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
    const provider = Self.imports.providers[p].Provider;
    const providerString = provider.toString();
    const name = providerString.substring(18, providerString.length - 1);
    providers[name] = provider;
  }
  return providers;
}

function getProvider(providerType) {
  if (providerType !== currentProviderType) {
    if (currentProvider) {
      currentProvider.destroy();
    }
    
    const provider = this.getProviders()[providerType];
    if (provider) {
      currentProvider = new provider();
    } else {
      currentProvider = null;
    }
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