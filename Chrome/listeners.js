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
      console.log("Got response " + r);
      if (r.flagged == "true") {
        oldHTML = document.body.innerHTML;
        document.body.innerHTML = CreditCardNannyAlerter.alertHTML(document) + oldHTML;        
      }
    });    
  }
}
