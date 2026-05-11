# Hướng dẫn đánh giá S1-S3 (Script Pipeline)

## Cách lấy dữ liệu — Dùng DB Browser (SQLite)

Mở DB Browser, mở file `database.sqlite` (thư mục gốc dự án).
Vào tab **Execute SQL**, paste từng lệnh bên dưới, bấm Run (F5).

---

### 1. Xem INPUT GỐC (truyện đầu vào cho S1)

```sql
SELECT content FROM episodes WHERE script_content IS NOT NULL AND script_content != '';
```

### 2. Xem S1 OUTPUT (kịch bản đã chuyển thể)

```sql
SELECT script_content FROM episodes WHERE script_content IS NOT NULL AND script_content != '';
```

**Đối chiếu với rubric S1:** Đọc input gốc (lệnh 1) rồi đọc output (lệnh 2). So sánh: có giữ đúng nội dung không? Thoại có tự nhiên không? Mô tả hành động có đủ không?

### 3. Xem S2 OUTPUT (nhân vật đã trích xuất)

```sql
SELECT name, role, personality, appearance, voice_style FROM characters;
```

**Đối chiếu với rubric S2:** Đọc truyện gốc → đối chiếu danh sách nhân vật. Có thiếu ai không? Có bị trùng không? Mô tả có đa dạng không?

### 4. Xem S3 OUTPUT (storyboard)

```sql
SELECT storyboard_number, location, time, shot_type, action, dialogue, duration
FROM storyboards
ORDER BY storyboard_number;
```

**Đối chiếu với rubric S3:** Xem pacing — mỗi shot dài bao nhiêu giây? Có shot nào quá ngắn/dài không? Location/time có bị NULL không?

---

## Cách chấm điểm

1. Mở file `docs/audit/quality-rubric.md` (tab mới)
2. Cuộn đến phần S1, S2, S3. Mỗi trạm có 3 tiêu chí, mỗi tiêu chí có barem 1-5
3. Query DB (lệnh SQL trên) → so sánh với rubric → cho điểm
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
