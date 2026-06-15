# 🎬 Auto Video Editor — AI-Powered Video Production Platform

> **🌍 Language:** [Tiếng Việt bên dưới ↓](#tiếng-việt)

**Auto Video Editor** is an AI-driven video production platform. From script input to final MP4 output, the entire pipeline is automated. AI agents control the editing process via API, with a human-in-the-loop web UI for review and refinement.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              WEB PLATFORM (Next.js)              │
│  Landing Page │ Episode Detail │ Asset Dashboard │
│  /api/episodes │ /api/assets │ /api/dramas       │
├─────────────────────────────────────────────────┤
│              PIPELINE (Python)                   │
│  S1-S7: Script → Storyboard → Audio → Visual    │
│  → Video Compiler → Output ready for Editor     │
├─────────────────────────────────────────────────┤
│              EDITOR (OpenCut)                    │
│  Multi-track Timeline │ Preview │ Effects        │
│  Export MP4 │ AI Bridge API (coming)             │
├─────────────────────────────────────────────────┤
│              DATABASE (SQLite)                   │
│  dramas │ episodes │ assets │ pipeline_status    │
└─────────────────────────────────────────────────┘
```

| Layer | Technology |
|-------|-----------|
| **Web Platform** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Pipeline** | Python 3.10+, SQLAlchemy, SQLite, Gemini/DeepSeek LLM |
| **AI & TTS** | Gemini, DeepSeek, ElevenLabs, Edge-TTS |
| **Editor** | OpenCut (MIT) — multi-track timeline, effects, export |
| **Database** | SQLite (via node:sqlite for API routes, SQLAlchemy for pipeline) |
| **Testing** | Vitest (frontend), pytest (Python), ruff (lint), tsc (type check) |
| **CI/CD** | GitHub Actions — Python + TypeScript Gatekeeper |

> **⚠️ Technology Pivot (2026-06-15):** Remotion has been removed. See [AGENTS.md Rule J](AGENTS.md) for details. OpenCut is the new editor engine.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ptnhan2/Auto_Video_Editor.git
cd Auto_Video_Editor
```

**Python dependencies:**
```bash
pip install -r requirements.txt
```

**Node.js dependencies:**
```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (default) |
| `DEEPSEEK_API_KEY` | (Optional) DeepSeek fallback |

### 3. Seed Test Data

```bash
python scripts/seed_test_data.py
python scripts/seed_edge_cases.py   # Optional: stress-test data
```

### 4. Run the Pipeline

```bash
python scripts/run_pipeline.py <episode_id>
```

### 5. Start the Web Platform

```bash
npm run dev
```

Open http://localhost:3000 — browse dramas, create episodes, view pipeline status.

---

## 🖥️ Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start production server |
| `npm test` | Run Vitest test suite |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type check |
| `ruff check .` | Python lint |

---

## 📁 Project Structure

```
/ (Root)
├── src/
│   ├── app/          # Next.js pages & API routes
│   ├── pipeline/     # Python stations (S1–S7)
│   ├── services/     # Domain logic (AI, character, assets, video)
│   ├── shared/       # Types, API clients, mappers
│   └── ui/           # Reusable React components
├── scripts/          # CLI entry points (thin wrappers)
├── public/           # Static assets
├── docs/             # Architecture plans & docs
├── .archive/         # Deprecated code (Remotion, old tools)
└── AGENTS.md         # AI agent constitution & rules
```

> See `AGENTS.md` for strict directory rules enforced on all AI agents.

---

## 🤖 CI/CD

Every push to `main` triggers:

- **🐍 Python Gatekeeper:** `ruff check .`
- **⚛️ TypeScript Gatekeeper:** `npx tsc --noEmit`

---

## 🧑‍💻 Contributing

Manager-Worker workflow via Kilo Agent Manager. Full workflow: `AGENTS.md`.

---

## 📄 License

Proprietary. All rights reserved.

---

---

<a name="tiếng-việt"></a>
# 🇻🇳 Auto Video Editor — Nền Tảng Sản Xuất Video AI

**Auto Video Editor** là nền tảng sản xuất video tự động bằng AI. Từ kịch bản đầu vào đến video MP4 hoàn chỉnh, toàn bộ pipeline được tự động hóa. AI agent điều khiển quá trình edit qua API, với giao diện web human-in-the-loop để kiểm duyệt và tinh chỉnh.

---

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────────────┐
│              WEB PLATFORM (Next.js)              │
│  Trang Chủ │ Chi Tiết Tập │ Dashboard Asset      │
│  /api/episodes │ /api/assets │ /api/dramas       │
├─────────────────────────────────────────────────┤
│              PIPELINE (Python)                   │
│  S1-S7: Kịch bản → Phân cảnh → Audio → Hình ảnh │
│  → Biên dịch Video → Output cho Editor          │
├─────────────────────────────────────────────────┤
│              EDITOR (OpenCut)                    │
│  Timeline đa track │ Preview │ Hiệu ứng          │
│  Xuất MP4 │ API Bridge cho AI (sắp có)           │
├─────────────────────────────────────────────────┤
│              DATABASE (SQLite)                   │
│  dramas │ episodes │ assets │ pipeline_status    │
└─────────────────────────────────────────────────┘
```

| Lớp | Công nghệ |
|-----|----------|
| **Web Platform** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Pipeline** | Python 3.10+, SQLAlchemy, SQLite, Gemini/DeepSeek |
| **AI & TTS** | Gemini, DeepSeek, ElevenLabs, Edge-TTS |
| **Editor** | OpenCut (MIT) — timeline đa track, hiệu ứng, xuất file |
| **Database** | SQLite (node:sqlite cho API routes, SQLAlchemy cho pipeline) |
| **Kiểm thử** | Vitest (frontend), pytest (Python), ruff (lint), tsc (type check) |
| **CI/CD** | GitHub Actions — Python + TypeScript Gatekeeper |

> **⚠️ Chuyển đổi công nghệ (2026-06-15):** Remotion đã bị loại bỏ. Xem [AGENTS.md Rule J](AGENTS.md). OpenCut là editor engine mới.

---

## 🚀 Cài Đặt Nhanh

### 1. Clone & Cài đặt

```bash
git clone https://github.com/ptnhan2/Auto_Video_Editor.git
cd Auto_Video_Editor
```

**Python:**
```bash
pip install -r requirements.txt
```

**Node.js:**
```bash
npm install
```

### 2. Biến Môi Trường

```bash
cp .env.example .env.local
```

| Biến | Mô tả |
|------|-------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (mặc định) |
| `DEEPSEEK_API_KEY` | (Tùy chọn) DeepSeek dự phòng |

### 3. Nạp Dữ Liệu Mẫu

```bash
python scripts/seed_test_data.py
python scripts/seed_edge_cases.py   # Tùy chọn: dữ liệu kiểm thử giới hạn
```

### 4. Chạy Pipeline

```bash
python scripts/run_pipeline.py <episode_id>
```

### 5. Khởi Động Web Platform

```bash
npm run dev
```

Mở http://localhost:3000 — duyệt drama, tạo tập phim, xem trạng thái pipeline.

---

## 🖥️ Các Lệnh Phát Triển

| Lệnh | Mục đích |
|------|---------|
| `npm run dev` | Chạy Next.js dev server |
| `npm run build` | Build Next.js production |
| `npm run start` | Chạy production server |
| `npm test` | Chạy Vitest |
| `npm run lint` | Chạy ESLint |
| `npx tsc --noEmit` | Kiểm tra TypeScript |
| `ruff check .` | Kiểm tra Python |

---

## 📁 Cấu Trúc Dự Án

```
/ (Root)
├── src/
│   ├── app/          # Next.js pages & API routes
│   ├── pipeline/     # Python stations (S1–S7)
│   ├── services/     # Domain logic (AI, character, assets, video)
│   ├── shared/       # Types, API clients, mappers
│   └── ui/           # Reusable React components
├── scripts/          # CLI entry points (thin wrappers)
├── public/           # Static assets
├── docs/             # Tài liệu kiến trúc & kế hoạch
├── .archive/         # Code cũ (Remotion, tools đã deprecated)
└── AGENTS.md         # Quy tắc cho AI agent
```

> Xem `AGENTS.md` để biết quy tắc thư mục nghiêm ngặt áp dụng cho mọi AI agent.

---

## 🤖 CI/CD

Mỗi lần push lên `main`:

- **🐍 Python Gatekeeper:** `ruff check .`
- **⚛️ TypeScript Gatekeeper:** `npx tsc --noEmit`

---

## 🧑‍💻 Đóng Góp

Mô hình Manager-Worker qua Kilo Agent Manager. Quy trình đầy đủ: `AGENTS.md`.

---

## 📄 Bản Quyền

Độc quyền. Mọi quyền được bảo lưu.
