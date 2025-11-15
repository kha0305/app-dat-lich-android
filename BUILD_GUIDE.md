# Hướng dẫn Build APK - Ứng dụng Đặt lịch khám bệnh

## 📱 Thông tin App
- **Tên ứng dụng:** Đặt lịch khám bệnh
- **Package Name:** com.app.medicalapp
- **Version:** 1.0.0 (versionCode: 1)
- **Icon:** Đã được cấu hình từ file app-icon.png

## 🚀 Phương pháp 1: Build APK với EAS Build (Khuyến nghị)

### Bước 1: Cài đặt EAS CLI
```bash
npm install -g eas-cli
```

### Bước 2: Đăng nhập Expo
```bash
eas login
```
Nhập username và password của tài khoản Expo của bạn.

### Bước 3: Khởi tạo dự án với EAS
```bash
cd /app/frontend
eas build:configure
```
Lệnh này sẽ tạo một project ID mới trên Expo và cập nhật app.json.

### Bước 4: Build APK Preview
Để build APK cho việc test:
```bash
eas build --platform android --profile preview
```

**Lưu ý:** 
- Build sẽ diễn ra trên cloud của Expo (không cần Android Studio)
- Thời gian build: khoảng 10-20 phút
- Khi build xong, bạn sẽ nhận được link download APK

### Build APK Development (có Expo Go features)
```bash
eas build --platform android --profile development
```

### Build AAB Production (để publish lên Google Play)
```bash
eas build --platform android --profile production
```

## 🔧 Phương pháp 2: Build Local với Gradle (Không cần Expo account)

### Bước 1: Tạo native project
```bash
cd /app/frontend
npx expo prebuild --platform android
```

### Bước 2: Build APK với Gradle
```bash
cd android
./gradlew assembleRelease
```

APK sẽ được tạo tại:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Bước 3: Build APK Debug (cho testing)
```bash
cd android
./gradlew assembleDebug
```

APK debug sẽ ở:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📦 Cấu hình đã được thiết lập

### ✅ app.json
- Package name: `com.app.medicalapp`
- Version: 1.0.0
- versionCode: 1
- Icon: app-icon.png (icon bạn cung cấp)
- Permissions: INTERNET, ACCESS_NETWORK_STATE
- Orientation: portrait

### ✅ eas.json
- **Preview profile**: Build APK cho testing
- **Development profile**: APK với development features
- **Production profile**: AAB cho Google Play Store

## 🎯 Các lệnh hữu ích

### Kiểm tra build status
```bash
eas build:list
```

### Download APK đã build
```bash
eas build:download --platform android
```

### View build logs
```bash
eas build:view
```

## 📱 Test APK trên thiết bị

1. Download file APK về máy
2. Chuyển APK sang thiết bị Android (qua USB hoặc cloud)
3. Bật "Install from Unknown Sources" trong Settings
4. Mở file APK và cài đặt

## ⚠️ Lưu ý quan trọng

### Trước khi build Production:
1. Đổi backend URL trong .env về production server
2. Kiểm tra tất cả API endpoints
3. Test kỹ trên APK preview trước
4. Chuẩn bị keystore cho signing (nếu build local)

### Nếu build bị lỗi:
1. Chạy `expo doctor` để check dependencies
2. Chạy `npx expo install --fix` để fix version conflicts
3. Clear cache: `npx expo start -c`
4. Kiểm tra file eas.json và app.json

## 🔐 Signing APK (Cho Production)

### Tạo keystore (cho local build):
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Cấu hình trong app.json:
```json
"android": {
  "signingKey": "./path/to/my-release-key.keystore"
}
```

## 📊 Kích thước APK dự kiến

- **Development APK**: ~60-80 MB
- **Preview APK**: ~25-35 MB
- **Production AAB**: ~20-30 MB

## 🆘 Support

Nếu gặp vấn đề trong quá trình build:
- Expo docs: https://docs.expo.dev/build/setup/
- EAS Build: https://docs.expo.dev/eas/
- Android build: https://docs.expo.dev/build-reference/android-builds/

## 📝 Checklist trước khi build

- [x] Icon đã được cấu hình
- [x] Package name đã đúng: com.app.medicalapp
- [x] app.json đã được cập nhật
- [x] eas.json đã được tạo
- [ ] Đã test app trên Expo Go
- [ ] Backend API đã sẵn sàng
- [ ] Đã đăng nhập EAS CLI
- [ ] Đã chọn build profile phù hợp

---

## 🎉 Bắt đầu build ngay!

**Lệnh nhanh để build APK test:**
```bash
cd /app/frontend
eas build --platform android --profile preview --non-interactive
```

Chúc bạn build thành công! 🚀
