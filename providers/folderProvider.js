const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;
const WallpaperProvider = Self.imports.wallpaperProvider;

let WALLPAPER_PATH = "~/wallpapers";

const Provider = new Lang.Class({
  Name: "Folder",
  Extends: WallpaperProvider.Provider,

  _init: function () {
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
      this.wallpapers = this._getFolderWallpapers(this.dir);
      this.monitor = this.dir.monitor_directory(Gio.FileMonitorFlags.NONE, null)
      this.monitor.connect('changed', Lang.bind(this, this._wallpapersChanged));
    }
  },

  _getFolderWallpapers: function (dir) {
    const children = dir.enumerate_children('standard::name,standard::type',
      Gio.FileQueryInfoFlags.NONE, null);

    let info, files = [];
    while ((info = children.next_file(null)) != null) {
      const type = info.get_file_type();
      const name = info.get_name();
      const child = dir.get_child(name);
      if (this._validWallpaper(type, name)) {
        files.push(child.get_parse_name());
      }
    }

    return files;
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
        if (this._validWallpaper(type, path)) {
          this.wallpapers.push(path);
        }
        break;
    }
  },

  _validWallpaper: function (type, file) {
    const ext = file.substring(file.lastIndexOf('.') + 1).toLowerCase();
    return type == Gio.FileType.REGULAR
      && WallpaperProvider.VALID_EXTENSIONS.indexOf(ext) !== -1
  }
});