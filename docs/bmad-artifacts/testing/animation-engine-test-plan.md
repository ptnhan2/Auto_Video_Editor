# Hướng dẫn Kiểm thử: Animation Engine (MVP)

Tài liệu này cung cấp **Danh sách Kiểm tra (QA Checklist)** và **Tiêu chí Đánh giá (Test Criteria)** toàn diện cho hệ thống Animation Engine (MVP). Vì AI không thể xem và đánh giá trực tiếp video sau khi render, người dùng cần đóng vai trò là QA chính để thực hiện các bước kiểm tra trực quan.

---

## 1. Kiểm tra Tự động (Automated Checks)
Các bước kiểm tra cơ bản về mặt mã nguồn, có thể tự động hóa hoặc chạy thông qua command line để đảm bảo luồng build:

- [ ] **Khả năng biên dịch (Code Compile):** Mã nguồn của animation engine có biên dịch thành công không? (Chạy lệnh `tsc` hoặc build script mà không có lỗi `TypeScript`).
- [ ] **Dữ liệu cấu hình (Config Data):** File `pivots.json` có tồn tại và đúng định dạng cho nhân vật mục tiêu không?

---

## 2. Kiểm tra Trực quan (Manual Visual Checks)
**Trách nhiệm của người dùng:** Render video chạy thử hoặc xem bản preview, sau đó đánh giá các yếu tố sau bằng mắt thường:

- [ ] **Độ chính xác của trục xoay (Pivot Accuracy):** Các chi (tay, chân, đầu) có xoay quanh đúng điểm khớp nối không? (Có bị "trôi" hay trượt ra khỏi vị trí gắn kết khi xoay không?).
- [ ] **Hệ thống Phân cấp (Hierarchy):** Các bộ phận con có di chuyển theo bộ phận mẹ một cách hợp lý không? (Ví dụ: Cẳng chân (calf) phải tuân theo sự di chuyển và xoay của đùi (thigh)).
- [ ] **Thứ tự lớp (Z-Index):** Các bộ phận có hiển thị đúng thứ tự trước/sau không? (Ví dụ: Cánh tay phải (Right Arm) có nằm *trên* phần Thân (Body) không? Chân trái có nằm *sau* Thân không?).
- [ ] **Độ mượt mà (Smoothness):** Hoạt ảnh diễn ra có mượt mà, tốc độ khung hình (FPS) ổn định không, hay chuyển động bị giật cục (jerky)?
- [ ] **Tính liền mạch của Vòng lặp (Looping):** Khung hình cuối cùng có khớp hoàn hảo với khung hình đầu tiên để tạo thành một vòng lặp (loop) liên tục không? (Thường dùng cho animation như đi bộ (walk cycle)).

---

## 3. Hướng dẫn Khắc phục sự cố (Troubleshooting Guide)
Khi bạn phát hiện hoạt ảnh bị lỗi trong quá trình kiểm tra trực quan, dưới đây là các bước khắc phục phổ biến:

*   **Hiện tượng: Bộ phận (chi) bay lung tung hoặc rời khỏi cơ thể.**
    *   *Nguyên nhân:* Tọa độ tâm xoay (`transform-origin`) hoặc điểm nối (`anchor`/`pivot`) bị sai; hoặc hệ thống phân cấp (cha-con) bị hỏng.
    *   *Cách khắc phục:* Mở file `pivots.json` hoặc cấu hình nhân vật. Kiểm tra lại thông số tọa độ `x`, `y` của khớp bị sai. Kiểm tra xem điểm gắn kết của thành phần con có khớp với cấu trúc bộ phận cha hay không.

*   **Hiện tượng: Bộ phận xoay ngược hướng, vặn vẹo sai quy luật.**
    *   *Nguyên nhân:* Giá trị của góc xoay (rotation angle) trong keyframe bị đảo ngược dấu (âm thành dương, dương thành âm).
    *   *Cách khắc phục:* Xác định thư mục hoạt ảnh (ví dụ `walk_cycle.json`), tìm mảng `keyframes` của bộ phận lỗi và đổi dấu của góc xoay (ví dụ: chuyển `15` thành `-15` hoặc ngược lại).

*   **Hiện tượng: Cẳng chân tách ra khỏi đùi khi chân di chuyển.**
    *   *Nguyên nhân:* Khớp gối chưa được chọn làm trục xoay của cẳng chân.
    *   *Cách khắc phục:* Chỉnh sửa `transform-origin` của lớp cẳng chân (calf) xuống khu vực đầu gối.
