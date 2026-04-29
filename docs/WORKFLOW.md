# 📋 QUY TRÌNH LÀM VIỆC HÀNG NGÀY — Auto Video Editor

Tài liệu này hướng dẫn quy trình làm việc chuẩn xác để quản lý task, code (sử dụng Kilo Agent Manager) và duy trì nhịp độ phát triển đều đặn cho dự án.

---

## 🔗 Các Link Quan Trọng

- **Bảng Kanban (Project Board):** [Auto Video Editor - Kanban](https://github.com/users/ptnhan2/projects/3)
- **Danh sách Issues:** [GitHub Issues](https://github.com/ptnhan2/Auto_Video_Editor/issues)
- **Nhật ký dự án (Discussions):** [GitHub Discussions](https://github.com/ptnhan2/Auto_Video_Editor/discussions)
- **Bảng Audit Tổng Thể:** [docs/audit/project-audit.md](audit/project-audit.md)

---

## 🌅 BUỔI SÁNG — Mở Máy & Lập Kế Hoạch (15 phút)

1. **Mở Kanban Board.**
2. **Chọn task:** Chọn từ 1-3 task theo thứ tự ưu tiên (🔴 P0 → 🟡 P1 → 🟢 P2). Có thể chọn các task không phụ thuộc nhau để làm song song.
3. **Chuyển trạng thái:** Kéo task sang cột **In Progress**.
4. **Khai báo trên Issue:** Comment ngắn gọn vào từng issue:
   > `🎯 Hôm nay: [dự định làm gì] — YYYY-MM-DD`

---

## ⏱️ TRONG NGÀY — Triển khai Code & Kilo Agent Manager

Dự án sử dụng mô hình **Đa tác vụ song song (Parallel Mode)** thông qua Kilo Agent Manager để tối ưu tốc độ.

### 1. Khởi tạo Worktree (Môi trường ảo)
- Mở Agent Manager (`Ctrl+Shift+M`).
- Tạo worktree mới (`Ctrl+N` -> Advanced) cho từng Issue, ví dụ nhánh `feat/test-data`.
- **Prompt chuẩn cho Agent:** Luôn yêu cầu Agent sử dụng GitHub Tool để đọc nội dung Issue, đọc các file tài liệu nền tảng, và dặn dò tuân thủ luật trong `AGENTS.md`.

### 2. Nghiệm thu & Merge (Default Loop)
- Không bao giờ tin code 100%. Xem Diff (`Ctrl+D`) và mở Terminal riêng của worktree (`Ctrl+/`) để chạy test.
- Phản hồi cho Agent qua Chat để sửa lỗi.
- Khi đã hoàn hảo, bấm **Apply to local** để đưa code từ worktree về working tree của nhánh `main`.

### 3. Quy tắc Commit, Push & Dọn dẹp
Khi code đã áp dụng lên `main`:
1. **Commit gắn tag Issue:** `git commit -m "feat(scope): mô tả ngắn (#số-issue)"`
2. **Push `main`:** `git push origin main`
3. **Dọn dẹp:** Xóa worktree và branch ảo trong Agent Manager để trả lại tài nguyên cho máy tính.

### 4. Ghi Nhật ký Session (KHÔNG ghi log rác vào Issue)
- Cuối mỗi session làm việc (50 phút), vào **GitHub Discussions**.
- Mở Thread của ngày hôm nay (VD: `[Journal] 2026-04-28`).
- Comment tiến độ phiên làm việc theo ĐỊNH DẠNG CHECKLIST CHUYÊN NGHIỆP:
  > `### Phiên làm việc thứ X (YYYY-MM-DD) - [Tên chủ đề]`
  > `**Nội dung:** [Tóm tắt ngắn gọn mục tiêu phiên làm việc]`
  > `- [x] **[Task/Issue #]:** [Chi tiết những gì đã làm, kết quả đạt được]`
  > `- [x] **[Task/Issue #]:** [Chi tiết những gì đã làm, kết quả đạt được]`
  > `---`
  > `**Tiếp theo:** [Kế hoạch cho phiên tiếp theo]`
- *Lưu ý: Chỉ dùng Issue để bàn về logic kỹ thuật hoặc báo cáo hoàn thành task, không dùng để ghi nhật ký lắt nhắt.*

---

## 🌆 CUỐI NGÀY — Cập Nhật Tiến Độ (10 phút)

1. **Đóng Issue:** Nếu task đã xong, comment tổng kết kết quả vào Issue và Close nó.
2. **Cập nhật Journal:** Comment báo cáo cuối ngày vào Thread trong **GitHub Discussions**:
   > `📅 Cuối ngày YYYY-MM-DD:`
   > `✅ Đã làm: chốt thiết kế Trạm 5 (#41), Waddle Engine (#35)`
   > `🔜 Mai: Làm tiếp Trạm 5 (#7)`
3. **Cập nhật Kanban:** Kéo các task đã xong sang cột **Done**.

---

## 📊 CUỐI TUẦN — Retrospective (30 phút, thứ Sáu)

1. Đếm số task đã hoàn thành trên Kanban.
2. Viết Weekly Report tóm tắt và lưu vào comment của **Issue #47** (Issue được ghim chuyên dùng cho Retrospective tuần):
   > `📅 Tuần [Ngày-Tháng]: Đã đóng 5 issues (#35, #40...). Tuần sau tập trung làm Video Compiler.`
