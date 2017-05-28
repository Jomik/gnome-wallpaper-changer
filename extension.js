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
    const separatorItem = new PopupMenu.PopupSeparatorMenuItem('');
    const pauseItem = new PopupMenu.PopupMenuItem('Pause');

    // Add items to menu
    this.menu.addMenuItem(nextItem);
    this.menu.addMenuItem(pauseItem);
    this.menu.addMenuItem(separatorItem);
    this.menu.addMenuItem(settingsItem);

    // Bind events
    settingsItem.connect('activate', Lang.bind(this, this._openSettings));
    nextItem.connect('activate', Lang.bind(this, this._nextWallpaper));
    pauseItem.connect('activate', Lang.bind(this, this._pauseToggle(pauseItem)));
  },

  _openSettings: function () {
    Utils.debug('_openSettings', this.__name__);
    Util.spawn(['gnome-shell-extension-prefs', Self.uuid]);
  },

  _nextWallpaper: function () {
    this.provider.next(Lang.bind(this, this._setWallpaper));
    this._resetTimer();
  },

  _pauseToggle: function (pauseItem) {
    return function () {
      TIMER.running = !TIMER.running;
      Utils.debug('pause - timer running = ' + TIMER.running);
      pauseItem.label.set_text(TIMER.running ? 'Pause' : 'Unpause');
      this._resetTimer();
    }
  },

  _applyProvider: function () {
    Utils.debug('_applyProvider', this.__name__);
    this.provider = Utils.getProvider(this.settings.get_string('provider'));
    this._nextWallpaper();
    this.provider.connect('wallpapers-changed', Lang.bind(this, function (provider) {
      if (provider === this.provider) {
        Utils.debug('wallpapers-changed signal received', this.__name__);
        this._nextWallpaper();
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
      Utils.debug('Set to ' + TIMER.toSeconds(), this.__name__);
      this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
        TIMER.toSeconds(),
        Lang.bind(this, function () {
          this._nextWallpaper();
          this.timer = null;
          return false;
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
      } else {
        Utils.debug('Unable to set wallpaper', this.__name__)
      }
    } else {
      Utils.debug('Can\'t write to org.gnome.desktop.background', this.__name__);
    }
  }
});
