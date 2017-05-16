const Lang = imports.lang;

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Util = imports.misc.util;
const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;

const TIMER = {
  minutes: 0,
  hours: 0,

  toSeconds: function () {
    return this.minutes * 60 + this.hours * 3600
  }
}

let panelEntry;

function init() {
}

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

    this.settings = Utils.getSettings();
    this._applyProvider();
    this._applyTimer();
    this.settings.connect('changed::minutes', Lang.bind(this, this._applyTimer));
    this.settings.connect('changed::hours', Lang.bind(this, this._applyTimer));
    this.settings.connect('changed::provider', Lang.bind(this, this._applyProvider));

    const icon = new St.Icon({
      icon_name: 'preferences-desktop-wallpaper-symbolic',
      style_class: 'system-status-icon'
    });
    this.actor.add_child(icon);

    // Construct items
    const nextItem = new PopupMenu.PopupMenuItem('Next Wallpaper');
    const settingsMenuItem = new PopupMenu.PopupMenuItem('Settings');

    // Add items to menu
    this.menu.addMenuItem(nextItem);
    this.menu.addMenuItem(settingsMenuItem);

    // Bind events
    settingsMenuItem.connect('activate', Lang.bind(this, this._openSettings));
    nextItem.connect('activate', Lang.bind(this, function () {
      this.provider.next(this._setWallpaper);
      this._resetTimer();
    }));
  },

  _openSettings: function () {
    Util.spawn(["gnome-shell-extension-prefs", Self.uuid]);
  },

  _applyProvider: function () {
    this.provider = Utils.getProvider(this.settings.get_string('provider'));
    this.provider.next(this._setWallpaper);
  },

  _applyTimer: function () {
    TIMER.minutes = this.settings.get_int('minutes');
    TIMER.hours = this.settings.get_int('hours');

    this._resetTimer();
  },

  _resetTimer: function () {
    if (this.timer) {
      GLib.Source.remove(this.timer);
    }

    if (TIMER.toSeconds() > 0) {
      this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
        TIMER.toSeconds(),
        Lang.bind(this, function () {
          this.provider.next(this._setWallpaper);
          return true;
        }));
    } else {
      this.timer = null;
    }
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
