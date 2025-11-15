#!/usr/bin/env python3
"""
VNPay Specific Testing - Additional edge cases and validation
"""

import requests
import json
import uuid
from datetime import datetime, timedelta

BASE_URL = "https://ra-builder.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def test_vnpay_edge_cases():
    """Test VNPay specific edge cases"""
    print("🔍 VNPAY EDGE CASE TESTING")
    print("=" * 50)
    
    # Register a test user
    test_email = f"vnpay_test_{uuid.uuid4().hex[:8]}@test.com"
    user_data = {
        "email": test_email,
        "password": "TestPass123!",
        "full_name": "VNPay Test User",
        "phone": "0901234567",
        "role": "patient"
    }
    
    # Register user
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data, headers=HEADERS)
    if response.status_code != 200:
        print("❌ Failed to register test user")
        return False
        
    token = response.json().get("token")
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Create doctor
    doctor_data = {
        "email": f"doctor_{uuid.uuid4().hex[:8]}@test.com",
        "password": "DoctorPass123!",
        "full_name": "Test Doctor",
        "phone": "0987654321",
        "role": "doctor",
        "specialization": "Nội khoa"
    }
    
    doc_response = requests.post(f"{BASE_URL}/auth/register", json=doctor_data, headers=HEADERS)
    if doc_response.status_code != 200:
        print("❌ Failed to register test doctor")
        return False
        
    doctor_id = doc_response.json()["user"]["id"]
    
    # Create appointment
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    appointment_data = {
        "doctor_id": doctor_id,
        "appointment_date": tomorrow,
        "appointment_time": "14:00",
        "notes": "VNPay payment test"
    }
    
    apt_response = requests.post(f"{BASE_URL}/appointments", json=appointment_data, headers=auth_headers)
    if apt_response.status_code != 200:
        print("❌ Failed to create test appointment")
        return False
        
    appointment_id = apt_response.json()["id"]
    
    print(f"✅ Test setup complete - Appointment ID: {appointment_id}")
    
    # Test 1: Different payment amounts
    print("\n🧪 Test 1: Different payment amounts")
    amounts = [100000.0, 250000.0, 500000.0, 1000000.0]
    
    for amount in amounts:
        payment_data = {
            "appointment_id": appointment_id,
            "amount": amount,
            "gateway": "vnpay"
        }
        
        response = requests.post(f"{BASE_URL}/payments/create", json=payment_data, headers=auth_headers)
        if response.status_code == 200:
            data = response.json()
            qr_code = data.get("qr_code")
            if f"amount={amount}" in qr_code:
                print(f"✅ Amount {amount} VND - QR code correct")
            else:
                print(f"❌ Amount {amount} VND - QR code incorrect")
        else:
            print(f"❌ Amount {amount} VND - Payment creation failed")
    
    # Test 2: QR Code format validation
    print("\n🧪 Test 2: QR Code format validation")
    payment_data = {
        "appointment_id": appointment_id,
        "amount": 500000.0,
        "gateway": "vnpay"
    }
    
    response = requests.post(f"{BASE_URL}/payments/create", json=payment_data, headers=auth_headers)
    if response.status_code == 200:
        data = response.json()
        qr_code = data.get("qr_code")
        payment_id = data.get("payment_id")
        
        # Check all required components
        required_components = {
            "Protocol": "vnpay://payment",
            "Client ID": "client_id=ra-builder",
            "API Key": "api_key=ra-builder",
            "Amount": f"amount={payment_data['amount']}",
            "Order ID": f"order_id={payment_id}",
            "Appointment ID": f"appointment_id={appointment_id}"
        }
        
        all_valid = True
        for component_name, component_value in required_components.items():
            if component_value in qr_code:
                print(f"✅ {component_name}: Present")
            else:
                print(f"❌ {component_name}: Missing")
                all_valid = False
        
        if all_valid:
            print("✅ QR Code format is completely valid")
        else:
            print("❌ QR Code format has issues")
            
        print(f"📱 Full QR Code: {qr_code}")
        
        # Test 3: Payment status lifecycle
        print("\n🧪 Test 3: Payment status lifecycle")
        
        # Check initial status
        status_response = requests.get(f"{BASE_URL}/payments/status/{payment_id}", headers=auth_headers)
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"✅ Initial status: {status_data.get('status')}")
        else:
            print("❌ Failed to get initial payment status")
        
        # Confirm payment
        confirm_response = requests.post(f"{BASE_URL}/payments/confirm/{appointment_id}", headers=auth_headers)
        if confirm_response.status_code == 200:
            print("✅ Payment confirmation successful")
            
            # Check updated status
            status_response2 = requests.get(f"{BASE_URL}/payments/status/{payment_id}", headers=auth_headers)
            if status_response2.status_code == 200:
                status_data2 = status_response2.json()
                print(f"✅ Updated status: {status_data2.get('status')}")
            else:
                print("❌ Failed to get updated payment status")
        else:
            print("❌ Payment confirmation failed")
    
    # Test 4: Invalid scenarios
    print("\n🧪 Test 4: Invalid scenarios")
    
    # Test with invalid appointment ID
    invalid_payment_data = {
        "appointment_id": "invalid-appointment-id",
        "amount": 500000.0,
        "gateway": "vnpay"
    }
    
    response = requests.post(f"{BASE_URL}/payments/create", json=invalid_payment_data, headers=auth_headers)
    if response.status_code == 404:
        print("✅ Invalid appointment ID properly rejected")
    else:
        print(f"❌ Invalid appointment ID not properly handled: {response.status_code}")
    
    # Test with invalid payment ID for status check
    response = requests.get(f"{BASE_URL}/payments/status/invalid-payment-id", headers=auth_headers)
    if response.status_code == 404:
        print("✅ Invalid payment ID properly rejected")
    else:
        print(f"❌ Invalid payment ID not properly handled: {response.status_code}")
    
    print("\n✅ VNPay edge case testing completed")
    return True

if __name__ == "__main__":
    test_vnpay_edge_cases()