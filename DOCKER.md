# Docker development environment

Mọi dependency của project sống trong container. **Không cài gì lên host** — không
`npm install`, không Node, không MongoDB. Host chỉ cần Docker.

## Quick start

```bash
docker compose up -d --build     # dựng image và chạy stack
docker compose exec dev bash     # vào shell trong container
```

Lần đầu tiên, cài dependency **bên trong** container:

```bash
npm run install:all              # root + mock-api + frontend + contracts
```

Sau đó mọi lệnh đều chạy từ `/workspace` trong container:

```bash
cd contracts && npx hardhat test                          # 25 test
cd contracts && npx hardhat node --hostname 0.0.0.0       # local chain
cd contracts && npx hardhat run scripts/deploy.js --network localhost
cd mock-api  && npm start                                 # :3001
cd frontend  && npm run dev                               # :3000
```

> `hardhat node` **bắt buộc** có `--hostname 0.0.0.0`. Mặc định nó chỉ bind
> `127.0.0.1` bên trong container nên host và MetaMask sẽ không kết nối được.

## Có gì bên trong

| Service | Nội dung |
|---|---|
| `dev` | Node 20, npm, git, python3/make/g++ (node-gyp), curl |
| `mongo` | MongoDB 7, dữ liệu nằm trong volume `mongo_data` |

Container chạy dưới user `node` (uid/gid **1000**, trùng với user host), nên file
container tạo ra không bị root-owned trên host — không cần `chown` thủ công.

## Ports

| Port | Service |
|---|---|
| 3000 | Next.js dev server |
| 3001 | mock-api |
| 8545 | hardhat node |
| 27017 | MongoDB (để host dùng Compass) |

## node_modules

`node_modules` của cả 4 package nằm trong **named volume**, không phải trên host.
Thư mục `node_modules` phía host chỉ là mount point rỗng — đó là chủ ý.

Hệ quả: chạy `npm test` trên host sẽ fail với `hardhat: not found`. Mọi thứ phải
chạy trong container.

Muốn cài lại từ đầu:

```bash
docker compose down -v           # xoá luôn volume, gồm cả dữ liệu MongoDB
docker compose up -d --build
docker compose exec dev bash -lc 'npm run install:all'
```

## Biến môi trường

`MONGODB_URI` được set sẵn trong `docker-compose.yml` trỏ tới service `mongo`,
nên **không cần tài khoản MongoDB Atlas** để dev.

Lưu ý: Next.js không ghi đè biến đã tồn tại trong môi trường, nên giá trị trong
compose thắng `frontend/.env.local`. Muốn dùng Atlas thì comment dòng
`MONGODB_URI` trong `docker-compose.yml` đi.

Các biến còn lại điền vào `frontend/.env.local` (xem `frontend/.env.example`):

- `NEXT_PUBLIC_STREAM_CREDIT_ADDRESS`, `NEXT_PUBLIC_MOCK_USDC_ADDRESS`,
  `NEXT_PUBLIC_COLLATERAL_NFT_ADDRESS` — copy từ
  `contracts/deployed-addresses-<network>.json` sau khi deploy
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` — upload ảnh tài sản thế chấp lên IPFS

Deploy lên mạng public thì thêm `contracts/.env` (xem `contracts/.env.example`).

## Hot reload

`WATCHPACK_POLLING` và `CHOKIDAR_USEPOLLING` được bật sẵn vì file watching qua
bind mount không phải lúc nào cũng nhận được inotify event từ host.
