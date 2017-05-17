const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;
const WallpaperProvider = Self.imports.wallpaperProvider;

let WALLPAPER_PATH = "/usr/share/backgrounds/gnome";

const Provider = new Lang.Class({
  Name: "Folder",
  Extends: WallpaperProvider.Provider,

  _init: function () {
    this.parent();
    this.settings = Utils.getSettings(this);
    this._applySettings();
    this.settings.connect('changed', Lang.bind(this, this._applySettings));

  },

  getPreferences: function () {
    const prefs = this.parent();
    this.settings.bind('wallpaper-path', prefs.get_object('field_wallpaper_path'), 'text', Gio.SettingsBindFlags.DEFAULT);
    return prefs;
  },

  destroy: function () {
    if (this.monitor) {
      this.monitor.cancel();
    }
  },

  _applySettings: function () {
    WALLPAPER_PATH = this.settings.get_string('wallpaper-path');

    this._setupWallpaperDir();
  },

  _setupWallpaperDir: function () {
    if (this.monitor) {
      this.monitor.cancel();
    }
    this.monitor = null;
    this.dir = Gio.File.new_for_path(Utils.realPath(WALLPAPER_PATH));
    if (this.dir.query_exists(null)) {
      this.wallpapers = Utils.getFolderWallpapers(this.dir);
      this.monitor = this.dir.monitor_directory(Gio.FileMonitorFlags.NONE, null)
      this.monitor.connect('changed', Lang.bind(this, this._wallpapersChanged));
    }
  },

  _wallpapersChanged: function (monitor, file, other_file, event_type) {
    if (!this.dir.query_exists(null)) {
      monitor.cancel();
      throw new Error("No directory : " + this.dir.get_path());
    }

    switch (event_type) {
      case Gio.FileMonitorEvent.DELETED:
        this.wallpapers = this.wallpapers.filter(function (f) {
          return f !== file.get_parse_name();
        });
        break;
      case Gio.FileMonitorEvent.CREATED:
        const path = file.get_parse_name();
        const type = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null);
        if (Utils.isValidWallpaper(type, path)) {
          this.wallpapers.push(path);
        }
        break;
    }
  }
});