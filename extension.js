const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;

let TIMER_MINUTES = 0;
let TIMER_HOURS = 1;

let panelEntry;

function enable() {
  panelEntry = new WallpaperChangerEntry();
  Main.panel.addToStatusArea("wallpaper-changer-menu", panelEntry);
}

function disable() {
  panelEntry.destroy();
}

const WallpaperChangerEntry = new Lang.Class({
  Extends: PanelMenu.Button,
  Name: "WallpaperChangerEntry",

  _init: function () {
    this.parent(0, "WallpaperChangerEntry");

    this._applySettings();

    const icon = new St.Icon({
      icon_name: 'preferences-desktop-wallpaper-symbolic',
      style_class: 'system-status-icon'
    });
    this.actor.add_child(icon);

    this.itemNextWallpaper = new PopupMenu.PopupMenuItem('Next Wallpaper');
    this.menu.addMenuItem(this.itemNextWallpaper);
    this.itemNextWallpaper.connect('activate', Lang.bind(this, function () {
      this.provider.next(this._setWallpaper);
    }));

    GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
      TIMER_MINUTES * 60 + TIMER_HOURS * 3600,
      Lang.bind(this, function () {
        this.provider.next(this._setWallpaper);
        return true;
      }))
  },

  _applySettings: function () {
    this.provider = Utils.getProvider("Folder");
  },

  _setWallpaper: function (path) {
    const background_setting = new Gio.Settings({ schema: "org.gnome.desktop.background" });

    if (background_setting.is_writable("picture-uri")) {
      if (background_setting.set_string("picture-uri", "file://" + path)) {
        Gio.Settings.sync();
      }
    }
  }
});