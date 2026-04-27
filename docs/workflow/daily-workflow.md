# 🗓️ QUY TRÌNH LÀM VIỆC HÀNG NGÀY — Auto Video Editor

> Thiết kế riêng cho dự án này. Mỗi ngày chỉ cần mở GitHub là biết phải làm gì.
> Lưu trên GitHub: https://github.com/ptnhan2/Auto_Video_Editor/issues/47

---

## 🌅 BUỔI SÁNG — Mở Máy & Lập Kế Hoạch (15 phút)

### Bước 1: Mở Kanban Board
👉 https://github.com/users/ptnhan2/projects/3

### Bước 2: Review 3 cột
| Cột | Ý nghĩa |
|---|---|
| Todo | Task đã lên kế hoạch, sẵn sàng làm |
| In Progress | Task đang làm dở từ hôm trước |
| Done | Task đã hoàn thành |

### Bước 3: Chọn task hôm nay
- Nhìn cột **Todo**, chọn 1-3 task theo thứ tự ưu tiên: 🔴 P0 → 🟡 P1 → 🟢 P2
- Kéo task sang cột **In Progress**
- Comment vào mỗi task: `🎯 Hôm nay: [dự định làm gì] — YYYY-MM-DD`

---

## ⏱️ TRONG NGÀY — Làm Việc Tập Trung (Pomodoro 50/10)

### Quy tắc vàng
- **1 session = 50 phút** code tập trung tuyệt đối
- **10 phút** nghỉ giữa các session
- Sau mỗi session: **ghi log ngắn** vào issue

### Cách ghi log vào issue
Sau mỗi session, comment ngắn gọn:
```
⏱️ Session 1 (50 phút): Đã đọc hiểu flow Station 5, xác định bug ở dòng 87
⏱️ Session 2 (50 phút): Sửa tham số camera_motion → camera_concept, chạy test → OK
⏱️ Session 3 (50 phút): Đang debug lỗi embedding, chưa fix được → để mai
```

### Cách commit code
Mỗi lần commit phải tham chiếu đến issue:
```bash
git commit -m "fix(station-5): đổi camera_motion thành camera_concept (#32)"
```
Định dạng: `loại(phạm-vi): mô tả ngắn (#số-issue)`

| Loại commit | Khi nào dùng |
|---|---|
| `feat` | Tính năng mới |
| `fix` | Sửa bug |
| `refactor` | Tổ chức lại code |
| `chore` | Việc lặt vặt (dọn dẹp, config) |
| `docs` | Tài liệu |

---

## 🌆 CUỐI NGÀY — Cập Nhật Tiến Độ (10 phút)

### Việc cần làm
1. **Comment tổng kết** vào mỗi task đã làm:
```
📅 Cuối ngày YYYY-MM-DD:
✅ Đã làm: sửa bug camera_concept, test OK
🔄 Đang dở: debug embedding search
❌ Bị kẹt: chưa rõ cách thêm pacing_speed
🔜 Mai: tiếp tục debug embedding, bắt đầu C4
```

2. **Kéo task đã xong** sang cột **Done**
3. **Cập nhật trạng thái task** (nếu còn dở thì giữ In Progress)

---

## 📊 CUỐI TUẦN — Retrospective (30 phút, thứ Sáu)

1. Đếm số task đã đóng trong tuần
2. Xem lại log để viết **Weekly Report** ngắn:
```
📅 Tuần DD-DD/MM:
- Đã đóng: 3 issues (#32, #33, #43)
- Đang làm dở: #34 (40%), #35 (10%)
- Điểm nghẽn: embedding search Station 5 còn chậm
- Tuần sau: hoàn thành G1 Video Compiler
```
3. Post report vào issue #47

---

## 🏷️ QUY ƯỚC LABEL & PRIORITY

| Ký hiệu | Ý nghĩa | Thời hạn xử lý |
|---|---|---|
| 🔴 P0 | Critical — phải làm ngay, đang chặn các task khác | Trong 1-3 ngày |
| 🟡 P1 | Quan trọng — cần làm trong sprint này | Trong 1-2 tuần |
| 🟢 P2 | Nên làm — có thời gian thì làm | Trong 1 tháng |

---

## 📋 MẪU ISSUE CHUẨN

Mỗi issue nên có cấu trúc:
```markdown
## Mục tiêu
[Mô tả ngắn: cần đạt được gì]

## Context
[File liên quan, kiến thức nền]

## Tiêu chí hoàn thành (Definition of Done)
- [ ] Tiêu chí 1
- [ ] Tiêu chí 2
- [ ] Đã test và chạy OK

## Log hàng ngày
(xem comment bên dưới)
```

---

## 🔗 LINK QUAN TRỌNG

| Link | Mô tả |
|---|---|
| [Kanban Board](https://github.com/users/ptnhan2/projects/3) | Bảng theo dõi công việc |
| [Issues](https://github.com/ptnhan2/Auto_Video_Editor/issues) | Danh sách task |
| [Milestones](https://github.com/ptnhan2/Auto_Video_Editor/milestones) | Timeline & deadline |
| [Audit](docs/audit/project-audit.md) | Bức tranh toàn cảnh dự án |
| [Issue #47](https://github.com/ptnhan2/Auto_Video_Editor/issues/47) | Bản sao hướng dẫn này trên GitHub |

---

> 💡 **Mẹo:** Mỗi sáng mở 2 tab: Kanban Board + Issue đang làm. Dùng `#số-issue` khi commit để GitHub tự động link commit vào issue.
