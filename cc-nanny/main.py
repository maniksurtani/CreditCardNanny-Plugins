from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from django.utils import simplejson as json

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
    except:
      logging.error("Something bad happened persisting state!")

def main():
  application = webapp.WSGIApplication([('/', MainHandler), ('/get_matcher', REHandler), ('/report', CaptureBadSite)],
                                       debug=False)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()
