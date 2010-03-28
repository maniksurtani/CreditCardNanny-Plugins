from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from django.utils import simplejson as json
import os
from google.appengine.ext.webapp import template

import logging
import reporting
from main import REUpdateEvent

def stringify(l):
  """docstring for format_list"""
  s = ""
  first = True
  for i in l:
    if first:
      first = False
    else:
      s += ", "
    s += '<a href="/admin/ip_details?ip=%s">%s</a>' % (str(i), str(i))
  return s    


class StaticPageHandler(webapp.RequestHandler):
  def render_page(self, parameters):
    parameters['title'] = self.get_page_title()
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

class Item(object):
  addresses = []
  count = 0

class AdminHandler(StaticPageHandler):
  def get_page_title(self):
    return "Admin page"
  
  def get_page_template_name(self):
    return "admin"
  
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
  application = webapp.WSGIApplication([('/admin', AdminHandler), ('/admin/ip_details', IPDetailsHandler)],
                                       debug=False)
  util.run_wsgi_app(application)

if __name__ == '__main__':
  main()
  

