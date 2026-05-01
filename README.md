# 🎬 Auto Video Editor — AI-Powered Video Production Pipeline

> **🌍 Language:** [Tiếng Việt bên dưới ↓](#tiếng-việt)

**Auto Video Editor** turns raw scripts into fully rendered MP4 videos using an AI-driven multi-station pipeline. From script rewriting to voice generation, visual directing, sound design, and final video rendering — the entire process is automated end-to-end.

The system is designed for AI agents (LLM Function Calling) to orchestrate, with a human-in-the-loop UI for quality control.

---

## 🏗️ Architecture (Station Pipeline)

```
S0: Indexer  →  S1: Script Rewriter  →  S2: Extractor  →  S3: Storyboard Breaker
    ↓
S4: Audio (TTS)  →  S5: Visual Director  →  S6: Sound & VFX  →  S7: Video Compiler
    ↓
S8: Remotion Render → 🎥 MP4 Output
```

- **Backend (Python):** SQLite + SQLAlchemy, AI-driven stations S0–S7
- **Frontend (Remotion/React):** Renders JSON output from S7 into video
- **UI Tools (Next.js):** Human-in-the-loop editors at `/tools`
- **CI/CD:** GitHub Actions — Python lint (`ruff`) + TypeScript check (`tsc`)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Pipeline | Python 3.10+, SQLAlchemy, SQLite |
| AI & LLM | Gemini (Google), DeepSeek, ElevenLabs (TTS/SFX) |
| Video Rendering | Remotion 4.0, React 19, TypeScript |
| UI Tools | Next.js 16, Tailwind CSS, Zustand |
| Testing | Vitest (frontend), ruff (Python lint), tsc (type check) |
| CI/CD | GitHub Actions |

---

## 📋 Prerequisites

- **Python 3.10+** (with `pip`)
- **Node.js 20+** (with `npm`)
- **Git**
- A **Gemini API key** ([get one here](https://aistudio.google.com/apikey))

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ptnhan2/Auto_Video_Editor.git
cd Auto_Video_Editor
```

**Python dependencies:**
```bash
pip install sqlalchemy
```

**Node.js dependencies:**
```bash
npm install
```

### 2. Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key for AI generation |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (default) |
| `DEEPSEEK_API_KEY` | (Optional) DeepSeek fallback LLM |

### 3. Seed Test Data

```bash
# Standard test data (1 drama, 1 episode, 2 characters)
python scripts/seed_test_data.py

# Edge-case test suites (optional — stress-test pipeline)
python scripts/seed_edge_cases.py
```

### 4. Run the Pipeline

```bash
# Run full pipeline for an episode
python scripts/run_pipeline.py <episode_id>

# Example with the standard seed data:
python scripts/run_pipeline.py 019d861bbf3ea9d3bfcdd25458dcdbef
```

### 5. Render Video

```bash
# Via Remotion Studio (preview)
npm run studio

# Or CLI render
npm run render:all <episode_id>
```

---

## 🖥️ Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server (UI tools) |
| `npm run studio` | Start Remotion Studio (video preview) |
| `npm run build` | Build Next.js app |
| `npm test` | Run Vitest suite |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type check |
| `ruff check .` | Python lint |

---

## 📁 Project Structure

```
/ (Root)
├── src/
│   ├── app/          # Next.js pages & UI tools
│   ├── pipeline/     # Backend stations (S0–S7)
│   ├── services/     # Domain logic (AI, character, assets, video)
│   ├── shared/       # Types, API clients, utilities
│   └── ui/           # Reusable React components
├── remotion/         # Video rendering (compositions, components)
├── scripts/          # CLI entry points (thin wrappers)
├── public/           # Static assets & compiled JSON outputs
└── docs/             # Architecture plans & documentation
```

> See `AGENTS.md` for strict directory rules enforced on all AI agents.

---

## 🤖 CI/CD (Gatekeeper)

Every push to `main` triggers GitHub Actions:

- **🐍 Python Gatekeeper:** `ruff check .` — catches syntax errors & undefined variables
- **⚛️ TypeScript Gatekeeper:** `npx tsc --noEmit` — catches type errors in React/Remotion

Look for ✅ green checkmarks on commits. Any ❌ red cross means a commit broke something.

---

## 🧑‍💻 Contributing

This project uses a **Manager-Worker** workflow with Kilo Agent Manager:

- **Manager:** Reviews PRs, merges code, writes Journal, updates Kanban
- **Worker:** Writes code for a single issue, creates PR, reports results

Full workflow details: [`WORKFLOW.md`](WORKFLOW.md)

---

## 📄 License

Proprietary. All rights reserved.

---

---

<a name="tiếng-việt"></a>
# 🇻🇳 Auto Video Editor — Xưởng Phim AI Tự Động

**Auto Video Editor** biến kịch bản thô thành video MP4 hoàn chỉnh bằng hệ thống AI đa trạm. Từ viết lại kịch bản, tạo giọng nói, đạo diễn hình ảnh, thiết kế âm thanh cho đến render video cuối cùng — toàn bộ đều tự động hóa.

Hệ thống được thiết kế để AI agent (LLM Function Calling) vận hành, kèm giao diện Human-in-the-loop để kiểm soát chất lượng.

---

## 🏗️ Kiến Trúc (Pipeline Các Trạm)

```
S0: Lập chỉ mục  →  S1: Viết lại kịch bản  →  S2: Trích xuất  →  S3: Phân cảnh
    ↓
S4: Audio (TTS)  →  S5: Đạo diễn hình ảnh  →  S6: Âm thanh & VFX  →  S7: Biên dịch Video
    ↓
S8: Render Remotion → 🎥 Xuất MP4
```

- **Backend (Python):** SQLite + SQLAlchemy, các trạm AI từ S0–S7
- **Frontend (Remotion/React):** Render JSON đầu ra từ S7 thành video
- **UI Tools (Next.js):** Công cụ Human-in-the-loop tại `/tools`
- **CI/CD:** GitHub Actions — kiểm tra Python (`ruff`) + kiểm tra TypeScript (`tsc`)

---

## 🛠️ Công Nghệ

| Lớp | Công nghệ |
|-----|----------|
| Backend Pipeline | Python 3.10+, SQLAlchemy, SQLite |
| AI & LLM | Gemini (Google), DeepSeek, ElevenLabs (TTS/SFX) |
| Render Video | Remotion 4.0, React 19, TypeScript |
| UI Tools | Next.js 16, Tailwind CSS, Zustand |
| Kiểm thử | Vitest (frontend), ruff (Python lint), tsc (type check) |
| CI/CD | GitHub Actions |

---

## 📋 Yêu Cầu Hệ Thống

- **Python 3.10+** (có `pip`)
- **Node.js 20+** (có `npm`)
- **Git**
- **Gemini API key** ([lấy tại đây](https://aistudio.google.com/apikey))

---

## 🚀 Cài Đặt Nhanh

### 1. Clone & Cài đặt

```bash
git clone https://github.com/ptnhan2/Auto_Video_Editor.git
cd Auto_Video_Editor
```

**Python:**
```bash
pip install sqlalchemy
```

**Node.js:**
```bash
npm install
```

### 2. Biến Môi Trường

Copy file mẫu và điền API key:

```bash
cp .env.example .env.local
```

Các biến bắt buộc trong `.env.local`:

| Biến | Mô tả |
|------|-------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key để gọi AI |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (mặc định) |
| `DEEPSEEK_API_KEY` | (Tùy chọn) DeepSeek LLM dự phòng |

### 3. Nạp Dữ Liệu Mẫu

```bash
# Dữ liệu mẫu chuẩn (1 drama, 1 tập, 2 nhân vật)
python scripts/seed_test_data.py

# Dữ liệu edge case (tùy chọn — kiểm thử giới hạn pipeline)
python scripts/seed_edge_cases.py
```

### 4. Chạy Pipeline

```bash
# Chạy toàn bộ pipeline cho 1 tập phim
python scripts/run_pipeline.py <episode_id>

# Ví dụ với dữ liệu mẫu chuẩn:
python scripts/run_pipeline.py 019d861bbf3ea9d3bfcdd25458dcdbef
```

### 5. Xuất Video

```bash
# Xem preview qua Remotion Studio
npm run studio

# Hoặc render trực tiếp qua CLI
npm run render:all <episode_id>
```

---

## 🖥️ Các Lệnh Phát Triển

| Lệnh | Mục đích |
|------|---------|
| `npm run dev` | Chạy Next.js dev server (UI tools) |
| `npm run studio` | Chạy Remotion Studio (xem preview video) |
| `npm run build` | Build Next.js app |
| `npm test` | Chạy Vitest |
| `npm run lint` | Chạy ESLint |
| `npx tsc --noEmit` | Kiểm tra lỗi TypeScript |
| `ruff check .` | Kiểm tra lỗi Python |

---

## 📁 Cấu Trúc Dự Án

```
/ (Root)
├── src/
│   ├── app/          # Next.js pages & UI tools
│   ├── pipeline/     # Backend stations (S0–S7)
│   ├── services/     # Domain logic (AI, character, assets, video)
│   ├── shared/       # Types, API clients, utilities
│   └── ui/           # Reusable React components
├── remotion/         # Video rendering (compositions, components)
├── scripts/          # CLI entry points (thin wrappers)
├── public/           # Static assets & compiled JSON outputs
└── docs/             # Architecture plans & documentation
```

> Xem `AGENTS.md` để biết quy tắc thư mục nghiêm ngặt áp dụng cho mọi AI agent.

---

## 🤖 CI/CD (Gatekeeper)

Mỗi lần push lên `main`, GitHub Actions tự động:

- **🐍 Python Gatekeeper:** `ruff check .` — bắt lỗi cú pháp & biến không xác định
- **⚛️ TypeScript Gatekeeper:** `npx tsc --noEmit` — bắt lỗi kiểu dữ liệu React/Remotion

Dấu ✅ xanh = code an toàn. Dấu ❌ đỏ = có lỗi cần sửa trước khi merge.

---

## 🧑‍💻 Đóng Góp

Dự án dùng mô hình **Manager-Worker** với Kilo Agent Manager:

- **Manager:** Review PR, merge code, ghi Journal, cập nhật Kanban
- **Worker:** Viết code cho 1 issue, tạo PR, báo cáo kết quả

Chi tiết quy trình: [`WORKFLOW.md`](WORKFLOW.md)

---

## 📄 Bản Quyền

Độc quyền. Mọi quyền được bảo lưu.
