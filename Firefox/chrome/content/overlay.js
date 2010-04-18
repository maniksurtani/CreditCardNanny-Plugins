function isFlagged(url, actions) {
  debug("Received msg from listener URL = " + url + " and action = " + actions);
  if (containsSuspiciousAction(actions)) {
    debug("Cleartext form mailer detected!")
    var jsonRep = {
      url: url,
      formActions: actions
    }
    reportPage(jsonRep);
    return true;
  } else {
    debug("All forms look OK.")
    return false;
  }  
}

function checkDocument(e) {
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

      if (isFlagged(doc.URL, formActions)) {
        doc.body.innerHTML = alertHTML(doc) + doc.body.innerHTML;
      }
    }
  }
}

const prefsPrefix = "extensions.creditcardnanny.";

var storage = {
  prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
  setItem: function(k, v) {
    this.prefs.setCharPref(prefsPrefix + k, v);
    this.prefs.savePrefFile(null);
  },
  getItem: function(k) {
    try {
      return this.prefs.getCharPref(prefsPrefix + k);        
    } catch (e) {
      // key does not exist
      return null;
     }
  }
};

function browserStartup() {
  loadDatabase();  
}

window.addEventListener("DOMContentLoaded", checkDocument, false);
window.addEventListener("load", browserStartup, false);

