# 🔐 Thirdweb Storage Setup Guide

## Tại sao cần Thirdweb?

Thirdweb Storage cung cấp IPFS upload/download **MIỄN PHÍ** với:
- ✅ Không giới hạn storage
- ✅ Gateway nhanh toàn cầu
- ✅ Không cần tạo tài khoản phức tạp
- ✅ Tích hợp sẵn với ethers.js

## 📝 Hướng dẫn lấy API Keys

### Bước 1: Truy cập Thirdweb Dashboard

```
https://thirdweb.com/dashboard
```

### Bước 2: Đăng nhập

Chọn một trong các cách:
- **Email** (khuyến nghị - nhanh nhất)
- **MetaMask** wallet
- **WalletConnect**
- **Google Account**

### Bước 3: Tạo API Key

1. Sau khi đăng nhập, click vào **Settings** (góc dưới trái)
2. Chọn **API Keys** trong menu
3. Click nút **"Create API Key"**
4. Đặt tên cho key (VD: "FESE Collateral NFT")
5. Click **"Create"**

### Bước 4: Copy Credentials

Sau khi tạo, bạn sẽ thấy 2 keys:

```
┌─────────────────────────────────────────┐
│ Client ID (Public)                      │
│ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        │
│                                         │
│ Secret Key (Private) - Copy this!       │
│ xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx    │
└─────────────────────────────────────────┘
```

**⚠️ LƯU Ý:** Secret Key chỉ hiển thị **MỘT LẦN**! 
Hãy copy ngay và lưu an toàn.

### Bước 5: Thêm vào .env.local

Mở file `frontend/.env.local` và thêm:

```env
# Thirdweb Storage
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
THIRDWEB_SECRET_KEY=your_secret_key_here
```

**Thay thế:**
- `your_client_id_here` → Client ID bạn vừa copy
- `your_secret_key_here` → Secret Key bạn vừa copy

### Bước 6: Restart Dev Server

```bash
cd frontend
npm run dev
```

## ✅ Kiểm tra

Mở browser console (F12), reload trang.

**Thành công:**
```
✅ Thirdweb Storage initialized
```

**Lỗi (thiếu credentials):**
```
⚠️ Thirdweb credentials missing. Add to .env.local:
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key
```

## 📦 Test Upload

1. **Connect Wallet** trong app
2. **Vào Collateral Manager**
3. **Điền thông tin** tài sản
4. **Chọn ảnh** (< 10MB)
5. **Click "Mint"**

Kiểm tra console logs:

```javascript
📤 Uploading to Thirdweb IPFS...
Uploading image: asset.jpg
✅ Image uploaded: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
Uploading metadata...
✅ Metadata uploaded: bafkreieq5uwy...
```

## 🔒 Bảo mật

### ✅ ĐÚNG:
- ✅ Lưu Secret Key trong `.env.local`
- ✅ Thêm `.env.local` vào `.gitignore`
- ✅ Không commit `.env.local` lên GitHub

### ❌ SAI:
- ❌ Hardcode Secret Key trong code
- ❌ Commit Secret Key lên repository public
- ❌ Chia sẻ Secret Key với người khác

## 🆓 Rate Limits (FREE tier)

```
Upload:   Unlimited files
Storage:  Unlimited size
Download: 1 GB/month bandwidth
Speed:    Fast (CDN-backed)
```

**Nếu cần nhiều hơn:**
- Upgrade lên Pro plan ($99/month)
- Hoặc dùng multiple API keys

## 🚨 Troubleshooting

### Lỗi: "Storage not initialized"

**Nguyên nhân:** Thiếu credentials hoặc sai format

**Giải pháp:**
```bash
1. Check file .env.local tồn tại
2. Check có cả CLIENT_ID và SECRET_KEY
3. Không có dấu ngoặc, space thừa
4. Restart dev server
```

### Lỗi: "Invalid API Key"

**Nguyên nhân:** Secret Key sai hoặc bị revoke

**Giải pháp:**
```
1. Quay lại Thirdweb Dashboard
2. Delete API key cũ
3. Tạo API key mới
4. Copy Secret Key mới
5. Update .env.local
```

### Lỗi: "Upload failed"

**Nguyên nhân:** File quá lớn hoặc network issue

**Giải pháp:**
```
1. Check file size < 10MB
2. Check internet connection
3. Thử upload file nhỏ hơn để test
```

## 📚 Tài liệu

- **Thirdweb Docs**: https://portal.thirdweb.com/storage
- **Dashboard**: https://thirdweb.com/dashboard
- **API Reference**: https://docs.thirdweb.com/typescript/sdk.thirdwebstorage

## 💡 Tips

1. **Tạo nhiều API keys** cho các môi trường khác nhau:
   - Development key (local)
   - Staging key (test)
   - Production key (live)

2. **Monitor usage** trong Dashboard:
   - Số lượng uploads
   - Bandwidth sử dụng
   - Rate limit status

3. **Rotate keys định kỳ** (mỗi 3-6 tháng) để tăng bảo mật

4. **Backup images** quan trọng:
   - Lưu CID vào database
   - Pin trên Pinata/Fleek (backup IPFS)
   - Download local copy

## 🎉 Done!

Sau khi setup xong, system sẽ tự động upload tất cả ảnh collateral lên IPFS thông qua Thirdweb! 🚀
