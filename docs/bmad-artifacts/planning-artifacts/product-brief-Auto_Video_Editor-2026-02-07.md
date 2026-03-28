---
stepsCompleted: [1, 2, 3, 4, 5]

---

## MVP Scope

### Core Features
*   **Multi-layer Orchestration Engine:** Hệ thống "Bộ não" AI tự động bóc tách kịch bản thô thành 3 lớp kịch bản (Audio, Visual, Authentic Me) kèm theo bộ thẻ Metadata (Tags) điều khiển thời gian thực (Start/End của SFX, BGM, Pose nhân vật).
*   **Authentic Me Persona:** Cho phép người dùng xuất hiện trong video thông qua 3 chế độ tương tác (Overlay, Participant, Director) để tạo dấu ấn cá nhân và vượt qua bộ lọc AI Slop.
*   **Automated Cutout & Rigging Pipeline:** Tự động hóa quy trình SAM Segmentation -> SVG Vectorization -> Auto-Rigging với quy chuẩn tỷ lệ nhân vật.
*   **Hybrid Smart Timeline (Remotion):** Giao diện chỉnh sửa trực quan cho phép người dùng thay đổi "Thẻ cảm xúc" hoặc tinh chỉnh chuyển cảnh nghệ thuật mà không cần biết code.
*   **Cinematic Transitions Library:** Bộ mẫu chuyển cảnh phức tạp (Morphing, Seamless Cuts) được điều khiển tự động dựa trên nhịp điệu của video.

### Out of Scope for MVP
*   Hệ thống cộng đồng và chia sẻ Templates.
*   Tự động upload trực tiếp lên các nền tảng MXH.
*   Môi trường 3D hoàn chỉnh (Chỉ tập trung vào 2D Animation).

### MVP Success Criteria
*   **Technical Proof:** Hoàn thành video 30 phút tự động với tỷ lệ lỗi < 20%.
*   **User Validation:** Creator phản hồi tiết kiệm được 80% thời gian sản xuất.
*   **Operational Goal:** Chi phí API < 10% doanh thu dự kiến.

### Future Vision
Trong 2-3 năm tới, dự án sẽ tiến hóa thành một **"AI Directing Platform"** toàn diện, cho phép bất kỳ ai cũng có thể vận hành một kênh truyền hình/phim hoạt hình cá nhân với chất lượng studio chuyên nghiệp.

---

---

## Success Metrics

### User Success Metrics
Chúng ta thành công khi người dùng đạt được sự tự do trong sáng tạo và an toàn về thu nhập:
*   **Monetization Safety:** 100% video tạo ra vượt qua các bài kiểm tra "AI Slop" và "Repetitive Content" để được bật kiếm tiền trên YouTube.
*   **Production Efficiency:** Giảm 80% thời gian hoàn thiện video (Ví dụ: Một video 10 phút trước đây mất 5 tiếng làm thủ công thì nay chỉ còn tối đa 1 tiếng bao gồm cả khâu review).
*   **Emotional Accuracy:** Tỷ lệ AI gán sai cảm xúc/nhịp điệu không quá 20% (5 đoạn thoại thì tối đa chỉ có 1 đoạn cần người dùng chỉnh sửa sâu).

### Business Objectives
*   **Market Penetration:** Đạt cột mốc **1000 người dùng** đăng ký sử dụng trong 3 tháng đầu tiên kể từ khi ra mắt MVP.
*   **Cost Efficiency:** Tối ưu hóa hạ tầng để tổng chi phí API (Qwen3-TTS, SAM, GPU) luôn duy trì ở mức **dưới 10% doanh thu**.

### Key Performance Indicators (KPIs)
*   **Pass Rate:** Số lượng video bị nền tảng cảnh báo / Tổng số video xuất bản = 0%.
*   **Time-to-Publish:** Thời gian trung bình từ lúc nạp text đến lúc xuất video 10 phút < 60 phút.
*   **Cost-per-Hour:** Chi phí biến đổi trên mỗi giờ video thành phẩm (đảm bảo mục tiêu lợi nhuận gộp > 90%).

---

---

## Target Users

### Primary Users: Professional AI Creators
*   **Persona:** **"Minh - Nhà kể chuyện chiến lược"**.
*   **Bối cảnh:** Sở hữu các kênh chuyên về Review phim/truyện và Tin tức. Cần tần suất ra video cao nhưng đang bị thuật toán "bóp nghẹt" do nội dung thiếu tính độc bản.
*   **Nỗi đau:** Nguy cơ bị gỡ video/tắt kiếm tiền do lỗi "AI Slop". Việc sản xuất video hoạt hình có cảm xúc quá tốn kém thời gian và tiền bạc.
*   **Động lực:** Tìm kiếm công cụ tự động hóa khâu "chân tay" (cắt ghép, rigging) nhưng cho phép lồng ghép cá tính riêng để bảo vệ kênh bền vững.

### Secondary Users: Small Marketing Agencies
*   **Mục tiêu:** Sản xuất video quảng cáo ngắn, đồng bộ thương hiệu cho nhiều khách hàng với chi phí tối ưu và chất lượng "không giống AI".

---

## User Journey

1.  **Discovery:** Minh nhận thông báo video bị bóp reach do "AI Slop" và tìm kiếm giải pháp tạo video "Authentic".
2.  **Onboarding:** Minh tạo Avatar cá nhân (Authentic Avatar). AI tự động tách lớp và rigging ảnh cá nhân thành nhân vật Animation mượt mà.
3.  **Core Usage:** Minh nạp kịch bản. Hệ thống **Triple-Script** tự động bóc tách Audio, Visual và Lời bình cá nhân.
4.  **Aha Moment:** 
    *   Thấy phiên bản Animation của mình xuất hiện, thể hiện đúng quan điểm và cảm xúc trong video.
    *   Ngỡ ngàng với các hiệu ứng chuyển cảnh (Transitions) phức tạp, cinematic (Morphing, Seamless Cuts) thay vì slide ảnh đơn điệu.
5.  **Success:** Video xuất ra có "chất" riêng, vượt qua mọi bộ lọc của YouTube/TikTok, tỷ lệ giữ chân khán giả tăng mạnh.

---
inputDocuments: 
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-05.md'
  - '_bmad-output/planning-artifacts/research/market-authentic-video-editor-research-2026-02-05.md'
  - '_bmad-output/planning-artifacts/research/domain-authentic-video-editor-research-2026-02-05.md'
  - '_bmad-output/planning-artifacts/research/technical-animation-tts-research-2026-02-06.md'
date: 2026-02-07
author: Nhan
---

# Product Brief: Auto_Video_Editor

## Executive Summary
**Auto_Video_Editor** là một nền tảng sản xuất video Hybrid thế hệ mới, giải cứu các Creator khỏi cuộc khủng hoảng "AI Slop". Sản phẩm không chỉ tự động hóa quy trình sản xuất video hoạt hình 2D (SVG) bằng sức mạnh của **SAM**, **Remotion**, và **Qwen3-TTS**, mà còn cho phép người dùng lồng ghép "Cái tôi kỹ thuật số" (Authentic Avatar) để dẫn dắt, bình luận và thể hiện quan điểm cá nhân, đảm bảo tính Authentic và khả năng kiếm tiền bền vững.

---

## Core Vision

### Problem Statement
Sự bùng nổ của video AI chất lượng thấp (Slop) khiến các nền tảng video siết chặt thuật toán, gây rủi ro lớn cho thu nhập của Creator. Người dùng hiện tại bị kẹt giữa các công cụ AI "Black Box" không thể chỉnh sửa và quy trình làm thủ công quá tốn kém thời gian.

### Problem Impact
Hàng tỷ lượt xem bị gỡ bỏ, uy tín kênh suy giảm. Rào cản kỹ thuật về Animation và Rigging khiến việc tạo ra nội dung hoạt hình có chiều sâu cảm xúc trở thành đặc quyền của những người có chuyên môn cao.

### Why Existing Solutions Fall Short
Các giải pháp AI hiện nay thường thiếu khả năng can thiệp ở cấp độ frame và không hỗ trợ cá nhân hóa chiều sâu. Các phần mềm chuyên nghiệp đòi hỏi kỹ năng quá cao và không có sự hỗ trợ thông minh từ AI để giảm tải công việc "nhàm chán".

### Proposed Solution: AI-Powered Personal Studio
Hệ thống **"AI Draft - Human Direct"** với cơ chế **Triple-Script Processing**:
*   **Audio Script:** Tự động phân vai, biểu cảm (Emotional TTS) và SFX.
*   **Visual Script:** Tự động tách bộ phận (SAM), Rigging và lắp ghép Timeline (Remotion).
*   **Authentic Me Script:** Lời bình và phản ứng của người dùng thông qua Avatar cá nhân.

### Key Differentiators
*   **The "Authentic Me" Persona:** Hỗ trợ 3 chế độ tương tác (Overlay, Participant, Director) để chủ kênh xuất hiện và thể hiện quan điểm trong video.
*   **Automated Puppet Rigging:** Quy chuẩn hóa tỷ lệ và tự động hóa gắn xương SVG, cho phép chỉnh sửa xương mặt/body trực quan.
*   **Hybrid Timeline Management:** Giao diện chỉnh sửa thông minh cho phép người dùng sửa lỗi logic của AI ngay lập tức mà không cần code.
*   **Extreme Cost Efficiency:** Sử dụng Qwen3-TTS và Serverless GPU giúp tối ưu chi phí vận hành (20.000 VNĐ/giờ audio).

---

<!-- Content will be appended sequentially through collaborative workflow steps -->
