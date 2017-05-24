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
  running: true,

  toSeconds: function () {
    return this.minutes * 60 + this.hours * 3600
  }
}

let panelEntry;

function init() {
}

function enable() {
  panelEntry = new WallpaperChangerEntry();
  Main.panel.addToStatusArea('wallpaper-changer-menu', panelEntry);
}

function disable() {
  panelEntry.destroy();
}

const WallpaperChangerEntry = new Lang.Class({
  Extends: PanelMenu.Button,
  Name: 'WallpaperChangerEntry',

  _init: function () {
    this.parent(0, 'WallpaperChangerEntry');

    this.settings = Utils.getSettings();
    this.settings.connect('changed::minutes', Lang.bind(this, this._applyTimer));
    this.settings.connect('changed::hours', Lang.bind(this, this._applyTimer));
    this.settings.connect('changed::provider', Lang.bind(this, this._applyProvider));

    this.settings.connect('changed::debug', Lang.bind(this, function () {
      Utils.DEBUG = this.settings.get_boolean('debug');
    }));
    Utils.DEBUG = this.settings.get_boolean('debug');
    Utils.debug('_init', this.__name__);

    this._applyProvider();
    this._applyTimer();

    const icon = new St.Icon({
      icon_name: 'preferences-desktop-wallpaper-symbolic',
      style_class: 'system-status-icon'
    });
    this.actor.add_child(icon);

    // Construct items
    const nextItem = new PopupMenu.PopupMenuItem('Next Wallpaper');
    const settingsItem = new PopupMenu.PopupMenuItem('Settings');
    const pauseItem = new PopupMenu.PopupMenuItem('Pause');
    const unpauseItem = new PopupMenu.PopupMenuItem('Unpause');

    // Add items to menu
    this.menu.addMenuItem(nextItem);
    this.menu.addMenuItem(settingsItem);
    this.menu.addMenuItem(pauseItem);
    this.menu.addMenuItem(unpauseItem);
    unpauseItem.actor.visible = false;

    // Bind events
    settingsItem.connect('activate', Lang.bind(this, this._openSettings));
    nextItem.connect('activate', Lang.bind(this, function () {
      this.provider.next(this._setWallpaper);
      this._resetTimer();
    }));
    pauseItem.connect('activate', Lang.bind(this, function () {
      Utils.debug('pause');
      TIMER.running = false;
      pauseItem.actor.visible = false;
      unpauseItem.actor.visible = true;

      this._resetTimer();
    }));
    unpauseItem.connect('activate', Lang.bind(this, function () {
      Utils.debug('unpause');
      TIMER.running = true;
      pauseItem.actor.visible = true;
      unpauseItem.actor.visible = false;

      this.provider.next(this._setWallpaper);
      this._resetTimer();
    }));
  },

  _openSettings: function () {
    Utils.debug('_openSettings', this.__name__);
    Util.spawn(['gnome-shell-extension-prefs', Self.uuid]);
  },

  _applyProvider: function () {
    Utils.debug('_applyProvider', this.__name__);
    this.provider = Utils.getProvider(this.settings.get_string('provider'));
    this.provider.next(this._setWallpaper);
    this.provider.connect('wallpapers-changed', Lang.bind(this, function (provider) {
      if (provider === this.provider) {
        Utils.debug('wallpapers-changed', this.__name__);
        this.provider.next(this._setWallpaper);
        this._resetTimer();
      }
    }));
  },

  _applyTimer: function () {
    Utils.debug('_applyTimer', this.__name__);
    TIMER.minutes = this.settings.get_int('minutes');
    TIMER.hours = this.settings.get_int('hours');

    this._resetTimer();
  },

  _resetTimer: function () {
    Utils.debug('_resetTimer', this.__name__);
    if (this.timer) {
      GLib.Source.remove(this.timer);
    }

    if (TIMER.running && TIMER.toSeconds() > 0) {
      Utils.debug('set to ' + TIMER.toSeconds(), this.__name__);
      this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
        TIMER.toSeconds(),
        Lang.bind(this, function () {
          this.provider.next(this._setWallpaper);
          return true;
        })
      );
    } else {
      this.timer = null;
    }
  },

  _setWallpaper: function (path) {
    Utils.debug('_setWallpaper', this.__name__);
    const background_setting = new Gio.Settings({ schema: 'org.gnome.desktop.background' });

    if (background_setting.is_writable('picture-uri')) {
      if (background_setting.set_string('picture-uri', 'file://' + path)) {
        Utils.debug(path, this.__name__);
        Gio.Settings.sync();
      }
    }
  }
});
