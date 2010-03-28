from datetime import *
from google.appengine.ext import db
from geo import Geo
from google.appengine.api import memcache

class IPDetails():
    city = ""
    country = ""
    region = ""
    area_code = ""
    country_code = ""
    continent_code = ""
    latitude = ""
    longitude = ""
    ip_address = ""
    name_known = False

    def formatted_name(self):
        if self.name_known:
            return self.name + " (" + self.email + ")"
        else:
            return self.ip_address

def reset_ip_address_cache():
    memcache.flush_all()

def get_ip_details(ip_address):
    # First see if we have this cached
    dtls = memcache.get(ip_address)
    if not dtls:
        # We dont have this.  Lets get some details.
        dtls = IPDetails()
        dtls.ip_address = ip_address

        # Geographic location guesses
        geo = Geo(ip_address)
        dtls.city = geo.city
        dtls.country = geo.country
        dtls.region = geo.region
        dtls.area_code = geo.area_code
        dtls.country_code = geo.country_code
        dtls.continent_code = geo.continent_code
        dtls.latitude = geo.latitude
        dtls.longitude = geo.longitude

        memcache.set(ip_address, dtls)

    return dtls
