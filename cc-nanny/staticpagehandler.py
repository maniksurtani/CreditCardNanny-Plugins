from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.api import users
import os

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

