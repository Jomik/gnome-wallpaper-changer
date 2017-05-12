const Lang = imports.lang;

let Provider = new Lang.Class({
  Name: "WallpaperProvider",
  currentWallpaper: null,
  
  // Choose the next wallpaper, call callback with the parse_name as a parameter when done.
  // Save wallpaper parse_name in this.currentWallpaper.
  next: function(callback) {
    throw new Error('Unimplemented function "next"');
  },
  
  get: function() {
    return this.currentWallpaper;
  }
});