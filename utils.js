const Gio = imports.gi.Gio;

function makeDirectory(path) {
  let dir = Gio.File.new_for_path(path);
  
  if (!dir.query_exists(null)) {
    dir.make_directory_with_parents(null);
  } else if (dir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) !== Gio.FileType.DIRECTORY) {
    throw new Error('Not a directory: ' + path);
  }
  return dir;
}