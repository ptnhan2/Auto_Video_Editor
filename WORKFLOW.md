# 📋 QUY TRÌNH LÀM VIỆC HÀNG NGÀY — Auto Video Editor

> 🚨 **CẢNH BÁO CHO AI AGENT: XÁC ĐỊNH RÕ BẠN ĐANG LÀ AI TRƯỚC KHI ĐỌC TIẾP!**
> Nếu bạn nhầm lẫn vai trò, toàn bộ dự án sẽ đổ vỡ. Hãy tự hỏi: User vừa giao cho bạn lệnh gì?
> 
> 👑 **BẠN LÀ MANAGER NẾU:** User (người thật) yêu cầu bạn tổng hợp tiến độ, phân tích các issue, sinh prompt cho agent khác, review Pull Request, merge code, hoặc ghi Journal. (Ở vai trò này, **TUYỆT ĐỐI KHÔNG TỰ TAY VIẾT CODE SỬA APP**).
> 
> 👷 **BẠN LÀ WORKER NẾU:** Bạn nhận được một prompt bắt đầu bằng *"Chào Kilo Agent, bạn đang khởi động trong một git worktree mới..."* và được giao đích danh 1 số Issue (vd: Issue #57) để viết code và tạo PR. (Ở vai trò này, **TUYỆT ĐỐI KHÔNG ĐI REVIEW PR CỦA NGƯỜI KHÁC HAY QUẢN LÝ DỰ ÁN**, việc của bạn là code và pass Acceptance Criteria).

---

## 🔗 Các Link Quan Trọng

- **Bảng Kanban (Project Board):** [Auto Video Editor - Kanban](https://github.com/users/ptnhan2/projects/3)
- **Danh sách Issues:** [GitHub Issues](https://github.com/ptnhan2/Auto_Video_Editor/issues) ← **Nguồn chân lý duy nhất để lập kế hoạch công việc**
- **Nhật ký dự án (Discussions):** [GitHub Discussions](https://github.com/ptnhan2/Auto_Video_Editor/discussions)
- **Bảng Audit Tổng Thể:** [docs/audit/project-audit.md](audit/project-audit.md) *(chỉ là ảnh chụp lịch sử, không dùng để lập kế hoạch)*

---

## 🏗️ Mô Hình Hai Tầng (Manager-Worker)

Dự án vận hành theo mô hình phân tách rõ ràng giữa **một phiên Manager** và **nhiều phiên Worker** chạy song song trên các git worktree riêng biệt.

```
┌─────────────────────────────────────────────────────┐
│  MANAGER SESSION (Working Tree chính — main branch) │
│  • Đọc Issues, chọn task ưu tiên                    │
│  • Sinh prompt chi tiết cho Worker Agent             │
│  • Review PR, feedback, merge vào main               │
│  • Ghi Journal, cập nhật Kanban                      │
│  • KHÔNG tự tay viết code                            │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐
    │ WORKTREE #1 │ │ WORKTREE #2│ │ WORKTREE #3│ ...
    │ Issue #57   │ │ Issue #58  │ │ Issue #59  │
    │ Worker Agent│ │ Worker Agt.│ │ Worker Agt.│
    │ Đọc issue   │ │ Đọc issue  │ │ Đọc issue  │
    │ Code → PR   │ │ Code → PR  │ │ Code → PR  │
    └─────────────┘ └────────────┘ └────────────┘
```

### 🔷 Vai trò Manager (Phiên làm việc chính — 1 phiên duy nhất)

Manager không trực tiếp viết code. Nhiệm vụ của Manager là **điều phối**:

| Nhiệm vụ | Mô tả |
|----------|-------|
| **Chọn task** | Đọc Kanban Board và GitHub Issues, chọn task ưu tiên cao nhất, phân tích xem task nào có thể chạy song song |
| **Sinh Prompt** | Viết prompt chuẩn hóa (có bối cảnh dự án, quy tắc, link issue) cho Worker Agent |
| **Review PR** | Đọc diff của PR do Worker tạo, kiểm tra code có đúng AC, đúng cấu trúc thư mục không |
| **Merge PR** | Duyệt và merge PR vào `main`, đóng issue tương ứng |
| **Journal** | Ghi nhật ký tiến độ vào GitHub Discussions theo định dạng checklist |
| **Cập nhật Kanban** | Kéo task trên Kanban Board theo trạng thái thực tế |

### 🔶 Vai trò Worker (Phiên làm việc trên Worktree — nhiều phiên song song)

Mỗi Worker là một phiên Kilo Agent chạy trong **git worktree riêng biệt**, được giao **đúng 1 Issue** để xử lý toàn bộ vòng đời:

1. **Nhận Prompt** từ Manager (chứa số Issue, bối cảnh dự án, quy tắc)
2. **Nạp ngữ cảnh**: Đọc `AGENTS.md`, `WORKFLOW.md`, và nội dung Issue từ `gh issue view`
3. **Lập kế hoạch**: Trình bày plan ngắn gọn cho Manager duyệt
4. **Triển khai**: Viết code, chạy test, verify
5. **Tạo PR**: Commit và tạo Pull Request lên GitHub
6. **Báo cáo**: Trả về tóm tắt kết quả cho Manager (dạng checklist). **Không tự ý ghi Journal, không tạo Discussion, không format theo mẫu Journal.**

---

## 🌅 BUỔI SÁNG — Mở Máy & Lập Kế Hoạch (Manager, 15 phút)

1. **Mở Kanban Board** và **Danh sách GitHub Issues** — đây là nguồn chân lý duy nhất.
2. **Chọn task:** Chọn các task theo thứ tự ưu tiên (🔴 P0 → 🟡 P1 → 🟢 P2). Ưu tiên các task không phụ thuộc nhau để chạy song song.
3. **Chuyển trạng thái:** Kéo task sang cột **In Progress**.
4. **Sinh Prompt cho Worker:** Với mỗi task được chọn, dùng Manager sinh prompt Worker chuẩn (xem mẫu bên dưới).

---

## ⏱️ TRONG NGÀY — Vòng Lặp Manager-Worker

### 1. Manager sinh Prompt cho Worker

Sử dụng template dưới đây, điền số Issue, tên worktree, tên branch và gửi cho Worker Agent:

**Quy tắc đặt tên bắt buộc (Manager phải tuân thủ khi tạo):**
- **Branch:** `<type>/<issue_id>-<short-desc>` (VD: `fix/68-s1-data-source`, `feat/71-deepseek-fallback`)
- **Worktree:** `../worktrees/i<issue_id>-<short-desc>` (VD: `../worktrees/i68-fix-s1`, `../worktrees/i71-deepseek`)

<details>
<summary><b>🛠 Template Prompt Worker (bấm để mở)</b></summary>

```text
Chào Kilo Agent, bạn đang khởi động trong một git worktree mới. Nhánh làm việc đã được tôi checkout sẵn, nhưng bạn không có bất kỳ ngữ cảnh nào về dự án từ các phiên trước. Hãy đọc kỹ mệnh lệnh dưới đây để nạp ngữ cảnh và bắt đầu nhiệm vụ.

**Thông tin môi trường làm việc:**
- **Worktree:** `[TÊN_WORKTREE]`
- **Branch:** `[TÊN_BRANCH]`

# 1. BỐI CẢNH DỰ ÁN (AUTO VIDEO EDITOR)
Dự án là hệ thống AI Video Editor biến kịch bản thô thành video MP4.
- Backend (Python): Xử lý data qua các trạm S0→S8, gọi LLM/TTS, lưu SQLite, xuất JSON.
- Frontend (Remotion/React): Đọc JSON và render video MP4.
Dự án đã đạt MVP (Text-to-Video thành công). Đang ở giai đoạn QA và xây dựng tool quản trị.

# 2. NHIỆM VỤ
Bạn được giao xử lý **Issue #[SỐ_ISSUE]**.

# 3. NHỮNG VIỆC BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM

| 🚫 CẤM | Hậu quả nếu vi phạm |
|--------|-------------------|
| **Bỏ qua Bước 3 — code ngay mà không lập plan chờ Manager duyệt** | Làm sai yêu cầu, phải code lại từ đầu. Manager sẽ từ chối toàn bộ PR. |
| **Viết Journal hoặc tạo GitHub Discussion** | Manager là người duy nhất ghi Journal. Bạn chỉ báo cáo kết quả checklist cho Manager trong chat. |
| **Dùng bash/PowerShell để viết/sửa code** | Dùng tool `write` và `edit`. Nếu không có các tool này, dừng lại và báo Manager ngay. |
| **Sửa file có sẵn của dự án mà không nêu trong plan** | Chỉ sửa file đã được Manager duyệt trong plan. |

# 4. QUY TRÌNH BẮT BUỘC

**Bước 1 — Nạp quy tắc nền tảng:**
- Đọc `WORKFLOW.md` và `AGENTS.md` (thư mục root).
- TUÂN THỦ "THE ROOT IS LAVA": Không tạo file ở root. Code logic phải nằm trong `/src/services`, `/src/pipeline`, hoặc `/scripts`.

**Bước 2 — Nạp yêu cầu từ Issue:**
- Chạy `gh issue view [SỐ_ISSUE]` (và `--comments` nếu cần) để đọc mô tả, bối cảnh, và **Acceptance Criteria (AC)**.

**Bước 3 — Phân tích & Lập kế hoạch:**
- Dùng `glob`/`grep` tìm file liên quan.
- Trình bày plan ngắn gọn: tạo/sửa file gì, ở đâu, cách pass AC.

> ⛔ **DỪNG LẠI TẠI ĐÂY. KHÔNG ĐƯỢC LÀM GÌ THÊM.**
> Bạn PHẢI chờ Manager trả lời "Approved" hoặc "Duyệt" trước khi chuyển sang Bước 4.
> Nếu bạn bắt đầu `mkdir`, `write`, `edit` trước khi được duyệt → bạn đã vi phạm quy trình.

**Bước 4 — Triển khai & Xác thực (CHỈ sau khi Manager duyệt plan):**
- Viết code. Chạy test/build (`npx tsc --noEmit`, `python script.py`, `npm run build`) để xác nhận không crash, đạt AC.
- **Không tự review code.** Bạn viết code xong thì chuyển sang Bước 5.

**Bước 5 — Tạo PR & Báo cáo:**
- Commit. Tạo PR: `gh pr create --title "feat: Resolve Issue #[SỐ_ISSUE] - [mô tả ngắn]" --body "Đóng #[SỐ_ISSUE]. ..."`
- **Báo cáo kết quả dạng checklist NGẮN GỌN trong chat** cho Manager. KHÔNG dùng format Journal (### Phiên làm việc...), KHÔNG tạo Discussion, KHÔNG ghi "Tiếp theo:". Chỉ liệt kê: file nào đã tạo/sửa, test result, PR URL.
- Việc của bạn kết thúc tại đây. Manager sẽ review PR, merge, ghi Journal.

Hãy bắt đầu ngay Bước 1 và Bước 2.
```
</details>

### 2. Worker lập kế hoạch → Manager duyệt

Worker sau khi đọc issue sẽ đề xuất plan. Manager đọc plan và:
- **Duyệt** nếu plan đúng hướng, khớp AC.
- **Sửa** nếu Worker hiểu sai scope, thiếu file cần đụng, hoặc quên rule trong AGENTS.md.

### 3. Worker triển khai → Manager Review PR

Khi Worker tạo PR xong:
1. Manager mở PR trên GitHub, đọc diff.
2. Kiểm tra: Code có đúng cấu trúc thư mục không? Có pass AC không? Có vi phạm "The Root is Lava" hay "Frozen Blocks" không?
3. Nếu lỗi: comment feedback vào PR, yêu cầu Worker sửa.
4. Nếu đạt: **Merge PR vào `main`**.

### 4. Sau Merge — Checklist Bắt Buộc Cho Manager

Manager phải thực hiện **đầy đủ và đúng thứ tự** các bước sau cho mỗi PR được merge. Đây là trách nhiệm của Manager, không phải của User.

> 🛠️ **Nguyên tắc chọn công cụ:** Ưu tiên dùng GitHub MCP tools trước. Chỉ fallback sang `gh` CLI khi MCP không có tool tương ứng.

| # | Bước | Công cụ |
|---|------|---------|
| 1 | Merge PR trên GitHub | **MCP:** `github_merge_pull_request` |
| 2 | Pull `main` mới nhất về local | **Bash:** `git checkout main && git pull origin main` |
| 3 | Xác nhận Issue đã auto-close. Nếu chưa, đóng thủ công | **MCP:** `github_issue_write` với `state: closed` |
| 4 | Kéo Issue sang cột **Done** trên Kanban | **gh CLI:** `gh project item-edit` (MCP không hỗ trợ Projects V2 — xem Phụ lục A) |
| 5 | **Hỏi User:** "Đây là session thứ mấy hôm nay?" | Chat |
| 6 | Ghi Journal vào GitHub Discussions | **gh CLI:** `gh api graphql` (MCP không hỗ trợ Discussions) |

> ⚠️ **Lưu ý:** Việc xóa worktree ở local là do **User tự làm** trong Kilo Agent Manager (`Ctrl+Shift+M`). Manager không được tự ý xóa worktree.
>
> **Có nên xóa worktree sau khi merge?** → **Có.** Commits đã nằm trong `main`, branch đã có trên GitHub remote. Xóa worktree không mất dữ liệu — git history vẫn còn nguyên, và bạn luôn có thể vào `https://github.com/ptnhan2/Auto_Video_Editor/branches` để xem branch cũ. Nên xóa để tránh lộn xộn (hiện 10+ worktree và đang tăng).

### 5. Ghi Nhật ký (Journal) — Manager làm

Mỗi lần merge PR xong (hoặc kết thúc 1 phiên 50 phút), Manager phải ghi ngay vào Journal, không để dồn cuối ngày.

Manager vào **GitHub Discussions**, tìm thread `[Journal] YYYY-MM-DD`. Nếu chưa có, tạo mới. Comment theo định dạng:

```
### Phiên làm việc thứ [X] (YYYY-MM-DD) - [Tên chủ đề]

**Nội dung:** [Tóm tắt ngắn gọn mục tiêu phiên]
- [x] **Issue #XX:** [Chi tiết đã làm, file tạo/sửa]. PR #YY (đã merge).
- [x] **Issue #ZZ:** [Chi tiết đã làm]. PR #AA (đã merge).
- [x] **Quy trình:** [nếu có cập nhật WORKFLOW.md, config...]
---
**Tiếp theo:** [Kế hoạch phiên tiếp theo]
```

---

## 🌆 CUỐI NGÀY — Tổng Kết (Manager, 10 phút)

1. **Kiểm tra Kanban** (Manager làm): Mở [Kanban Board](https://github.com/users/ptnhan2/projects/3), đếm task Done hôm nay, xác nhận các task đã sang đúng cột Done.
2. **Ghi Journal cuối ngày** (Manager làm) vào GitHub Discussions:
   ```
   📅 Cuối ngày YYYY-MM-DD:
   ✅ Đã merge: #57 (PR #62), #59 (PR #64)
   🔄 Đang chạy: #58 (Worker đang code), #60 (chờ review)
   🔜 Mai: Tiếp tục #58, #60. Bắt đầu #61.
   ```

---

## 📊 CUỐI TUẦN — Retrospective (Manager, 30 phút, thứ Sáu)

1. Đếm số task Done trong tuần trên Kanban.
2. Vào GitHub Discussions, thread **"📊 BÁO CÁO TỔNG KẾT TUẦN"**.
3. Viết Weekly Report:
   ```
   📅 Tuần [Ngày-Tháng]:
   - ✅ Đã đóng: #57, #58, #59 (3 issues)
   - 🔄 Đang làm dở: #60 (đợi review)
   - ⚠️ Trở ngại: [nếu có]
   - 🔜 Tuần sau: Hoàn thành #60, #61. Bắt đầu Epic mới.
   ```

---

## 🚫 Các Quy Tắc Cấm

| ❌ Không được làm | ✅ Làm thay vào đó |
|-------------------|-------------------|
| Manager tự tay viết code | Sinh prompt, giao cho Worker |
| Worker đi làm việc của Manager | Tập trung pass đúng issue được giao |
| Dùng file audit cũ để lập kế hoạch | Chỉ dùng GitHub Issues đang mở |
| Ghi log lắt nhắt vào Issue | Ghi Journal vào GitHub Discussions |
| Worker bỏ qua bước lập plan | Luôn trình plan cho Manager duyệt trước khi code |
| Worker quên đọc AGENTS.md | Luôn đọc AGENTS.md và WORKFLOW.md ở Bước 1 |
| Merge PR mà không review diff | Luôn đọc diff, kiểm tra cấu trúc thư mục trước khi merge |
| **Dùng bash/PowerShell để viết hoặc sửa code** | **Dùng tool `write` và `edit`. Nếu không có các tool này, báo ngay cho Manager: "Tôi đang ở mode X, không có write/edit tool. Hãy chuyển tôi sang mode có edit tool để tôi sửa code."** |
| Lặng lẽ chịu đựng khi thiếu tool | Chủ động yêu cầu Manager chuyển mode hoặc tự chuyển mode nếu được phép |
| **Worker tự ý ghi Journal hoặc tạo Discussion** | **Chỉ báo cáo kết quả dạng checklist cho Manager. Manager là người duy nhất ghi Journal vào GitHub Discussions.** |
| Worker ghi sai session number hoặc format Journal | Không động vào Journal — đó không phải việc của Worker |

---

## 🛠️ Quy Tắc Dùng Tool Cho Worker

Worker **chỉ được phép dùng một bộ công cụ cụ thể** để thao tác với code:

| Mục đích | Tool phải dùng | TUYỆT ĐỐI KHÔNG dùng |
|----------|---------------|---------------------|
| Tạo file mới | `write` | bash (echo, cat, Out-File, Set-Content...) |
| Sửa file có sẵn | `edit` | bash (sed, awk, -replace, regex...) |
| Đọc file | `read` | bash (cat, head, tail, Get-Content...) |
| Tìm file | `glob` | bash (find, ls, Get-ChildItem...) |
| Tìm nội dung | `grep` | bash (grep, rg, Select-String...) |

**Nếu bạn không thấy `write` hoặc `edit` trong danh sách tool khả dụng → bạn đang ở sai mode.** Hãy dừng lại và yêu cầu Manager chuyển mode. Không được phép "chữa cháy" bằng cách viết code qua PowerShell — việc này luôn gây ra lỗi escape, hỏng syntax, và mất thời gian gấp 10 lần.

---

## 📎 Phụ lục A — Cách Kéo Kanban (Cho Manager)

### A.1 Tìm Project ID
```bash
gh api graphql -F login="ptnhan2" -F num=3 -f query='query($login: String!, $num: Int!) { user(login: $login) { projectV2(number: $num) { id } } }' --jq '.data.user.projectV2.id'
```
→ Kết quả: `PVT_kwHODDVJA84BV1Oa`

### A.2 Tìm Item ID của một Issue trong Project
```bash
gh api graphql -F owner="ptnhan2" -F name="Auto_Video_Editor" -F num=[SỐ_ISSUE] -f query='query($owner: String!, $name: String!, $num: Int!) { repository(owner: $owner, name: $name) { issue(number: $num) { projectItems(first: 5) { nodes { id } } } } }' --jq '.data.repository.issue.projectItems.nodes[0].id'
```
→ Kết quả: `PVTI_lAHODDVJA84BV1OazgrhjC0`

### A.3 Kéo Item sang Done
```bash
gh project item-edit \
  --project-id PVT_kwHODDVJA84BV1Oa \
  --id [ITEM_ID] \
  --field-id PVTSSF_lAHODDVJA84BV1OazhROIAU \
  --single-select-option-id 98236657
```
(Giá trị Status options: `f75ad846` = Todo, `47fc9ee4` = In Progress, `98236657` = Done)

### A.4 Đóng Issue thủ công (nếu PR không auto-close)
```bash
gh issue close [SỐ_ISSUE] --reason completed
```