try {
  CreditCardNanny.pluginFlavour = "Chrome";
  CreditCardNanny.debug = function(msg) {
    if (CreditCardNanny.Constants.loggingEnabled) console.log(msg);  
  };
  CreditCardNanny.getStorage = function() {
    return localStorage;  
  }
} catch (err) {
  // could not load this extension!
}
