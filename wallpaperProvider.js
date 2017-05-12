const Lang = imports.lang;

const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png'];

const Provider = new Lang.Class({
  Name: "WallpaperProvider",
  currentWallpaper: null,
  wallpapers: [],

  next: function (callback) {
    function notCurrent(file) {
      return file !== this.currentWallpaper;
    }

    if (this.wallpapers.length > 1) {
      const index = Math.floor(Math.random() * (this.wallpapers.length - 1));
      this.currentWallpaper = this.wallpapers.filter(Lang.bind(this, notCurrent))[index];
    } else {
      this.currentWallpaper = this.wallpapers[0];
    }

    if (callback) {
      callback(this.currentWallpaper);
    }
  },

  get: function () {
    return this.currentWallpaper;
  }
});