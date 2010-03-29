from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from django.utils import simplejson as json
import os
from google.appengine.ext.webapp import template
from google.appengine.api import users

import logging
import reporting
from main import REUpdateEvent
from main import ReportEvent
from google.appengine.api import mail
import re

chrome_re = re.compile('.*AppleWebKit.*KHTML.*Chrome.*')
ffox_re = re.compile('.*Firefox.*')
windows_re = re.compile('.*Windows.*')
mac_re = re.compile('.*Macintosh.*')
linux_re = re.compile('.*Linux.*')

class KnownSites(db.Model):
  url = db.StringProperty()
  form_actions = db.StringListProperty()

def find_event(k):
  return db.GqlQuery("SELECT * FROM ReportEvent where __key__ = key('%s')" % k).get()    

class ProcessReportHandler(webapp.RequestHandler):
  def get(self):
    event_key = self.request.get("event_key")
    logging.debug("Processing event key %s" % event_key)
    event = find_event(event_key)    
    if (event):
      logging.debug("Found event %s" % str(event))
      if KnownSites.all().filter("url =", event.offending_url).count() < 1:
        logging.debug("Pertains to a new site!")
        new_site = KnownSites(url = event.offending_url, form_actions = event.form_actions)
        new_site.put()
        mail.send_mail(sender="CreditCardNanny Backend Process <manik.surtani@gmail.com>",
                      to="Manik Surtani <manik@surtani.org>",
                      subject="New Offending Site %s reported!" % (new_site.url),
                      body="A new offending site %s has been reported, with form actions %s." % (new_site.url, str(new_site.form_actions)))
      else:
        logging.debug("This is a known site.")
    else:
      logging.error("Could not locate event with key %s" % event_key)


class StaticPageHandler(webapp.RequestHandler):
  def render_page(self, parameters):
    parameters['title'] = self.get_page_title()
    parameters['logout'] = users.create_logout_url("/")
    path = os.path.join(os.path.dirname(__file__), 'templates/' + self.get_page_template_name() + '.html')
    self.response.out.write(template.render(path, parameters))

  def get(self):
    self.render_page({})
    
  def post(self):
    self.get()

class IPDetailsHandler(StaticPageHandler):
  def get_page_title(self):
    return "IP Details for " + self.request.get("ip")

  def get_page_template_name(self):
    return "ip_details"

  def get(self):
    ip = self.request.get("ip")
    params = {"ip_details" : reporting.get_ip_details(ip)}
    self.render_page(params)

class UrlHandler(StaticPageHandler):
  def get_page_title(self):
    return "Offending URLs"

  def get_page_template_name(self):
    return "urls"

  def get(self):
    q = ReportEvent.all()
    m = {}
    for e in q:
      if e.offending_url in m:
        m[e.offending_url].update(e)
      else:
        m[e.offending_url] = OffendingUrl(e)        
    
    dtls = []
    for u in m.items():
      dtls.append(u[1])
    
    dtls.sort()

    self.render_page({"details": dtls, "num_urls": len(dtls)})


class BrowserHandler(StaticPageHandler):
  def get_page_title(self):
    return "Browsers and OSes"
    
  def get_page_template_name(self):
    return "browsers"

  def get(self):
    chrome = Browser()
    firefox = Browser()
    processed = []
    
    for e in ReportEvent.all():
      if ('%s %s' % (e.requestor_ip, e.requestor_ua)) not in processed:
        if chrome_re.match(e.requestor_ua):
          chrome.process(e)
        if ffox_re.match(e.requestor_ua):
          firefox.process(e)
        processed.append('%s %s' % (e.requestor_ip, e.requestor_ua))
    
    for e in REUpdateEvent.all():
      if ('%s %s' % (e.requestor_ip, e.requestor_ua)) not in processed:
        if chrome_re.match(e.requestor_ua):
          chrome.process(e)
        if ffox_re.match(e.requestor_ua):
          firefox.process(e)
        processed.append('%s %s' % (e.requestor_ip, e.requestor_ua))

    self.render_page({"chrome": chrome, "firefox": firefox})

class Item(object):
  addresses = []
  count = 0

class OffendingUrl(object):
  def __init__(self, evt):
    self.url = evt.offending_url
    self.count = 1
    self.last_reported = evt.created
    self.first_reported = evt.created
  
  def update(self, evt):
    self.count += 1
    if self.last_reported < evt.created:
      self.last_reported = evt.created
    
    if self.first_reported > evt.created:
      self.first_reported = evt.created

  def __cmp__(self, other):
    return other.count - self.count

class Browser(object):
  all = 0
  win = 0
  mac = 0
  linux = 0
  
  def process(self, ev):
    self.all += 1
    if windows_re.match(ev.requestor_ua):
      self.win += 1
    if mac_re.match(ev.requestor_ua):
      self.mac += 1
    if linux_re.match(ev.requestor_ua):
      self.linux += 1

  

class PluginHandler(StaticPageHandler):
  def get_page_title(self):
    return "Plugin install base"
  
  def get_page_template_name(self):
    return "plugins"
  
  def get(self):
    events = {}
    for ev in REUpdateEvent.all():
      if ev.requestor_ip in events:
        count = events[ev.requestor_ip]
        count += 1
        events[ev.requestor_ip] = count
      else:
        events[ev.requestor_ip] = 1
        
    sorted_events = {}
    for ev in events.items():
      if ev[1] in sorted_events:
        ip_list = sorted_events[ev[1]]
        ip_list.append(ev[0])
      else:
        sorted_events[ev[1]] = [ev[0]]
    
    dtls = []
    for i in sorted_events.items():
      item = Item()
      item.count = i[0]
      item.addresses = i[1]
      dtls.append(item)
    
    self.render_page({"details": dtls, "num_ips": len(events)})
    
    
  
def main():
  application = webapp.WSGIApplication([
      ('/admin', PluginHandler), 
      ('/admin/plugins', PluginHandler), 
      ('/admin/urls', UrlHandler), 
      ('/admin/ip_details', IPDetailsHandler),
      ('/admin/process_report', ProcessReportHandler),      
      ('/admin/browsers', BrowserHandler)
      
      ],
                                       debug=False)
  util.run_wsgi_app(application)

if __name__ == '__main__':
  main()
  

