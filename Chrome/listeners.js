function alertHTML() {
  h = '<div class="__alert__internal__" id="__should_not_interfere__" style="font-size: 14px;margin: 10px;font-family: arial, sans-serif; width: 100%;color: red; background-color: #FFFFFF;border: thin black solid; text-align: center;">';
  h += '<font size=+2><u><b>WARNING</b></u></font><br /><br />';
  h += 'We have detected that this page uses an insecure form mailer.  Please click the alert icon above for more details.  Do NOT submit any valuable data in this form!';
  h += '<INPUT TYPE="BUTTON" onClick="javascript:document.getElementById(\'__should_not_interfere__\').innerHTML=\'\';" value="Ignore warning">';
  h += '</div>';
  return h;
}

if (location.protocol == "https:") {
  
  // inspect all forms on the document
  forms = document.forms;
  if (forms.length > 0) {
    // create a callback request.  All inspecting happens in background.html
    callbackRequest = '{"url": "' + document.URL + '", "formActions": [';
    
    // loop thru forms
    for (i=0; i<forms.length; i++) {
      f = forms[i];
      // add form actions to request
      callbackRequest += '"' + f.action + '"';
      if (i == forms.length - 1) {
        callbackRequest += "]}";
      } else {
        callbackRequest += ", ";
      }
    }
    
    // send message to background.html
    chrome.extension.sendRequest(callbackRequest, function(r) {
      // if we get a response saying this page is flagged, display appropriate warning HTML
      if (r.flagged == "true") {
        oldHTML = document.body.innerHTML;
        document.body.innerHTML = alertHTML() + oldHTML;        
      }
    });    
  }
}
