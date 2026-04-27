# 📋 QUY TRÌNH LÀM VIỆC HÀNG NGÀY — Auto Video Editor

Tài liệu này hướng dẫn quy trình làm việc chuẩn xác để quản lý task, code và duy trì nhịp độ phát triển đều đặn cho dự án.

---

## 🔗 Các Link Quan Trọng

- **Bảng Kanban (Project Board):** [Auto Video Editor - Kanban](https://github.com/users/ptnhan2/projects/3)
- **Danh sách Issues:** [GitHub Issues](https://github.com/ptnhan2/Auto_Video_Editor/issues)
- **Bảng Audit Tổng Thể:** [docs/audit/project-audit.md](audit/project-audit.md)

---

## 🌅 BUỔI SÁNG — Mở Máy & Lập Kế Hoạch (15 phút)

1. **Mở Kanban Board.**
2. **Chọn task:** Nhìn vào cột **Todo**, chọn từ 1-3 task theo thứ tự ưu tiên (🔴 P0 → 🟡 P1 → 🟢 P2).
3. **Chuyển trạng thái:** Kéo các task vừa chọn sang cột **In Progress**.
4. **Khai báo:** Comment vào mỗi issue tương ứng trên GitHub:
   > `🎯 Hôm nay: [dự định làm gì] — YYYY-MM-DD`

---

## ⏱️ TRONG NGÀY — Làm Việc Tập Trung (Pomodoro 50/10)

- **1 session = 50 phút** code tập trung tuyệt đối.
- **10 phút** nghỉ giải lao.
- **Ghi log sau mỗi session:** Trực tiếp comment vào issue đang làm để tránh quên.
  > Ví dụ: `⏱️ Session 1 (50p): Đã đọc hiểu flow Station 5, xác định bug ở dòng 87.`

### 💻 Quy tắc Commit Code

Khi code xong 1 tính năng hoặc sửa xong 1 lỗi, hãy commit và **gắn tag số issue** để GitHub tự động liên kết:
Cú pháp: `loại(phạm-vi): mô tả ngắn (#số-issue)`
> Ví dụ: `git commit -m "fix(station-5): đổi camera_motion thành camera_concept (#32)"`

Các loại commit phổ biến:
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Viết/sửa tài liệu
- `refactor`: Tối ưu lại code (không đổi chức năng)

---

## 🌆 CUỐI NGÀY — Cập Nhật Tiến Độ (10 phút)

Trước khi đóng máy, hãy vào lại các issue đang làm và thực hiện 2 việc:

1. **Comment tổng kết:**
   > `📅 Cuối ngày YYYY-MM-DD:`
   > `✅ Đã làm: sửa bug camera_concept, test OK`
   > `🔄 Đang dở: debug embedding search`
   > `❌ Bị kẹt: chưa rõ cách thêm pacing_speed`
   > `🔜 Mai: tiếp tục debug embedding`

2. **Cập nhật Kanban:**
   - Kéo task đã xong sang cột **Done**.
   - Nếu chưa xong, giữ nguyên ở **In Progress**.

---

## 📊 CUỐI TUẦN — Retrospective (30 phút, thứ Sáu)

1. Mở Kanban Board, xem lại toàn bộ cột Done.
2. Đếm số task đã hoàn thành trong tuần.
3. Viết một báo cáo ngắn (Weekly Report) lưu vào [Issue #47](https://github.com/ptnhan2/Auto_Video_Editor/issues/47) (Issue đã được ghim) để theo dõi hành trình dài hạn:
   > `📅 Tuần [Ngày-Tháng]:`
   > `- Đã đóng: 3 issues (#32, #33, #43)`
   > `- Đang làm dở: #34 (40%)`
   > `- Điểm nghẽn: embedding search Station 5 còn chậm`
   > `- Tuần sau: hoàn thành G1 Video Compiler`