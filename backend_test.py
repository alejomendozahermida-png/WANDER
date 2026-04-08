#!/usr/bin/env python3
"""
Backend API Testing for Wander App
Tests all RSS Deal Aggregator, Notifications, and Alert Preferences endpoints
"""

import asyncio
import httpx
import json
import time
from datetime import datetime
from typing import Dict, Any

# Use the backend URL from the environment
BACKEND_URL = "https://eurohop-preview.preview.emergentagent.com/api"

class WanderAPITester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_user_id = "test-user-1"
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
    
    async def test_health_check(self):
        """Test GET /api/ - Basic health check"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Wander API" in data["message"]:
                    self.log_test("Health Check", True, f"API responding: {data['message']}", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    async def test_save_alert_preferences(self):
        """Test POST /api/alerts/preferences - Save alert preferences"""
        try:
            preferences = {
                "user_id": self.test_user_id,
                "max_price": 200,
                "preferred_destinations": ["Lisbon", "Barcelona"],
                "origin_iata": "CDG",
                "active": True
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/alerts/preferences",
                json=preferences
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "preference" in data:
                    self.log_test("Save Alert Preferences", True, "Preferences saved successfully", data)
                    return True
                else:
                    self.log_test("Save Alert Preferences", False, "Unexpected response format", data)
                    return False
            else:
                self.log_test("Save Alert Preferences", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Save Alert Preferences", False, f"Error: {str(e)}")
            return False
    
    async def test_get_alert_preferences(self):
        """Test GET /api/alerts/preferences/{user_id} - Get saved preferences"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/alerts/preferences/{self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user_id") == self.test_user_id:
                    expected_fields = ["max_price", "preferred_destinations", "origin_iata", "active"]
                    if all(field in data for field in expected_fields):
                        self.log_test("Get Alert Preferences", True, "Preferences retrieved successfully", data)
                        return True
                    else:
                        self.log_test("Get Alert Preferences", False, "Missing expected fields", data)
                        return False
                else:
                    self.log_test("Get Alert Preferences", False, "User ID mismatch", data)
                    return False
            else:
                self.log_test("Get Alert Preferences", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Alert Preferences", False, f"Error: {str(e)}")
            return False
    
    async def test_deals_refresh(self):
        """Test POST /api/deals/refresh - Trigger RSS feed refresh"""
        try:
            print("⏳ Triggering RSS feed refresh (may take 10-15 seconds)...")
            start_time = time.time()
            
            response = await self.client.post(f"{BACKEND_URL}/deals/refresh")
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["message", "deals_count", "notifications_created"]
                if all(field in data for field in required_fields):
                    deals_count = data["deals_count"]
                    notifications = data["notifications_created"]
                    self.log_test("Deals Refresh", True, 
                                f"Refresh completed in {elapsed:.1f}s - {deals_count} deals, {notifications} notifications", 
                                data)
                    return True, deals_count
                else:
                    self.log_test("Deals Refresh", False, "Missing required response fields", data)
                    return False, 0
            else:
                self.log_test("Deals Refresh", False, f"HTTP {response.status_code}: {response.text}")
                return False, 0
        except Exception as e:
            self.log_test("Deals Refresh", False, f"Error: {str(e)}")
            return False, 0
    
    async def test_get_deals(self):
        """Test GET /api/deals - Get cached deals"""
        try:
            # Test without parameters
            response = await self.client.get(f"{BACKEND_URL}/deals")
            
            if response.status_code == 200:
                data = response.json()
                if "deals" in data and "count" in data:
                    deals = data["deals"]
                    count = data["count"]
                    
                    # Validate deal structure if deals exist
                    if deals:
                        first_deal = deals[0]
                        required_fields = ["id", "source", "title", "url", "fetched_at"]
                        if all(field in first_deal for field in required_fields):
                            self.log_test("Get Deals", True, f"Retrieved {count} deals successfully")
                            return True
                        else:
                            self.log_test("Get Deals", False, "Deal structure missing required fields", first_deal)
                            return False
                    else:
                        self.log_test("Get Deals", True, "No deals found (acceptable if feeds unavailable)")
                        return True
                else:
                    self.log_test("Get Deals", False, "Missing 'deals' or 'count' in response", data)
                    return False
            else:
                self.log_test("Get Deals", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Deals", False, f"Error: {str(e)}")
            return False
    
    async def test_get_deals_with_params(self):
        """Test GET /api/deals with query parameters"""
        try:
            # Test with limit parameter
            response = await self.client.get(f"{BACKEND_URL}/deals?limit=10")
            
            if response.status_code == 200:
                data = response.json()
                deals = data.get("deals", [])
                if len(deals) <= 10:
                    self.log_test("Get Deals (with limit)", True, f"Limit parameter working - got {len(deals)} deals")
                    return True
                else:
                    self.log_test("Get Deals (with limit)", False, f"Limit not respected - got {len(deals)} deals")
                    return False
            else:
                self.log_test("Get Deals (with limit)", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Deals (with limit)", False, f"Error: {str(e)}")
            return False
    
    async def test_get_error_fares(self):
        """Test GET /api/deals/error-fares - Get only error fares"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/deals/error-fares")
            
            if response.status_code == 200:
                data = response.json()
                if "deals" in data and "count" in data:
                    deals = data["deals"]
                    count = data["count"]
                    
                    # Verify all deals are error fares if any exist
                    if deals:
                        all_error_fares = all(deal.get("is_error_fare", False) for deal in deals)
                        if all_error_fares:
                            self.log_test("Get Error Fares", True, f"Retrieved {count} error fares successfully")
                            return True
                        else:
                            self.log_test("Get Error Fares", False, "Some deals are not error fares", data)
                            return False
                    else:
                        self.log_test("Get Error Fares", True, "No error fares found (acceptable)")
                        return True
                else:
                    self.log_test("Get Error Fares", False, "Missing 'deals' or 'count' in response", data)
                    return False
            else:
                self.log_test("Get Error Fares", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Error Fares", False, f"Error: {str(e)}")
            return False
    
    async def test_get_notifications(self):
        """Test GET /api/notifications/{user_id} - Get notifications for user"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/notifications/{self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "notifications" in data and "unread_count" in data:
                    notifications = data["notifications"]
                    unread_count = data["unread_count"]
                    
                    self.log_test("Get Notifications", True, 
                                f"Retrieved {len(notifications)} notifications, {unread_count} unread")
                    return True, notifications
                else:
                    self.log_test("Get Notifications", False, "Missing required fields in response", data)
                    return False, []
            else:
                self.log_test("Get Notifications", False, f"HTTP {response.status_code}: {response.text}")
                return False, []
        except Exception as e:
            self.log_test("Get Notifications", False, f"Error: {str(e)}")
            return False, []
    
    async def test_mark_notification_read(self, notification_id: str):
        """Test POST /api/notifications/{notification_id}/read - Mark notification as read"""
        try:
            response = await self.client.post(f"{BACKEND_URL}/notifications/{notification_id}/read")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Mark Notification Read", True, f"Notification {notification_id} marked as read")
                    return True
                else:
                    self.log_test("Mark Notification Read", False, "Success flag not true", data)
                    return False
            else:
                self.log_test("Mark Notification Read", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Mark Notification Read", False, f"Error: {str(e)}")
            return False
    
    async def test_mark_all_notifications_read(self):
        """Test POST /api/notifications/{user_id}/read-all - Mark all notifications as read"""
        try:
            response = await self.client.post(f"{BACKEND_URL}/notifications/{self.test_user_id}/read-all")
            
            if response.status_code == 200:
                data = response.json()
                if "marked_read" in data:
                    marked_count = data["marked_read"]
                    self.log_test("Mark All Notifications Read", True, f"Marked {marked_count} notifications as read")
                    return True
                else:
                    self.log_test("Mark All Notifications Read", False, "Missing 'marked_read' field", data)
                    return False
            else:
                self.log_test("Mark All Notifications Read", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Mark All Notifications Read", False, f"Error: {str(e)}")
            return False
    
    async def run_full_test_suite(self):
        """Run the complete test suite following the specified flow"""
        print("🚀 Starting Wander API Backend Test Suite")
        print(f"🔗 Testing backend at: {BACKEND_URL}")
        print("=" * 60)
        
        # 1. Basic health check
        health_ok = await self.test_health_check()
        if not health_ok:
            print("❌ Health check failed - stopping tests")
            return
        
        # 2. Save alert preferences for test user
        await self.test_save_alert_preferences()
        
        # 3. Get alert preferences to verify save
        await self.test_get_alert_preferences()
        
        # 4. Trigger deals refresh (may take time)
        refresh_ok, deals_count = await self.test_deals_refresh()
        
        # 5. Get deals to verify they were stored
        await self.test_get_deals()
        
        # 6. Test deals with parameters
        await self.test_get_deals_with_params()
        
        # 7. Get error fares specifically
        await self.test_get_error_fares()
        
        # 8. Check notifications for the test user
        notifications_ok, notifications = await self.test_get_notifications()
        
        # 9. If notifications exist, test marking one as read
        if notifications_ok and notifications:
            first_notification = notifications[0]
            notification_id = first_notification.get("id")
            if notification_id:
                await self.test_mark_notification_read(notification_id)
        
        # 10. Test mark all notifications as read
        await self.test_mark_all_notifications_read()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
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
    tester = WanderAPITester()
    try:
        results = await tester.run_full_test_suite()
        return results
    finally:
        await tester.close()

if __name__ == "__main__":
    asyncio.run(main())