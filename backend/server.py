from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from bson import ObjectId
import socketio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'clinic_db')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Socket.IO setup for real-time chat
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Wrap FastAPI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# ==================== MODELS ====================

class UserRole(str):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    role: str = UserRole.PATIENT
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    id_card: Optional[str] = None
    specialization: Optional[str] = None  # For doctors
    medical_history: Optional[str] = None  # For patients

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    role: str
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    id_card: Optional[str] = None
    specialization: Optional[str] = None
    medical_history: Optional[str] = None
    created_at: datetime

class Doctor(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    specialization: str
    available_days: List[str] = []
    available_hours: str = "08:00-17:00"

class Appointment(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    appointment_date: str
    appointment_time: str
    specialization: str
    status: str = "pending"  # pending, confirmed, cancelled, completed
    payment_status: str = "unpaid"  # unpaid, paid
    amount: float
    notes: Optional[str] = None
    created_at: datetime

class AppointmentCreate(BaseModel):
    doctor_id: str
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Message(BaseModel):
    id: str
    appointment_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    message: str
    timestamp: datetime

class MessageCreate(BaseModel):
    appointment_id: str
    message: str

class PaymentRequest(BaseModel):
    appointment_id: str
    amount: float
    gateway: str  # vnpay, momo, zalopay

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_data.password)
    user_dict["_id"] = user_id
    user_dict["created_at"] = datetime.utcnow()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"sub": user_id, "role": user_data.role})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "role": user_data.role
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["_id"], "role": user["role"]})
    
    return {
        "token": token,
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "phone": user.get("phone"),
            "specialization": user.get("specialization")
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"],
        "phone": current_user.get("phone"),
        "date_of_birth": current_user.get("date_of_birth"),
        "address": current_user.get("address"),
        "id_card": current_user.get("id_card"),
        "specialization": current_user.get("specialization"),
        "medical_history": current_user.get("medical_history")
    }

# ==================== DOCTOR ROUTES ====================

@api_router.get("/doctors")
async def get_doctors(specialization: Optional[str] = None):
    query = {"role": "doctor"}
    if specialization:
        query["specialization"] = specialization
    
    doctors = await db.users.find(query).to_list(100)
    
    return [
        {
            "id": doc["_id"],
            "full_name": doc["full_name"],
            "email": doc["email"],
            "phone": doc.get("phone"),
            "specialization": doc.get("specialization", "General")
        }
        for doc in doctors
    ]

@api_router.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    doctor = await db.users.find_one({"_id": doctor_id, "role": "doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return {
        "id": doctor["_id"],
        "full_name": doctor["full_name"],
        "email": doctor["email"],
        "phone": doctor.get("phone"),
        "specialization": doctor.get("specialization", "General")
    }

@api_router.get("/specializations")
async def get_specializations():
    return [
        {"id": "1", "name": "Nội khoa"},
        {"id": "2", "name": "Ngoại khoa"},
        {"id": "3", "name": "Nhi khoa"},
        {"id": "4", "name": "Sản phụ khoa"},
        {"id": "5", "name": "Tim mạch"},
        {"id": "6", "name": "Da liễu"},
        {"id": "7", "name": "Mắt"},
        {"id": "8", "name": "Tai Mũi Họng"},
    ]

# ==================== APPOINTMENT ROUTES ====================

@api_router.post("/appointments")
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user = Depends(get_current_user)
):
    # Get doctor info
    doctor = await db.users.find_one({"_id": appointment_data.doctor_id, "role": "doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Create appointment
    appointment_id = str(uuid.uuid4())
    appointment = {
        "_id": appointment_id,
        "patient_id": current_user["_id"],
        "patient_name": current_user["full_name"],
        "patient_email": current_user["email"],
        "patient_phone": current_user.get("phone"),
        "doctor_id": appointment_data.doctor_id,
        "doctor_name": doctor["full_name"],
        "appointment_date": appointment_data.appointment_date,
        "appointment_time": appointment_data.appointment_time,
        "specialization": doctor.get("specialization", "General"),
        "status": "pending",
        "payment_status": "unpaid",
        "amount": 500000.0,  # Default amount
        "notes": appointment_data.notes,
        "created_at": datetime.utcnow()
    }
    
    await db.appointments.insert_one(appointment)
    
    return {
        "id": appointment_id,
        "message": "Appointment created successfully",
        "appointment": appointment
    }

@api_router.get("/appointments")
async def get_appointments(current_user = Depends(get_current_user)):
    # Get appointments based on user role
    if current_user["role"] == "patient":
        query = {"patient_id": current_user["_id"]}
    elif current_user["role"] == "doctor":
        query = {"doctor_id": current_user["_id"]}
    else:  # admin
        query = {}
    
    appointments = await db.appointments.find(query).sort("created_at", -1).to_list(100)
    
    return [
        {
            "id": apt["_id"],
            "patient_name": apt["patient_name"],
            "doctor_name": apt["doctor_name"],
            "appointment_date": apt["appointment_date"],
            "appointment_time": apt["appointment_time"],
            "specialization": apt["specialization"],
            "status": apt["status"],
            "payment_status": apt["payment_status"],
            "amount": apt["amount"],
            "notes": apt.get("notes")
        }
        for apt in appointments
    ]

@api_router.get("/appointments/{appointment_id}")
async def get_appointment(appointment_id: str, current_user = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check access
    if current_user["role"] == "patient" and appointment["patient_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user["role"] == "doctor" and appointment["doctor_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return appointment

@api_router.put("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdate,
    current_user = Depends(get_current_user)
):
    appointment = await db.appointments.find_one({"_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only patient can update their own appointments
    if current_user["role"] == "patient" and appointment["patient_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await db.appointments.update_one({"_id": appointment_id}, {"$set": update_dict})
    
    return {"message": "Appointment updated successfully"}

@api_router.delete("/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: str, current_user = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only patient can cancel their own appointments
    if current_user["role"] == "patient" and appointment["patient_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.appointments.update_one(
        {"_id": appointment_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Appointment cancelled successfully"}

# ==================== CHAT ROUTES ====================

@api_router.get("/chats")
async def get_chats(current_user = Depends(get_current_user)):
    """Get list of conversations (appointments with messages) for the user"""
    # Get appointments based on user role
    if current_user["role"] == "patient":
        query = {"patient_id": current_user["_id"]}
    elif current_user["role"] == "doctor":
        query = {"doctor_id": current_user["_id"]}
    else:  # admin
        query = {}
    
    # Get appointments that have at least one message or are confirmed/completed
    appointments = await db.appointments.find(query).sort("created_at", -1).to_list(100)
    
    chats = []
    for apt in appointments:
        # Get last message for this appointment
        last_message = await db.messages.find_one(
            {"appointment_id": apt["_id"]},
            sort=[("timestamp", -1)]
        )
        
        # Get unread message count
        unread_count = 0
        if last_message:
            unread_count = await db.messages.count_documents({
                "appointment_id": apt["_id"],
                "sender_id": {"$ne": current_user["_id"]},
                "read": {"$ne": True}
            })
        
        # Only include appointments that have messages or are confirmed
        if last_message or apt["status"] in ["confirmed", "completed"]:
            chats.append({
                "id": apt["_id"],
                "appointment_id": apt["_id"],
                "patient_name": apt["patient_name"],
                "doctor_name": apt["doctor_name"],
                "specialization": apt["specialization"],
                "appointment_date": apt["appointment_date"],
                "appointment_time": apt["appointment_time"],
                "status": apt["status"],
                "last_message": {
                    "message": last_message["message"] if last_message else None,
                    "timestamp": last_message["timestamp"].isoformat() if last_message else None,
                    "sender_name": last_message["sender_name"] if last_message else None
                } if last_message else None,
                "unread_count": unread_count
            })
    
    return chats

@api_router.post("/messages")
async def send_message(
    message_data: MessageCreate,
    current_user = Depends(get_current_user)
):
    # Verify appointment exists
    appointment = await db.appointments.find_one({"_id": message_data.appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    message_id = str(uuid.uuid4())
    message = {
        "_id": message_id,
        "appointment_id": message_data.appointment_id,
        "sender_id": current_user["_id"],
        "sender_name": current_user["full_name"],
        "sender_role": current_user["role"],
        "message": message_data.message,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    await db.messages.insert_one(message)
    
    # Emit to socket
    await sio.emit('new_message', {
        "id": message_id,
        "appointment_id": message_data.appointment_id,
        "sender_name": current_user["full_name"],
        "sender_role": current_user["role"],
        "message": message_data.message,
        "timestamp": message["timestamp"].isoformat()
    }, room=message_data.appointment_id)
    
    return message

@api_router.get("/messages/{appointment_id}")
async def get_messages(appointment_id: str, current_user = Depends(get_current_user)):
    # Verify access to appointment
    appointment = await db.appointments.find_one({"_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if current_user["role"] == "patient" and appointment["patient_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user["role"] == "doctor" and appointment["doctor_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.messages.find({"appointment_id": appointment_id}).sort("timestamp", 1).to_list(1000)
    
    return [
        {
            "id": msg["_id"],
            "sender_name": msg["sender_name"],
            "sender_role": msg["sender_role"],
            "message": msg["message"],
            "timestamp": msg["timestamp"].isoformat()
        }
        for msg in messages
    ]

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments/create")
async def create_payment(
    payment_data: PaymentRequest,
    current_user = Depends(get_current_user)
):
    appointment = await db.appointments.find_one({"_id": payment_data.appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["patient_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # For now, mock payment (would integrate with actual gateways)
    payment_id = str(uuid.uuid4())
    
    # Simulate payment URL
    payment_url = f"https://payment.gateway.vn/pay?order_id={payment_id}&amount={payment_data.amount}"
    
    return {
        "success": True,
        "payment_id": payment_id,
        "payment_url": payment_url,
        "gateway": payment_data.gateway,
        "amount": payment_data.amount
    }

@api_router.post("/payments/confirm/{appointment_id}")
async def confirm_payment(appointment_id: str, current_user = Depends(get_current_user)):
    # Update appointment payment status
    await db.appointments.update_one(
        {"_id": appointment_id},
        {"$set": {"payment_status": "paid", "status": "confirmed"}}
    )
    
    return {"message": "Payment confirmed successfully"}

# ==================== SOCKET.IO EVENTS ====================

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def join_room(sid, data):
    appointment_id = data.get('appointment_id')
    if appointment_id:
        sio.enter_room(sid, appointment_id)
        print(f"Client {sid} joined room {appointment_id}")

@sio.event
async def leave_room(sid, data):
    appointment_id = data.get('appointment_id')
    if appointment_id:
        sio.leave_room(sid, appointment_id)
        print(f"Client {sid} left room {appointment_id}")

# Include the router
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
