const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;
const WallpaperProvider = Self.imports.wallpaperProvider;

const homePath = GLib.getenv("HOME");

const Provider = new Lang.Class({
  Extends: WallpaperProvider.Provider,
  Name: "Folder",

  _init: function () {
    this.dir = Utils.makeDirectory(homePath + "/wallpapers");
    this.wallpapers = this._getFolderWallpapers(this.dir);
    this.monitor = this.dir.monitor_directory(Gio.FileMonitorFlags.NONE, null)
    this.monitor.connect('changed', Lang.bind(this, this._wallpapersChanged));
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
        // Remove file
        this.wallpapers = this.wallpapers.filter(function (f) {
          return f !== file.get_parse_name();
        });
        break;
      case Gio.FileMonitorEvent.CREATED:
        // Add file
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