const Lang = imports.lang;

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Self = imports.misc.extensionUtils.getCurrentExtension();

const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif'];

const Provider = new Lang.Class({
  Name: "WallpaperProviderBase",
  Abstract: true,
  currentWallpaper: null,
  wallpapers: [],

  next: function (callback) {
    function notCurrent(file) {
      return file !== this.currentWallpaper;
    }

    if (this.wallpapers.length > 1) {
      const index = Math.floor(Math.random() * (this.wallpapers.length - 1));
      this.currentWallpaper = this.wallpapers.filter(Lang.bind(this, notCurrent))[index];
    } else {
      this.currentWallpaper = this.wallpapers[0];
    }

    if (callback) {
      callback(this.currentWallpaper);
    }
  },

  get: function () {
    return this.currentWallpaper;
  },

  getPreferences: function () {
    let prefs = Self.dir.get_path() + '/preferences/' + this.__name__.toLowerCase() + '.xml';
    let prefsFile = Gio.File.new_for_path(prefs);
    if (!prefsFile.query_exists(null)) {
      prefs = Self.dir.get_path() + '/preferences/provider.xml';
    }
    const builder = Gtk.Builder.new_from_file(prefs);
    return builder;
  },

  destroy: function () {
  }
});