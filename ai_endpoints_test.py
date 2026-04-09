#!/usr/bin/env python3
"""
AI Endpoints Testing for Wander App
Tests the 3 NEW backend endpoints: AI Destinations, AI Itinerary, and Subsidies Calculator
"""

import asyncio
import httpx
import json
import time
from datetime import datetime
from typing import Dict, Any

# Use the backend URL from the environment
BACKEND_URL = "https://eurohop-preview.preview.emergentagent.com/api"

class AIEndpointsTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=60.0)  # Longer timeout for AI endpoints
        self.test_results = []
        
    async def close(self):
        await self.client.aclose()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    async def test_ai_destinations_party_mood(self):
        """Test POST /api/ai/destinations with party mood"""
        try:
            print("⏳ Testing AI Destinations (party mood) - may take 10-20 seconds...")
            start_time = time.time()
            
            request_data = {
                "mood": "party",
                "budget_max": 500,
                "origin": "MAD",
                "departure_date": "2026-05-10",
                "return_date": "2026-05-15"
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/ai/destinations",
                json=request_data
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for error response first
                if "error" in data:
                    self.log_test("AI Destinations (party)", False, f"API returned error: {data['error']}", data)
                    return False
                
                # Validate response structure
                if "destinations" in data:
                    destinations = data["destinations"]
                    if len(destinations) == 3:
                        # Validate each destination structure
                        required_fields = ["city", "country", "iata", "why", "estimated_flight_budget", "vibe_tags", "best_season", "student_tip"]
                        all_valid = True
                        
                        for i, dest in enumerate(destinations):
                            missing_fields = [field for field in required_fields if field not in dest]
                            if missing_fields:
                                self.log_test("AI Destinations (party)", False, 
                                            f"Destination {i+1} missing fields: {missing_fields}", dest)
                                all_valid = False
                                break
                        
                        if all_valid:
                            cities = [dest["city"] for dest in destinations]
                            self.log_test("AI Destinations (party)", True, 
                                        f"Got 3 destinations in {elapsed:.1f}s: {', '.join(cities)}", data)
                            return True
                    else:
                        self.log_test("AI Destinations (party)", False, 
                                    f"Expected 3 destinations, got {len(destinations)}", data)
                        return False
                else:
                    self.log_test("AI Destinations (party)", False, "Missing 'destinations' field", data)
                    return False
            else:
                self.log_test("AI Destinations (party)", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Destinations (party)", False, f"Error: {str(e)}")
            return False
    
    async def test_ai_destinations_different_moods(self):
        """Test AI Destinations with different moods"""
        moods = ["relax", "culture", "nature"]
        success_count = 0
        
        for mood in moods:
            try:
                print(f"⏳ Testing AI Destinations ({mood} mood) - may take 10-20 seconds...")
                start_time = time.time()
                
                request_data = {
                    "mood": mood,
                    "budget_max": 400,
                    "origin": "CDG",
                    "departure_date": "2026-06-01",
                    "return_date": "2026-06-08"
                }
                
                response = await self.client.post(
                    f"{BACKEND_URL}/ai/destinations",
                    json=request_data
                )
                
                elapsed = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "error" in data:
                        self.log_test(f"AI Destinations ({mood})", False, f"API returned error: {data['error']}")
                        continue
                    
                    if "destinations" in data and len(data["destinations"]) == 3:
                        cities = [dest["city"] for dest in data["destinations"]]
                        self.log_test(f"AI Destinations ({mood})", True, 
                                    f"Got 3 destinations in {elapsed:.1f}s: {', '.join(cities)}")
                        success_count += 1
                    else:
                        self.log_test(f"AI Destinations ({mood})", False, "Invalid response structure")
                else:
                    self.log_test(f"AI Destinations ({mood})", False, f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"AI Destinations ({mood})", False, f"Error: {str(e)}")
        
        return success_count == len(moods)
    
    async def test_ai_itinerary_barcelona(self):
        """Test POST /api/ai/itinerary for Barcelona"""
        try:
            print("⏳ Testing AI Itinerary (Barcelona) - may take 15-30 seconds...")
            start_time = time.time()
            
            request_data = {
                "city": "Barcelona",
                "country": "Spain",
                "trip_days": 3,
                "mood": "party",
                "budget_level": "student"
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/ai/itinerary",
                json=request_data
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for error response first
                if "error" in data:
                    self.log_test("AI Itinerary (Barcelona)", False, f"API returned error: {data['error']}", data)
                    return False
                
                # Validate response structure
                required_top_fields = ["city", "total_days", "days", "local_tips"]
                missing_top_fields = [field for field in required_top_fields if field not in data]
                
                if missing_top_fields:
                    self.log_test("AI Itinerary (Barcelona)", False, 
                                f"Missing top-level fields: {missing_top_fields}", data)
                    return False
                
                # Validate days structure
                days = data["days"]
                if len(days) == 3:
                    # Validate each day structure
                    for i, day in enumerate(days):
                        required_day_fields = ["day", "title", "activities"]
                        missing_day_fields = [field for field in required_day_fields if field not in day]
                        
                        if missing_day_fields:
                            self.log_test("AI Itinerary (Barcelona)", False, 
                                        f"Day {i+1} missing fields: {missing_day_fields}", day)
                            return False
                        
                        # Validate activities structure
                        activities = day["activities"]
                        if activities:
                            activity = activities[0]
                            required_activity_fields = ["time", "title", "description", "type", "cost", "location", "insider_tip"]
                            missing_activity_fields = [field for field in required_activity_fields if field not in activity]
                            
                            if missing_activity_fields:
                                self.log_test("AI Itinerary (Barcelona)", False, 
                                            f"Activity missing fields: {missing_activity_fields}", activity)
                                return False
                    
                    # Validate local_tips
                    local_tips = data["local_tips"]
                    if isinstance(local_tips, list) and len(local_tips) > 0:
                        self.log_test("AI Itinerary (Barcelona)", True, 
                                    f"Generated 3-day itinerary in {elapsed:.1f}s with {len(local_tips)} local tips", data)
                        return True
                    else:
                        self.log_test("AI Itinerary (Barcelona)", False, "Invalid local_tips structure", data)
                        return False
                else:
                    self.log_test("AI Itinerary (Barcelona)", False, 
                                f"Expected 3 days, got {len(days)}", data)
                    return False
            else:
                self.log_test("AI Itinerary (Barcelona)", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Itinerary (Barcelona)", False, f"Error: {str(e)}")
            return False
    
    async def test_subsidies_calculator_basic(self):
        """Test GET /api/subsidies/calculate with basic parameters"""
        try:
            params = {
                "age": 22,
                "is_student": True,
                "country": "FR",
                "has_erasmus": False
            }
            
            response = await self.client.get(
                f"{BACKEND_URL}/subsidies/calculate",
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ["subsidies", "total_potential_savings", "applicable_count"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Subsidies Calculator (basic)", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Validate subsidies structure
                subsidies = data["subsidies"]
                if isinstance(subsidies, list) and len(subsidies) > 0:
                    # Check first subsidy structure
                    subsidy = subsidies[0]
                    required_subsidy_fields = ["name", "description", "amount", "applies", "apply_url", "next_deadline"]
                    missing_subsidy_fields = [field for field in required_subsidy_fields if field not in subsidy]
                    
                    if missing_subsidy_fields:
                        self.log_test("Subsidies Calculator (basic)", False, 
                                    f"Subsidy missing fields: {missing_subsidy_fields}", subsidy)
                        return False
                    
                    # Validate numeric fields
                    total_savings = data["total_potential_savings"]
                    applicable_count = data["applicable_count"]
                    
                    if isinstance(total_savings, (int, float)) and isinstance(applicable_count, int):
                        applicable_subsidies = [s for s in subsidies if s["applies"]]
                        self.log_test("Subsidies Calculator (basic)", True, 
                                    f"Found {len(subsidies)} subsidies, {len(applicable_subsidies)} applicable, €{total_savings} potential savings", data)
                        return True
                    else:
                        self.log_test("Subsidies Calculator (basic)", False, 
                                    "Invalid numeric field types", data)
                        return False
                else:
                    self.log_test("Subsidies Calculator (basic)", False, "Empty or invalid subsidies array", data)
                    return False
            else:
                self.log_test("Subsidies Calculator (basic)", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Subsidies Calculator (basic)", False, f"Error: {str(e)}")
            return False
    
    async def test_subsidies_calculator_edge_cases(self):
        """Test subsidies calculator with edge cases"""
        test_cases = [
            {
                "name": "Age 17 (DiscoverEU not eligible)",
                "params": {"age": 17, "is_student": True, "country": "FR", "has_erasmus": False}
            },
            {
                "name": "Germany with Erasmus",
                "params": {"age": 23, "is_student": True, "country": "DE", "has_erasmus": True}
            },
            {
                "name": "Non-student",
                "params": {"age": 25, "is_student": False, "country": "ES", "has_erasmus": False}
            }
        ]
        
        success_count = 0
        
        for test_case in test_cases:
            try:
                response = await self.client.get(
                    f"{BACKEND_URL}/subsidies/calculate",
                    params=test_case["params"]
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "subsidies" in data and "total_potential_savings" in data and "applicable_count" in data:
                        applicable_count = data["applicable_count"]
                        total_savings = data["total_potential_savings"]
                        
                        # Special validation for age 17 case
                        if test_case["params"]["age"] == 17:
                            discover_eu = next((s for s in data["subsidies"] if s["name"] == "DiscoverEU"), None)
                            if discover_eu and not discover_eu["applies"]:
                                self.log_test(f"Subsidies Calculator ({test_case['name']})", True, 
                                            f"Correctly excluded DiscoverEU for age 17. {applicable_count} applicable, €{total_savings} savings")
                                success_count += 1
                            else:
                                self.log_test(f"Subsidies Calculator ({test_case['name']})", False, 
                                            "DiscoverEU should not apply for age 17")
                        else:
                            self.log_test(f"Subsidies Calculator ({test_case['name']})", True, 
                                        f"{applicable_count} applicable subsidies, €{total_savings} potential savings")
                            success_count += 1
                    else:
                        self.log_test(f"Subsidies Calculator ({test_case['name']})", False, "Invalid response structure")
                else:
                    self.log_test(f"Subsidies Calculator ({test_case['name']})", False, f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"Subsidies Calculator ({test_case['name']})", False, f"Error: {str(e)}")
        
        return success_count == len(test_cases)
    
    async def test_subsidies_missing_params(self):
        """Test subsidies calculator with missing parameters"""
        try:
            # Test with no parameters (should use defaults)
            response = await self.client.get(f"{BACKEND_URL}/subsidies/calculate")
            
            if response.status_code == 200:
                data = response.json()
                
                if "subsidies" in data and "total_potential_savings" in data and "applicable_count" in data:
                    self.log_test("Subsidies Calculator (no params)", True, 
                                "Handled missing parameters with defaults")
                    return True
                else:
                    self.log_test("Subsidies Calculator (no params)", False, "Invalid response structure", data)
                    return False
            else:
                self.log_test("Subsidies Calculator (no params)", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Subsidies Calculator (no params)", False, f"Error: {str(e)}")
            return False
    
    async def run_ai_endpoints_test_suite(self):
        """Run the complete AI endpoints test suite"""
        print("🚀 Starting Wander AI Endpoints Test Suite")
        print(f"🔗 Testing backend at: {BACKEND_URL}")
        print("=" * 60)
        
        # Test AI Destinations endpoint
        print("\n🎯 Testing AI Destinations Endpoint")
        print("-" * 40)
        await self.test_ai_destinations_party_mood()
        await self.test_ai_destinations_different_moods()
        
        # Test AI Itinerary endpoint
        print("\n📅 Testing AI Itinerary Endpoint")
        print("-" * 40)
        await self.test_ai_itinerary_barcelona()
        
        # Test Subsidies Calculator endpoint
        print("\n💰 Testing Subsidies Calculator Endpoint")
        print("-" * 40)
        await self.test_subsidies_calculator_basic()
        await self.test_subsidies_calculator_edge_cases()
        await self.test_subsidies_missing_params()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 AI ENDPOINTS TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🎯 Overall Success Rate: {(passed/total)*100:.1f}%")
        
        return self.test_results

async def main():
    """Main test execution"""
    tester = AIEndpointsTester()
    try:
        results = await tester.run_ai_endpoints_test_suite()
        return results
    finally:
        await tester.close()

if __name__ == "__main__":
    asyncio.run(main())