try {
  CreditCardNanny.pluginFlavour = "Firefox";
  CreditCardNanny.gaTrack = function(eventName, additionalData) {
    // a no-op
    return true;
  };
  CreditCardNanny.debug = function(msg) {
    if (CreditCardNanny.Constants.loggingEnabled) {
      var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                     .getService(Components.interfaces.nsIConsoleService);
      consoleService.logStringMessage(msg);      
    }
  };
  CreditCardNanny.getStorage = function() {
    return CreditCardNanny.storage;  
  };
} catch (err) {
  // could not load this extension!
}
