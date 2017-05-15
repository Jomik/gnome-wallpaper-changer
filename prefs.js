const Lang = imports.lang;

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;

let settings;

function init() {
  settings = Utils.getSettings();
}

function buildPrefsWidget() {
  const main = Gtk.Builder.new_from_file(Self.dir.get_path() + '/preferences/extension.xml');
  const widget = main.get_object('prefs_widget');

  const versionLabel = main.get_object('version_info');
  versionLabel.set_text('[Wallpaper Changer v' + Self.metadata.version + ']');

  const providerList = main.get_object('field_provider');
  for (let provider in Utils.getProviders()) {
    providerList.append(provider, provider);
  }

  settings.bind('minutes', main.get_object('field_minutes'), 'value', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('hours', main.get_object('field_hours'), 'value', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('provider', main.get_object('field_provider'), 'active-id', Gio.SettingsBindFlags.DEFAULT);

  if (providerList.get_active() === -1) {
    providerList.set_active(0);
  }
  
  _updateProviderTab(main)();
  settings.connect('changed::provider', Lang.bind(this, _updateProviderTab(main)));

  widget.show_all();
  return widget;
}

function _updateProviderTab(main) {
  return function () {
    const providerPlace = main.get_object('provider_prefs');
    const providerPrefs = Utils.getProvider(settings.get_string('provider')).getPreferences().get_object('prefs_page');
    providerPlace.foreach(function (widget) {
      providerPlace.remove(widget);
    });
    if (providerPrefs) {
      providerPrefs.forall(function (widget) {
        providerPrefs.remove(widget);
        providerPlace.add(widget);
      });
      providerPlace.show_all();
    }
  }
}