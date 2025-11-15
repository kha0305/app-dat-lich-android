# 🚀 BUILD APK NHANH - 3 BƯỚC ĐƠN GIẢN

## ✅ Đã cấu hình xong:
- ✓ Package name: `com.app.medicalapp`
- ✓ App name: "Đặt lịch khám bệnh"
- ✓ Icon đã được set
- ✓ Files cấu hình: `app.json` và `eas.json`

---

## 📱 CÁCH 1: BUILD CLOUD VỚI EAS (KHUYẾN NGHỊ)

### Bước 1: Cài đặt EAS CLI (chỉ cần 1 lần)
```bash
npm install -g eas-cli
```

### Bước 2: Đăng nhập
```bash
cd /app/frontend
eas login
```

### Bước 3: Build APK
```bash
# Khởi tạo project (lần đầu tiên)
eas build:configure

# Build APK để test
eas build --platform android --profile preview
```

**Hoặc dùng script tự động:**
```bash
cd /app/frontend
./build-apk.sh preview
```

⏱️ **Thời gian build:** 10-20 phút  
📥 **Kết quả:** Link download APK

---

## 🔧 CÁCH 2: BUILD LOCAL (KHÔNG CẦN EXPO ACCOUNT)

### Bước 1: Tạo native project
```bash
cd /app/frontend
npx expo prebuild --platform android
```

### Bước 2: Build APK
```bash
cd android
./gradlew assembleRelease
```

📁 **APK sẽ ở:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 📋 SAU KHI BUILD XONG

### Download APK (nếu build cloud):
```bash
eas build:download --platform android
```

### Kiểm tra build history:
```bash
eas build:list
```

---

## 🎯 CÁC LOẠI BUILD

| Profile | Lệnh | Mục đích | File output |
|---------|------|----------|-------------|
| **preview** | `eas build -p android --profile preview` | APK để test | `.apk` (~30MB) |
| **development** | `eas build -p android --profile development` | APK dev với hot reload | `.apk` (~70MB) |
| **production** | `eas build -p android --profile production` | Lên Google Play | `.aab` (~25MB) |

---

## 🚨 TROUBLESHOOTING

### Lỗi: "Not logged in"
```bash
eas login
eas whoami  # kiểm tra
```

### Lỗi: "No project ID"
```bash
eas build:configure
```

### Lỗi dependencies:
```bash
cd /app/frontend
npx expo install --fix
```

### Clear cache:
```bash
npx expo start -c
```

---

## 📱 CÀI ĐẶT APK TRÊN ĐIỆN THOẠI

1. Download file `.apk` về máy tính
2. Chuyển file sang điện thoại (USB/AirDrop/Drive)
3. Bật **"Install from Unknown Sources"** trong Settings
4. Mở file APK → Cài đặt

---

## ⚡ LỆNH NHANH

```bash
# Build APK test (khuyến nghị)
cd /app/frontend && eas build -p android --profile preview

# Build local (không cần Expo account)
cd /app/frontend && npx expo prebuild --platform android && cd android && ./gradlew assembleRelease

# Script tự động
cd /app/frontend && ./build-apk.sh preview
```

---

## 📞 HỖ TRỢ

- 📖 Docs: https://docs.expo.dev/build/setup/
- 🔗 EAS: https://docs.expo.dev/eas/
- 📄 Chi tiết: Xem file `BUILD_GUIDE.md`

---

**🎉 Chúc bạn build thành công!**
