var CreditCardNannyAlerter = {};
CreditCardNannyAlerter.alertHTML = function(doc) {    
    var dims = {height: window.innerHeight, width: window.innerWidth};
    var padding = 30;
    var margin = 30;
    var popup_w = 360;
    var popup_left = Math.round((dims.width / 2) - ((popup_w/2) + margin + padding));

    var popup_h = 285;
    var popup_top = Math.round((dims.height / 2) - ((popup_h/2) + margin + padding));
    
    // inject style to darken background
    // for IE, replace opacity with filter: alpha(opacity=70);
    var h = '<STYLE tyle="text/css">.darkenBackground { background-color: rgb(0, 0, 0); opacity: 0.7; z-index: 20; height: 100%; width: 100%; background-repeat:repeat; position:fixed; top: 0px; left: 0px;}</STYLE>';
    h += '<div id="__should_not_interfere2__" class="darkenBackground"></div>'
    h += '<div class="__alert__internal__" id="__should_not_interfere__" style="position: absolute; top: ' + popup_top + 'px; left: ' + popup_left + 'px; width: ' + popup_w + 'px; height: ' + popup_h + 'px; font-size: 14px;margin: '+margin+'px; padding: '+padding+'px; font-family: arial, sans-serif; color: black; background-color: #DDDDDD;border: thick grey solid; text-align: center; z-index: 21;">';
    h += '<font size=+2><font color="red"><u><b>WARNING</b></u></font></font><br /><br />';
    h += '<p style="text-align: left;"><a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> has detected that this page uses a clear-text form emailing script. This means that <i>all</i> information entered on this page may be visible to malicious third-parties.  CreditCardNanny recommends you <b><i>do not</i></b> enter any sensitive information such as <b>credit card details</b>, <b>passwords</b> or <b>dates of birth</b> on this page.  Instead, you should inform the owner of this website. <br /><br />Visit <a href="http://sites.google.com/site/creditcardnanny">CreditCardNanny</a> for more information.</p><br/>';
    h += '<INPUT TYPE="BUTTON" onClick="javascript:location.href=\'http://cc-nanny.appspot.com/warn_friend?u='+doc.URL+'\';" value="Warn your friends about this!"><br />';
    h += '<INPUT TYPE="BUTTON" onClick="javascript:document.getElementById(\'__should_not_interfere__\').style.visibility=\'hidden\';document.getElementById(\'__should_not_interfere2__\').style.display=\'none\';" value="Ignore warning and continue">';
    h += '</div>';

    return h;
}
