from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import feedparser
import re
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class FlightDeal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str  # 'secretflying', 'fly4free', etc.
    title: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    price: Optional[float] = None
    currency: str = "EUR"
    url: str
    published_at: Optional[datetime] = None
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    is_error_fare: bool = False
    tags: List[str] = []

class UserAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    deal_id: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertPreference(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    max_price: Optional[float] = None
    preferred_destinations: List[str] = []
    preferred_regions: List[str] = []
    origin_iata: Optional[str] = None
    mood: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ==================== RSS DEAL AGGREGATOR ====================

RSS_FEEDS = [
    {
        "name": "secretflying",
        "url": "https://www.secretflying.com/feed/",
        "is_error_fare": True,
        "region": "global",
    },
    {
        "name": "fly4free_us",
        "url": "https://www.fly4free.com/feed/",
        "is_error_fare": False,
        "region": "us",
    },
    {
        "name": "fly4free_europe",
        "url": "https://www.fly4free.com/flight-deals/europe/feed/",
        "is_error_fare": False,
        "region": "europe",
    },
    {
        "name": "theflightdeal",
        "url": "https://www.theflightdeal.com/feed/",
        "is_error_fare": True,
        "region": "us",
    },
    {
        "name": "holidaypirates",
        "url": "https://www.holidaypirates.com/feed",
        "is_error_fare": False,
        "region": "europe",
    },
    {
        "name": "travelfree",
        "url": "https://travelfree.info/feed",
        "is_error_fare": False,
        "region": "europe",
    },
]

# Airport to region mapping
AIRPORT_REGIONS = {
    # Europe
    "CDG": "europe", "ORY": "europe", "LHR": "europe", "LGW": "europe", "STN": "europe",
    "AMS": "europe", "FRA": "europe", "MUC": "europe", "BER": "europe", "BCN": "europe",
    "MAD": "europe", "FCO": "europe", "MXP": "europe", "LIS": "europe", "ATH": "europe",
    "VIE": "europe", "ZRH": "europe", "BRU": "europe", "CPH": "europe", "OSL": "europe",
    "ARN": "europe", "HEL": "europe", "WAW": "europe", "PRG": "europe", "BUD": "europe",
    "DUB": "europe", "EDI": "europe", "MAN": "europe",
    # US
    "JFK": "us", "LAX": "us", "ORD": "us", "SFO": "us", "MIA": "us",
    "ATL": "us", "DFW": "us", "DEN": "us", "SEA": "us", "BOS": "us",
    "IAD": "us", "EWR": "us", "PHL": "us", "IAH": "us", "MSP": "us",
    # LATAM
    "BOG": "latam", "MEX": "latam", "GRU": "latam", "EZE": "latam", "SCL": "latam",
    "LIM": "latam", "CUN": "latam", "PTY": "latam", "MDE": "latam",
    # Asia
    "NRT": "asia", "HND": "asia", "ICN": "asia", "SIN": "asia", "HKG": "asia",
    "BKK": "asia", "DEL": "asia", "BOM": "asia", "KUL": "asia", "TPE": "asia",
    # Middle East / Africa
    "DXB": "meast", "DOH": "meast", "IST": "europe", "CAI": "meast",
    "JNB": "africa", "CPT": "africa", "NBO": "africa", "CMN": "africa",
    # Oceania
    "SYD": "oceania", "MEL": "oceania", "AKL": "oceania",
}

# European city names for matching deal origins
EUROPEAN_CITIES = {
    "paris", "london", "amsterdam", "berlin", "barcelona", "madrid", "rome", "milan",
    "lisbon", "athens", "vienna", "zurich", "brussels", "copenhagen", "oslo", "stockholm",
    "helsinki", "warsaw", "prague", "budapest", "dublin", "edinburgh", "manchester",
    "munich", "frankfurt", "lyon", "marseille", "nice", "seville", "porto", "florence",
    "venice", "naples", "dubrovnik", "split", "bucharest", "sofia", "belgrade", "zagreb",
}

US_CITIES = {
    "new york", "los angeles", "chicago", "san francisco", "miami", "atlanta",
    "dallas", "denver", "seattle", "boston", "washington", "philadelphia", "houston",
    "minneapolis", "detroit", "portland", "san diego", "las vegas", "orlando",
}

LATAM_CITIES = {
    "bogota", "mexico city", "sao paulo", "buenos aires", "santiago", "lima",
    "cancun", "panama city", "medellin", "cartagena", "rio de janeiro",
}

def get_deal_region(deal: dict) -> str:
    """Determine the region of a deal based on origin city"""
    origin = (deal.get("origin") or "").lower()
    if not origin:
        return deal.get("feed_region", "global")
    if origin in EUROPEAN_CITIES:
        return "europe"
    if origin in US_CITIES:
        return "us"
    if origin in LATAM_CITIES:
        return "latam"
    return deal.get("feed_region", "global")


def parse_price_from_text(text: str) -> Optional[float]:
    """Extract price from title/description text"""
    patterns = [
        r'[\$\€\£](\d+[\.,]?\d*)',
        r'(\d+[\.,]?\d*)\s*(?:EUR|USD|GBP|€|\$|£)',
        r'from\s+(\d+[\.,]?\d*)',
        r'desde\s+(\d+[\.,]?\d*)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(',', '.')
            try:
                return float(price_str)
            except ValueError:
                continue
    return None


def extract_cities_from_title(title: str) -> tuple:
    """Try to extract origin and destination from deal title"""
    # Common patterns: "City to City", "City → City", "City - City"
    patterns = [
        r'(?:from\s+)?(\w[\w\s]*?)\s+(?:to|→|->|–)\s+(\w[\w\s]*?)(?:\s+(?:from|for|just|only|\$|€|£|\d))',
        r'(\w[\w\s]*?)\s+(?:to|→|->|–)\s+(\w[\w\s]*)',
    ]
    for pattern in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            return match.group(1).strip(), match.group(2).strip()
    return None, None


async def fetch_rss_feed(feed_config: dict) -> List[dict]:
    """Fetch and parse a single RSS feed using feedparser"""
    deals = []
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as http_client:
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; WanderBot/1.0)",
                "Accept": "application/rss+xml, application/xml, text/xml",
            }
            response = await http_client.get(feed_config["url"], headers=headers)
            
            if response.status_code != 200:
                logger.warning(f"RSS feed {feed_config['name']} returned status {response.status_code}")
                return deals

            content = response.text
            
            # Skip if HTML
            if '<html' in content[:500].lower() and '<?xml' not in content[:100]:
                logger.warning(f"RSS {feed_config['name']}: Received HTML, skipping.")
                return deals

            # Use feedparser for robust RSS/Atom parsing
            feed = feedparser.parse(content)
            entries = feed.entries
            logger.info(f"RSS {feed_config['name']}: feedparser found {len(entries)} entries")
            
            for entry in entries[:20]:
                try:
                    title = getattr(entry, 'title', '') or ''
                    link = getattr(entry, 'link', '') or ''
                    description = getattr(entry, 'summary', '') or getattr(entry, 'description', '') or ''
                    
                    if not title:
                        continue

                    price = parse_price_from_text(title) or parse_price_from_text(description)
                    origin, destination = extract_cities_from_title(title)

                    tags = []
                    title_lower = title.lower()
                    if any(w in title_lower for w in ['error', 'mistake', 'glitch']):
                        tags.append('error_fare')
                    if any(w in title_lower for w in ['business', 'first class', 'premium']):
                        tags.append('premium')
                    if price and price < 100:
                        tags.append('budget')
                    if any(w in title_lower for w in ['round', 'roundtrip', 'ida y vuelta']):
                        tags.append('roundtrip')

                    published_at = None
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        try:
                            import time
                            published_at = datetime.fromtimestamp(time.mktime(entry.published_parsed))
                        except Exception:
                            pass

                    # Extract image from description/content
                    image_url = None
                    content_text = ''
                    if hasattr(entry, 'content') and entry.content:
                        content_text = entry.content[0].get('value', '')
                    elif description:
                        content_text = description
                    
                    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content_text)
                    if img_match:
                        image_url = img_match.group(1)

                    deal = {
                        "id": str(uuid.uuid4()),
                        "source": feed_config["name"],
                        "title": title[:300],
                        "origin": origin,
                        "destination": destination,
                        "price": price,
                        "currency": "EUR",
                        "url": link,
                        "image_url": image_url,
                        "published_at": published_at,
                        "fetched_at": datetime.utcnow(),
                        "is_error_fare": feed_config.get("is_error_fare", False) or 'error_fare' in tags,
                        "tags": tags,
                        "feed_region": feed_config.get("region", "global"),
                    }
                    deals.append(deal)
                except Exception as item_err:
                    logger.warning(f"RSS {feed_config['name']}: Error parsing entry: {item_err}")
                    continue

    except Exception as e:
        logger.error(f"Error fetching RSS feed {feed_config['name']}: {e}")
    
    return deals


async def refresh_all_feeds():
    """Fetch all RSS feeds in parallel and store in MongoDB"""
    all_deals = []
    tasks = [fetch_rss_feed(feed) for feed in RSS_FEEDS]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for i, result in enumerate(results):
        if isinstance(result, list):
            logger.info(f"Feed {RSS_FEEDS[i]['name']}: {len(result)} deals parsed")
            all_deals.extend(result)
        elif isinstance(result, Exception):
            logger.error(f"Feed {RSS_FEEDS[i]['name']} error: {result}")
        else:
            logger.warning(f"Feed {RSS_FEEDS[i]['name']}: unexpected result type {type(result)}")
    
    logger.info(f"Total deals collected: {len(all_deals)}")
    
    if all_deals:
        try:
            # Clear old deals and insert new ones
            await db.deals.delete_many({})
            await db.deals.insert_many(all_deals)
            logger.info(f"Stored {len(all_deals)} deals in MongoDB")
        except Exception as e:
            logger.error(f"MongoDB insert error: {e}")
    
    return all_deals


async def match_deals_with_preferences():
    """Match current deals with user preferences and create notifications"""
    preferences = await db.alert_preferences.find({"active": True}).to_list(1000)
    deals = await db.deals.find().sort("fetched_at", -1).to_list(200)
    
    notifications_created = 0
    
    for pref in preferences:
        for deal in deals:
            # Check if notification already exists for this deal+user
            existing = await db.notifications.find_one({
                "user_id": pref["user_id"],
                "deal_id": deal["id"]
            })
            if existing:
                continue
            
            matched = False
            
            # Match by price
            if pref.get("max_price") and deal.get("price"):
                if deal["price"] <= pref["max_price"]:
                    matched = True
            
            # Match by destination
            if pref.get("preferred_destinations") and deal.get("destination"):
                dest_lower = deal["destination"].lower()
                if any(d.lower() in dest_lower for d in pref["preferred_destinations"]):
                    matched = True
            
            # Error fares are always interesting
            if deal.get("is_error_fare") and deal.get("price") and deal["price"] < 200:
                matched = True
            
            if matched:
                notification = {
                    "id": str(uuid.uuid4()),
                    "user_id": pref["user_id"],
                    "title": f"{'Error Fare!' if deal.get('is_error_fare') else 'Deal found!'} {deal.get('destination', 'Unknown')}",
                    "message": deal["title"],
                    "deal_id": deal["id"],
                    "read": False,
                    "created_at": datetime.utcnow(),
                }
                await db.notifications.insert_one(notification)
                notifications_created += 1
    
    return notifications_created


# ==================== API ROUTES ====================

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Wander API v2.0 - Global Smart Travel Search"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# ---- Deal Aggregator Routes ----

@api_router.get("/deals")
async def get_deals(limit: int = 50, error_fares_only: bool = False, airport: str = None):
    """Get cached flight deals from RSS feeds, filtered by user region"""
    query = {}
    if error_fares_only:
        query["is_error_fare"] = True
    
    deals = await db.deals.find(query).sort("fetched_at", -1).to_list(200)
    
    # Convert ObjectId and datetime for JSON serialization
    for deal in deals:
        deal.pop("_id", None)
        if deal.get("published_at"):
            deal["published_at"] = deal["published_at"].isoformat()
        if deal.get("fetched_at"):
            deal["fetched_at"] = deal["fetched_at"].isoformat()
    
    # If airport provided, filter and prioritize by region
    if airport:
        user_region = AIRPORT_REGIONS.get(airport.upper(), "global")
        
        # Categorize deals
        for_you = []  # Same region as user
        global_deals = []  # Global deals
        other = []  # Other regions
        
        for deal in deals:
            deal_region = get_deal_region(deal)
            if deal_region == user_region:
                deal["relevance"] = "for_you"
                for_you.append(deal)
            elif deal_region == "global":
                deal["relevance"] = "global"
                global_deals.append(deal)
            else:
                deal["relevance"] = "other"
                other.append(deal)
        
        # Prioritize: user region first, then global, then limited others
        filtered = for_you + global_deals + other[:5]
        return {"deals": filtered[:limit], "count": len(filtered[:limit]), "user_region": user_region}
    
    return {"deals": deals[:limit], "count": len(deals[:limit])}


@api_router.post("/deals/refresh")
async def refresh_deals():
    """Manually trigger RSS feed refresh"""
    deals = await refresh_all_feeds()
    # Also match with user preferences
    notifications = await match_deals_with_preferences()
    return {
        "message": f"Refreshed {len(deals)} deals from {len(RSS_FEEDS)} sources",
        "deals_count": len(deals),
        "notifications_created": notifications,
    }


@api_router.get("/deals/error-fares")
async def get_error_fares():
    """Get only error fares / mistake fares"""
    deals = await db.deals.find({"is_error_fare": True}).sort("fetched_at", -1).to_list(20)
    for deal in deals:
        deal.pop("_id", None)
        if deal.get("published_at"):
            deal["published_at"] = deal["published_at"].isoformat()
        if deal.get("fetched_at"):
            deal["fetched_at"] = deal["fetched_at"].isoformat()
    return {"deals": deals, "count": len(deals)}


# ---- Notification Routes ----

@api_router.get("/notifications/{user_id}")
async def get_notifications(user_id: str, unread_only: bool = False):
    """Get notifications for a user"""
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query).sort("created_at", -1).to_list(50)
    unread_count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    
    for n in notifications:
        n.pop("_id", None)
        if n.get("created_at"):
            n["created_at"] = n["created_at"].isoformat()
    
    return {"notifications": notifications, "unread_count": unread_count}


@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    return {"success": result.modified_count > 0}


@api_router.post("/notifications/{user_id}/read-all")
async def mark_all_read(user_id: str):
    """Mark all notifications as read for a user"""
    result = await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"marked_read": result.modified_count}


# ---- Alert Preference Routes ----

@api_router.post("/alerts/preferences")
async def save_alert_preference(pref: AlertPreference):
    """Save or update alert preferences for a user"""
    # Upsert by user_id
    await db.alert_preferences.update_one(
        {"user_id": pref.user_id},
        {"$set": pref.dict()},
        upsert=True
    )
    return {"success": True, "preference": pref.dict()}


@api_router.get("/alerts/preferences/{user_id}")
async def get_alert_preference(user_id: str):
    """Get alert preferences for a user"""
    pref = await db.alert_preferences.find_one({"user_id": user_id})
    if pref:
        pref.pop("_id", None)
        return pref
    return {"user_id": user_id, "active": False}


# ==================== ACCOMMODATION SEARCH (Booking.com) ====================

RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')

RAPIDAPI_HEADERS = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'Content-Type': 'application/json',
}


async def booking_search_dest_id(city: str) -> Optional[str]:
    """Get Booking.com dest_id for a city"""
    cache = await db.booking_dest_cache.find_one({"city": city.lower()})
    if cache:
        return cache["dest_id"]

    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            r = await client_http.get(
                'https://booking-com.p.rapidapi.com/v1/hotels/locations',
                params={'name': city, 'locale': 'en-gb'},
                headers={**RAPIDAPI_HEADERS, 'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'},
            )
            data = r.json()
            if isinstance(data, list) and data:
                dest_id = data[0].get('dest_id')
                # Cache it
                await db.booking_dest_cache.update_one(
                    {"city": city.lower()},
                    {"$set": {"city": city.lower(), "dest_id": dest_id, "data": data[0]}},
                    upsert=True
                )
                return dest_id
    except Exception as e:
        logger.error(f"Booking dest search error for {city}: {e}")
    return None


async def booking_search_hotels(
    dest_id: str,
    checkin: str,
    checkout: str,
    adults: int = 2,
    currency: str = "EUR"
) -> list:
    """Search hotels on Booking.com and return categorized results"""
    try:
        async with httpx.AsyncClient(timeout=30) as client_http:
            r = await client_http.get(
                'https://booking-com.p.rapidapi.com/v1/hotels/search',
                params={
                    'dest_id': dest_id,
                    'dest_type': 'city',
                    'checkin_date': checkin,
                    'checkout_date': checkout,
                    'adults_number': str(adults),
                    'room_number': '1',
                    'order_by': 'price',
                    'locale': 'en-gb',
                    'currency': currency,
                    'units': 'metric',
                    'filter_by_currency': currency,
                    'page_number': '0',
                    'include_adjacency': 'true',
                },
                headers={**RAPIDAPI_HEADERS, 'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'},
            )
            data = r.json()
            return data.get('result', [])
    except Exception as e:
        logger.error(f"Booking hotel search error: {e}")
        return []


def categorize_accommodations(hotels: list, nights: int) -> dict:
    """Pick 3 accommodation types: budget, mid-range, premium"""
    if not hotels:
        return {"budget": None, "midrange": None, "premium": None}

    def format_hotel(h, category):
        total = h.get('min_total_price') or h.get('composite_price_breakdown', {}).get('gross_amount', {}).get('value', 0)
        per_night = round(float(total) / max(nights, 1), 2) if total else 0
        photo = h.get('max_photo_url', h.get('main_photo_url', ''))
        return {
            "category": category,
            "name": h.get('hotel_name', 'Unknown'),
            "stars": h.get('class', 0),
            "review_score": h.get('review_score', 0),
            "review_word": h.get('review_score_word', ''),
            "total_price": round(float(total), 2) if total else 0,
            "price_per_night": per_night,
            "currency": h.get('currency_code', 'EUR'),
            "photo_url": photo,
            "address": h.get('address', ''),
            "distance_to_center": h.get('distance_to_cc', ''),
            "booking_url": h.get('url', ''),
            "accommodation_type": h.get('accommodation_type_name', 'Hotel'),
        }

    sorted_hotels = sorted(hotels, key=lambda x: float(x.get('min_total_price', 9999) or 9999))

    budget = None
    midrange = None
    premium = None

    for h in sorted_hotels:
        stars = float(h.get('class', 0) or 0)
        price = float(h.get('min_total_price', 0) or 0)
        review = float(h.get('review_score', 0) or 0)

        if not budget and price > 0:
            budget = format_hotel(h, 'budget')
        elif not midrange and (stars >= 3 or review >= 7.5) and price > 0:
            midrange = format_hotel(h, 'midrange')
        elif not premium and (stars >= 4 or review >= 8.5) and price > 0:
            premium = format_hotel(h, 'premium')

        if budget and midrange and premium:
            break

    # Fallbacks
    if not midrange and len(sorted_hotels) > 1:
        midrange = format_hotel(sorted_hotels[len(sorted_hotels) // 3], 'midrange')
    if not premium and len(sorted_hotels) > 2:
        premium = format_hotel(sorted_hotels[-1], 'premium')

    return {"budget": budget, "midrange": midrange, "premium": premium}


@api_router.get("/accommodations/search")
async def search_accommodations(
    city: str,
    checkin: str,
    checkout: str,
    adults: int = 2,
    currency: str = "EUR"
):
    """Search 3 accommodation options for a city (budget, mid-range, premium)"""
    # Calculate nights
    from datetime import date
    try:
        d1 = date.fromisoformat(checkin)
        d2 = date.fromisoformat(checkout)
        nights = (d2 - d1).days
    except Exception:
        nights = 7

    # Get destination ID
    dest_id = await booking_search_dest_id(city)
    if not dest_id:
        return {"city": city, "accommodations": None, "error": "City not found on Booking.com"}

    # Search hotels
    hotels = await booking_search_hotels(dest_id, checkin, checkout, adults, currency)
    if not hotels:
        return {"city": city, "accommodations": None, "error": "No hotels found"}

    # Categorize into 3 types
    accommodations = categorize_accommodations(hotels, nights)

    return {
        "city": city,
        "checkin": checkin,
        "checkout": checkout,
        "nights": nights,
        "total_results": len(hotels),
        "accommodations": accommodations,
    }


# ==================== CURRENCY CONVERSION ====================

@api_router.get("/currency/rates")
async def get_exchange_rates(base: str = "EUR", targets: str = "USD,GBP,MXN,BRL,COP,ARS,CLP,PEN"):
    """Get exchange rates from a base currency to targets"""
    # Check cache (refresh every hour)
    cache_key = f"rates_{base}_{targets}"
    cached = await db.currency_cache.find_one({"key": cache_key})
    if cached:
        cache_age = (datetime.utcnow() - cached["updated_at"]).total_seconds()
        if cache_age < 3600:  # 1 hour cache
            cached.pop("_id", None)
            return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            r = await client_http.get(
                'https://currency-conversion-and-exchange-rates.p.rapidapi.com/latest',
                params={'from': base, 'to': targets},
                headers={**RAPIDAPI_HEADERS, 'X-RapidAPI-Host': 'currency-conversion-and-exchange-rates.p.rapidapi.com'},
            )
            data = r.json()

            if data.get('success'):
                result = {
                    "base": base,
                    "rates": data.get("rates", {}),
                    "timestamp": data.get("timestamp"),
                }
                # Cache
                await db.currency_cache.update_one(
                    {"key": cache_key},
                    {"$set": {"key": cache_key, "data": result, "updated_at": datetime.utcnow()}},
                    upsert=True
                )
                return result
            return {"error": "Failed to fetch rates", "raw": data}
    except Exception as e:
        logger.error(f"Currency API error: {e}")
        return {"error": str(e)}


@api_router.get("/currency/convert")
async def convert_currency(amount: float, from_currency: str = "EUR", to_currency: str = "USD"):
    """Convert a specific amount between currencies"""
    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            r = await client_http.get(
                'https://currency-conversion-and-exchange-rates.p.rapidapi.com/convert',
                params={'from': from_currency, 'to': to_currency, 'amount': str(amount)},
                headers={**RAPIDAPI_HEADERS, 'X-RapidAPI-Host': 'currency-conversion-and-exchange-rates.p.rapidapi.com'},
            )
            data = r.json()
            if data.get('success'):
                return {
                    "from": from_currency,
                    "to": to_currency,
                    "amount": amount,
                    "result": data.get("result"),
                    "rate": data.get("info", {}).get("rate"),
                }
            return {"error": "Conversion failed", "raw": data}
    except Exception as e:
        logger.error(f"Currency convert error: {e}")
        return {"error": str(e)}

# ==================== FLIGHT SEARCH (Duffel API via Backend) ====================

DUFFEL_API_KEY = os.environ.get("DUFFEL_API_KEY", "")
DUFFEL_IS_TEST = DUFFEL_API_KEY.startswith("duffel_test_")

def adjust_dates_for_test(departure: str, return_date: str):
    """Shift dates forward for Duffel test API key (requires 340+ days in future)"""
    if not DUFFEL_IS_TEST:
        return departure, return_date
    from datetime import timedelta
    dep = datetime.strptime(departure, "%Y-%m-%d")
    ret = datetime.strptime(return_date, "%Y-%m-%d")
    trip_days = (ret - dep).days
    min_date = datetime.now() + timedelta(days=340)
    if dep < min_date:
        new_dep = min_date
        new_ret = min_date + timedelta(days=max(trip_days, 1))
        return new_dep.strftime("%Y-%m-%d"), new_ret.strftime("%Y-%m-%d")
    return departure, return_date

def format_duration(iso_dur):
    """Convert ISO 8601 duration (PT2H30M) to readable format"""
    if not iso_dur:
        return "N/A"
    import re as _re
    h = _re.search(r'(\d+)H', iso_dur)
    m = _re.search(r'(\d+)M', iso_dur)
    hours = int(h.group(1)) if h else 0
    minutes = int(m.group(1)) if m else 0
    if hours > 0 and minutes > 0:
        return f"{hours}h {minutes}m"
    if hours > 0:
        return f"{hours}h"
    if minutes > 0:
        return f"{minutes}m"
    return "N/A"

@api_router.post("/flights/search")
async def search_flights(data: dict):
    """
    Search flights via Duffel API.
    Expects: { origin, destinations: [iata codes], departure_date, return_date, budget_max }
    Returns array of flight results with full details.
    """
    if not DUFFEL_API_KEY:
        return {"error": "Duffel API key not configured", "results": []}

    origin = data.get("origin", "CDG")
    destinations = data.get("destinations", [])
    departure_date = data.get("departure_date", "")
    return_date = data.get("return_date", "")

    # Adjust dates for test key
    adj_dep, adj_ret = adjust_dates_for_test(departure_date, return_date)
    logger.info(f"[Duffel] Searching flights: {origin} -> {destinations}, dates: {adj_dep} to {adj_ret}")

    results = []
    headers = {
        "Authorization": f"Bearer {DUFFEL_API_KEY}",
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=50.0) as client_http:
        tasks = []
        for dest_iata in destinations[:15]:
            if dest_iata == origin:
                continue
            tasks.append(_search_single_flight(client_http, headers, origin, dest_iata, adj_dep, adj_ret, departure_date, return_date))

        flight_results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in flight_results:
            if isinstance(r, dict) and not r.get("error"):
                results.append(r)

    results.sort(key=lambda x: x.get("flightPrice", 99999))
    logger.info(f"[Duffel] Found {len(results)} flight results")
    return {"results": results}


async def _search_single_flight(client_http, headers, origin, dest_iata, adj_dep, adj_ret, orig_dep, orig_ret):
    """Search a single origin->destination flight pair"""
    try:
        payload = {
            "data": {
                "slices": [
                    {"origin": origin, "destination": dest_iata, "departure_date": adj_dep},
                    {"origin": dest_iata, "destination": origin, "departure_date": adj_ret},
                ],
                "passengers": [{"type": "adult"}],
                "cabin_class": "economy",
            }
        }

        resp = await client_http.post(
            "https://api.duffel.com/air/offer_requests?return_offers=true",
            json=payload,
            headers=headers,
        )
        resp_data = resp.json()

        if "errors" in resp_data:
            err_msg = resp_data["errors"][0].get("message", "Unknown Duffel error") if resp_data["errors"] else "Unknown"
            logger.warning(f"[Duffel] API error for {dest_iata}: {err_msg}")
            return {"error": err_msg, "iata": dest_iata}

        offers = resp_data.get("data", {}).get("offers", [])
        if not offers:
            logger.info(f"[Duffel] No offers for {dest_iata}")
            return {"error": f"No offers for {dest_iata}"}

        # Get cheapest offer
        cheapest = min(offers, key=lambda o: float(o.get("total_amount", "99999")))
        flight_price = round(float(cheapest["total_amount"]))

        # Extract city/country info from slice destination
        outbound_slice = cheapest.get("slices", [{}])[0]
        inbound_slice = cheapest["slices"][1] if len(cheapest.get("slices", [])) > 1 else None

        dest_place = outbound_slice.get("destination") or {}
        city_name = dest_place.get("city_name") or dest_place.get("name") or dest_iata
        country_code = dest_place.get("iata_country_code", "")

        COUNTRY_NAMES = {
            "PT": "Portugal", "ES": "Spain", "FR": "France", "IT": "Italy",
            "GR": "Greece", "CZ": "Czech Republic", "HU": "Hungary", "PL": "Poland",
            "AT": "Austria", "DE": "Germany", "NL": "Netherlands", "BE": "Belgium",
            "GB": "United Kingdom", "IE": "Ireland", "HR": "Croatia", "RO": "Romania",
            "BG": "Bulgaria", "CH": "Switzerland", "SE": "Sweden", "NO": "Norway",
            "DK": "Denmark", "FI": "Finland", "TR": "Turkey", "MA": "Morocco",
            "TN": "Tunisia", "EG": "Egypt", "IL": "Israel", "JO": "Jordan",
        }
        country_name = COUNTRY_NAMES.get(country_code, country_code)
        visa_free = country_code in ["PT","ES","FR","IT","GR","CZ","HU","PL","AT","DE","NL","BE","GB","IE","HR","RO","BG","CH","SE","NO","DK","FI"]

        def extract_segments(slice_data):
            if not slice_data:
                return []
            segs = []
            for seg in (slice_data.get("segments") or []):
                origin_data = seg.get("origin") or {}
                dest_data = seg.get("destination") or {}
                op_carrier = seg.get("operating_carrier") or {}
                mk_carrier = seg.get("marketing_carrier") or {}
                segs.append({
                    "airline": op_carrier.get("name") or mk_carrier.get("name", "Unknown"),
                    "flightNumber": (mk_carrier.get("iata_code", "") + seg.get("marketing_carrier_flight_number", "")),
                    "departureAirport": origin_data.get("iata_code", ""),
                    "departureName": origin_data.get("city_name") or origin_data.get("name", ""),
                    "departureTime": seg.get("departing_at", ""),
                    "arrivalAirport": dest_data.get("iata_code", ""),
                    "arrivalName": dest_data.get("city_name") or dest_data.get("name", ""),
                    "arrivalTime": seg.get("arriving_at", ""),
                    "duration": format_duration(seg.get("duration", "")),
                    "aircraft": (seg.get("aircraft") or {}).get("name", ""),
                })
            return segs

        ob_segments = outbound_slice.get("segments") or []
        ib_segments = (inbound_slice.get("segments") or []) if inbound_slice else []

        owner = cheapest.get("owner") or {}
        flight_details = {
            "offerId": cheapest.get("id", ""),
            "airline": owner.get("name", "Unknown"),
            "totalPrice": flight_price,
            "currency": cheapest.get("total_currency", "EUR"),
            "outbound": {
                "departure": ob_segments[0].get("departing_at", "") if ob_segments else "",
                "arrival": ob_segments[-1].get("arriving_at", "") if ob_segments else "",
                "duration": format_duration(outbound_slice.get("duration", "")),
                "stops": max(0, len(ob_segments) - 1),
                "segments": extract_segments(outbound_slice),
            },
            "inbound": {
                "departure": ib_segments[0].get("departing_at", "") if ib_segments else "",
                "arrival": ib_segments[-1].get("arriving_at", "") if ib_segments else "",
                "duration": format_duration(inbound_slice.get("duration", "")) if inbound_slice else "N/A",
                "stops": max(0, len(ib_segments) - 1),
                "segments": extract_segments(inbound_slice),
            },
        }

        logger.info(f"[Duffel] {origin}->{dest_iata}: {flight_price}EUR, {owner.get('name','?')}")
        return {
            "iata": dest_iata,
            "city": city_name,
            "country": country_name,
            "flightPrice": flight_price,
            "flightDuration": format_duration(outbound_slice.get("duration", "")),
            "flightDetails": flight_details,
            "visaFree": visa_free,
            "departureDate": orig_dep,
            "returnDate": orig_ret,
        }

    except Exception as e:
        import traceback
        logger.warning(f"[Duffel] Error searching {dest_iata}: {e}\n{traceback.format_exc()}")
        return {"error": str(e), "iata": dest_iata}


# ==================== AI ENDPOINTS (Claude via Emergent LLM) ====================

from emergentintegrations.llm.chat import LlmChat, UserMessage
import json as json_module

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

class AIDestinationRequest(BaseModel):
    mood: str
    budget_max: float = 500
    origin: str = "CDG"
    departure_date: str = ""
    return_date: str = ""
    languages: List[str] = []
    travel_experience: str = "beginner"
    travel_companion: str = "solo"
    climate_pref: str = "any"
    top_priority: str = "price"

class AIItineraryRequest(BaseModel):
    city: str
    country: str = ""
    trip_days: int = 3
    mood: str = "culture"
    budget_level: str = "student"

@api_router.post("/ai/destinations")
async def ai_destinations(req: AIDestinationRequest):
    """Use Claude to suggest personalized destinations"""
    if not EMERGENT_LLM_KEY:
        return {"error": "LLM key not configured", "destinations": []}
    
    try:
        system_prompt = """Eres un experto en viajes para jovenes europeos (18-30 anos). Tu rol es recomendar destinos reales, concretos y alcanzables segun el perfil del usuario. 
        
REGLAS:
- Responde SOLO con JSON valido, sin texto adicional, sin bloques de codigo
- Recomienda exactamente 3 destinos
- Usa codigos IATA reales
- Los precios estimados deben ser realistas para vuelos desde Europa
- Adapta las recomendaciones al mood, presupuesto y preferencias del usuario
- Incluye destinos variados (no 3 del mismo pais)"""

        user_prompt = f"""Perfil del viajero:
- Mood: {req.mood}
- Presupuesto max vuelo+hotel: {req.budget_max}EUR
- Aeropuerto origen: {req.origin}
- Fechas: {req.departure_date} a {req.return_date}
- Idiomas: {', '.join(req.languages) if req.languages else 'no especificado'}
- Experiencia: {req.travel_experience}
- Viaja: {req.travel_companion}
- Clima preferido: {req.climate_pref}
- Prioridad: {req.top_priority}

Responde con este JSON exacto (sin markdown, sin backticks):
{{"destinations": [{{"city": "nombre", "country": "pais", "iata": "XXX", "why": "razon personalizada en espanol", "estimated_flight_budget": 120, "vibe_tags": ["tag1", "tag2", "tag3"], "best_season": "estacion", "student_tip": "consejo en espanol"}}]}}"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"wander-ai-dest-{uuid.uuid4()}",
            system_message=system_prompt,
        ).with_model("anthropic", "claude-4-sonnet-20250514")
        
        response = await chat.send_message(UserMessage(text=user_prompt))
        
        response_text = response.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            if response_text.startswith("json"):
                response_text = response_text[4:].strip()
        
        result = json_module.loads(response_text)
        return result
        
    except Exception as e:
        logger.error(f"Claude AI error: {e}")
        return {"error": str(e), "destinations": []}


@api_router.post("/ai/itinerary")
async def ai_itinerary(req: AIItineraryRequest):
    """Generate day-by-day itinerary using Claude"""
    if not EMERGENT_LLM_KEY:
        return {"error": "LLM key not configured", "itinerary": []}
    
    try:
        system_prompt = """Eres un experto en viajes que genera itinerarios detallados dia a dia. 
Responde SOLO con JSON valido, sin bloques de codigo, sin backticks.
Incluye actividades reales, restaurantes que existen, barrios reales.
Cada dia debe tener al menos 1 opcion gratuita. Incluye horarios aproximados y consejos locales."""

        user_prompt = f"""Genera un itinerario de {req.trip_days} dias en {req.city}, {req.country}.
Mood: {req.mood}. Budget: {req.budget_level}.

Responde con este JSON exacto (sin markdown):
{{"city": "{req.city}", "total_days": {req.trip_days}, "days": [{{"day": 1, "title": "titulo del dia", "activities": [{{"time": "09:00", "title": "nombre actividad", "description": "descripcion corta", "type": "culture", "cost": "Gratis", "location": "barrio", "insider_tip": "consejo"}}]}}], "local_tips": ["consejo1", "consejo2"]}}"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"wander-ai-itin-{uuid.uuid4()}",
            system_message=system_prompt,
        ).with_model("anthropic", "claude-4-sonnet-20250514")
        
        response = await chat.send_message(UserMessage(text=user_prompt))
        
        response_text = response.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            if response_text.startswith("json"):
                response_text = response_text[4:].strip()
        
        result = json_module.loads(response_text)
        return result
        
    except Exception as e:
        logger.error(f"Claude itinerary error: {e}")
        return {"error": str(e), "itinerary": []}


# ==================== SUBSIDIES ENDPOINT ====================

EUROPEAN_SUBSIDIES = [
    {
        "name": "DiscoverEU",
        "description": "Pase Interrail gratuito para jovenes de 18 anos",
        "amount": "Gratuito (valor ~251€)",
        "max_age": 18,
        "min_age": 18,
        "requires_student": False,
        "eligible_countries": ["EU"],
        "apply_url": "https://youth.europa.eu/discovereu_en",
        "next_deadline": "Octubre 2026",
    },
    {
        "name": "Erasmus+ Travel Grant",
        "description": "Subvencion de viaje para estudiantes Erasmus",
        "amount": "Hasta 275€",
        "max_age": 30,
        "min_age": 18,
        "requires_student": True,
        "requires_erasmus": True,
        "eligible_countries": ["EU"],
        "apply_url": "https://erasmus-plus.ec.europa.eu/",
        "next_deadline": "Segun universidad",
    },
    {
        "name": "ANCV Cheques-Vacances",
        "description": "Cheques vacaciones cofinanciados por el empleador (Francia)",
        "amount": "Variable (hasta 500€/ano)",
        "max_age": 99,
        "min_age": 18,
        "requires_student": False,
        "requires_employer": True,
        "eligible_countries": ["FR"],
        "apply_url": "https://www.ancv.com/",
        "next_deadline": "Permanente",
    },
    {
        "name": "Bono Joven Interrail (Espana)",
        "description": "Descuento del 50% en Interrail para menores de 30",
        "amount": "Hasta 150€ descuento",
        "max_age": 30,
        "min_age": 18,
        "requires_student": False,
        "eligible_countries": ["ES"],
        "apply_url": "https://www.interrail.eu/",
        "next_deadline": "Permanente",
    },
    {
        "name": "European Youth Card (EYCA)",
        "description": "Descuentos en transporte, cultura y alojamiento en 38 paises",
        "amount": "Descuentos variables",
        "max_age": 30,
        "min_age": 14,
        "requires_student": False,
        "eligible_countries": ["EU"],
        "apply_url": "https://www.eyca.org/",
        "next_deadline": "Permanente",
    },
    {
        "name": "Deutsche Bahn BahnCard 25 (Alemania)",
        "description": "25% descuento en trenes alemanes para jovenes",
        "amount": "Tarjeta 36.90€ (ahorro medio 120€)",
        "max_age": 27,
        "min_age": 18,
        "requires_student": False,
        "eligible_countries": ["DE", "EU"],
        "apply_url": "https://www.bahn.de/bahncard",
        "next_deadline": "Permanente",
    },
]

class SubsidyRequest(BaseModel):
    age: int = 22
    is_student: bool = True
    country: str = "FR"
    has_erasmus: bool = False

@api_router.get("/subsidies/calculate")
async def calculate_subsidies(age: int = 22, is_student: bool = True, country: str = "FR", has_erasmus: bool = False):
    """Calculate available travel subsidies for the user"""
    applicable = []
    total_savings = 0
    
    for subsidy in EUROPEAN_SUBSIDIES:
        applies = True
        
        if age < subsidy.get("min_age", 0) or age > subsidy.get("max_age", 99):
            applies = False
        if subsidy.get("requires_student") and not is_student:
            applies = False
        if subsidy.get("requires_erasmus") and not has_erasmus:
            applies = False
        
        eligible = subsidy.get("eligible_countries", [])
        if "EU" not in eligible and country not in eligible:
            applies = False
        
        result = {
            "name": subsidy["name"],
            "description": subsidy["description"],
            "amount": subsidy["amount"],
            "applies": applies,
            "apply_url": subsidy["apply_url"],
            "next_deadline": subsidy["next_deadline"],
        }
        applicable.append(result)
        
        if applies:
            amount_str = subsidy["amount"]
            numbers = re.findall(r'(\d+)', amount_str)
            if numbers:
                total_savings += int(numbers[-1])
    
    return {
        "subsidies": applicable,
        "total_potential_savings": total_savings,
        "applicable_count": sum(1 for s in applicable if s["applies"]),
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
