CreditCardNanny.Constants.prefsPrefix = "extensions.creditcardnanny.";
CreditCardNanny.storage = {
  prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
  setItem: function(k, v) {
    this.prefs.setCharPref(CreditCardNanny.Constants.prefsPrefix + k, v);
    this.prefs.savePrefFile(null);
  },
  getItem: function(k) {
    try {
      return this.prefs.getCharPref(CreditCardNanny.Constants.prefsPrefix + k);        
    } catch (e) {
      // key does not exist
      return null;
     }
  }
};

CreditCardNanny.isFlagged = function(url, actions) {
  CreditCardNanny.debug("Received msg from listener URL = " + url + " and action = " + actions);
  if (this.containsSuspiciousAction(actions)) {
    CreditCardNanny.debug("Cleartext form mailer detected!")
    var jsonRep = {
      url: url,
      formActions: actions
    }
    this.reportPage(jsonRep);
    return true;
  } else {
    CreditCardNanny.debug("All forms look OK.")
    return false;
  }  
};

CreditCardNanny.checkDocument = function(e) {
  var doc = e.originalTarget;
  if (doc && doc.URL && doc.URL.indexOf("https:") == 0) {

    // inspect all forms on the document
    var forms = doc.forms;
    if (forms.length > 0) {

      // loop thru forms
      var formActions = Array();
      var i;
      for (i = 0; i < forms.length; i++) {
        formActions[i] = forms[i].action;
      }
      
      if (CreditCardNanny.isFlagged(doc.URL, formActions)) {
        doc.body.innerHTML = CreditCardNannyAlerter.alertHTML(doc) + doc.body.innerHTML;
      }
    }
  }
}

Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage("CreditCardNanny is " + CreditCardNanny);
Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage("CreditCardNanny.debug is " + CreditCardNanny.debug);


window.addEventListener("DOMContentLoaded", CreditCardNanny.checkDocument, false);
window.addEventListener("load", CreditCardNanny.loadDatabase, false);

