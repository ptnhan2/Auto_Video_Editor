# Hướng dẫn đánh giá S1-S3 (Script Pipeline)

## Bước 1: Chạy Pipeline

Mở PowerShell trong thư mục gốc dự án. Chạy từng lệnh, **đợi xong rồi mới chạy lệnh tiếp**.

### Seed dữ liệu (nếu chưa có)
```
python scripts/seed_edge_cases.py
```

### Chạy S1 — Script Rewriter (3 episode)
```
python src/pipeline/station_1_script_rewriter.py 019de35281daadc5bb29ba2c2bf0d8d3
python src/pipeline/station_1_script_rewriter.py 019de35281f0bc98b6f2d64a1dcf5b8c
python src/pipeline/station_1_script_rewriter.py 019de3528208cfb31a972d714279e22a
```

### Chạy S2 — Extractor (3 episode)
```
python src/pipeline/station_2_extractor.py 019de35281daadc5bb29ba2c2bf0d8d3
python src/pipeline/station_2_extractor.py 019de35281f0bc98b6f2d64a1dcf5b8c
python src/pipeline/station_2_extractor.py 019de3528208cfb31a972d714279e22a
```

### Chạy S3 — Storyboard Breaker (3 episode)
```
python src/pipeline/station_3_storyboard_breaker.py 019de35281daadc5bb29ba2c2bf0d8d3
python src/pipeline/station_3_storyboard_breaker.py 019de35281f0bc98b6f2d64a1dcf5b8c
python src/pipeline/station_3_storyboard_breaker.py 019de3528208cfb31a972d714279e22a
```

---

## Bước 2: Audit — Dùng DB Browser

Mở DB Browser, mở file `database.sqlite`. Vào tab **Execute SQL**, paste từng lệnh.

### 1. Xem INPUT GỐC (3 episode)

```sql
SELECT id, title, content FROM episodes
WHERE id IN (
  '019de35281daadc5bb29ba2c2bf0d8d3',
  '019de35281f0bc98b6f2d64a1dcf5b8c',
  '019de3528208cfb31a972d714279e22a'
);
```

### 2. Xem S1 OUTPUT (kịch bản đã chuyển thể)

```sql
SELECT id, title, script_content FROM episodes
WHERE id IN (
  '019de35281daadc5bb29ba2c2bf0d8d3',
  '019de35281f0bc98b6f2d64a1dcf5b8c',
  '019de3528208cfb31a972d714279e22a'
);
```

**Đối chiếu rubric S1:** Đọc input (lệnh 1) rồi đọc output (lệnh 2) cho cùng 1 episode. So sánh: giữ đúng nội dung? Thoại tự nhiên? Mô tả hành động đủ?

### 3. Xem S2 OUTPUT (nhân vật đã trích xuất)

```sql
SELECT c.name, c.role, c.personality, c.appearance, c.voice_style
FROM characters c
JOIN episode_characters ec ON c.id = ec.character_id
WHERE ec.episode_id IN (
  '019de35281daadc5bb29ba2c2bf0d8d3',
  '019de35281f0bc98b6f2d64a1dcf5b8c',
  '019de3528208cfb31a972d714279e22a'
);
```

**Đối chiếu rubric S2:** Đọc truyện gốc → đối chiếu danh sách nhân vật từng episode. Thiếu ai? Trùng ai? Mô tả có đa dạng?

### 4. Xem S3 OUTPUT (storyboard)

```sql
SELECT episode_id, storyboard_number, location, time, shot_type, action, dialogue, duration
FROM storyboards
WHERE episode_id IN (
  '019de35281daadc5bb29ba2c2bf0d8d3',
  '019de35281f0bc98b6f2d64a1dcf5b8c',
  '019de3528208cfb31a972d714279e22a'
)
ORDER BY episode_id, storyboard_number;
```

**Đối chiếu rubric S3:** Pacing hợp lý? Location/time có NULL? Shot liên tục?

---

## Bước 3: Chấm điểm

Mở `docs/audit/quality-rubric.md`. Chấm riêng từng episode (TC1, TC2, TC3).

### Feedback cho Manager

```
## S1 - Script Rewriter
| Tiêu chí | TC1 | TC2 | TC3 | Nhận xét |
|----------|-----|-----|-----|----------|
| Hội thoại tự nhiên | ?/5 | ?/5 | ?/5 | ... |
| Giữ thông tin gốc | ?/5 | ?/5 | ?/5 | ... |
| Mô tả hành động & bối cảnh | ?/5 | ?/5 | ?/5 | ... |

## S2 - Extractor
| Tiêu chí | TC1 | TC2 | TC3 | Nhận xét |
|----------|-----|-----|-----|----------|
| Định danh nhân vật (dedup) | ?/5 | ?/5 | ?/5 | ... |
| Đa dạng diện mạo | ?/5 | ?/5 | ?/5 | ... |
| Nhất quán đặc điểm | ?/5 | ?/5 | ?/5 | ... |

## S3 - Storyboard Breaker
| Tiêu chí | TC1 | TC2 | TC3 | Nhận xét |
|----------|-----|-----|-----|----------|
| Nhịp độ cắt cảnh (pacing) | ?/5 | ?/5 | ?/5 | ... |
| Liên tục hành động (continuity) | ?/5 | ?/5 | ?/5 | ... |
| Lựa chọn cỡ cảnh (shot type) | ?/5 | ?/5 | ?/5 | ... |

## Tổng kết
- Điểm TB: ?/5
- Trạm yếu nhất: ?
- Cần sửa: ?
```
