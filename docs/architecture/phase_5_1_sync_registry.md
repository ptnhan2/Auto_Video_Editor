# Giai đoạn 5.1: Auto-Sync Asset Registry

## Mục tiêu

Tự động hóa việc đồng bộ dữ liệu tài nguyên (Nhân vật, Background, Âm thanh, Đạo cụ) từ thư mục `public/assets/` vào file config của hệ thống (`src/config/asset-registry.ts`) để AI Director và Remotion có thể lấy thông tin một cách tự động và linh hoạt, tránh việc phải hardcode thủ công khi có thêm tài nguyên mới.

## Giải pháp đã triển khai

1. **Tạo Script Đồng Bộ:** Đã tạo script `scripts/core/sync_registry.ts` sử dụng Node.js `fs` để quét các thư mục con trong `public/assets/`:
   - `public/assets/humanoid/`: Quét danh sách các thư mục Nhân vật.
   - `public/assets/backgrounds/` (và `public/assets/background/`): Quét các file hình ảnh `.jpg`, `.png`, `.jpeg`, `.webp` làm Background.
   - `public/assets/audio/`: Quét các file âm thanh `.mp3`, `.wav`, `.ogg` và tự động phân loại thành `bgm` (nhạc nền) hoặc `sfx` (hiệu ứng âm thanh) dựa trên tiền tố tên file.
   - `public/assets/props/`: Quét các file hình ảnh làm Đạo cụ.
2. **Bảo tồn Dữ liệu Hardcode:** Kịch bản giữ lại và tích hợp các Action, Expression và Effect đã được định nghĩa cứng, vốn đóng vai trò là logic nền tảng cho hệ thống animation, không phụ thuộc vào file vật lý đơn giản.
3. **Sinh Code TypeScript:** Dựa trên kết quả quét, script tự động tạo ra file TypeScript chuẩn với các hằng số (`CHARACTERS`, `BACKGROUNDS`, `AUDIO_TRACKS`,...) và các kiểu dữ liệu tương ứng, sau đó ghi đè vào file `src/config/asset-registry.ts`.
4. **Tích hợp Lệnh npm:** Scripts `sync-assets` đã được xác nhận nằm trong `package.json` (`npm run sync-assets`), có thể dễ dàng gọi bất cứ lúc nào khi cần đồng bộ hoặc trước khi build.

## Lợi ích

- Dễ dàng mở rộng, chỉ cần kéo thả asset mới vào thư mục `public/assets/` rồi chạy script.
- Giảm thiểu rủi ro lỗi type hoặc thiếu sót do gõ tay.
- Giúp AI Director (Gemini) luồn có thông tin cập nhật, chính xác nhất về các resource đang có sẵn.

## Bước tiếp theo (Next Steps)

- Kiểm tra các stage còn lại của Giai đoạn 5 (ví dụ: Tích hợp hệ thống Text-To-Speech chuyên sâu cho AI Director, hay hoàn thiện quá trình Chunking ở Giai đoạn 5.4).
- Cần thông tin cụ thể từ bạn (người dùng) về task tiếp theo trong Roadmap.
