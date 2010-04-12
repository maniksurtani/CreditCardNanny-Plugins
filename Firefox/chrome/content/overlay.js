function alertHTML() {

    w = window.innerWidth;
    popup_w = 350;
    popup_left = (w / 2) - (popup_w / 2);

    h = window.innerHeight;
    popup_h = 250;
    popup_top = (h / 2) - (popup_h / 2);

    // inject style to darken background
    h = '<STYLE tyle="text/css">.darkenBackground { background-color: rgb(0, 0, 0); opacity: 0.7; /* Safari, Opera */ -moz-opacity:0.70; /* FireFox */ filter: alpha(opacity=70); /* IE */ z-index: 20; height: 100%; width: 100%; background-repeat:repeat; position:fixed; top: 0px; left: 0px;}</STYLE>';
    h += '<div id="__should_not_interfere2__" class="darkenBackground"></div>'
    h += '<div class="__alert__internal__" id="__should_not_interfere__" style="position: absolute; top: ' + popup_top + 'px; left: ' + popup_left + 'px; width: ' + popup_w + 'px; height: ' + popup_h + 'px; font-size: 14px;margin: 30px; padding: 30px; font-family: arial, sans-serif; color: black; background-color: #DDDDDD;border: thick grey solid; text-align: center; z-index: 21;">';
    h += '<font size=+2><font color="red"><u><b>WARNING</b></u></font></font><br /><br />';
    h += '<p style="text-align: left;"><a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> has detected that this page uses a clear-text form emailing script. This means that any information entered on this page may be visible to malicious third-parties.  CreditCardNanny recommends you <b><i>do not</i></b> enter any sensitive information such as credit card details on this page.  Instead, you should contact and inform the site owner of this problem.<br /><br />Visit <a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> for more information.</p><br/><br />'
    h += '<INPUT TYPE="BUTTON" onClick="javascript:document.getElementById(\'__should_not_interfere__\').style.visibility=\'hidden\';document.getElementById(\'__should_not_interfere2__\').style.display=\'none\';" value="Ignore warning and continue">';
    h += '</div>';

    return h;
}

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
    forms = doc.forms;
    if (forms.length > 0) {

      // loop thru forms
      var formActions = Array()
      for (i = 0; i < forms.length; i++) {
        f = forms[i];
        formActions[i] = f.action;
      }

      if (isFlagged(doc.URL, formActions)) {
        oldHTML = doc.body.innerHTML;
        doc.body.innerHTML = alertHTML() + oldHTML;
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

// var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
// prefs = prefs.getBranch("extensions.creditcardnanny.");
