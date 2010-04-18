from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
import django.conf

try:
  django.conf.settings.configure(
    DEBUG=False,
    TEMPLATE_DEBUG=False,
    TEMPLATE_LOADERS=(
      'django.template.loaders.filesystem.load_template_source',
    ),
  )
except (EnvironmentError, RuntimeError):
  pass

from django.utils import simplejson as json
from django import newforms as forms
from google.appengine.api.labs.taskqueue import Task
from staticpagehandler import *

import logging

msg_pre = 'Dear friend,<br /><br />This message is to warn you about the fact that a certain URL - %s - has been reported to be potentially unsafe and fraudulent.  It is recommended that you do not use this website for anything important, and be particularly careful about submitting sensitive information such as credit card details or passwords.'
msg_post = '<br /><br />Detected using <a href="http://sites.google.com/site/creditcardnanny">the CreditCardNanny</a> browser plugin, by '

class REUpdateEvent(db.Model):
  requestor_ip = db.StringProperty()
  requestor_ua = db.StringProperty()
  created = db.DateTimeProperty(auto_now_add=True)

class ReportEvent(db.Model):
  requestor_ip = db.StringProperty()
  requestor_ua = db.StringProperty()
  offending_url = db.StringProperty()
  form_actions = db.StringListProperty()
  created = db.DateTimeProperty(auto_now_add=True)

class WarnFriendRequest(db.Model):
  sender = db.StringProperty()
  sender_email = db.StringProperty()
  message = db.TextProperty()
  status = db.StringProperty(default = "NEW")
  offending_url = db.StringProperty()
  recipients = db.StringListProperty()

class MainHandler(webapp.RequestHandler):
  def get(self):
    self.redirect("http://sites.google.com/site/creditcardnanny")
  
  def post(self):
    return self.get()

class REHandler(webapp.RequestHandler):
  def get(self):
    ev = REUpdateEvent(requestor_ip = self.request.environ['REMOTE_ADDR'], requestor_ua = self.request.environ['HTTP_USER_AGENT'])
    ev.put()
    self.response.headers['Content-Type'] = "text/plain"
    self.response.out.write('formmail\.asp|phpformmail\.php|formmail\.pl|formmail\.cgi|mailto:|email\.cgi|email\.pl|form_mailer\.cgi|form_mailer\.pl|formtomail\.asp')
    
  def post(self):
    return self.get()

class WarnFriendForm(forms.Form):
  sender_name = forms.CharField(label = "Your name", max_length=50, widget = forms.TextInput(attrs={"onChange": "javascript:preview(form);", "size": "20"}))
  sender = forms.EmailField(label = "Your email address", max_length=50, widget = forms.TextInput(attrs={"size": "20"}))
  recipients = forms.CharField(label = "Email addresses of your friends", help_text = '<span class="help">Multiple addresses allowed, separate using a comma.<br />E.g., fred@acme.com, jane@smellyfeet.com, howard@ducks.com</span>', widget = forms.Textarea(attrs={"cols": "30", "rows": "5", "onChange": "javascript:preview(form);"}))
  message = forms.CharField(label = "A custom message", help_text = '<span class="help">Optional</span>', required = False, widget = forms.Textarea(attrs={"cols": "30", "rows": "5", "onChange": "javascript:preview(form);"}))
  u = forms.CharField(widget = forms.HiddenInput)
  

class WarnFriend(StaticPageHandler):
  def get(self):
    offending_url = self.request.get("u")
    form = WarnFriendForm()
    form.fields["u"].initial = offending_url
    
    self.render_page({
      "offending_url": offending_url,
      "msg_pre": msg_pre % offending_url,
      "msg_post": msg_post,
      "form": form,
    })
  
  def post(self):
    form = WarnFriendForm(data= self.request.POST)
    offending_url = self.request.POST['u']
    
    if form.is_valid():
      cleaned = form.clean_data
      req = self.parse(cleaned)
      req.put()
      task = Task(url = "/admin/process_warn_friend", params = {"request_key": req.key()}, method = "GET")
      task.add(queue_name = "background")            
      self.redirect("/warn_friend_thankyou?u=" + offending_url)
    else:      
      self.render_page({
        "offending_url": offending_url,
        "msg_pre": msg_pre % offending_url,
        "msg_post": msg_post,
        "form": form,      
      })
    
  def parse(self, data):
    req = WarnFriendRequest(sender = data['sender_name'], sender_email = data['sender'])
    req.message = (msg_pre % data['u']) + data['message'].replace("\n", "<BR><BR>").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") + msg_post + data['sender_name']
    req.offending_url = data['u']
    req.recipients = []    
    for e in data['recipients'].strip().lower().split(','):
      req.recipients.append(e.strip())
    return req
        
  def get_page_title(self):
    return "Warn a friend"

  def get_page_template_name(self):
    return "warn_friend"

class WarnFriendThankYou(StaticPageHandler):
  def get(self):
    self.render_page({"offending_url": self.request.get("u")})
  
  def get_page_title(self):
    return "Thank You!"
  
  def get_page_template_name(self):
    return "warn_friend_thankyou"

class CaptureBadSite(webapp.RequestHandler):
  def get(self):
    console.log('received a GET!  WTF!')
    self.response.status = 500    
  
  def post(self):
    content = self.request.body
    logging.debug("Saw body %s" % content)
    o = json.loads(content)    
    try:
      ev = ReportEvent(requestor_ip = self.request.environ['REMOTE_ADDR'], requestor_ua = self.request.environ['HTTP_USER_AGENT'], offending_url = o['url'], form_actions = o['formActions'])
      ev.put()
      task = Task(url = "/admin/process_report", params = {"event_key": ev.key()}, method = "GET")
      task.add(queue_name = "background")
    except:
      logging.error("Something bad happened persisting state!")

class TestSecureForm(webapp.RequestHandler):
  def post(self):
    return self.get()
  
  def get(self):
    self.response.out.write('''
      <HTML>
        <HEAD><TITLE>Test Secure Form</TITLE></HEAD>
        <BODY STYLE="font-family: Arial, Sans Serif">
          <H1>This is a test form</H1>
          This test form is usecure and uses SSL encryption.  However it attempts to
          submit the contents of the form to a popular PHP emailer script, <B><I>phpformmail.php</I></B>.
          <p />
          Do not actually use this form to submit anything; it is used as a demo to watch
          the <a href="/">CreditCardNanny</a> browser plugin in action.
          <p />
          <FORM ACTION="/stuff/phpformmail.php">
            <TABLE CELLPADDING=0 CELLSPACING=0 ALIGN="LEFT" STYLE="border: thin black solid;">
              <TR><TD ALIGN=LEFT>Name</TD><TD ALIGN=LEFT><INPUT TYPE=TEXT SIZE=30></TD></TR>
              <TR><TD ALIGN=LEFT>Date of birth</TD><TD ALIGN=LEFT><INPUT TYPE=TEXT SIZE=8></TD></TR>
              <TR><TD ALIGN=LEFT>Credit card number</TD><TD ALIGN=LEFT><INPUT TYPE=TEXT SIZE=18></TD></TR>
              <TR><TD ALIGN=LEFT>Credit card type</TD><TD ALIGN=LEFT><SELECT><OPTION>Visa</OPTION><OPTION>Mastercard</OPTION><OPTION>American Express</OPTION></SELECT></TD></TR>
              <TR><TD ALIGN=LEFT>Credit card security code</TD><TD ALIGN=LEFT><INPUT TYPE=TEXT SIZE=4></TD></TR>
              <TR><TD ALIGN=RIGHT COLSPAN=2><INPUT TYPE="SUBMIT" VALUE="Submit details" /></TD></TR>                            
            </TABLE>
            
          </FORM>
        </BODY>
      </HTML>
    ''')

def main():
  application = webapp.WSGIApplication([('/', MainHandler), ('/get_matcher', REHandler), ('/report', CaptureBadSite), ('/warn_friend', WarnFriend), ('/warn_friend_thankyou', WarnFriendThankYou), ('/test-secure-page', TestSecureForm)],
                                       debug=True)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()
