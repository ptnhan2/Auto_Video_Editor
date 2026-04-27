# Nghiên cứu Chuyên sâu: Lỗ hổng Chunking & Giải pháp Context Preservation Nâng cao (Agentic Workflow)

Sau khi phân tích kỹ lưỡng các hệ lụy từ việc chia nhỏ kịch bản, đặc biệt là bài toán **Entity Consistency (Tính nhất quán của thực thể)** như số lượng nhân vật bị sai lệch, loạn danh xưng, hay mâu thuẫn bối cảnh, tài liệu này bổ sung các nghiên cứu cấp bách và giải pháp kiến trúc nâng cao.

## 1. Phân tích các "Lỗ hổng" (Vulnerabilities) của phương pháp tiếp cận cơ bản

Ngay cả khi dùng phương pháp "Two-Pass" (Quét vĩ mô lấy bối cảnh -> Quét vi mô lấy thoại) hay "Stateful Passing" (Truyền state từ Chunk 1 sang Chunk 2), hệ thống vẫn đối mặt với các rủi ro chí mạng:

1.  **Vấn đề ranh giới (Boundary Misalignment):** Nếu cắt cứng ở 300 từ, nhát cắt có thể rơi ngay giữa một câu thoại hoặc chia cắt một hành động liên hoàn. Chunk 2 mất hoàn toàn ngữ cảnh hành động từ Chunk 1.
2.  **Đứt gãy liên kết (Coreference Resolution Failure):** Kịch bản chunk 1 giới thiệu "Ông chủ quán". Chunk 2 chỉ viết "Lão ta bước tới". AI ở Chunk 2 không có dữ liệu để biết "Lão ta" chính là "Ông chủ quán". Kết quả: Tạo ra một `speaker` mới hoàn toàn (hallucination).
3.  **Lỗi Dây Chuyền (Cascading Errors):** Trong phương pháp truyền State, nếu Chunk 2 AI nhận diện sai bối cảnh (tưởng nhân vật đã ra ngoài), nó sẽ truyền State sai đó cho Chunk 3, 4, 5. Toàn bộ phần sau của video sẽ bị sai bối cảnh.
4.  **Giới hạn Token của Macro-Pass:** Nếu kịch bản là một tiểu thuyết 500 trang, ngay cả bước "Quét vĩ mô" cũng sẽ vượt quá giới hạn Token hoặc làm AI mất tập trung (Lost in the middle).

## 2. Giải pháp Kiến trúc Nâng cao: Agentic Chunking & Memory Graphs

Thay vì viết code Python chia chuỗi bằng `split()`, xu hướng hiện nay (như các tài liệu từ IBM, LangChain) chuyển sang **Agentic Chunking** kết hợp **Persistent Memory**.

### A. Agentic Chunking (Chia chunk bằng AI)
Không chia theo số chữ, mà giao cho một mô hình AI nhỏ/nhanh (như Gemini Flash) đọc lướt và **chỉ định điểm cắt (split points)**.
*   **Tiêu chí cắt:** Chỉ cắt khi kết thúc một Scene, hoặc khi có sự thay đổi rõ rệt về thời gian/địa điểm.
*   **Lợi ích:** Các chunk không còn bị độ dài cố định ép buộc. Một chunk có thể dài 100 từ hoặc 500 từ miễn là nó trọn vẹn một cảnh. Nhờ đó, bài toán "nhân vật bốc hơi" (từ 7 người thành 4 người) được giải quyết vì AI xử lý trọn vẹn toàn bộ sự kiện của cảnh đó trong 1 chunk.

### B. Mạng lưới Thực thể (Knowledge Graph / Entity Memory)
Áp dụng các công cụ quản lý bộ nhớ dài hạn như **Mem0** hoặc LangGraph Memory.
1.  **Extract & Store:** Khi xử lý Chunk 1, AI phát hiện 7 nhân vật. Nó lập tức gọi Tool: `upsert_memory(entity_type="character", name="Ông chủ quán", alias=["Lão ta", "Lão chủ"])`.
2.  **Retrieve & Resolve:** Khi xử lý Chunk 2, AI gặp từ "Lão ta". Hệ thống tự động truy vấn Mem0: "Lão ta là ai trong cảnh này?". Mem0 trả về "Ông chủ quán". AI gán chính xác `speaker: "Ông chủ quán"`.
3.  **Global vs Local State:** Hệ thống duy trì 2 lớp dữ liệu:
    *   **Global Entity Registry:** Danh sách "Thiên Hà" lưu mọi nhân vật, địa điểm từng xuất hiện trong toàn bộ truyện.
    *   **Local Scene State:** Danh sách các nhân vật đang "Active" trong Scene hiện tại. Khi hết Scene, Local State bị reset, nhưng Global State vẫn giữ nguyên.

### C. Self-Correction Loop (Vòng lặp tự sửa sai bằng LLM)
Trái tim của hệ thống: Đừng tin tưởng LLM ở lần chạy đầu tiên.
*   Sau khi Trạm 1 xuất ra file JSON cho một Scene. Hãy đưa file JSON đó qua một Node "Reviewer" (Kiểm duyệt).
*   **Reviewer Prompt:** "Đây là JSON của Cảnh 2. Hãy kiểm tra xem các `speaker` có nằm trong danh sách `characters_present` không? Có nhân vật nào đang nói mà bối cảnh là 'dưới biển' không?".
*   Nếu phát hiện lỗi (như mâu thuẫn số lượng người, sai tên), Reviewer sẽ gửi tín hiệu trả lại cho Node Ingestor yêu cầu chạy lại (Regenerate) kèm theo lý do lỗi.

## 3. Tổng kết Khuyến nghị Kỹ thuật
Để xây dựng Trạm Ingestor hoàn hảo cho kịch bản dài:
1.  Bỏ việc chia chunk bằng số từ (Word-count splitting).
2.  Xây dựng **Semantic Router / Agentic Chunker**: Dùng Gemini để cắt kịch bản theo **chuyển cảnh (Scene changes)**.
3.  Sử dụng một cơ sở dữ liệu in-memory (như Redis hoặc vector DB nhỏ) để lưu trữ danh bạ nhân vật (Character Registry).
4.  Cài đặt **Validation Pydantic nghiêm ngặt**: Ép trường `speaker` phải match với danh sách `characters_present` được cập nhật từ bộ nhớ toàn cục. Nếu LLM trả về một speaker lạ, Pydantic ném lỗi -> kích hoạt Self-Correction để LLM tự suy luận lại.
