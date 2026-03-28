---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
classification:
  projectType: web_app
  domain: media_entertainment
  complexity: High
  projectContext: greenfield
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-Auto_Video_Editor-2026-02-07.md'
  - '_bmad-output/planning-artifacts/research/domain-authentic-video-editor-research-2026-02-05.md'
  - '_bmad-output/planning-artifacts/research/market-authentic-video-editor-research-2026-02-05.md'
  - '_bmad-output/planning-artifacts/research/technical-animation-tts-research-2026-02-06.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-05.md'
workflowType: 'prd'
---

# Product Requirements Document - Auto_Video_Editor

**Author:** Nhan
**Date:** 2026-02-07

## Executive Summary
Auto_Video_Editor là nền tảng sản xuất video Hybrid thế hệ mới, giải quyết cuộc khủng hoảng "AI Slop" bằng cách kết hợp tự động hóa 2D Animation (SVG/Rigging) với quyền chỉ đạo tinh tế của con người. Sản phẩm cho phép Creator lồng ghép "Cái tôi kỹ thuật số" thông qua hệ thống Người dẫn chuyện linh hoạt, đảm bảo tính Authentic và khả năng kiếm tiền bền vững trên các nền tảng mạng xã hội.

## Success Criteria

### User Success
*   **Monetization Safety:** 100% video vượt qua kiểm tra "AI Slop" để được bật kiếm tiền trên YouTube.
*   **Production Efficiency:** Giảm 80% thời gian sản xuất (video 10 phút hoàn thiện trong < 1 tiếng).
*   **Emotional Accuracy:** Tỷ lệ AI gán sai cảm xúc/nhịp điệu < 20%.

### Business Success
*   **Market Penetration:** Đạt 1000 người dùng đăng ký trong 3 tháng đầu sau MVP.
*   **Cost Efficiency:** Chi phí API (TTS, SAM, GPU) < 10% doanh thu.
*   **Gross Margin:** Lợi nhuận gộp > 90% trên mỗi giờ video thành phẩm.

### Technical Success
*   **System Reliability:** Tỷ lệ lỗi hệ thống khi render video 30 phút < 20%.
*   **Performance:** Thời gian từ lúc nạp text đến lúc có bản nháp video 10 phút < 60 phút.
*   **Automation:** 80% quy trình (Cutout, Rigging, TTS) không cần can thiệp thủ công.

## Product Scope

### MVP - Phase 1: "The Authentic Narrator"
*   **Triple-Script Engine:** Bóc tách kịch bản thành Audio, Visual, và Persona layers.
*   **Auto-Rigging Pipeline:** Tự động hóa SAM Segmentation -> SVG Vectorization -> Auto-Rigging cho nhân vật 2D.
*   **Virtual Host Library:** Cung cấp các mẫu người dẫn chuyện có sẵn với Style Presets.
*   **Hybrid Editor:** Chỉnh sửa thẻ cảm xúc trên Timeline với Instant Preview.
*   **Smart AI Fallback:** Cơ chế tự động chuyển đổi Gemini sang DeepSeek khi bị Safety Block.

### Growth - Phase 2: "The Social Agency"
*   **Batch Production:** Tạo hàng loạt video từ danh sách script.
*   **Public Gallery:** Trang trưng bày video mẫu tối ưu SEO để thu hút người dùng.
*   **Social Integration:** Tự động upload trực tiếp lên YouTube/TikTok.

### Vision - Phase 3: "The AI Director"
*   **3D Virtual Studio:** Mở rộng sang môi trường 3D và điều khiển camera linh hoạt.
*   **Advanced Motion Control:** Can thiệp sâu vào Keyframe và xương nhân vật (Bone Animation).

## User Journeys

### Journey 1: The "Authentic" Creation Flow (Minh - Happy Path)
*   **Bối cảnh:** Creator cần làm video review phim nhanh để kịp trend.
*   **Hành động:** Nạp script -> Hệ thống chạy Async -> Nhận thông báo sau 2 phút -> Review bản nháp với Avatar đang "diễn" đúng cảm xúc.
*   **Kết quả:** Xuất bản video trong 30 phút, đạt hiệu quả giữ chân khán giả cao.

### Journey 2: The "Hybrid" Correction (Minh - Edge Case)
*   **Bối cảnh:** AI nhận diện sai cảm xúc của một đoạn thoại quan trọng.
*   **Hành động:** Mở Timeline -> Chọn đoạn thoại -> Kéo thanh trượt "Emotion" từ Happy sang Sad -> Xem Preview tức thì (Low-res).
*   **Kết quả:** Sửa lỗi trong 10 giây, cảm giác làm chủ hoàn toàn quá trình đạo diễn.

### Journey 3: Batch Production (Sarah - Agency)
*   **Bối cảnh:** Agency cần sản xuất 5 video quảng cáo đồng bộ thương hiệu.
*   **Hành động:** Clone Project -> Nạp 5 script -> Hệ thống chạy Compatibility Check (kiểm tra xương nhân vật tương thích với hành động mới).
*   **Kết quả:** Tránh lỗi render, đảm bảo tiến độ bàn giao cho khách hàng.

## Domain-Specific Requirements

### Platform Compliance
*   **Anti-Slop Mechanism:** Bắt buộc sử dụng Randomization Seed cho mỗi lần render để đảm bảo MD5 hash và frame timing độc bản.
*   **Variation Injection:** Tự động chèn biến thể nhỏ vào visual/audio để tránh lỗi "Repetitive Content".

### AI Resilience & Safety
*   **Model Routing:** Sử dụng Gemini cho logic phức tạp; tự động Failover sang DeepSeek ở cấp độ Batch nếu Gemini trả về Empty Response.
*   **Granular Moderation:** Chạy OpenAI Moderation trên kịch bản cuối (output) thay vì input thô để tối ưu chi phí.
*   **In-line Flagging:** Hiển thị cảnh báo vi phạm tại chính xác đoạn văn bản gây lỗi trong Editor.

## Innovation Analysis

### Dynamic Narrator Persona System
*   **Concept:** Host không chỉ là một Avatar tĩnh mà là một "Virtual Persona" có thể thay đổi trang phục, phong cách (Context-Aware Styling) phù hợp với chủ đề video (ví dụ: đồ Gothic cho truyện ma, đồ hiện đại cho tech review).
*   **Unified Pipeline:** Áp dụng cùng một công nghệ Auto-Rigging cho cả nhân vật kể chuyện và nhân vật trong truyện.

### Triple-Script Paradigm
*   **Innovation:** Tách rời hoàn toàn Nội dung (Audio), Minh họa (Visual) và Dẫn chuyện (Persona). Cho phép "Re-skinning" - đổi phong cách toàn bộ video mà không cần thay đổi nội dung gốc.

## Project-Type Requirements (Web SPA)

### Technical Architecture
*   **Browser Support:** Ưu tiên các trình duyệt nhân Chromium (Chrome, Edge). Firefox/Safari hỗ trợ ở mức cơ bản.
*   **Collaboration:** Sử dụng cơ chế File Locking (Optimistic Locking) trong MVP - mỗi thời điểm chỉ một người được quyền chỉnh sửa.
*   **Performance Targets:**
    *   Workspace Load: < 3 giây.
    *   UI Response: < 200ms.
    *   Render Speed: < 1.5x Real-time.

## Functional Requirements

### 1. Orchestration & AI Pipeline
*   **FR1:** Users can decompose raw scripts into Audio, Visual, and Persona layers (Triple-Script).
*   **FR2:** System can automatically assign emotion/action metadata tags from script analysis.
*   **FR3:** System can execute Automated Rigging pipeline (MoveNet Pose Detection -> 10-part Ball & Socket Partitioning -> JSON Pivot Export).
*   **FR4:** System can perform automatic model failover (Gemini to DeepSeek) at the chunk level.

### 2. Narrator Persona Management
*   **FR5:** Users can select virtual hosts from a library of pre-rigged 2D characters.
*   **FR6:** Users can filter and select narrator outfits using Style Presets.
*   **FR7:** Users can create and save custom narrator persona sets.

### 3. Hybrid Video Editing
*   **FR8:** Users can view instant low-resolution previews after metadata adjustments.
*   **FR9:** Users can adjust character emotions/actions via Timeline tags.
*   **FR10:** System can perform basic lip-sync (mouth flapping) based on audio amplitude.
*   **FR11:** Users can apply cinematic transitions from a template library.

### 4. Safety & Compliance
*   **FR12:** System can perform moderation checks on generated output scripts.
*   **FR13:** System can display in-line error flags on specific text segments causing safety blocks.
*   **FR14:** System can inject randomization seeds into every render process.
*   **FR15:** Users must confirm a copyright disclaimer before personal asset upload.

### 5. Project & Account Management
*   **FR16:** Users can create, save, delete, and manage video projects.
*   **FR17:** Users can export final videos in multiple formats/qualities.
*   **FR18:** System can prevent concurrent editing on the same project (Locking).
*   **FR19:** Users can resume/retry heavy rendering tasks from the last checkpoint.

## Non-Functional Requirements

### Performance
*   **NFR1:** UI response time shall be < 200ms for all interaction events.
*   **NFR2:** Project workspace shall load in < 3 seconds for projects under 10 minutes.
*   **NFR3:** Final export speed shall not exceed 1.5x real-time duration.

### Security
*   **NFR4:** All user assets and persona data shall be encrypted at rest.
*   **NFR5:** User biometric-like data (Face/Voice) shall not be used for public model training without explicit consent.
*   **NFR6:** API communication shall be secured via OAuth 2.0 / JWT.

### Scalability & Reliability
*   **NFR7:** System shall support 100 concurrent render tasks with < 20% latency impact.
*   **NFR8:** System shall maintain 99.9% uptime (excluding scheduled maintenance).

### Accessibility
*   **NFR9:** Project management interface shall comply with WCAG 2.1 Level A standards.
