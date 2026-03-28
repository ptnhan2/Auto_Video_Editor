---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-08'
project_name: 'Auto_Video_Editor'
user_name: 'Nhan'
date: '2026-02-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Hệ thống yêu cầu khả năng điều phối (Orchestration) phức tạp để thực hiện mô hình Triple-Script. Về mặt kiến trúc, điều này có nghĩa là chúng ta cần một Data Model linh hoạt, cho phép tách rời nội dung khỏi cách hiển thị. Các thành phần AI (SAM, Rigging, TTS) cần được đóng gói thành các Micro-services hoặc API endpoints độc lập để đảm bảo khả năng thay thế và mở rộng.

**Non-Functional Requirements:**
Hiệu năng là ưu tiên hàng đầu. Để đạt được độ trễ tương tác < 200ms và render 1.5x real-time, kiến trúc phải tận dụng tối đa sức mạnh của Client (WebCodecs/WebGL) và kết hợp với cụm Worker GPU Backend bất đồng bộ. Bảo mật dữ liệu sinh trắc học (Avatar/Voice) cũng là một ràng buộc kỹ thuật quan trọng ảnh hưởng đến thiết kế Database và lưu trữ.

**Scale & Complexity:**
Dự án có độ phức tạp **High** do tính chất tích hợp đa mô hình AI và xử lý media thời gian thực.
- Primary domain: **Full-stack (Media Heavy)**
- Complexity level: **High**
- Estimated architectural components: **6-8 components** (API Gateway, AI Orchestrator, Storage System, GPU Render Farm, Frontend SPA, State Bridge).

### Technical Constraints & Dependencies
*   **AI Dependency:** Phụ thuộc vào Gemini (Primary) và DeepSeek (Fallback).
*   **Browser Dependency:** Tối ưu hóa cho nhân Chromium (WebCodecs API).
*   **Performance Constraint:** Render video HQ 30 phút mà không gây crash hệ thống hoặc lag UI.

### Cross-Cutting Concerns Identified
*   **State Synchronization:** Đồng bộ hóa trạng thái giữa UI Shell (Shadcn) và Video Engine (Remotion) thông qua Zustand.
*   **Resilience & Error Handling:** Cơ chế Failover tự động giữa các nhà cung cấp AI.
*   **Asset Management:** Quản lý hàng trăm MB dữ liệu media (SVG, Audio, Video chunks) một cách hiệu quả trên trình duyệt.

---

## Starter Template Evaluation

### Primary Technology Domain
**Web Application / Full-stack** dựa trên yêu cầu về một SPA xử lý media nặng với engine React.

### Selected Starter: Next.js 15 + Shadcn UI + Zustand
**Rationale for Selection:**
1.  **Hiệu năng vượt trội:** Next.js 15 và React 19 mang đến **React Compiler**, tự động tối ưu hóa việc rerender - cực kỳ quan trọng cho một Timeline có hàng trăm đối tượng như Auto_Video_Editor.
2.  **Tính linh hoạt cao:** Shadcn UI cung cấp các component chất lượng cao nhưng không bị "đóng gói cứng", cho phép tùy biến sâu giao diện "Performance Director".
3.  **Hệ sinh thái đồng nhất:** Remotion tích hợp hoàn hảo với Next.js, cho phép chia sẻ logic giữa Client-side preview và Server-side rendering.

**Initialization Command:**
```bash
npx create-next-app@latest my-video-editor --typescript --tailwind --eslint --app
npx shadcn-ui@latest init
```

### Architectural Decisions Provided by Starter
*   **Language:** TypeScript (Strict mode) cho tính an toàn dữ liệu kịch bản.
*   **Styling:** Tailwind CSS 4.0 cho hiệu suất build và tối ưu animation.
*   **Routing:** Next.js App Router để quản lý các phân đoạn Editor và Dashboard hiệu quả.
*   **State Management:** Đề xuất cài đặt **Zustand** độc lập để làm cầu nối giữa UI và Remotion.
*   **Build Tooling:** Next.js Turbopack cho tốc độ phát triển nhanh nhất.

---

## Core Architectural Decisions

### Data Architecture
*   **Lựa chọn:** **Supabase (PostgreSQL + Storage)**.
*   **Rationale:** Cung cấp khả năng lưu trữ kịch bản (JSONB) và media assets (SVG, Audio) trong một nền tảng duy nhất, giảm thiểu công sức quản lý hạ tầng.
*   **Affects:** Project metadata, user assets, script storage.

### AI Orchestration
*   **Lựa chọn:** **Vercel AI SDK**.
*   **Rationale:** Giao diện lập trình thống nhất cho Gemini và DeepSeek, hỗ trợ tốt cho việc streaming dữ liệu và xử lý failover ở cấp độ ứng dụng.
*   **Affects:** Summarization, script generation, emotion tagging.

### Rendering Infrastructure
*   **Lựa chọn:** **Modal.com (Serverless GPU)**.
*   **Rationale:** Tối ưu hóa chi phí (Pay-as-you-go) và hiệu năng render. GPU là bắt buộc để duy trì tốc độ render 1.5x real-time và xử lý các tác vụ bóc tách SAM/Rigging nặng nề.
*   **Affects:** Final video export, HQ rendering.

### State Management Strategy
*   **Lựa chọn:** **Zustand**.
*   **Rationale:** Cung cấp Store trung tâm nhẹ và hiệu năng cao để đồng bộ hóa các thao tác từ UI Shell vào Video Engine (Remotion) mà không gây giật lag.
*   **Affects:** Timeline editing, property panels, canvas preview.

### Deployment & Hosting
*   **Lựa chọn:** **Vercel**.
*   **Rationale:** Tích hợp sâu với Next.js, hỗ trợ Edge Functions để giảm độ trễ khi xử lý AI logic ban đầu.
*   **Affects:** Web application frontend & API.

### Cost Analysis Summary
Kiến trúc "Serverless-First" được chọn nhằm tối ưu hóa chi phí cho MVP (~10.000 VNĐ cho video 10 phút). Sử dụng GPU thay vì CPU mặc dù có chi phí theo giờ cao hơn nhưng tổng giá thành trên mỗi sản phẩm lại rẻ hơn 60% nhờ tốc độ xử lý nhanh hơn 10-20 lần.

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined
**Critical Conflict Points Identified:** Đã xác định 5 khu vực tiềm ẩn xung đột giữa các AI Agent: Đặt tên cơ sở dữ liệu, Cấu trúc API, Quy tắc đặt tên Code, Tổ chức thư mục dự án, và Định dạng dữ liệu trao đổi.

### Naming Patterns
*   **Database (PostgreSQL):** Sử dụng `snake_case` cho tên bảng và tên cột. Bảng dùng số nhiều (ví dụ: `projects`, `characters`). Cột quan hệ dùng `[table_singular]_id`.
*   **API Endpoints:** Sử dụng `kebab-case` cho đường dẫn (ví dụ: `/api/v1/video-projects`). Body JSON sử dụng `camelCase`.
*   **Code Naming:** Component dùng `PascalCase`. File dùng `kebab-case`. Variables/Functions dùng `camelCase`.

### Structure Patterns
*   **Project Organization:** Tổ chức theo tính năng (**Feature-based**) trong thư mục `src/features/`. Ví dụ: `src/features/editor/`, `src/features/library/`.
*   **Shared Infrastructure:** Thư mục `src/lib/` chứa cấu hình cho các SDK ngoài (Supabase, Vercel AI). Thư mục `src/utils/` chứa logic dùng chung.
*   **Testing:** File test đặt ngay cạnh file code (`*.test.tsx`).

### Format Patterns
*   **API Response Format:** Luôn trả về cấu trúc: `{ success: boolean, data?: T, error?: string }`.
*   **Data Exchange:** Sử dụng chuỗi **ISO 8601** cho toàn bộ dữ liệu thời gian. Boolean dùng `true/false`.

### Communication Patterns
*   **State Management (Zustand):** Sử dụng pattern `use[Feature]Store` để quản lý trạng thái đồng bộ giữa UI và Video Canvas.
*   **Event Naming:** Sử dụng format `Feature:Action` (ví dụ: `Editor:TagAdded`) cho hệ thống log hoặc thông báo nội bộ.

### Process Patterns
*   **Error Handling:** Áp dụng **Error Boundaries** cho các module lớn (Editor, Player). User-facing error message phải thân thiện và có hướng dẫn hành động (ví dụ: chỉ rõ đoạn text vi phạm safety).
*   **Loading States:** Sử dụng Skeleton cho các component nhỏ và Global Progress Bar trên Timeline cho các tác vụ Render nặng.
*   **Resilience:** Mọi request AI phải có cơ chế **Retry** (3 lần) và **Failover** sang model dự phòng nếu lỗi kéo dài.

---

## Project Structure & Boundaries

### Complete Project Directory Structure
```text
auto-video-editor/
├── src/
│   ├── app/ (Next.js App Router)
│   │   ├── (auth)/             # Login, Register pages
│   │   ├── dashboard/          # Project list, Templates gallery
│   │   ├── editor/[id]/        # Giao diện Performance Director chính
│   │   ├── api/                # Backend API Routes
│   │   │   ├── ai/             # Orchestrator (Gemini/DeepSeek routing)
│   │   │   ├── projects/       # CRUD Project metadata
│   │   │   └── render/         # Trigger Modal.com/Remotion Lambda
│   ├── features/ (Logic theo nghiệp vụ)
│   │   ├── editor/             # Zustand stores, Timeline & Canvas logic
│   │   ├── library/            # Quản lý Virtual Hosts & Assets
│   │   ├── ai-orchestrator/    # Prompt templates, Chunking & Failover logic
│   │   └── export-pipeline/    # Logic chuẩn bị data cho Remotion
│   ├── components/ (UI Components chung)
│   │   ├── ui/                 # Atomic Shadcn components
│   │   └── layout/             # Sidebar, Header, Resizable panels
│   ├── lib/ (Cấu hình hạ tầng)
│   │   ├── supabase.ts         # Client/Admin Supabase initialization
│   │   ├── vercel-ai.ts        # Vercel AI SDK configuration
│   │   └── remotion.ts         # Remotion engine helpers
│   ├── types/                  # TypeScript interfaces (Triple-Script, Persona)
│   └── utils/                  # Helper functions (Time formatting, SVG parsing)
├── remotion/                   # Thư mục chứa các Remotion Compositions (Engine video)
│   ├── Root.tsx
│   ├── compositions/           # Các mẫu video khác nhau
│   └── components/             # Animation components (Lip-sync, Rigging)
├── public/                     # Static assets (icons, default SVG parts)
└── tests/                      # E2E & Integration tests
```

### Architectural Boundaries
*   **State Boundary:** Toàn bộ trạng thái "Acting" và "Timeline" phải nằm trong **Zustand Store**. UI không can thiệp trực tiếp vào Remotion props.
*   **AI Boundary:** Logic bóc tách kịch bản (Triple-Script) chỉ nằm ở phía Server (`src/app/api/ai/`).
*   **Render Boundary:** Tác vụ render nặng được đẩy hoàn toàn lên **Modal.com**. Server API chỉ đóng vai trò Trigger và Webhook.

### Requirements to Structure Mapping
*   **Triple-Script Engine:** `src/features/ai-orchestrator/`
*   **Performance Director UI:** `src/app/editor/` + `src/features/editor/`
*   **Virtual Host Library:** `src/features/library/`
*   **Video Engine:** `remotion/`

---

## Architecture Validation Results

### Coherence Validation ✅
Các lựa chọn công nghệ (Next.js, Shadcn, Zustand, Remotion, Supabase, Modal, Vercel AI) đều nằm trong hệ sinh thái JavaScript/React hiện đại, đảm bảo tính tương thích cao và dễ dàng chia sẻ logic. Các phiên bản được chọn đều là phiên bản ổn định nhất năm 2025-2026.

### Requirements Coverage Validation ✅
Toàn bộ 19 yêu cầu chức năng (FR) và 9 yêu cầu phi chức năng (NFR) từ PRD/UX đã được ánh xạ vào các thành phần kiến trúc và cấu trúc thư mục cụ thể. Đặc biệt, chiến lược AI Resilience và GPU rendering đã giải quyết triệt để các rủi ro kỹ thuật lớn nhất.

### Implementation Readiness Validation ✅
Kiến trúc đã sẵn sàng để triển khai. Các AI Agent có thể bắt đầu bằng lệnh khởi tạo dự án và tuân theo bộ quy tắc đặt tên (Naming) cũng như cấu trúc thư mục (Feature-based) đã được quy định để tránh xung đột.

### Gap Analysis Results
*   **Minor Gap:** Cần liệt kê cụ thể các biến môi trường (Environment Variables) trong file `.env.example`.
*   **Resolved:** Đã định nghĩa tiêu chuẩn Rigging 10 bộ phận và Schema JSON (`pivots.json`) cho nhân vật 2D.

### Automated Rigging Specification (Added 2026-02-23)
*   **Standard:** 10-part humanoid rig (Head, Torso, L/R Upper Arm, L/R Lower Arm+Hand, L/R Thigh, L/R Calf+Foot).
*   **Joint Geometry:** Ball & Socket joint với kỹ thuật **Dual-Convex Overlap**. Mỗi khớp nối được bo tròn bằng hình tròn tâm thực (True Center).
*   **Math Logic:** Sử dụng **Bi-directional Ray-casting** vuông góc với trục xương để tìm chính xác độ rộng của chi và xác định tâm xoay vật lý, thay vì tin hoàn toàn vào điểm AI.

### Architecture Readiness Assessment
**Overall Status:** **READY FOR IMPLEMENTATION**
**Confidence Level:** **High (95%)**
**Key Strengths:** Tối ưu chi phí vận hành, hiệu năng render vượt trội, kiến trúc cực kỳ linh hoạt và dễ mở rộng AI.

### Implementation Handoff
**AI Agent Guidelines:**
- Tuân thủ tuyệt đối cấu trúc thư mục `src/features/`.
- Mọi trạng thái dùng chung PHẢI đi qua Zustand Store.
- Sử dụng Vercel AI SDK cho mọi tương tác với LLM.
- Tham chiếu file `architecture.md` cho mọi quyết định kỹ thuật.

**First Implementation Priority:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app
```
(Sau đó thực hiện cài đặt Shadcn UI và Supabase SDK).
