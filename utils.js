const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Self = imports.misc.extensionUtils.getCurrentExtension();

const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif'];

const HOME = GLib.getenv("HOME");

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
    ? HOME
    + path.slice(1)
    : path;
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

function getFolderWallpapers(dir) {
  const children = dir.enumerate_children('standard::name,standard::type',
    Gio.FileQueryInfoFlags.NONE, null);

  let info, files = [];
  while ((info = children.next_file(null)) != null) {
    const type = info.get_file_type();
    const name = info.get_name();
    const child = dir.get_child(name);
    if (isValidWallpaper(name, type)) {
      files.push(child.get_parse_name());
    }
  }

  return files;
}

function isValidWallpaper(file, type) {
  const ext = file.substring(file.lastIndexOf('.') + 1).toLowerCase();
  return type == Gio.FileType.REGULAR
    && VALID_EXTENSIONS.indexOf(ext) !== -1
}