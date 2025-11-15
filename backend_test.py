#!/usr/bin/env python3
"""
Backend API Testing for Clinic Booking Application
Tests all backend endpoints with realistic Vietnamese data
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://medischedule.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data
TEST_USERS = {
    "patient": {
        "email": "nguyen.van.a@gmail.com",
        "password": "matkhau123",
        "full_name": "Nguyễn Văn A",
        "phone": "0901234567",
        "role": "patient",
        "date_of_birth": "1990-05-15",
        "address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
        "id_card": "025123456789",
        "medical_history": "Tiền sử bệnh cao huyết áp"
    },
    "doctor": {
        "email": "bs.tran.thi.b@hospital.vn",
        "password": "matkhau123",
        "full_name": "BS. Trần Thị B",
        "phone": "0912345678",
        "role": "doctor",
        "specialization": "Nội khoa",
        "id_card": "025987654321"
    },
    "admin": {
        "email": "admin@clinic.vn",
        "password": "matkhau123",
        "full_name": "Quản trị viên",
        "phone": "0923456789",
        "role": "admin"
    }
}

# Global variables to store tokens and IDs
tokens = {}
user_ids = {}
appointment_id = None
doctor_id = None

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(endpoint, method, status_code, response_data, expected_status=200):
    success = status_code == expected_status
    status_symbol = "✅" if success else "❌"
    print(f"{status_symbol} {method} {endpoint}")
    print(f"   Status: {status_code} (Expected: {expected_status})")
    if not success or status_code >= 400:
        print(f"   Response: {response_data}")
    return success

def test_user_registration():
    """Test user registration for all 3 roles"""
    print_test_header("USER REGISTRATION")
    results = []
    
    for role, user_data in TEST_USERS.items():
        try:
            response = requests.post(f"{BASE_URL}/auth/register", 
                                   json=user_data, 
                                   headers=HEADERS)
            
            success = print_result(f"/auth/register ({role})", "POST", 
                                 response.status_code, response.json())
            
            if success:
                data = response.json()
                tokens[role] = data.get("token")
                user_ids[role] = data.get("user", {}).get("id")
                print(f"   ✅ {role.capitalize()} registered successfully")
                if role == "doctor":
                    global doctor_id
                    doctor_id = user_ids[role]
            else:
                print(f"   ❌ {role.capitalize()} registration failed")
            
            results.append(success)
            
        except Exception as e:
            print(f"   ❌ {role.capitalize()} registration error: {str(e)}")
            results.append(False)
    
    return all(results)

def test_user_login():
    """Test user login with valid and invalid credentials"""
    print_test_header("USER LOGIN")
    results = []
    
    # Test valid logins
    for role, user_data in TEST_USERS.items():
        try:
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            
            response = requests.post(f"{BASE_URL}/auth/login", 
                                   json=login_data, 
                                   headers=HEADERS)
            
            success = print_result(f"/auth/login ({role})", "POST", 
                                 response.status_code, response.json())
            
            if success:
                data = response.json()
                tokens[role] = data.get("token")  # Update token
                print(f"   ✅ {role.capitalize()} login successful")
            
            results.append(success)
            
        except Exception as e:
            print(f"   ❌ {role.capitalize()} login error: {str(e)}")
            results.append(False)
    
    # Test invalid login
    try:
        invalid_login = {
            "email": "invalid@email.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=invalid_login, 
                               headers=HEADERS)
        
        success = print_result("/auth/login (invalid)", "POST", 
                             response.status_code, response.json(), 401)
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Invalid login test error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_protected_endpoints():
    """Test protected endpoints with and without tokens"""
    print_test_header("PROTECTED ENDPOINTS")
    results = []
    
    # Test without token
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=HEADERS)
        success = print_result("/auth/me (no token)", "GET", 
                             response.status_code, response.json(), 403)
        results.append(success)
    except Exception as e:
        print(f"   ❌ No token test error: {str(e)}")
        results.append(False)
    
    # Test with valid token
    if tokens.get("patient"):
        try:
            auth_headers = {**HEADERS, "Authorization": f"Bearer {tokens['patient']}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=auth_headers)
            
            success = print_result("/auth/me (with token)", "GET", 
                                 response.status_code, response.json())
            results.append(success)
            
        except Exception as e:
            print(f"   ❌ Valid token test error: {str(e)}")
            results.append(False)
    
    return all(results)

def test_specializations():
    """Test GET /api/specializations"""
    print_test_header("SPECIALIZATIONS")
    
    try:
        response = requests.get(f"{BASE_URL}/specializations", headers=HEADERS)
        success = print_result("/specializations", "GET", 
                             response.status_code, response.json())
        
        if success:
            data = response.json()
            if len(data) == 8:
                print(f"   ✅ Found 8 Vietnamese specializations")
                for spec in data:
                    print(f"      - {spec.get('name')}")
            else:
                print(f"   ❌ Expected 8 specializations, got {len(data)}")
                success = False
        
        return success
        
    except Exception as e:
        print(f"   ❌ Specializations test error: {str(e)}")
        return False

def test_doctors():
    """Test doctor endpoints"""
    print_test_header("DOCTOR MANAGEMENT")
    results = []
    
    # Test GET /api/doctors
    try:
        response = requests.get(f"{BASE_URL}/doctors", headers=HEADERS)
        success = print_result("/doctors", "GET", 
                             response.status_code, response.json())
        
        if success:
            doctors = response.json()
            print(f"   ✅ Found {len(doctors)} doctors")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Get doctors error: {str(e)}")
        results.append(False)
    
    # Test GET /api/doctors?specialization=Nội khoa
    try:
        response = requests.get(f"{BASE_URL}/doctors?specialization=Nội khoa", 
                              headers=HEADERS)
        success = print_result("/doctors?specialization=Nội khoa", "GET", 
                             response.status_code, response.json())
        
        if success:
            filtered_doctors = response.json()
            print(f"   ✅ Found {len(filtered_doctors)} doctors in Nội khoa")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Filter doctors error: {str(e)}")
        results.append(False)
    
    # Test GET /api/doctors/{doctor_id}
    if doctor_id:
        try:
            response = requests.get(f"{BASE_URL}/doctors/{doctor_id}", 
                                  headers=HEADERS)
            success = print_result(f"/doctors/{doctor_id}", "GET", 
                                 response.status_code, response.json())
            results.append(success)
            
        except Exception as e:
            print(f"   ❌ Get specific doctor error: {str(e)}")
            results.append(False)
    
    return all(results)

def test_appointments():
    """Test appointment booking system"""
    print_test_header("APPOINTMENT BOOKING SYSTEM")
    results = []
    global appointment_id
    
    if not tokens.get("patient") or not doctor_id:
        print("   ❌ Missing patient token or doctor ID for appointment tests")
        return False
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {tokens['patient']}"}
    
    # Test POST /api/appointments - create appointment
    try:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        appointment_data = {
            "doctor_id": doctor_id,
            "appointment_date": tomorrow,
            "appointment_time": "09:00",
            "notes": "Khám tổng quát định kỳ"
        }
        
        response = requests.post(f"{BASE_URL}/appointments", 
                               json=appointment_data, 
                               headers=auth_headers)
        
        success = print_result("/appointments", "POST", 
                             response.status_code, response.json())
        
        if success:
            data = response.json()
            appointment_id = data.get("id")
            print(f"   ✅ Appointment created with ID: {appointment_id}")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Create appointment error: {str(e)}")
        results.append(False)
    
    # Test GET /api/appointments - list appointments
    try:
        response = requests.get(f"{BASE_URL}/appointments", headers=auth_headers)
        success = print_result("/appointments", "GET", 
                             response.status_code, response.json())
        
        if success:
            appointments = response.json()
            print(f"   ✅ Found {len(appointments)} appointments for patient")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Get appointments error: {str(e)}")
        results.append(False)
    
    # Test PUT /api/appointments/{id} - update appointment
    if appointment_id:
        try:
            update_data = {
                "notes": "Cập nhật: Khám tổng quát và tư vấn dinh dưỡng"
            }
            
            response = requests.put(f"{BASE_URL}/appointments/{appointment_id}", 
                                  json=update_data, 
                                  headers=auth_headers)
            
            success = print_result(f"/appointments/{appointment_id}", "PUT", 
                                 response.status_code, response.json())
            results.append(success)
            
        except Exception as e:
            print(f"   ❌ Update appointment error: {str(e)}")
            results.append(False)
    
    # Test doctor view of appointments
    if tokens.get("doctor"):
        try:
            doctor_headers = {**HEADERS, "Authorization": f"Bearer {tokens['doctor']}"}
            response = requests.get(f"{BASE_URL}/appointments", headers=doctor_headers)
            
            success = print_result("/appointments (doctor view)", "GET", 
                                 response.status_code, response.json())
            
            if success:
                doctor_appointments = response.json()
                print(f"   ✅ Doctor can see {len(doctor_appointments)} appointments")
                
            results.append(success)
            
        except Exception as e:
            print(f"   ❌ Doctor appointments view error: {str(e)}")
            results.append(False)
    
    return all(results)

def test_chat_system():
    """Test chat system"""
    print_test_header("CHAT SYSTEM")
    results = []
    
    if not tokens.get("patient") or not appointment_id:
        print("   ❌ Missing patient token or appointment ID for chat tests")
        return False
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {tokens['patient']}"}
    
    # Test POST /api/messages - send message
    try:
        message_data = {
            "appointment_id": appointment_id,
            "message": "Xin chào bác sĩ, tôi muốn hỏi về lịch khám."
        }
        
        response = requests.post(f"{BASE_URL}/messages", 
                               json=message_data, 
                               headers=auth_headers)
        
        success = print_result("/messages", "POST", 
                             response.status_code, response.json())
        
        if success:
            print("   ✅ Message sent successfully")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Send message error: {str(e)}")
        results.append(False)
    
    # Test GET /api/messages/{appointment_id} - get chat history
    try:
        response = requests.get(f"{BASE_URL}/messages/{appointment_id}", 
                              headers=auth_headers)
        
        success = print_result(f"/messages/{appointment_id}", "GET", 
                             response.status_code, response.json())
        
        if success:
            messages = response.json()
            print(f"   ✅ Retrieved {len(messages)} messages")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Get messages error: {str(e)}")
        results.append(False)
    
    # Test doctor can also access chat
    if tokens.get("doctor"):
        try:
            doctor_headers = {**HEADERS, "Authorization": f"Bearer {tokens['doctor']}"}
            response = requests.get(f"{BASE_URL}/messages/{appointment_id}", 
                                  headers=doctor_headers)
            
            success = print_result(f"/messages/{appointment_id} (doctor)", "GET", 
                                 response.status_code, response.json())
            results.append(success)
            
        except Exception as e:
            print(f"   ❌ Doctor chat access error: {str(e)}")
            results.append(False)
    
    return all(results)

def test_payment_system():
    """Test payment system"""
    print_test_header("PAYMENT SYSTEM")
    results = []
    
    if not tokens.get("patient") or not appointment_id:
        print("   ❌ Missing patient token or appointment ID for payment tests")
        return False
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {tokens['patient']}"}
    
    # Test POST /api/payments/create - create payment order
    try:
        payment_data = {
            "appointment_id": appointment_id,
            "amount": 500000.0,
            "gateway": "vnpay"
        }
        
        response = requests.post(f"{BASE_URL}/payments/create", 
                               json=payment_data, 
                               headers=auth_headers)
        
        success = print_result("/payments/create", "POST", 
                             response.status_code, response.json())
        
        if success:
            data = response.json()
            print(f"   ✅ Payment order created: {data.get('payment_id')}")
            print(f"   ✅ Payment URL: {data.get('payment_url')}")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Create payment error: {str(e)}")
        results.append(False)
    
    # Test POST /api/payments/confirm/{appointment_id} - confirm payment
    try:
        response = requests.post(f"{BASE_URL}/payments/confirm/{appointment_id}", 
                               headers=auth_headers)
        
        success = print_result(f"/payments/confirm/{appointment_id}", "POST", 
                             response.status_code, response.json())
        
        if success:
            print("   ✅ Payment confirmed successfully")
            
        results.append(success)
        
    except Exception as e:
        print(f"   ❌ Confirm payment error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_appointment_cancellation():
    """Test appointment cancellation"""
    print_test_header("APPOINTMENT CANCELLATION")
    
    if not tokens.get("patient") or not appointment_id:
        print("   ❌ Missing patient token or appointment ID for cancellation test")
        return False
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {tokens['patient']}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/appointments/{appointment_id}", 
                                 headers=auth_headers)
        
        success = print_result(f"/appointments/{appointment_id}", "DELETE", 
                             response.status_code, response.json())
        
        if success:
            print("   ✅ Appointment cancelled successfully")
            
        return success
        
    except Exception as e:
        print(f"   ❌ Cancel appointment error: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🏥 CLINIC BOOKING APPLICATION - BACKEND API TESTING")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_results = {}
    
    # Run tests in priority order
    test_results["User Registration"] = test_user_registration()
    test_results["User Login"] = test_user_login()
    test_results["Protected Endpoints"] = test_protected_endpoints()
    test_results["Specializations"] = test_specializations()
    test_results["Doctor Management"] = test_doctors()
    test_results["Appointment Booking"] = test_appointments()
    test_results["Chat System"] = test_chat_system()
    test_results["Payment System"] = test_payment_system()
    test_results["Appointment Cancellation"] = test_appointment_cancellation()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    print(f"Success rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the details above.")
    
    return test_results

if __name__ == "__main__":
    run_all_tests()