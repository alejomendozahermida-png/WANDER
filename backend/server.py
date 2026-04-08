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
import xml.etree.ElementTree as ET
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
    },
    {
        "name": "fly4free",
        "url": "https://www.fly4free.com/feed/",
        "is_error_fare": False,
    },
    {
        "name": "theflightdeal",
        "url": "https://www.theflightdeal.com/feed/",
        "is_error_fare": True,
    },
    {
        "name": "holidaypirates",
        "url": "https://www.holidaypirates.com/feed",
        "is_error_fare": False,
    },
]


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
    """Fetch and parse a single RSS feed"""
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

            root = ET.fromstring(response.text)
            
            # Handle both RSS 2.0 and Atom feeds
            items = root.findall('.//item') or root.findall('.//{http://www.w3.org/2005/Atom}entry')
            
            for item in items[:20]:  # Limit to 20 items per feed
                title_el = item.find('title') or item.find('{http://www.w3.org/2005/Atom}title')
                link_el = item.find('link') or item.find('{http://www.w3.org/2005/Atom}link')
                pub_date_el = item.find('pubDate') or item.find('{http://www.w3.org/2005/Atom}published')
                desc_el = item.find('description') or item.find('{http://www.w3.org/2005/Atom}summary')
                
                title = title_el.text if title_el is not None and title_el.text else ""
                link = link_el.text if link_el is not None and link_el.text else (link_el.get('href', '') if link_el is not None else "")
                description = desc_el.text if desc_el is not None and desc_el.text else ""
                
                if not title:
                    continue

                # Extract price and cities
                price = parse_price_from_text(title) or parse_price_from_text(description)
                origin, destination = extract_cities_from_title(title)

                # Parse tags from title
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
                if pub_date_el is not None and pub_date_el.text:
                    try:
                        from email.utils import parsedate_to_datetime
                        published_at = parsedate_to_datetime(pub_date_el.text)
                    except Exception:
                        pass

                deal = {
                    "id": str(uuid.uuid4()),
                    "source": feed_config["name"],
                    "title": title[:300],
                    "origin": origin,
                    "destination": destination,
                    "price": price,
                    "currency": "EUR",
                    "url": link,
                    "published_at": published_at,
                    "fetched_at": datetime.utcnow(),
                    "is_error_fare": feed_config.get("is_error_fare", False) or 'error_fare' in tags,
                    "tags": tags,
                }
                deals.append(deal)

    except Exception as e:
        logger.error(f"Error fetching RSS feed {feed_config['name']}: {e}")
    
    return deals


async def refresh_all_feeds():
    """Fetch all RSS feeds in parallel and store in MongoDB"""
    all_deals = []
    tasks = [fetch_rss_feed(feed) for feed in RSS_FEEDS]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for result in results:
        if isinstance(result, list):
            all_deals.extend(result)
        elif isinstance(result, Exception):
            logger.error(f"Feed fetch error: {result}")
    
    if all_deals:
        # Clear old deals and insert new ones
        await db.deals.delete_many({})
        await db.deals.insert_many(all_deals)
        logger.info(f"Stored {len(all_deals)} deals from {len(RSS_FEEDS)} feeds")
    
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
async def get_deals(limit: int = 50, error_fares_only: bool = False):
    """Get cached flight deals from RSS feeds"""
    query = {}
    if error_fares_only:
        query["is_error_fare"] = True
    
    deals = await db.deals.find(query).sort("fetched_at", -1).to_list(limit)
    
    # Convert ObjectId and datetime for JSON serialization
    for deal in deals:
        deal.pop("_id", None)
        if deal.get("published_at"):
            deal["published_at"] = deal["published_at"].isoformat()
        if deal.get("fetched_at"):
            deal["fetched_at"] = deal["fetched_at"].isoformat()
    
    return {"deals": deals, "count": len(deals)}


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
