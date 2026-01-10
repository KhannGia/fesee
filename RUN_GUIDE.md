# Hướng dẫn khởi động StreamCredit (Frontend + Mock API)

Tài liệu này hướng dẫn nhanh cách chạy web (Next.js) và Mock API server (Node.js) trên máy của bạn.

## Yêu cầu môi trường
- Node.js 18+
- npm (hoặc yarn)
- MetaMask (đang ở mạng Sepolia)

## Cách nhanh nhất (Windows)
Nếu muốn chạy mọi thứ chỉ với 1 thao tác:

```powershell
# Trong thư mục stream-credit
./start.bat
```

Script sẽ tự mở 2 terminal: 1 cho Mock API (port 3001) và 1 cho Frontend (port 3000).

## Cách thủ công (khuyến nghị cho dev)
### 1) Khởi động Mock API (port 3001)
```powershell
cd "stream-credit/mock-api"
npm install
npm start
```
Khi chạy thành công, terminal sẽ hiển thị:
-  `Mock API Server running on http://localhost:3001`
-  Honest/Fraud endpoints: `/api/user/honest`, `/api/user/fraud`
-  Regenerate data: `POST /api/regenerate`

### 2) Khởi động Frontend (port 3000)
Trong terminal mới:
```powershell
cd "stream-credit/frontend"
npm install
npm run dev
```
Mở trình duyệt: http://localhost:3000

## Tuỳ chọn: Deploy contracts (Sepolia)
Nếu cần deploy lại contracts (đã có sẵn địa chỉ nếu dùng MockVerifier):
```powershell
cd "stream-credit/contracts"
# Deploy verifier thật + StreamCredit
npx hardhat run scripts/deploy.js --network sepolia

# Hoặc dùng MockVerifier (test nhanh, luôn verify true)
npx hardhat run scripts/deploy-mock.js --network sepolia
```
Sau khi deploy, cập nhật địa chỉ trong file `frontend/config/constants.js`.

## Kiểm tra hoạt động
- Frontend: http://localhost:3000 hiển thị dashboard
- Mock API: http://localhost:3001/health trả về `{ status: 'ok' }`
- Chọn scenario (Honest/Wash Trader) → nút "Generate ZK Proof"

## Lỗi thường gặp
### 1) Error: Network Error
- Mock API chưa chạy hoặc khác port → chạy lại bước 1
- Kiểm tra `API_BASE_URL` trong `frontend/config/constants.js` phải là `http://localhost:3001`
- Thử hard reload (Ctrl + Shift + R)

### 2) CORS hoặc Unauthorized khi gọi RPC
- Đổi RPC sang public endpoint hỗ trợ CORS (ví dụ `https://rpc2.sepolia.org`, `https://ethereum-sepolia-rpc.publicnode.com`)
- Kiểm tra file `frontend/app/layout.js` phần cấu hình provider

### 3) snarkjs not loaded
- Đảm bảo component `frontend/components/ZKScripts.js` được include trong `layout.js` hoặc `page.js`
- Đợi script load xong rồi mới bấm Generate ZK Proof

### 4) Transaction reverted
- Dùng MockVerifier để test nhanh: `npx hardhat run scripts/deploy-mock.js --network sepolia` và cập nhật địa chỉ trong `constants.js`
- Verifier thật phải khớp với `verification_key.json` trong `frontend/public/zk`

### 5) Wash Trader vẫn được duyệt
- Kiểm tra `FRAUD_THRESHOLD` trong `frontend/config/constants.js`
- Giá trị khuyến nghị: `FRAUD_THRESHOLD: 20` (Benford score > 20 sẽ fail)

## Ghi chú
- Ports sử dụng: Frontend 3000, Mock API 3001
- Nếu port bị chiếm, đổi port trong server hoặc app
- Khi thay đổi contracts trên Sepolia, nhớ cập nhật địa chỉ trong `frontend/config/constants.js`

---
Nếu cần hỗ trợ thêm, mở Issues hoặc ping team dev.
