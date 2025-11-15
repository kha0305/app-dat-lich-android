#!/bin/bash

# Script tự động build APK cho ứng dụng Đặt lịch khám bệnh
# Sử dụng: ./build-apk.sh [preview|development|production]

set -e

# Màu sắc cho terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Profile mặc định
PROFILE=${1:-preview}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Build APK - Ứng dụng Đặt lịch khám bệnh${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Kiểm tra EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}⚠️  EAS CLI chưa được cài đặt${NC}"
    echo -e "${BLUE}➜ Đang cài đặt EAS CLI...${NC}"
    npm install -g eas-cli
fi

# Kiểm tra đăng nhập
echo -e "${BLUE}➜ Kiểm tra đăng nhập Expo...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Bạn chưa đăng nhập EAS${NC}"
    echo -e "${BLUE}➜ Vui lòng đăng nhập:${NC}"
    eas login
fi

echo -e "${GREEN}✓ Đã đăng nhập: $(eas whoami)${NC}"
echo ""

# Xác nhận profile
echo -e "${BLUE}➜ Build profile: ${YELLOW}${PROFILE}${NC}"
case $PROFILE in
    preview)
        echo -e "   APK cho testing"
        ;;
    development)
        echo -e "   APK development với hot reload"
        ;;
    production)
        echo -e "   AAB cho Google Play Store"
        ;;
    *)
        echo -e "${RED}❌ Profile không hợp lệ. Chọn: preview, development, hoặc production${NC}"
        exit 1
        ;;
esac

echo ""
read -p "Tiếp tục build? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Build đã bị hủy${NC}"
    exit 0
fi

# Chạy build
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Bắt đầu build...${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

eas build --platform android --profile $PROFILE

echo ""
echo -e "${GREEN}✓ Build hoàn tất!${NC}"
echo -e "${BLUE}➜ Kiểm tra status: ${YELLOW}eas build:list${NC}"
echo -e "${BLUE}➜ Download APK: ${YELLOW}eas build:download --platform android${NC}"
echo ""
