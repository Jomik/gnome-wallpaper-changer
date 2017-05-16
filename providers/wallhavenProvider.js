const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Soup = imports.gi.Soup;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Self.imports.utils;
const WallpaperProvider = Self.imports.wallpaperProvider;

const homePath = GLib.getenv("HOME");

const OPTIONS = {
  query: "",
  categories: '100',
  purity: '100',
  resolutions: "",
  ratios: "16x9",
  sorting: "favorites",
  order: "desc",

  toParameterString: function () {
    return "categories=" + this.categories
      + "&purity=" + this.purity
      + "&resolutions=" + this.resolutions
      + "&ratios=" + this.ratios
      + "&sorting=" + this.sorting
      + "&order=" + this.order
      + "&q=" + this.query;
  }
}

const Provider = new Lang.Class({
  Name: 'Wallhaven',
  Extends: WallpaperProvider.Provider,
  wallpapers: [],

  _init: function () {
    this.session = new Soup.Session();
    this.page = 0;
    this.dir = Utils.makeDirectory(Self.path + "/" + this.__name__);
    this.wallpapers = Utils.getFolderWallpapers(this.dir);
  },

  next: function (callback) {
    if (this.wallpapers.length === 0) {
      let called = false;
      this._downloadPage(++this.page, Lang.bind(this, function (path) {
        this.wallpapers.push(path);
        if (!called) {
          called = true;
          this._deleteCurrentWallpaper();
          this.currentWallpaper = this.wallpapers.shift();
          callback(this.currentWallpaper);
        }
      }));
    } else {
      this._deleteCurrentWallpaper();
      this.currentWallpaper = this.wallpapers.shift();
      callback(this.currentWallpaper);
    }
  },

  destroy: function () {
    this.session.abort();
  },

  _deleteCurrentWallpaper: function () {
    if (this.currentWallpaper) {
      Gio.File.new_for_path(this.currentWallpaper).delete_async(GLib.PRIORITY_DEFAULT, null,
        function (file, res) {
          file.delete_finish(res);
        });
    }
  },

  _downloadPage: function (page, callback) {
    const request = this.session.request_http('GET',
      'https://alpha.wallhaven.cc/search?' + OPTIONS.toParameterString() + '&page=' + page);
    const message = request.get_message();
    this.session.queue_message(message, Lang.bind(this, function (session, message) {
      if (message.status_code != Soup.KnownStatusCode.OK) {
        global.log('_downloadPage error: ' + message.status_code);
        return;
      }

      const matches = message.response_body.data.match(/data-wallpaper-id="(\d+)"/g);
      const ids = matches.map(function (elem) {
        return elem.match(/\d+/);
      });
      ids.forEach(Lang.bind(this, function (id) {
        this._downloadWallpaper(id, callback);
      }));
    }));
  },

  _downloadWallpaper: function (id, callback) {
    this._requestWallpaperType(id, Lang.bind(this, function (type) {
      const request = this.session.request_http('GET', 'https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-' + id + '.' + type);
      const message = request.get_message();

      const outputFile = this.dir.get_child('wallhaven-' + id + '.' + type);
      if (!outputFile.query_exists(null)) {
        const outputStream = outputFile.create(Gio.FileCreateFlags.NONE, null);

        this.session.queue_message(message, function (session, message) {
          const contents = message.response_body.flatten().get_as_bytes();
          outputStream.write_bytes(contents, null);
          outputStream.close(null);
          callback(outputFile.get_parse_name());
        });
      }
    }));
  },

  _requestWallpaperType: function (id, callback) {
    const request = this.session.request_http('GET', 'https://alpha.wallhaven.cc/wallpaper/' + id);
    const message = request.get_message();
    this.session.queue_message(message, function (session, message) {
      if (message.status_code != Soup.KnownStatusCode.OK) {
        global.log('_requestWallpaperData error: ' + message.status_code);
        return;
      }

      const type = message.response_body.data.match(/\/\/wallpapers.wallhaven.cc\/wallpapers\/full\/wallhaven-\d+.(\w+)/i)[1];
      if (callback) {
        callback(type);
      }
    });
  }
});