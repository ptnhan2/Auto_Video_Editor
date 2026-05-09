# Huong dan danh gia S1-S3 (Script Pipeline)

## Truoc khi danh gia
Worker se chay pipeline → sinh output. Ban can mo cac file sau:

| Output | File | Dung cu |
|--------|------|---------|
| Kich ban S1 | `data/output/s1_rewritten_script.json` | Notepad/VS Code |
| Nhan vat S2 | `data/output/s2_extracted_characters.json` | Notepad/VS Code |
| Storyboard S3 | `data/output/s3_storyboard.json` | Notepad/VS Code |

## Cach cham diem

Mo `docs/audit/quality-rubric.md` (da co san). Di xuong phan **S1, S2, S3**.
Moi tieu chi co barem 1-5. Ban doc output, roi cham diem.

### Vi du S1 - Dialogue Naturalness

1. Mo `s1_rewritten_script.json`
2. Doc hoi thoai
3. Hoi: "Nghe co tu nhien khong, hay nhu may doc sach?"
4. Cham: 1 (robot) / 3 (tam duoc) / 5 (rat tu nhien)
5. Ghi diem + 1-2 cau nhan xet

## Feedback cho Manager

Sau khi cham xong, paste feedback vao chat nay theo format:

```
#92 Audit S1-S3 - Ket qua danh gia

## S1 - Script Rewriter
| Tieu chi | Diem | Nhan xet |
|----------|------|----------|
| Dialogue Naturalness | ?/5 | ... |
| Content Retention | ?/5 | ... |
| Scene Description | ?/5 | ... |

## S2 - Extractor
| Tieu chi | Diem | Nhan xet |
|----------|------|----------|
| ... | ?/5 | ... |

## S3 - Storyboard Breaker
| Tieu chi | Diem | Nhan xet |
|----------|------|----------|
| ... | ?/5 | ... |

## Tong ket
- Diem trung binh: ?/5
- Tram nao yeu nhat?
- Can sua gi?
```

Manager se doc feedback → tao Issue cho Worker sua pipeline.
