const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;
const WallpaperProvider = Self.imports.wallpaperProvider.Provider;

const homePath = GLib.getenv("HOME");

let Provider = new Lang.Class({
  Extends: WallpaperProvider,
  Name: "Folder",
  files: [],
  
  _init: function() {
    this.dir = Utils.makeDirectory(homePath + "/wallpapers");
    this.files = this._getFolderContents();
    this.monitor = this.dir.monitor_directory(Gio.FileMonitorFlags.NONE, null)
    this.monitor.connect('changed', Lang.bind(this, this._filesChanged));
  },
  
  next: function(callback) {
    if (this.files.length > 1) {
      function notCurrent(file) {
        return file !== this.currentWallpaper;
      }
      
      this.currentWallpaper = this.files.filter(Lang.bind(this, notCurrent))[
        Math.floor(Math.random() * (this.files.length - 1))
      ];
    } else {
      this.currentWallpaper = this.files[0];
    }
    
    if (callback) {
      callback(this.currentWallpaper);
    }
  },
  
  _getFolderContents: function() {
    let children = this.dir.enumerate_children('standard::name,standard::type',
    Gio.FileQueryInfoFlags.NONE, null);
    
    let info, child, files = [];
    while ((info = children.next_file(null)) != null) {
      let type = info.get_file_type();
      let child = this.dir.get_child(info.get_name());
      if (type == Gio.FileType.REGULAR) {
        files.push(child.get_parse_name());
      }
    }
    
    return files;
  },
  
  _filesChanged: function(monitor, file, other_file, event_type) {
    if (!this.dir.query_exists(null)) {
      monitor.cancel();
      throw new Error("No directory : " + this.dir.get_path());
    }
    
    switch (event_type) {
      case Gio.FileMonitorEvent.DELETED:
        // Remove file
        this.files = this.files.filter(function(f) {
          return f !== file.get_parse_name();
        });
        break;
      case Gio.FileMonitorEvent.CREATED:
        // Add file
        if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.REGULAR) {
          this.files.push(file.get_parse_name());
        }
        break;
    }
  }
});