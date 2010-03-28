var report_url = "http://cc-nanny.appspot.com/report";  
var re_update_url = "http://cc-nanny.appspot.com/get_matcher";
var knownScripts = null;
var knownScriptsPattern = null;
var updateFreq = 1000 *60 *60 *24 *7; // weekly updates

jetpack.future.import("storage.simple");
jetpack.storage.simple.nextUpdateDueStamp = jetpack.storage.simple.nextUpdateDueStamp || -1;
jetpack.storage.simple.mailerScriptRE = jetpack.storage.simple.mailerScriptRE || "";

function getDomain(url) {
  try {
    e = new RegExp("^(https?://[a-z0-9_.-]*)", "i");
    trimmed = e.exec(url)[1].toLowerCase();
    return trimmed;
  } catch (err) {
    console.log(err);
    return "";
  }
}

function alertHTML(document) {
  
  w = Math.min(document.body.clientWidth, document.documentElement.clientWidth);
  popup_w = 350;
  popup_left = (w / 2) - (popup_w / 2);
  
  h = Math.min(document.body.clientHeight, document.documentElement.clientHeight);
  popup_h = 250;
  popup_top = (h / 2) - (popup_h / 2);
  
  console.log(" h = " + w + " w = " + h);
  
    
  // inject style to darken background
  h = '<STYLE tyle="text/css">.darkenBackground { background-color: rgb(0, 0, 0); opacity: 0.7; /* Safari, Opera */ -moz-opacity:0.70; /* FireFox */ filter: alpha(opacity=70); /* IE */ z-index: 20; height: 100%; width: 100%; background-repeat:repeat; position:fixed; top: 0px; left: 0px;}</STYLE>';
  h += '<div id="__should_not_interfere2__" class="darkenBackground"></div>'
  h += '<div class="__alert__internal__" id="__should_not_interfere__" style="position: absolute; top: ' + popup_top + 'px; left: ' + popup_left + 'px; width: ' + popup_w + 'px; height: ' + popup_h + 'px; font-size: 14px;margin: 30px; padding: 30px; font-family: arial, sans-serif; color: black; background-color: #DDDDDD;border: thick grey solid; text-align: center; z-index: 21;">';
  h += '<font size=+2><font color="red"><u><b>WARNING</b></u></font></font><br /><br />';
  h += '<p style="text-align: left;"><a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> has detected that this page uses a clear-text form emailing script. This means that any information entered on this page may be visible to malicious third-parties.  CreditCardNanny recommends you <b><i>do not</i></b> enter any sensitive information such as credit card details on this page.  Instead, you should contact and inform the site owner of this problem.<br /><br />Visit <a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> for more information.</p><br/><br />'
  h += '<INPUT TYPE="BUTTON" onClick="javascript:document.getElementById(\'__should_not_interfere__\').style.visibility=\'hidden\';document.getElementById(\'__should_not_interfere2__\').style.display=\'none\';" value="Ignore warning and continue">';
  h += '</div>';
  
  // add analytics
  var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
  h += unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E");
  h += '<script type="text/javascript">';
  h += 'try {';
  h += 'var pageTracker = _gat._getTracker("UA-3966069-4");';
  h += 'pageTracker._trackPageview();';
  h += '} catch(err) {}</script>';
  
  oldHtml = document.body.innerHTML;
  document.body.innerHTML = h + oldHtml;
}


function alertUser(url) {
  //UI - event registration
  // jetpack.statusBar.append({html : '<IMG SRC="i19.png"/> <B>CreditCardNanny</b> detected unsafe form!'});
  jetpack.notifications.show('CreditCardNanny detected unsafe form on '+getDomain(url)+'!');  
}

function getHardCodedKnownScripts() {
  knownScriptsPattern = 'formmail\.asp|phpformmail\.php|formmail\.pl|formmail\.cgi|mailto:|email\.cgi|email\.pl|form_mailer\.cgi|form_mailer\.pl|formtomail\.asp'
  return new RegExp(knownScriptsPattern, "i");  
}

function persistKnownScripts(nextUpdateDue) {
  jetpack.storage.simple.nextUpdateDueStamp = nextUpdateDue;
  jetpack.storage.simple.mailerScriptRE = knownScriptsPattern;
}

function loadAndStoreRemoteDatabase() {
  if (knownScriptsPattern == null) getHardCodedKnownScripts();
  
  console.log("Loading remote script database at " + re_update_url);
  jQuery.get(re_update_url, function(resp) {
    knownScriptsPattern = resp;
    console.log("Received remote response text " + knownScriptsPattern);
    knownScripts = new RegExp(knownScriptsPattern, "i");          
    persistKnownScripts(new Date().getTime() + updateFreq);    
  });
}

function loadDatabase() {  
  console.log("Loading scripts RE from localStorage");
  currentTimestamp = new Date().getTime();
  console.log("Current timestamp = " + currentTimestamp);
  nextUpdateDueStamp = jetpack.storage.simple.nextUpdateDueStamp;
  console.log("Next update timestamp = " + nextUpdateDueStamp);  
  if (nextUpdateDueStamp != null) {
    nextUpdateDueStamp = parseInt(nextUpdateDueStamp);
  } else {
    nextUpdateDueStamp = -1;
  }
  console.log("Next update due " + nextUpdateDueStamp);
  
  if (currentTimestamp > nextUpdateDueStamp) {
    loadAndStoreRemoteDatabase();
  } else {
    console.log("No need to update RE, loading from local storage");
    db = jetpack.storage.simple.mailerScriptRE;
    if (db != null) {
      console.log("Loading known scripts from localStorage as " + db);
      knownScriptsPattern = db;
      knownScripts = new RegExp(knownScriptsPattern, "i");
      console.log("Known scripts are " + knownScripts);
    } else {
      console.log("Loading known scripts from localStorage");
      knownScripts = getHardCodedKnownScripts();
      persistKnownScripts(currentTimestamp);
    }
  }
}

function containsSuspiciousAction(actions) {
  if (knownScripts == null) {
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
  console.log("Reporting to central database");  
  xhr = new XMLHttpRequest();  
  xhr.open("POST", report_url, true);  
  xhr.setRequestHeader("Content-Type", "text/plain")
  xhr.send(JSON.stringify(req));  
}


function pageLoaded(doc) {
  if (knownScriptsPattern == null || knownScriptsPattern == "") {
    knownScripts = getHardCodedKnownScripts();
  }
  for (i=0; i<doc.forms.length; i++) {
    if (knownScripts.test(doc.forms[i].action)) { 
      reportPage({url: doc.URL, formActions: [doc.forms[i].action]});
      alertUser(doc.URL);
      alertHTML(doc);
      break;
    }
  }
}

//Settings
console.log("Loading script.");
var manifest = {};
jetpack.tabs.onReady( pageLoaded );

loadDatabase();
