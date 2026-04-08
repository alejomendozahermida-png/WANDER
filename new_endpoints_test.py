#!/usr/bin/env python3
"""
Backend API Testing for Wander API v2.0 - NEW ENDPOINTS
Testing NEW accommodation search and currency endpoints
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://eurohop-preview.preview.emergentagent.com/api"

def test_health_check():
    """Test basic health check endpoint"""
    print("\n=== Testing Health Check ===")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "Wander API v2.0" in data.get("message", ""):
                print("✅ Health check PASSED")
                return True
            else:
                print("❌ Health check FAILED - Unexpected message")
                return False
        else:
            print(f"❌ Health check FAILED - Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check FAILED - Error: {e}")
        return False

def test_accommodation_search_lisbon():
    """Test accommodation search for Lisbon"""
    print("\n=== Testing Accommodation Search - Lisbon ===")
    try:
        params = {
            'city': 'Lisbon',
            'checkin': '2026-07-15',
            'checkout': '2026-07-22',
            'adults': 2,
            'currency': 'EUR'
        }
        
        print(f"Making request to: {BASE_URL}/accommodations/search")
        print(f"Parameters: {params}")
        print("⏳ This may take 5-15 seconds due to real Booking.com API calls...")
        
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/accommodations/search", params=params, timeout=30)
        duration = time.time() - start_time
        
        print(f"Request took {duration:.2f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            # Check required fields
            required_fields = ['city', 'checkin', 'checkout', 'nights', 'accommodations']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            # Check accommodations structure
            accommodations = data.get('accommodations', {})
            if not accommodations:
                print("❌ No accommodations data returned")
                return False
            
            categories = ['budget', 'midrange', 'premium']
            found_categories = []
            
            for category in categories:
                if category in accommodations and accommodations[category]:
                    found_categories.append(category)
                    acc = accommodations[category]
                    required_acc_fields = ['name', 'stars', 'review_score', 'total_price', 'price_per_night', 'photo_url']
                    missing_acc_fields = [field for field in required_acc_fields if field not in acc]
                    if missing_acc_fields:
                        print(f"❌ {category} accommodation missing fields: {missing_acc_fields}")
                    else:
                        print(f"✅ {category}: {acc['name']} - €{acc['total_price']} total (€{acc['price_per_night']}/night)")
            
            if len(found_categories) >= 2:  # At least 2 categories should be found
                print(f"✅ Accommodation search Lisbon PASSED - Found {len(found_categories)} categories")
                return True
            else:
                print(f"❌ Accommodation search Lisbon FAILED - Only found {len(found_categories)} categories")
                return False
        else:
            print(f"❌ Accommodation search Lisbon FAILED - Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Accommodation search Lisbon FAILED - Error: {e}")
        return False

def test_accommodation_search_bangkok():
    """Test accommodation search for Bangkok"""
    print("\n=== Testing Accommodation Search - Bangkok ===")
    try:
        params = {
            'city': 'Bangkok',
            'checkin': '2026-07-15',
            'checkout': '2026-07-22',
            'adults': 1,
            'currency': 'EUR'
        }
        
        print(f"Making request to: {BASE_URL}/accommodations/search")
        print(f"Parameters: {params}")
        print("⏳ This may take 5-15 seconds due to real Booking.com API calls...")
        
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/accommodations/search", params=params, timeout=30)
        duration = time.time() - start_time
        
        print(f"Request took {duration:.2f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            # Check required fields
            required_fields = ['city', 'checkin', 'checkout', 'nights', 'accommodations']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            # Check accommodations structure
            accommodations = data.get('accommodations', {})
            if not accommodations:
                print("❌ No accommodations data returned")
                return False
            
            categories = ['budget', 'midrange', 'premium']
            found_categories = []
            
            for category in categories:
                if category in accommodations and accommodations[category]:
                    found_categories.append(category)
                    acc = accommodations[category]
                    required_acc_fields = ['name', 'stars', 'review_score', 'total_price', 'price_per_night', 'photo_url']
                    missing_acc_fields = [field for field in required_acc_fields if field not in acc]
                    if missing_acc_fields:
                        print(f"❌ {category} accommodation missing fields: {missing_acc_fields}")
                    else:
                        print(f"✅ {category}: {acc['name']} - €{acc['total_price']} total (€{acc['price_per_night']}/night)")
            
            if len(found_categories) >= 2:  # At least 2 categories should be found
                print(f"✅ Accommodation search Bangkok PASSED - Found {len(found_categories)} categories")
                return True
            else:
                print(f"❌ Accommodation search Bangkok FAILED - Only found {len(found_categories)} categories")
                return False
        else:
            print(f"❌ Accommodation search Bangkok FAILED - Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Accommodation search Bangkok FAILED - Error: {e}")
        return False

def test_currency_rates():
    """Test currency exchange rates endpoint"""
    print("\n=== Testing Currency Exchange Rates ===")
    try:
        params = {
            'base': 'EUR',
            'targets': 'USD,GBP,MXN,BRL'
        }
        
        print(f"Making request to: {BASE_URL}/currency/rates")
        print(f"Parameters: {params}")
        
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/currency/rates", params=params, timeout=15)
        duration = time.time() - start_time
        
        print(f"Request took {duration:.2f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            # Check required fields
            if 'base' not in data or 'rates' not in data:
                print("❌ Missing required fields: base or rates")
                return False
            
            if data['base'] != 'EUR':
                print(f"❌ Wrong base currency: {data['base']}")
                return False
            
            rates = data['rates']
            expected_currencies = ['USD', 'GBP', 'MXN', 'BRL']
            found_currencies = []
            
            for currency in expected_currencies:
                if currency in rates:
                    found_currencies.append(currency)
                    print(f"✅ {currency}: {rates[currency]}")
                else:
                    print(f"❌ Missing rate for {currency}")
            
            if len(found_currencies) >= 3:  # At least 3 currencies should be found
                print(f"✅ Currency rates PASSED - Found {len(found_currencies)} currencies")
                return True
            else:
                print(f"❌ Currency rates FAILED - Only found {len(found_currencies)} currencies")
                return False
        else:
            print(f"❌ Currency rates FAILED - Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Currency rates FAILED - Error: {e}")
        return False

def test_currency_convert():
    """Test currency conversion endpoint"""
    print("\n=== Testing Currency Conversion ===")
    try:
        params = {
            'amount': 100,
            'from_currency': 'EUR',
            'to_currency': 'USD'
        }
        
        print(f"Making request to: {BASE_URL}/currency/convert")
        print(f"Parameters: {params}")
        
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/currency/convert", params=params, timeout=15)
        duration = time.time() - start_time
        
        print(f"Request took {duration:.2f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            # Check required fields
            required_fields = ['from', 'to', 'amount', 'result', 'rate']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            if data['from'] != 'EUR' or data['to'] != 'USD' or data['amount'] != 100:
                print("❌ Wrong conversion parameters in response")
                return False
            
            if not data['result'] or not data['rate']:
                print("❌ Missing conversion result or rate")
                return False
            
            print(f"✅ Converted €{data['amount']} to ${data['result']} (rate: {data['rate']})")
            print("✅ Currency conversion PASSED")
            return True
        else:
            print(f"❌ Currency conversion FAILED - Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Currency conversion FAILED - Error: {e}")
        return False

def main():
    """Run all backend tests"""
    print("🚀 Starting Wander API v2.0 NEW ENDPOINTS Backend Tests")
    print(f"Testing against: {BASE_URL}")
    print(f"Test started at: {datetime.now().isoformat()}")
    
    tests = [
        ("Health Check", test_health_check),
        ("Accommodation Search - Lisbon", test_accommodation_search_lisbon),
        ("Accommodation Search - Bangkok", test_accommodation_search_bangkok),
        ("Currency Exchange Rates", test_currency_rates),
        ("Currency Conversion", test_currency_convert),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(results)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)