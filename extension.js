const Lang = imports.lang;

const Gio = imports.gi.Gio;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Providers = Self.imports.providers;
const Utils = Self.imports.utils;

let panelEntry;

function init() {
  Utils.makeDirectory(Self.path + "/wallpapers");
}

function enable() {
  panelEntry = new WallpaperChangerEntry();
  Main.panel.addToStatusArea("wallpaper-changer-menu", panelEntry);
}

function disable() {
  panelEntry.destroy();
}

let WallpaperChangerEntry = new Lang.Class({
  Extends: PanelMenu.Button,
  Name: "WallpaperChangerEntry",
  
  _init: function() {
    this.parent(0, "WallpaperChangerEntry");
    
    this._applySettings();
    
    let icon = new St.Icon({
      icon_name: 'preferences-desktop-wallpaper-symbolic',
      style_class: 'system-status-icon'
    });
    this.actor.add_child(icon);
    
    this.itemNextWallpaper = new PopupMenu.PopupMenuItem('Next Wallpaper');
    this.menu.addMenuItem(this.itemNextWallpaper);
    this.itemNextWallpaper.connect('activate', Lang.bind(this, function() {
      this.provider.next(this._setWallpaper);
    }));
  },

  _applySettings: function() {
    this.provider = Providers.getWallpaperProvider("Folder");
  },

  _setWallpaper: function(path) {
		let background_setting = new Gio.Settings({schema: "org.gnome.desktop.background"});
    
    if (background_setting.is_writable("picture-uri")) {
			if (background_setting.set_string("picture-uri", "file://" + path) ) {
				Gio.Settings.sync();
			}
		}
  }
});