const report_url = "http://cc-nanny.appspot.com/report";  
const re_update_url = "http://cc-nanny.appspot.com/get_matcher";
const updateFreq = 1000 *60 *60 *24 *7; // weekly updates
const nextUpdateDueKey = "nextUpdateDueStamp";
const mailerScriptMatcherKey = "mailerScriptRE";

var knownScripts = null;
var knownScriptsPattern = null;

function gaTrack(eventName, additionalData) {
  try {
    var pageTracker = _gat._getTracker("UA-3966069-4");
    pageTracker._trackPageview();
    pageTracker._trackEvent(eventName, pluginFlavour, additionalData);
  } catch(err) {}  
}

function getHardCodedKnownScripts() {
  knownScriptsPattern = 'formmail\.asp|phpformmail\.php|formmail\.pl|formmail\.cgi|mailto:|email\.cgi|email\.pl|form_mailer\.cgi|form_mailer\.pl|formtomail\.asp'
  return new RegExp(knownScriptsPattern, "i");  
}

function loadAndStoreRemoteDatabase() {
  if (knownScriptsPattern == null) getHardCodedKnownScripts();
  
  debug("Loading remote script database at " + re_update_url);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", re_update_url, true);  
  try {netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");} catch (e) {}
  xhr.onload = function() {
        knownScriptsPattern = xhr.responseText;
        debug("Received remote response text " + xhr.responseText);
        knownScripts = new RegExp(knownScriptsPattern, "i");
        persistKnownScripts(new Date().getTime() + updateFreq);
        gaTrack("UpdatedDatabase", knownScriptsPattern);
  };
  
  xhr.send(null);    
}

function persistKnownScripts(nextUpdateDue) {
  var storage = getStorage();
  storage.setItem(nextUpdateDueKey, nextUpdateDue);
  storage.setItem(mailerScriptMatcherKey, knownScriptsPattern);
}


function loadDatabase() {  
  debug("Loading scripts RE from persistence");
  var currentTimestamp = new Date().getTime();
  var storage = getStorage();
  var nextUpdateDueStamp = storage.getItem(nextUpdateDueKey);
  if (nextUpdateDueStamp != null) {
    nextUpdateDueStamp = parseInt(nextUpdateDueStamp);
  } else {
    nextUpdateDueStamp = -1;
  }
  if (isNaN(nextUpdateDueStamp)) nextUpdateDueStamp = -1;
  debug("Next update due " + nextUpdateDueStamp);
  
  if (currentTimestamp > nextUpdateDueStamp) {
    loadAndStoreRemoteDatabase();
  } else {
    debug("No need to update RE, loading from local storage");
    var db = storage.getItem(mailerScriptMatcherKey);
    if (db != null) {
      debug("Loading known scripts from persistence as " + db);
      knownScriptsPattern = db;
      knownScripts = new RegExp(knownScriptsPattern, "i");
    } else {
      debug("Loading known scripts from persistence");
      knownScripts = getHardCodedKnownScripts();
      persistKnownScripts(currentTimestamp);
    }
  }
}

function containsSuspiciousAction(actions) {
  if (knownScripts == null || knownScriptsPattern == null || knownScriptsPattern == "") {
    knownScripts = getHardCodedKnownScripts();
  }
  for (i=0; i<actions.length; i++) {
    if (knownScripts.test(actions[i])) {
      return true;
    }
  }
  return false;
}

function reportPage(req) {
  debug("Reporting to central database");  
  var xhr = new XMLHttpRequest();  
  xhr.open("POST", report_url, true);  
  xhr.setRequestHeader("Content-Type", "text/plain")
  xhr.send(JSON.stringify(req));  
  gaTrack("BadPageReported", req.url);
}
