from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from django.utils import simplejson as json
from google.appengine.api.labs.taskqueue import Task

import logging

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
  application = webapp.WSGIApplication([('/', MainHandler), ('/get_matcher', REHandler), ('/report', CaptureBadSite), ('/test-secure-page', TestSecureForm)],
                                       debug=False)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()
