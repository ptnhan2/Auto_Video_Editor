---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Auto_Video_Editor - Phân rã Epic

## Tổng quan

Tài liệu này cung cấp danh sách đầy đủ các Epic và Story cho Auto_Video_Editor, phân rã các yêu cầu từ PRD, Thiết kế UX (nếu có) và yêu cầu Kiến trúc thành các câu chuyện có thể triển khai được.

## Danh mục Yêu cầu

### Yêu cầu Chức năng (Functional Requirements)

FR1: Người dùng có thể bóc tách kịch bản thô thành các lớp Âm thanh (Audio), Hình ảnh (Visual) và Nhân vật (Persona) (Triple-Script).
FR2: Hệ thống tự động gán các thẻ metadata về cảm xúc/hành động từ việc phân tích kịch bản.
FR3: Hệ thống có thể thực hiện quy trình SAM Segmentation -> SVG Vectorization -> Auto-Rigging.
FR4: Hệ thống thực hiện chuyển đổi mô hình tự động (Gemini sang DeepSeek) ở cấp độ đoạn (chunk).
FR5: Người dùng có thể chọn người dẫn chuyện ảo từ thư viện các nhân vật 2D đã được gắn xương sẵn.
FR6: Người dùng có thể lọc và chọn trang phục cho người dẫn chuyện bằng các Style Presets.
FR7: Người dùng có thể tạo và lưu các bộ nhân vật dẫn chuyện tùy chỉnh.
FR8: Người dùng có thể xem bản xem trước độ phân giải thấp tức thì sau khi điều chỉnh metadata.
FR9: Người dùng có thể điều chỉnh cảm xúc/hành động của nhân vật qua các thẻ trên Timeline.
FR10: Hệ thống thực hiện khớp môi cơ bản (lip-sync) dựa trên biên độ âm thanh.
FR11: Người dùng có thể áp dụng các hiệu ứng chuyển cảnh điện ảnh từ thư viện mẫu.
FR12: Hệ thống thực hiện kiểm duyệt nội dung trên các kịch bản đầu ra được tạo ra.
FR13: Hệ thống hiển thị các cờ báo lỗi trực tiếp trên các đoạn văn bản cụ thể gây ra lỗi an toàn.
FR14: Hệ thống chèn các hạt giống ngẫu nhiên (randomization seeds) vào mọi quá trình render.
FR15: Người dùng phải xác nhận tuyên bố từ chối trách nhiệm bản quyền trước khi tải lên tài sản cá nhân.
FR16: Người dùng có thể tạo, lưu, xóa và quản lý các dự án video.
FR17: Người dùng có thể xuất video cuối cùng ở nhiều định dạng/chất lượng khác esnhau.
FR18: Hệ thống ngăn chặn việc chỉnh sửa đồng thời trên cùng một dự án (Locking).
FR19: Người dùng có thể tiếp tục/thử lại các tác vụ render nặng từ điểm kiểm tra (checkpoint) cuối cùng.

### Yêu cầu Phi chức năng (Non-Functional Requirements)

NFR1: Thời gian phản hồi UI < 200ms cho mọi sự kiện tương tác.
NFR2: Không gian làm việc của dự án tải trong < 3 giây cho các dự án dưới 10 phút.
NFR3: Tốc độ xuất video cuối cùng không vượt quá 1.5 lần thời gian thực.
NFR4: Mọi tài sản của người dùng và dữ liệu nhân vật phải được mã hóa khi lưu trữ.
NFR5: Dữ liệu giống như sinh trắc học của người dùng (Khuôn mặt/Giọng nói) không được sử dụng để huấn luyện mô hình công khai nếu không có sự đồng ý rõ ràng.
NFR6: Giao tiếp API phải được bảo mật qua OAuth 2.0 / JWT.
NFR7: Hệ thống hỗ trợ 100 tác vụ render đồng thời với tác động độ trễ < 20%.
NFR8: Hệ thống duy trì thời gian hoạt động 99.9% (không bao gồm bảo trì định kỳ).
NFR9: Giao diện quản lý dự án phải tuân thủ tiêu chuẩn WCAG 2.1 Cấp độ A.

### Yêu cầu Bổ sung

- **Starter Template**: Next.js 15 + Shadcn UI + Zustand. Sử dụng React Compiler để tối ưu hiệu năng.
- **Hạ tầng**: Supabase (PostgreSQL + Storage) cho dữ liệu/tài sản. Vercel để lưu trữ web.
- **Điều phối AI**: Vercel AI SDK cho Gemini (Chính) và DeepSeek (Dự phòng).
- **Render GPU**: Modal.com (Serverless GPU) cho SAM/Rigging và render cuối cùng.
- **Đồng bộ trạng thái**: Store Zustand đóng vai trò cầu nối giữa UI Shell và Remotion Video Engine.
- **Mẫu UX**: Bảng điều khiển Studio 3 cột (Tài sản | Xem trước/Timeline | Thuộc tính).
- **Phản hồi**: Desktop (Studio), Máy tính bảng (Review), Di động (Monitor).
- **Bảo mật**: Mã hóa dữ liệu, OAuth 2.0 / JWT, Xác nhận bản quyền.
- **Xử lý lỗi**: Logic dự phòng (3 lần thử lại), Báo lỗi an toàn trực tiếp trên dòng.

### Bản đồ bao phủ yêu cầu (FR Coverage Map)

FR1: Epic 1 - Bóc tách kịch bản Triple-Script
FR2: Epic 1 - Gán thẻ metadata cảm xúc/hành động
FR3: Epic 2 - Pipeline Auto-Rigging (SAM + SVG)
FR4: Epic 1 - Tự động Failover Gemini/DeepSeek
FR5: Epic 2 - Thư viện nhân vật 2D đã gắn xương
FR6: Epic 2 - Lọc/Chọn trang phục cho nhân vật
FR7: Epic 2 - Tạo/Lưu bộ nhân vật tùy chỉnh
FR8: Epic 3 - Xem trước bản nháp tức thì
FR9: Epic 3 - Điều chỉnh cảm xúc qua Timeline tags
FR10: Epic 3 - Khớp môi (Lip-sync) cơ bản
FR11: Epic 5 - Hiệu ứng chuyển cảnh điện ảnh
FR12: Epic 1 - Kiểm duyệt nội dung đầu ra
FR13: Epic 1 - Báo lỗi an toàn trên dòng văn bản
FR14: Epic 5 - Chèn Randomization Seeds
FR15: Epic 4 - Xác nhận bản quyền
FR16: Epic 4 - Quản lý dự án (CRUD)
FR17: Epic 5 - Xuất video đa định dạng
FR18: Epic 4 - Ngăn chặn chỉnh sửa đồng thời (Locking)
FR19: Epic 5 - Retry render từ checkpoint

## Danh sách Epic

### Epic 1: Bộ não AI & Triple-Script Engine (Core AI & Triple-Script)

Thiết lập khả năng bóc tách kịch bản thành Audio/Visual/Persona, gán thẻ cảm xúc tự động và cơ chế Failover AI.
**Yêu cầu bao phủ:** FR1, FR2, FR4, FR12, FR13

### Epic 2: Pipeline Cắt ảnh & Nhân vật (Core Character Pipeline)

Xây dựng quy trình tự động hóa từ hình ảnh sang nhân vật dựa trên Blueprint và các điểm đánh dấu Magenta, thay thế cho SAM.
**Yêu cầu bao phủ:** FR3, FR5, FR6, FR7

### Epic 3: Giao diện chỉ đạo Performance Director (Hybrid Editor)

Xây dựng Timeline thông minh và Canvas tương tác để người dùng trực tiếp chỉ đạo diễn xuất của nhân vật AI.
**Yêu cầu bao phủ:** FR8, FR9, FR10, NFR1, NFR2

### Epic 4: Quản trị dự án & Hạ tầng (Infrastructure & Project Management)

Thiết lập hệ thống lưu trữ dự án, bảo mật, quản lý tài sản và quyền truy cập.
**Yêu cầu bao phủ:** FR15, FR16, FR18, NFR4, NFR6, NFR9

### Epic 5: Render Engine & Xuất bản (GPU Rendering & Output)

Hiện thực hóa việc xuất video chất lượng cao qua GPU, đảm bảo tính độc bản và khả năng phục hồi khi lỗi.
**Yêu cầu bao phủ:** FR11, FR14, FR17, FR19, NFR3, NFR7, NFR8

<!-- Lặp lại cho mỗi epic trong epics_list (N = 1, 2, 3...) -->

## Epic 1: Bộ não AI & Triple-Script Engine (Core AI & Triple-Script)

Thiết lập khả năng bóc tách kịch bản thành Audio/Visual/Persona, gán thẻ metadata đa tầng tự động và cơ chế Failover AI.

### Story 1.1: Khởi tạo dự án từ Starter Template (Next.js 15 + Shadcn UI)
Là một Developer,
Tôi muốn khởi tạo cấu trúc dự án từ starter template Next.js 15 và Shadcn UI,
Để thiết lập nền tảng kỹ thuật vững chắc và sẵn sàng cho các bước triển khai tiếp theo.

**Tiêu chí Chấp nhận:**
- **Giả sử** Đã cài đặt môi trường Node.js.
- **Khi** Chạy lệnh khởi tạo dự án theo Kiến trúc đã định nghĩa.
- **Thì** Một dự án Next.js 15 mới được tạo với TypeScript, Tailwind CSS, và Shadcn UI đã được init.
- **Và** Cấu trúc thư mục tuân thủ quy tắc Feature-based (`src/features/`).

### Story 1.2: Tích hợp Vercel AI SDK & Cấu hình Model Routing
Là một Developer,
Tôi muốn thiết lập Vercel AI SDK với cấu hình định tuyến cho Gemini và DeepSeek,
Để hệ thống sẵn sàng xử lý các yêu cầu AI phức tạp với khả năng dự phòng.

**Tiêu chí Chấp nhận:**
- **Giả sử** Dự án đã được khởi tạo thành công.
- **Khi** Hệ thống cấu hình AI SDK trong `src/lib/vercel-ai.ts`.
- **Thì** Hệ thống có thể thực hiện một request test đến cả hai mô hình (Gemini, DeepSeek) thông qua Vercel AI SDK và nhận phản hồi thành công.
- **Và** Các khóa API được quản lý bảo mật qua biến môi trường.

### Story 1.3: Engine bóc tách kịch bản Triple-Script
Là một Creator,
Tôi muốn hệ thống tự động bóc tách kịch bản thô thành 3 tầng dữ liệu riêng biệt (Audio, Visual, Persona),
Để tôi có thể bắt đầu quy trình đạo diễn chi tiết cho từng khía cạnh của video.

**Tiêu chí Chấp nhận:**
- **Giả sử** Tôi cung cấp một đoạn kịch bản văn bản thô.
- **Khi** Tôi yêu cầu phân tích kịch bản.
- **Thì** Hệ thống trả về cấu trúc JSON chứa 3 mảng dữ liệu tương ứng với Audio (lời thoại), Visual (mô tả cảnh), và Persona (thông tin nhân vật).
- **Và** Toàn bộ nội dung kịch bản gốc được bảo toàn và phân loại chính xác.

### Story 1.4: Hệ thống điều phối Metadata đa tầng tự động
Là một Đạo diễn,
Tôi muốn hệ thống tự động gán các thẻ metadata đa tầng (giọng nói, hình ảnh, hành vi) từ phân tích kịch bản,
Để giảm thiểu công sức thiết lập thủ công và có sẵn một khung kịch bản diễn xuất đầy đủ.

**Tiêu chí Chấp nhận:**
- **Giả sử** Một kịch bản đã được bóc tách Triple-Script.
- **Khi** AI Orchestrator phân tích ngữ cảnh của từng đoạn.
- **Thì** Hệ thống tự động chèn các thẻ Metadata phù hợp (ví dụ: Voice: Tone:Excited, Visual: Scene:Office, Persona: Action:Wave).
- **Và** Các thẻ phải có mốc thời gian (timestamp) hoặc vị trí tham chiếu chính xác trong kịch bản.

### Story 1.5: Cơ chế Failover & Chunk-level AI Resilience
Là một người dùng,
Tôi muốn hệ thống tự động chuyển sang DeepSeek nếu Gemini gặp lỗi hoặc bị chặn bởi Safety filter,
Để quy trình sản xuất video của tôi không bị gián đoạn giữa chừng.

**Tiêu chí Chấp nhận:**
- **Giả sử** Một đoạn kịch bản gây ra lỗi Safety Block trên Gemini.
- **Khi** Request đến Gemini trả về lỗi hoặc trống.
- **Thì** Hệ thống tự động thực hiện lại request đó bằng DeepSeek cho chính đoạn (chunk) bị lỗi thông qua Vercel AI SDK.
- **Và** Hệ thống ghi lại lịch sử failover để tối ưu hóa lần sau.

### Story 1.6: Kiểm duyệt nội dung & Báo lỗi Inline
Là một Creator,
Tôi muốn biết chính xác đoạn văn bản nào vi phạm chính sách an toàn thông qua các cờ báo lỗi trên dòng,
Để tôi có thể chỉnh sửa kịch bản nhanh chóng và đảm bảo video đủ điều kiện kiếm tiền.

**Tiêu chí Chấp nhận:**
- **Giả sử** Đầu ra của AI chứa nội dung nhạy cảm vi phạm quy tắc.
- **Khi** OpenAI Moderation check được kích hoạt.
- **Thì** Hệ thống đánh dấu chính xác vị trí văn bản vi phạm trong giao diện biên tập.
- **Và** Hiển thị hướng dẫn hành động cụ thể thay vì mã lỗi kỹ thuật.

## Epic 2: Pipeline Cắt ảnh & Nhân vật (Core Character Pipeline)

Xây dựng quy trình tự động hóa từ hình ảnh sang nhân vật có xương chuyển động được dựa trên Blueprint và các điểm đánh dấu Magenta.

### Story 2.1: Phát hiện điểm đánh dấu (Magenta Dot Detection)
Là một Developer,
Tôi muốn sử dụng OpenCV để tự động phát hiện 8 điểm Magenta (#FF00FF) trên nền xanh,
Để xác định chính xác các tọa độ cắt (head, shoulders, armpits, crotch, hands).

**Tiêu chí Chấp nhận:**
- **Giả sử** Một ảnh nhân vật được tạo ra với 8 chấm Magenta.
- **Khi** Chạy thuật toán lọc màu và phát hiện tâm (centroid).
- **Thì** Hệ thống trả về danh sách tọa độ (x, y) của đúng 8 điểm theo thứ tự đã định nghĩa.

### Story 2.2: Thuật toán Cắt ảnh thông minh (Smart Crop & Masking)
Là một Developer,
Tôi muốn sử dụng Sharp để cắt ảnh thành các bộ phận dựa trên tọa độ điểm Magenta và vùng biên Chroma Key (#00FF00),
Để tách rời Đầu, Thân, Tay và Chân một cách chính xác mà không cần SAM.

**Tiêu chí Chấp nhận:**
- **Giả sử** Đã có tọa độ 8 điểm từ Story 2.1.
- **Khi** Thực hiện lệnh cắt.
- **Thì** Tạo ra các file ảnh riêng lẻ cho từng bộ phận với nền trong suốt (Alpha channel).
- **Và** Các vết cắt phải mượt mà, không bị dính màu nền xanh.

### Story 2.3: Quy trình SVG Vectorization & Layering (Dựa trên Blueprint)
Là một Creator,
Tôi muốn các bộ phận đã cắt được vector hóa và xếp lớp (layering) theo đúng cấu trúc Blueprint,
Để đảm bảo tính nhất quán giữa các nhân vật khác nhau.

**Tiêu chí Chấp nhận:**
- **Giả sử** Có các bộ phận đã cắt từ Story 2.2.
- **Khi** Chạy quy trình Vectorization.
- **Thì** Tạo ra một file SVG hoàn chỉnh với cấu trúc layer được đặt tên chuẩn.
- **Và** Vị trí các layer khớp 100% với Master Blueprint.

### Story 2.4: Hệ thống Auto-Rigging & Gán điểm xoay từ Magenta Points
Là một Đạo diễn,
Tôi muốn sử dụng chính các điểm Magenta làm điểm xoay (Pivot Points) và khớp nối (Joints),
Để nhân vật có thể cử động tự nhiên ngay sau khi cắt.

**Tiêu chí Chấp nhận:**
- **Giả sử** Một file SVG nhân vật đã phân layer.
- **Khi** Chạy thuật toán Auto-Rigging.
- **Thì** Hệ thống xác định các điểm Joint (khớp) và Pivot (điểm xoay) hợp lý cho từng bộ phận.
- **Và** Tạo ra một cấu hình xương (Skeleton data) có thể nạp vào Remotion.

### Story 2.5: Thư viện Nhân vật & Quản lý Trang phục (Closet)
Là một Creator,
Tôi muốn chọn nhân vật từ thư viện có sẵn và thay đổi trang phục (Style Presets),
Để tạo ra sự đa dạng cho người dẫn chuyện phù hợp với nhiều chủ đề video khác nhau.

**Tiêu chí Chấp nhận:**
- **Giả sử** Tôi mở thư viện Virtual Hosts.
- **Khi** Tôi chọn một nhân vật và áp dụng một Style Preset.
- **Thì** Nhân vật trên Canvas thay đổi diện mạo (trang phục, kiểu tóc) nhưng vẫn giữ nguyên cấu trúc xương.
- **Và** Trạng thái được lưu vào Persona layer của dự án.

## Epic 3: Giao diện chỉ đạo Performance Director (Hybrid Editor)

Xây dựng Timeline thông minh và Canvas tương tác để người dùng trực tiếp chỉ đạo diễn xuất của nhân vật AI.

### Story 3.1: Canvas tương tác & Click-to-Select
Là một Đạo diễn,
Tôi muốn click trực tiếp vào nhân vật trên màn hình xem trước để mở bảng thuộc tính,
Để tôi có thể điều chỉnh diện mạo hoặc tư thế một cách trực quan nhất.

**Tiêu chí Chấp nhận:**
- **Giả sử** Một nhân vật đang hiển thị trên Remotion Canvas.
- **Khi** Tôi click vào nhân vật.
- **Thì** Hệ thống xác định đúng đối tượng và hiển thị Property Panel tương ứng bên phải.
- **Và** Có hiệu ứng highlight (viền xanh) quanh nhân vật được chọn.

### Story 3.2: Narrative Timeline đa tầng (Multi-track Behavior Bar)
Là một Đạo diễn,
Tôi muốn một Timeline chia thành các lớp chuyên biệt (Face, Body, Stage, Look),
Để tôi có thể điều phối đồng thời nhiều khía cạnh diễn xuất của nhân vật trên cùng một mốc thời gian.

**Tiêu chí Chấp nhận:**
- **Giả sử** Dự án có dữ liệu Metadata đa tầng từ Epic 1.
- **Khi** Timeline được hiển thị.
- **Thì** Các thẻ (tags) hành vi được phân loại theo màu sắc và hiển thị trên các track tương ứng.
- **Và** Tôi có thể kéo thả để thay đổi vị trí hoặc thời lượng của các thẻ này.

### Story 3.3: Xem trước bản nháp tức thì (Instant Proxy Preview)
Là một Creator,
Tôi muốn xem trước chuyển động của nhân vật dưới dạng khung xương (Skeleton) ngay khi điều chỉnh thẻ,
Để tôi có thể kiểm tra ý đồ diễn xuất mà không phải chờ render lâu.

**Tiêu chí Chấp nhận:**
- **Giả sử** Tôi vừa thay đổi một thẻ hành động trên Timeline.
- **Khi** Playhead di chuyển qua đoạn đó.
- **Thì** Canvas hiển thị nhân vật chuyển động tức thì (có thể dùng low-res hoặc skeleton view).
- **Và** Độ trễ phản hồi UI phải dưới 200ms.

### Story 3.4: Hệ thống Khớp môi (Lip-sync) theo Audio
Là một Đạo diễn,
Tôi muốn khuôn miệng nhân vật tự động chuyển động khớp với giọng nói (TTS),
Để video trông sinh động và chân thực hơn.

**Tiêu chí Chấp nhận:**
- **Giả sử** Có file Audio được sinh ra từ Audio layer.
- **Khi** Preview hoặc Render video.
- **Thì** Thành phần Mouth của nhân vật SVG thay đổi hình dạng dựa trên biên độ và tần số âm thanh.
- **Và** Chuyển động phải đồng bộ hoàn toàn với âm thanh.

## Epic 4: Quản trị dự án & Hạ tầng (Infrastructure & Project Management)

Thiết lập hệ thống lưu trữ dự án, bảo mật, quản lý tài sản và quyền truy cập.

### Story 4.1: Khởi tạo Project & Lưu trữ Supabase
Là một Creator,
Tôi muốn tạo mới và lưu dự án vào đám mây,
Để tôi có thể truy cập và làm việc ở bất cứ đâu.

**Tiêu chí Chấp nhận:**
- **Giả sử** Tôi nhấn nút "New Project".
- **Khi** Tôi đặt tên và lưu dự án.
- **Thì** Một bản ghi được tạo trong bảng `projects` của Supabase với Metadata đầy đủ.
- **Và** Trạng thái dự án được đồng bộ liên tục.

### Story 4.2: Quản lý Tài sản (Asset Management) & Mã hóa
Là một người dùng,
Tôi muốn các tài sản cá nhân (ảnh, giọng nói) được mã hóa và lưu trữ an toàn,
Để bảo vệ quyền riêng tư và dữ liệu của tôi.

**Tiêu chí Chấp nhận:**
- **Giả sử** Tôi tải lên một file SVG cá nhân.
- **Khi** File được lưu vào Supabase Storage.
- **Thì** Dữ liệu phải được mã hóa tại chỗ (at rest).
- **Và** Chỉ tôi mới có quyền truy cập vào các tài sản này.

### Story 4.3: Cơ chế File Locking (Ngăn chặn xung đột)
Là một Creator,
Tôi muốn hệ thống cảnh báo nếu có người khác đang chỉnh sửa cùng một dự án,
Để tránh việc ghi đè dữ liệu và mất mát công sức làm việc.

**Tiêu chí Chấp nhận:**
- **Giả sử** Một dự án đang được mở bởi User A.
- **Khi** User B cố gắng mở cùng dự án đó để chỉnh sửa.
- **Thì** Hệ thống hiển thị thông báo "Project is currently locked" và chỉ cho phép User B ở chế độ Read-only.

## Epic 5: Render Engine & Xuất bản (GPU Rendering & Output)

Hiện thực hóa việc xuất video chất lượng cao qua GPU, đảm bảo tính độc bản và khả năng phục hồi khi lỗi.

### Story 5.1: GPU Render Farm Integration (Remotion + Modal.com)
Là một Creator,
Tôi muốn render video chất lượng cao bằng sức mạnh của GPU serverless,
Để tiết kiệm thời gian chờ đợi và đảm bảo độ ổn định cho video dài.

**Tiêu chí Chấp nhận:**
- **Giả sử** Tôi nhấn nút "Export HQ Video".
- **Khi** Task render được gửi đến Modal.com.
- **Thì** Hệ thống sử dụng GPU để render các frame video bằng Remotion engine.
- **Và** Trả về link download file MP4 hoàn chỉnh sau khi xong.

### Story 5.2: Cơ chế Anti-Slop & Độc bản hóa (Randomization)
Là một Creator,
Tôi muốn video của mình luôn là độc bản để có thể bật kiếm tiền trên các nền tảng xã hội,
Để tránh bị đánh dấu là nội dung lặp lại (Repetitive Content/AI Slop).

**Tiêu chí Chấp nhận:**
- **Giả sử** Hai người dùng sử dụng cùng một kịch bản.
- **Khi** Hệ thống thực hiện render.
- **Thì** Tự động chèn Randomization Seed để tạo ra sự khác biệt nhỏ về MD5 hash, frame timing và biến thể màu sắc.
- **Và** Video vượt qua các bài kiểm tra AI Slop cơ bản.

### Story 5.3: Giám sát Render & Retry Checkpoints
Là một người dùng,
Tôi muốn theo dõi tiến độ render và có thể thử lại nếu gặp sự cố,
Để tôi không phải bắt đầu lại từ đầu nếu mạng bị ngắt hoặc server gặp lỗi.

**Tiêu chí Chấp nhận:**
- **Giả sử** Một tác vụ render 30 phút đang chạy.
- **Khi** Tôi nhìn vào giao diện dashboard.
- **Thì** Hiển thị thanh tiến trình (progress bar) thời gian thực.
- **Và** Nếu tiến trình bị ngắt giữa chừng, tôi có thể nhấn "Resume" để tiếp tục từ checkpoint gần nhất.
