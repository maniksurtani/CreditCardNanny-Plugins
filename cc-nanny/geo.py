from xml.parsers import expat
from google.appengine.api import urlfetch

class Geo():
  def __init__(self, ip):
    self.city = ""
    self.country = ""
    self.region = ""
    self.area_code = ""
    self.country_code = ""
    self.continent_code = ""
    self.latitude = ""
    self.longitude = ""
    
    self.ip = ip
    self.data_map = {}
    self.current_key = ""    
    url = "http://www.geoplugin.net/xml.gp?ip=" + ip
    res = urlfetch.fetch(url, deadline = 10)
    if (res.status_code == 200):
      xml = res.content
    
      p = expat.ParserCreate()
            
      p.StartElementHandler = self.start_element
      p.EndElementHandler = self.end_element
      p.CharacterDataHandler = self.char_data
        
      p.Parse(xml)
        
        
      if 'geoplugin_city' in self.data_map:
        self.city = self.data_map['geoplugin_city']
      if 'geoplugin_countryName' in self.data_map:
        self.country = self.data_map['geoplugin_countryName']
      if 'geoplugin_region' in self.data_map:
        self.region = self.data_map['geoplugin_region']
      if 'geoplugin_areaCode' in self.data_map:
        self.area_code = self.data_map['geoplugin_areaCode']
      if 'geoplugin_countryCode' in self.data_map:
        self.country_code = self.data_map['geoplugin_countryCode']
      if 'geoplugin_continentCode' in self.data_map:
        self.continent_code = self.data_map['geoplugin_continentCode']
      if 'geoplugin_latitude' in self.data_map:
        self.latitude = self.data_map['geoplugin_latitude']
      if 'geoplugin_longitude' in self.data_map:
        self.longitude = self.data_map['geoplugin_longitude']
  
                
  def start_element(self, name, attrs):
    if name != "geoPlugin":
      self.current_key = name

  def end_element(self, name):
    self.current_key = ""

  def char_data(self, data):
    if self.current_key != "":
      self.data_map[self.current_key] = data        

