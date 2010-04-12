function debug(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                   .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
}

function getStorage() {
  debug("Asking for storage instance");
  return storage;
}

