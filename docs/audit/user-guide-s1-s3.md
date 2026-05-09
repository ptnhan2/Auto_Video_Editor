# Hướng dẫn đánh giá S1-S3 (Script Pipeline)

## Cách lấy dữ liệu — Query trực tiếp Database

Không cần Worker. Database là SQLite tại `database.sqlite` (thư mục gốc dự án).
Mở PowerShell trong thư mục dự án, paste lệnh để xem output từng trạm.

---

### 1. Xem INPUT GỐC (truyện đầu vào)
```
python -c "import sqlite3; conn=sqlite3.connect('database.sqlite'); row=conn.execute('SELECT content FROM episodes LIMIT 1').fetchone(); print(row[0] if row and row[0] else '[KHONG CO INPUT]')"
```

### 2. Xem S1 OUTPUT (kịch bản đã chuyển thể)
```
python -c "import sqlite3; conn=sqlite3.connect('database.sqlite'); row=conn.execute('SELECT script_content FROM episodes LIMIT 1').fetchone(); print(row[0] if row and row[0] else '[S1 CHUA CHAY]')"
```

**Đối chiếu với rubric S1:** Đọc input gốc rồi đọc S1 output. So sánh: có giữ đúng nội dung không? Thoại có tự nhiên không? Mô tả hành động có đủ không?

### 3. Xem S2 OUTPUT (nhân vật đã trích xuất)
```
python -c "import sqlite3; conn=sqlite3.connect('database.sqlite'); [print(f'Tên: {r[0]} | Vai: {r[1]} | Tính cách: {r[2][:80] if r[2] else None}... | Ngoại hình: {r[3][:80] if r[3] else None}...') for r in conn.execute('SELECT name, role, personality, appearance FROM characters LIMIT 10')]"
```

**Đối chiếu với rubric S2:** Đọc truyện gốc → đối chiếu danh sách nhân vật. Có thiếu ai không? Có bị trùng không? Mô tả có đa dạng không?

### 4. Xem S3 OUTPUT (storyboard)
```
python -c "import sqlite3; conn=sqlite3.connect('database.sqlite'); [print(f'Shot #{r[0]} | {r[1]} | {r[2]} | Hành động: {r[3][:50] if r[3] else None}... | {r[4]}s') for r in conn.execute('SELECT storyboard_number, location, time, action, duration FROM storyboards ORDER BY storyboard_number LIMIT 38')]"
```

**Đối chiếu với rubric S3:** Xem pacing — mỗi shot dài bao nhiêu giây? Có shot nào quá ngắn/dài không? Location/time có bị None không?

---

## Cách chấm điểm

1. Mở file `docs/audit/quality-rubric.md` (tab mới)
2. Cuộn đến phần S1, S2, S3. Mỗi trạm có 3 tiêu chí, mỗi tiêu chí có barem 1-5
3. Query DB (lệnh trên) → so sánh với rubric → cho điểm
4. Ghi điểm + 1-2 câu nhận xét vào bảng bên dưới

---

## Feedback cho Manager

Sau khi chấm xong, paste bảng này vào chat:

```
## S1 - Script Rewriter
| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Hội thoại tự nhiên | ?/5 | ... |
| Giữ thông tin gốc | ?/5 | ... |
| Mô tả hành động & bối cảnh | ?/5 | ... |

## S2 - Extractor
| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Định danh nhân vật (dedup) | ?/5 | ... |
| Đa dạng diện mạo | ?/5 | ... |
| Nhất quán đặc điểm | ?/5 | ... |

## S3 - Storyboard Breaker
| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Nhịp độ cắt cảnh (pacing) | ?/5 | ... |
| Liên tục hành động (continuity) | ?/5 | ... |
| Lựa chọn cỡ cảnh (shot type) | ?/5 | ... |

## Tổng kết
- Điểm trung bình: ?/5
- Trạm nào yếu nhất?
- Cần sửa gì?
```

Manager sẽ đọc feedback → tạo Issue cho Worker sửa pipeline.
