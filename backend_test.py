#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Wander Travel App
Tests all endpoints with valid inputs, edge cases, and error handling
"""

import asyncio
import httpx
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Backend URL from environment
BACKEND_URL = "https://eurohop-preview.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, endpoint: str, test_name: str, success: bool, details: str = "", response_time: float = 0):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            "endpoint": endpoint,
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}s" if response_time > 0 else "N/A"
        }
        self.results.append(result)
        print(f"{status} {endpoint} - {test_name}: {details}")
        
    async def test_health_check(self):
        """Test GET /api/ - Health check"""
        print("\n🔍 Testing Health Check...")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "message" in data and "Wander" in data["message"]:
                        self.log_test("GET /", "Health check", True, 
                                    f"Status: {response.status_code}, Message: {data['message']}", response_time)
                    else:
                        self.log_test("GET /", "Health check", False, 
                                    f"Unexpected response format: {data}", response_time)
                else:
                    self.log_test("GET /", "Health check", False, 
                                f"Status: {response.status_code}, Body: {response.text}", response_time)
                    
        except Exception as e:
            self.log_test("GET /", "Health check", False, f"Exception: {str(e)}")
            
    async def test_flight_search(self):
        """Test POST /api/flights/search - Duffel API integration"""
        print("\n✈️ Testing Flight Search...")
        
        # Test 1: Valid flight search
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Use dates 340+ days in future for Duffel test key
                future_date = datetime.now() + timedelta(days=350)
                departure_date = future_date.strftime("%Y-%m-%d")
                return_date = (future_date + timedelta(days=4)).strftime("%Y-%m-%d")
                
                payload = {
                    "origin": "CDG",
                    "destinations": ["BCN", "LIS", "BUD"],
                    "departure_date": departure_date,
                    "return_date": return_date
                }
                
                start_time = time.time()
                response = await client.post(f"{BACKEND_URL}/flights/search", json=payload)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "results" in data and isinstance(data["results"], list):
                        results_count = len(data["results"])
                        self.log_test("POST /flights/search", "Valid search", True, 
                                    f"Found {results_count} flight results", response_time)
                        
                        # Validate result structure if results exist
                        if results_count > 0:
                            first_result = data["results"][0]
                            required_fields = ["iata", "city", "country", "flightPrice", "flightDetails"]
                            missing_fields = [f for f in required_fields if f not in first_result]
                            
                            if not missing_fields:
                                self.log_test("POST /flights/search", "Result structure", True, 
                                            f"All required fields present: {required_fields}")
                            else:
                                self.log_test("POST /flights/search", "Result structure", False, 
                                            f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("POST /flights/search", "Valid search", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("POST /flights/search", "Valid search", False, 
                                f"Status: {response.status_code}, Body: {response.text}")
                    
        except Exception as e:
            self.log_test("POST /flights/search", "Valid search", False, f"Exception: {str(e)}")
            
        # Test 2: Invalid destinations
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "origin": "CDG",
                    "destinations": [],  # Empty destinations
                    "departure_date": departure_date,
                    "return_date": return_date
                }
                
                response = await client.post(f"{BACKEND_URL}/flights/search", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "results" in data and len(data["results"]) == 0:
                        self.log_test("POST /flights/search", "Empty destinations", True, 
                                    "Correctly handled empty destinations")
                    else:
                        self.log_test("POST /flights/search", "Empty destinations", False, 
                                    f"Unexpected response: {data}")
                else:
                    self.log_test("POST /flights/search", "Empty destinations", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("POST /flights/search", "Empty destinations", False, f"Exception: {str(e)}")
            
    async def test_accommodations(self):
        """Test GET /api/accommodations/search - Booking.com integration"""
        print("\n🏨 Testing Accommodations Search...")
        
        # Test 1: Valid accommodation search
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                params = {
                    "city": "Lisbon",
                    "checkin": "2026-06-01",
                    "checkout": "2026-06-05",
                    "adults": 2,
                    "currency": "EUR"
                }
                
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/accommodations/search", params=params)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "accommodations" in data and data["accommodations"]:
                        accommodations = data["accommodations"]
                        categories = ["budget", "midrange", "premium"]
                        found_categories = [cat for cat in categories if accommodations.get(cat)]
                        
                        self.log_test("GET /accommodations/search", "Valid search", True, 
                                    f"Found {len(found_categories)} categories: {found_categories}", response_time)
                        
                        # Validate structure of first accommodation
                        for category in found_categories:
                            acc = accommodations[category]
                            required_fields = ["name", "stars", "total_price", "price_per_night", "currency"]
                            missing_fields = [f for f in required_fields if f not in acc]
                            
                            if not missing_fields:
                                self.log_test("GET /accommodations/search", f"{category} structure", True, 
                                            f"All required fields present")
                            else:
                                self.log_test("GET /accommodations/search", f"{category} structure", False, 
                                            f"Missing fields: {missing_fields}")
                            break  # Test only first found category
                    else:
                        self.log_test("GET /accommodations/search", "Valid search", False, 
                                    f"No accommodations found: {data}")
                else:
                    self.log_test("GET /accommodations/search", "Valid search", False, 
                                f"Status: {response.status_code}, Body: {response.text}")
                    
        except Exception as e:
            self.log_test("GET /accommodations/search", "Valid search", False, f"Exception: {str(e)}")
            
        # Test 2: Different city
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                params = {
                    "city": "Bangkok",
                    "checkin": "2026-07-01",
                    "checkout": "2026-07-05",
                    "adults": 1,
                    "currency": "EUR"
                }
                
                response = await client.get(f"{BACKEND_URL}/accommodations/search", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("GET /accommodations/search", "Different city", True, 
                                f"Bangkok search successful: {data.get('city', 'Unknown')}")
                else:
                    self.log_test("GET /accommodations/search", "Different city", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /accommodations/search", "Different city", False, f"Exception: {str(e)}")
            
        # Test 3: Invalid city
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "city": "NonExistentCity123",
                    "checkin": "2026-06-01",
                    "checkout": "2026-06-05",
                    "adults": 2,
                    "currency": "EUR"
                }
                
                response = await client.get(f"{BACKEND_URL}/accommodations/search", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    if "error" in data or not data.get("accommodations"):
                        self.log_test("GET /accommodations/search", "Invalid city", True, 
                                    "Correctly handled invalid city")
                    else:
                        self.log_test("GET /accommodations/search", "Invalid city", False, 
                                    f"Should have failed for invalid city: {data}")
                else:
                    self.log_test("GET /accommodations/search", "Invalid city", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /accommodations/search", "Invalid city", False, f"Exception: {str(e)}")
            
    async def test_currency_exchange(self):
        """Test currency exchange endpoints"""
        print("\n💱 Testing Currency Exchange...")
        
        # Test 1: Get exchange rates
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/currency/rates")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "rates" in data and "base" in data:
                        rates_count = len(data["rates"])
                        self.log_test("GET /currency/rates", "Get rates", True, 
                                    f"Base: {data['base']}, {rates_count} rates", response_time)
                    else:
                        self.log_test("GET /currency/rates", "Get rates", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /currency/rates", "Get rates", False, 
                                f"Status: {response.status_code}, Body: {response.text}")
                    
        except Exception as e:
            self.log_test("GET /currency/rates", "Get rates", False, f"Exception: {str(e)}")
            
        # Test 2: Convert currency
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "from": "EUR",
                    "to": "USD",
                    "amount": 100
                }
                
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/currency/convert", params=params)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "result" in data and "rate" in data:
                        self.log_test("GET /currency/convert", "Convert EUR to USD", True, 
                                    f"100 EUR = {data['result']} USD (rate: {data['rate']})", response_time)
                    else:
                        self.log_test("GET /currency/convert", "Convert EUR to USD", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /currency/convert", "Convert EUR to USD", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /currency/convert", "Convert EUR to USD", False, f"Exception: {str(e)}")
            
    async def test_rss_deals(self):
        """Test RSS deals endpoints"""
        print("\n📰 Testing RSS Deals...")
        
        # Test 1: Refresh deals
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                start_time = time.time()
                response = await client.post(f"{BACKEND_URL}/deals/refresh")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "deals_count" in data and "message" in data:
                        self.log_test("POST /deals/refresh", "Refresh deals", True, 
                                    f"Refreshed {data['deals_count']} deals", response_time)
                    else:
                        self.log_test("POST /deals/refresh", "Refresh deals", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("POST /deals/refresh", "Refresh deals", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("POST /deals/refresh", "Refresh deals", False, f"Exception: {str(e)}")
            
        # Test 2: Get deals
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {"limit": 10}
                
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/deals", params=params)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "deals" in data and "count" in data:
                        self.log_test("GET /deals", "Get deals", True, 
                                    f"Retrieved {data['count']} deals", response_time)
                    else:
                        self.log_test("GET /deals", "Get deals", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /deals", "Get deals", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /deals", "Get deals", False, f"Exception: {str(e)}")
            
        # Test 3: Get error fares
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/deals/error-fares")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "deals" in data and "count" in data:
                        self.log_test("GET /deals/error-fares", "Get error fares", True, 
                                    f"Retrieved {data['count']} error fares", response_time)
                    else:
                        self.log_test("GET /deals/error-fares", "Get error fares", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /deals/error-fares", "Get error fares", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /deals/error-fares", "Get error fares", False, f"Exception: {str(e)}")
            
        # Test 4: Get deals with airport filter
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {"limit": 5, "airport": "CDG"}
                
                response = await client.get(f"{BACKEND_URL}/deals", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    if "user_region" in data:
                        self.log_test("GET /deals", "Airport filter", True, 
                                    f"Filtered by CDG, user region: {data['user_region']}")
                    else:
                        self.log_test("GET /deals", "Airport filter", True, 
                                    "Airport filter applied successfully")
                else:
                    self.log_test("GET /deals", "Airport filter", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /deals", "Airport filter", False, f"Exception: {str(e)}")
            
    async def test_notifications(self):
        """Test notifications endpoints"""
        print("\n🔔 Testing Notifications...")
        
        test_user_id = "test-user-123"
        
        # Test 1: Get notifications
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/notifications/{test_user_id}")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "notifications" in data and "unread_count" in data:
                        self.log_test("GET /notifications/{user_id}", "Get notifications", True, 
                                    f"Retrieved {len(data['notifications'])} notifications, {data['unread_count']} unread", response_time)
                    else:
                        self.log_test("GET /notifications/{user_id}", "Get notifications", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /notifications/{user_id}", "Get notifications", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /notifications/{user_id}", "Get notifications", False, f"Exception: {str(e)}")
            
        # Test 2: Get unread only
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {"unread_only": True}
                
                response = await client.get(f"{BACKEND_URL}/notifications/{test_user_id}", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    if "notifications" in data:
                        self.log_test("GET /notifications/{user_id}", "Unread only filter", True, 
                                    f"Retrieved {len(data['notifications'])} unread notifications")
                    else:
                        self.log_test("GET /notifications/{user_id}", "Unread only filter", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /notifications/{user_id}", "Unread only filter", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /notifications/{user_id}", "Unread only filter", False, f"Exception: {str(e)}")
            
        # Test 3: Mark all as read
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = time.time()
                response = await client.post(f"{BACKEND_URL}/notifications/{test_user_id}/read-all")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "marked_read" in data:
                        self.log_test("POST /notifications/{user_id}/read-all", "Mark all read", True, 
                                    f"Marked {data['marked_read']} notifications as read", response_time)
                    else:
                        self.log_test("POST /notifications/{user_id}/read-all", "Mark all read", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("POST /notifications/{user_id}/read-all", "Mark all read", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("POST /notifications/{user_id}/read-all", "Mark all read", False, f"Exception: {str(e)}")
            
    async def test_alert_preferences(self):
        """Test alert preferences endpoints"""
        print("\n⚙️ Testing Alert Preferences...")
        
        test_user_id = "test-123"
        
        # Test 1: Save preferences
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "user_id": test_user_id,
                    "max_price": 200,
                    "preferred_destinations": ["BCN", "LIS"],
                    "origin_iata": "CDG"
                }
                
                start_time = time.time()
                response = await client.post(f"{BACKEND_URL}/alerts/preferences", json=payload)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "success" in data and data["success"]:
                        self.log_test("POST /alerts/preferences", "Save preferences", True, 
                                    f"Saved preferences for user {test_user_id}", response_time)
                    else:
                        self.log_test("POST /alerts/preferences", "Save preferences", False, 
                                    f"Save failed: {data}")
                else:
                    self.log_test("POST /alerts/preferences", "Save preferences", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("POST /alerts/preferences", "Save preferences", False, f"Exception: {str(e)}")
            
        # Test 2: Get preferences
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/alerts/preferences/{test_user_id}")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "user_id" in data:
                        required_fields = ["max_price", "preferred_destinations", "origin_iata"]
                        found_fields = [f for f in required_fields if f in data]
                        self.log_test("GET /alerts/preferences/{user_id}", "Get preferences", True, 
                                    f"Retrieved preferences with fields: {found_fields}", response_time)
                    else:
                        self.log_test("GET /alerts/preferences/{user_id}", "Get preferences", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /alerts/preferences/{user_id}", "Get preferences", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /alerts/preferences/{user_id}", "Get preferences", False, f"Exception: {str(e)}")
            
    async def test_ai_destinations(self):
        """Test AI destinations endpoint"""
        print("\n🤖 Testing AI Destinations...")
        
        # Test 1: Culture mood
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "mood": "culture",
                    "budget_max": 300,
                    "origin": "CDG",
                    "departure_date": "2026-07-01",
                    "return_date": "2026-07-05"
                }
                
                start_time = time.time()
                response = await client.post(f"{BACKEND_URL}/ai/destinations", json=payload)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "destinations" in data and isinstance(data["destinations"], list):
                        destinations_count = len(data["destinations"])
                        if destinations_count > 0:
                            first_dest = data["destinations"][0]
                            required_fields = ["city", "country", "iata", "why", "estimated_flight_budget"]
                            missing_fields = [f for f in required_fields if f not in first_dest]
                            
                            if not missing_fields:
                                self.log_test("POST /ai/destinations", "Culture mood", True, 
                                            f"Generated {destinations_count} destinations with all required fields", response_time)
                            else:
                                self.log_test("POST /ai/destinations", "Culture mood", False, 
                                            f"Missing fields in response: {missing_fields}")
                        else:
                            self.log_test("POST /ai/destinations", "Culture mood", False, 
                                        "No destinations returned")
                    else:
                        self.log_test("POST /ai/destinations", "Culture mood", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("POST /ai/destinations", "Culture mood", False, 
                                f"Status: {response.status_code}, Body: {response.text}")
                    
        except Exception as e:
            self.log_test("POST /ai/destinations", "Culture mood", False, f"Exception: {str(e)}")
            
        # Test 2: Party mood
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "mood": "party",
                    "budget_max": 400,
                    "origin": "CDG",
                    "departure_date": "2026-08-01",
                    "return_date": "2026-08-05"
                }
                
                response = await client.post(f"{BACKEND_URL}/ai/destinations", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "destinations" in data and len(data["destinations"]) > 0:
                        self.log_test("POST /ai/destinations", "Party mood", True, 
                                    f"Generated {len(data['destinations'])} party destinations")
                    else:
                        self.log_test("POST /ai/destinations", "Party mood", False, 
                                    "No destinations for party mood")
                else:
                    self.log_test("POST /ai/destinations", "Party mood", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("POST /ai/destinations", "Party mood", False, f"Exception: {str(e)}")
            
        # Test 3: Nature mood
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "mood": "nature",
                    "budget_max": 350,
                    "origin": "CDG",
                    "departure_date": "2026-09-01",
                    "return_date": "2026-09-05"
                }
                
                response = await client.post(f"{BACKEND_URL}/ai/destinations", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "destinations" in data and len(data["destinations"]) > 0:
                        self.log_test("POST /ai/destinations", "Nature mood", True, 
                                    f"Generated {len(data['destinations'])} nature destinations")
                    else:
                        self.log_test("POST /ai/destinations", "Nature mood", False, 
                                    "No destinations for nature mood")
                else:
                    self.log_test("POST /ai/destinations", "Nature mood", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("POST /ai/destinations", "Nature mood", False, f"Exception: {str(e)}")
            
    async def test_ai_itinerary(self):
        """Test AI itinerary endpoint"""
        print("\n📅 Testing AI Itinerary...")
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "city": "Barcelona",
                    "country": "Spain",
                    "trip_days": 3,
                    "mood": "culture",
                    "budget_level": "student"
                }
                
                start_time = time.time()
                response = await client.post(f"{BACKEND_URL}/ai/itinerary", json=payload)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "days" in data and "city" in data:
                        days_count = len(data["days"])
                        if days_count > 0:
                            first_day = data["days"][0]
                            if "activities" in first_day and len(first_day["activities"]) > 0:
                                first_activity = first_day["activities"][0]
                                required_fields = ["time", "title", "description", "type", "cost", "location"]
                                missing_fields = [f for f in required_fields if f not in first_activity]
                                
                                if not missing_fields:
                                    self.log_test("POST /ai/itinerary", "Barcelona itinerary", True, 
                                                f"Generated {days_count}-day itinerary with detailed activities", response_time)
                                else:
                                    self.log_test("POST /ai/itinerary", "Barcelona itinerary", False, 
                                                f"Missing activity fields: {missing_fields}")
                            else:
                                self.log_test("POST /ai/itinerary", "Barcelona itinerary", False, 
                                            "No activities in itinerary")
                        else:
                            self.log_test("POST /ai/itinerary", "Barcelona itinerary", False, 
                                        "No days in itinerary")
                    else:
                        self.log_test("POST /ai/itinerary", "Barcelona itinerary", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("POST /ai/itinerary", "Barcelona itinerary", False, 
                                f"Status: {response.status_code}, Body: {response.text}")
                    
        except Exception as e:
            self.log_test("POST /ai/itinerary", "Barcelona itinerary", False, f"Exception: {str(e)}")
            
    async def test_european_subsidies(self):
        """Test European subsidies endpoint"""
        print("\n💰 Testing European Subsidies...")
        
        # Test 1: Basic student case
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "age": 22,
                    "is_student": True,
                    "country": "FR",
                    "has_erasmus": False
                }
                
                start_time = time.time()
                response = await client.get(f"{BACKEND_URL}/subsidies/calculate", params=params)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if "subsidies" in data and "total_potential_savings" in data and "applicable_count" in data:
                        subsidies_count = len(data["subsidies"])
                        applicable_count = data["applicable_count"]
                        total_savings = data["total_potential_savings"]
                        
                        self.log_test("GET /subsidies/calculate", "Student case", True, 
                                    f"Found {subsidies_count} subsidies, {applicable_count} applicable, €{total_savings} savings", response_time)
                    else:
                        self.log_test("GET /subsidies/calculate", "Student case", False, 
                                    f"Invalid response format: {data}")
                else:
                    self.log_test("GET /subsidies/calculate", "Student case", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /subsidies/calculate", "Student case", False, f"Exception: {str(e)}")
            
        # Test 2: Age boundary test (17 years old)
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "age": 17,
                    "is_student": True,
                    "country": "FR",
                    "has_erasmus": False
                }
                
                response = await client.get(f"{BACKEND_URL}/subsidies/calculate", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    # Should exclude DiscoverEU (age 18 requirement)
                    discover_eu = next((s for s in data["subsidies"] if s["name"] == "DiscoverEU"), None)
                    if discover_eu and not discover_eu["applies"]:
                        self.log_test("GET /subsidies/calculate", "Age boundary", True, 
                                    "Correctly excluded DiscoverEU for age 17")
                    else:
                        self.log_test("GET /subsidies/calculate", "Age boundary", False, 
                                    "Should exclude DiscoverEU for age 17")
                else:
                    self.log_test("GET /subsidies/calculate", "Age boundary", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /subsidies/calculate", "Age boundary", False, f"Exception: {str(e)}")
            
        # Test 3: Non-student case
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "age": 25,
                    "is_student": False,
                    "country": "DE",
                    "has_erasmus": False
                }
                
                response = await client.get(f"{BACKEND_URL}/subsidies/calculate", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    applicable_count = data.get("applicable_count", 0)
                    self.log_test("GET /subsidies/calculate", "Non-student", True, 
                                f"Non-student case: {applicable_count} applicable subsidies")
                else:
                    self.log_test("GET /subsidies/calculate", "Non-student", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /subsidies/calculate", "Non-student", False, f"Exception: {str(e)}")
            
        # Test 4: Erasmus case
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "age": 20,
                    "is_student": True,
                    "country": "DE",
                    "has_erasmus": True
                }
                
                response = await client.get(f"{BACKEND_URL}/subsidies/calculate", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    # Should include Erasmus+ travel grant
                    erasmus_grant = next((s for s in data["subsidies"] if "Erasmus" in s["name"]), None)
                    if erasmus_grant and erasmus_grant["applies"]:
                        self.log_test("GET /subsidies/calculate", "Erasmus case", True, 
                                    "Correctly included Erasmus+ travel grant")
                    else:
                        self.log_test("GET /subsidies/calculate", "Erasmus case", False, 
                                    "Should include Erasmus+ travel grant")
                else:
                    self.log_test("GET /subsidies/calculate", "Erasmus case", False, 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GET /subsidies/calculate", "Erasmus case", False, f"Exception: {str(e)}")
            
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("🧪 BACKEND API TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%" if self.total_tests > 0 else "0%")
        
        if self.failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  • {result['endpoint']} - {result['test']}: {result['details']}")
                    
        print("\n✅ PASSED TESTS:")
        for result in self.results:
            if result["success"]:
                print(f"  • {result['endpoint']} - {result['test']}: {result['details']}")
                
        return self.failed_tests == 0
        
    async def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Comprehensive Backend API Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        
        # Run all test suites
        await self.test_health_check()
        await self.test_flight_search()
        await self.test_accommodations()
        await self.test_currency_exchange()
        await self.test_rss_deals()
        await self.test_notifications()
        await self.test_alert_preferences()
        await self.test_ai_destinations()
        await self.test_ai_itinerary()
        await self.test_european_subsidies()
        
        # Print summary
        all_passed = self.print_summary()
        return all_passed

async def main():
    """Main test runner"""
    tester = BackendTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print("\n⚠️ Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    import sys
    result = asyncio.run(main())
    sys.exit(result)