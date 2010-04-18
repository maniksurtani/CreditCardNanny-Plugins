function alertHTML(doc) {    
    var dims = getViewportDimensions(doc);
    var padding = 30;
    var margin = 30;
    var popup_w = 350;
    var popup_left = Math.round((dims.width / 2) - ((popup_w/2) + margin + padding));

    var popup_h = 250;
    var popup_top = Math.round((dims.height / 2) - ((popup_h/2) + margin + padding));
    
    // inject style to darken background
    // for IE, replace opacity with filter: alpha(opacity=70);
    var h = '<STYLE tyle="text/css">.darkenBackground { background-color: rgb(0, 0, 0); opacity: 0.7; z-index: 20; height: 100%; width: 100%; background-repeat:repeat; position:fixed; top: 0px; left: 0px;}</STYLE>';
    h += '<div id="__should_not_interfere2__" class="darkenBackground"></div>'
    h += '<div class="__alert__internal__" id="__should_not_interfere__" style="position: absolute; top: ' + popup_top + 'px; left: ' + popup_left + 'px; width: ' + popup_w + 'px; height: ' + popup_h + 'px; font-size: 14px;margin: '+margin+'px; padding: '+padding+'px; font-family: arial, sans-serif; color: black; background-color: #DDDDDD;border: thick grey solid; text-align: center; z-index: 21;">';
    h += '<font size=+2><font color="red"><u><b>WARNING</b></u></font></font><br /><br />';
    h += '<p style="text-align: left;"><a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> has detected that this page uses a clear-text form emailing script. This means that any information entered on this page may be visible to malicious third-parties.  CreditCardNanny recommends you <b><i>do not</i></b> enter any sensitive information such as credit card details on this page.  Instead, you should contact and inform the site owner of this problem.<br /><br />Visit <a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> for more information, or <a href="http://cc-nanny.appspot.com/warn_friend?u='+doc.URL+'">click here</a> to warn friends about this page.</p><br/><br />'
    h += '<INPUT TYPE="BUTTON" onClick="javascript:document.getElementById(\'__should_not_interfere__\').style.visibility=\'hidden\';document.getElementById(\'__should_not_interfere2__\').style.display=\'none\';" value="Ignore warning and continue">';
    h += '</div>';

    return h;
}
