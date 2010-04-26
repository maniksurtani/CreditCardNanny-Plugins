/**
 * CreditCardNanny namespace
 */
if ("undefined" == typeof(CreditCardNanny)) {  
  var CreditCardNanny = {
    init: function() {
      this.knownScripts = null;
      this.knownScriptsPattern = null;              
    },
    
    gaTrack: function(eventName, additionalData) {
      try {
        var pageTracker = _gat._getTracker("UA-3966069-4");
        pageTracker._trackPageview();
        pageTracker._trackEvent(eventName, this.pluginFlavour, additionalData);
      } catch(err) {}  
    },

    getHardCodedKnownScripts: function() {
      var hardcoded = 'formmail\.asp|phpformmail\.php|formmail\.pl|formmail\.cgi|mailto:|email\.cgi|email\.pl|form_mailer\.cgi|form_mailer\.pl|formtomail\.asp'
      return new RegExp(hardcoded, "i");  
    },

    loadAndStoreRemoteDatabase: function() {
      if (this.knownScriptsPattern == null) this.getHardCodedKnownScripts();

      CreditCardNanny.debug("Loading remote script database at " + CreditCardNanny.Constants.re_update_url);
      var xhr = new XMLHttpRequest();
      xhr.open("GET", CreditCardNanny.Constants.re_update_url, true);  
      xhr.onload = function() {
            CreditCardNanny.knownScriptsPattern = xhr.responseText;
            CreditCardNanny.debug("Received remote response text " + xhr.responseText);
            CreditCardNanny.knownScripts = new RegExp(CreditCardNanny.knownScriptsPattern, "i");
            CreditCardNanny.persistKnownScripts(new Date().getTime() + CreditCardNanny.Constants.updateFreq);
            CreditCardNanny.gaTrack("UpdatedDatabase", CreditCardNanny.knownScriptsPattern);
      };

      xhr.send(null);    
    },

    persistKnownScripts: function(nextUpdateDue) {
      var storage = CreditCardNanny.getStorage();
      storage.setItem(CreditCardNanny.Constants.nextUpdateDueKey, nextUpdateDue);
      storage.setItem(CreditCardNanny.Constants.mailerScriptMatcherKey, this.knownScriptsPattern);
    },


    loadDatabase: function() {  
      CreditCardNanny.debug("Loading scripts RE from persistence");
      var currentTimestamp = new Date().getTime();
      var storage = CreditCardNanny.getStorage();
      var nextUpdateDueStamp = storage.getItem(CreditCardNanny.Constants.nextUpdateDueKey);
      if (nextUpdateDueStamp != null) {
        nextUpdateDueStamp = parseInt(nextUpdateDueStamp);
      } else {
        nextUpdateDueStamp = -1;
      }
      if (isNaN(nextUpdateDueStamp)) nextUpdateDueStamp = -1;
      CreditCardNanny.debug("Next update due " + nextUpdateDueStamp);

      if (currentTimestamp > nextUpdateDueStamp) {
        this.loadAndStoreRemoteDatabase();
      } else {
        CreditCardNanny.debug("No need to update RE, loading from local storage");
        var db = storage.getItem(CreditCardNanny.Constants.mailerScriptMatcherKey);
        if (db != null) {
          CreditCardNanny.debug("Loading known scripts from persistence as " + db);
          this.knownScriptsPattern = db;
          this.knownScripts = new RegExp(this.knownScriptsPattern, "i");
        } else {
          CreditCardNanny.debug("Loading hardcoded known scripts");
          this.knownScripts = this.getHardCodedKnownScripts();
          this.persistKnownScripts(currentTimestamp);
        }
      }
    },

    containsSuspiciousAction: function(actions) {
      if (this.knownScripts == null || this.knownScriptsPattern == null || this.knownScriptsPattern == "") {
        this.knownScripts = this.getHardCodedKnownScripts();
      }
      for (i=0; i<actions.length; i++) {
        if (this.knownScripts.test(actions[i])) {
          return true;
        }
      }
      return false;
    },

    reportPage: function(req) {
      CreditCardNanny.debug("Reporting to central database");  
      var xhr = new XMLHttpRequest();  
      xhr.open("POST", CreditCardNanny.Constants.report_url, true);  
      xhr.setRequestHeader("Content-Type", "text/plain")
      xhr.send(JSON.stringify(req));  
      this.gaTrack("BadPageReported", req.url);
    }
  };  
  
  CreditCardNanny.Constants = {
    report_url: "http://cc-nanny.appspot.com/report",
    re_update_url: "http://cc-nanny.appspot.com/get_matcher",
    updateFreq: 1000 *60 *60 *24 *7,
    nextUpdateDueKey: "nextUpdateDueStamp",
    mailerScriptMatcherKey: "mailerScriptRE",
    loggingEnabled: true
  };
};



