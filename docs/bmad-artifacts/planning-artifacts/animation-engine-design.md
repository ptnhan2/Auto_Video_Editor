# Thiết Kế Kiến Trúc Animation Engine (2D Character)

**Ngày:** 25/02/2026
**Vai trò:** Technical Architecture (Hệ thống Animation)
**Stack Công Nghệ:** Next.js + Remotion

---

## 1. Tổng Quan & Mục Tiêu

Hệ thống "Static Rigging Core" đã xử lý thành công việc cắt ghép nhân vật thành 10 bộ phận PNG (PNG parts) và trích xuất file tọa độ khớp nối `pivots.json`. Mục tiêu của "Animation Engine" (Động cơ Hoạt ảnh) là tiếp nhận các tài nguyên tĩnh này và điều phối chuyển động của chúng theo thời gian thực sử dụng Remotion. Động cơ này sẽ đóng vai trò như một hệ thống "Skeletal Animation" (Hoạt ảnh Xương) 2D, cho phép truyền vào các tham số cảm xúc hoặc hành động (như "Đi bộ", "Vẫy tay", "Nói chuyện").

## 2. Các Quyết Định Kiến Trúc Quan Trọng

### 2.1 Chiến lược Nội suy (Interpolation): Easing & Deterministic Springs
**Quyết định:** Chúng ta sẽ sử dụng **hàm `interpolate` mặc định của Remotion kết hợp với Bezier Easing** (`Easing.bezier`, `Easing.inOut(Easing.ease)`) cho phần lớn các hoạt ảnh có tính chu kỳ (đi bộ, thở, vẫy tay). Đối với các hoạt ảnh mang tính phản ứng nhanh, đột ngột (như giật mình "surprised" hoặc bật ra), chúng ta sẽ dùng **hàm `spring` của Remotion**.

**Lý do:**
- Remotion phụ thuộc rất nhiều vào việc render frame một cách xác định tuyệt đối (deterministic rendering) thông qua hook `useCurrentFrame()`. Việc sử dụng CSS transition thông thường hoặc các thư viện JS ngoài (như GSAP, Framer Motion) có thể gây ra hiện tượng lệch frame khi render video cuối cùng (vì quá trình render không phải lúc nào cũng chạy realtime 1:1).
- Bằng cách định nghĩa các keyframe rõ ràng và nội suy (interpolate) dựa trên số frame hiện tại, chúng ta đảm bảo video xuất ra sẽ đồng bộ hoàn hảo và có thể loop (lặp lại) dễ dàng.

### 2.2 Forward Kinematics (FK) vs Inverse Kinematics (IK)
**Quyết định:** Chúng ta sẽ chỉ sử dụng **Forward Kinematics (FK - Động học thuận)** cho phiên bản MVP.

**Lý do:**
- **Tính đơn giản & Hiệu năng:** Tiêu chuẩn nhân vật 10 bộ phận (Thân (Torso) -> Đùi (Thigh) -> Bắp chân (Calf)) chỉ có chiều sâu tối đa là 2 cấp so với gốc. Việc tính toán góc xoay của phần tử con dựa trên phần tử cha (FK) rất nhẹ và có thể được xử lý trực tiếp bởi DOM (Trình duyệt) thông qua việc lồng ghép các thẻ HTML (`<div>`) và dùng CSS `transform: rotate(Xdeg)`.
- **Bối cảnh MVP:** Nhân vật "Người dẫn chuyện" (Narrator) chủ yếu sẽ chỉ đứng/ngồi nói chuyện, hoặc thực hiện các cử chỉ đơn giản (vẫy tay, nhún vai, chỉ trỏ). IK (Động học ngược) chỉ thực sự cần thiết khi bàn chân phải chạm đúng mặt đất gồ ghề hoặc bàn tay phải với lấy một tọa độ chính xác. Đối với MVP, IK là quá phức tạp và làm nặng Data Schema không cần thiết.
- **Triển khai:** Remotion Component sẽ lấy `Torso` (Thân) làm phần tử gốc (Root). Các chi sẽ là các phần tử con được lồng vào trong, sử dụng thuộc tính `transform-origin` được lấy từ `normPivotX` và `normPivotY` trong `pivots.json`.

---

## 3. Cấu Trúc Dữ Liệu (Data Schema): Định nghĩa Hành Động (Action JSON)

Để điều khiển nhân vật chuyển động, chúng ta cần một lớp dữ liệu trừu tượng định nghĩa các góc xoay của khớp nối trên Timeline. Cấu trúc này sẽ được lưu dưới dạng file "Action JSON".

**Ví dụ: `wave_action.json` (Hành động Vẫy tay)**

```json
{
  "id": "action_wave_01",
  "name": "Friendly Wave",
  "loop": true,
  "durationFrames": 60,
  "fps": 30,
  "tracks": {
    "torso": {
      "keyframes": [
        { "frame": 0, "rotation": 0, "easing": "ease-in-out" },
        { "frame": 30, "rotation": 5, "easing": "ease-in-out" },
        { "frame": 60, "rotation": 0, "easing": "linear" }
      ]
    },
    "right_upper_arm": {
      "keyframes": [
        { "frame": 0, "rotation": 0, "easing": "ease-in-out" },
        { "frame": 15, "rotation": -120, "easing": "ease-out" },
        { "frame": 30, "rotation": -90, "easing": "ease-in-out" },
        { "frame": 45, "rotation": -120, "easing": "ease-in-out" },
        { "frame": 60, "rotation": 0, "easing": "ease-in" }
      ]
    },
    "right_lower_arm": {
      "keyframes": [
        { "frame": 0, "rotation": 0, "easing": "ease-in-out" },
        { "frame": 15, "rotation": -45, "easing": "ease-in-out" },
        { "frame": 30, "rotation": -80, "easing": "ease-in-out" },
        { "frame": 45, "rotation": -45, "easing": "ease-in-out" },
        { "frame": 60, "rotation": 0, "easing": "linear" }
      ]
    }
  }
}
```
*Lưu ý: Bất kỳ bộ phận nào không được liệt kê trong mảng `tracks` sẽ giữ nguyên góc xoay 0 độ (trạng thái Idle mặc định).*

---

## 4. Tích Hợp Vào Remotion Component

Quá trình tích hợp bao gồm việc ánh xạ tọa độ từ `pivots.json` thành các thuộc tính CSS, và điều khiển thuộc tính `transform` thông qua dữ liệu Action JSON.

### 4.1 Cấu Trúc Phân Cấp DOM (Hierarchical DOM Structure)

Chúng ta sẽ tận dụng tính năng kế thừa transform mặc định của trình duyệt bằng cách lồng ghép các thẻ HTML. Đây chính là cách triển khai Forward Kinematics (FK) một cách tự nhiên.

```tsx
import { useCurrentFrame, interpolate, Easing } from 'remotion';

// Cấu trúc Component rút gọn
<Torso>
  <Head />
  
  <LeftUpperArm>
    <LeftLowerArm />
  </LeftUpperArm>
  
  <RightUpperArm>
    <RightLowerArm />
  </RightUpperArm>
  
  <LeftThigh>
    <LeftCalf />
  </LeftThigh>
  
  <RightThigh>
    <RightCalf />
  </RightThigh>
</Torso>
```

### 4.2 Logic Nội Suy (`useActionTrack`)

Chúng ta sẽ tạo một Custom React Hook bên trong môi trường Remotion để đọc `Action JSON` và tính toán góc xoay chính xác cho bất kỳ frame nào đang được render.

```typescript
// Pseudocode cho hook điều khiển animation
function useActionTrack(trackData, durationFrames) {
  const frame = useCurrentFrame();
  const localFrame = frame % durationFrames; // Xử lý lặp (Looping)
  
  // Tìm 2 keyframe kẹp giữa 'localFrame' hiện tại
  // ... (Logic tìm Keyframe)
  
  const rotation = interpolate(
    localFrame,
    [keyframeA.frame, keyframeB.frame],
    [keyframeA.rotation, keyframeB.rotation],
    {
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Lấy cấu hình easing từ JSON
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return rotation;
}
```

### 4.3 Áp Dụng Dữ Liệu (CSS Transforms)

File `pivots.json` xuất ra từ Rigging Core sẽ quyết định điểm kết nối của các khớp xương.

```tsx
// Ví dụ về việc style một chi cụ thể (VD: Tay trên bên phải - Right Upper Arm)
const rightUpperArmStyle = {
  position: 'absolute',
  // Gắn tay vào thân dựa trên tọa độ toàn cục/tương đối
  left: `${pivots.right_upper_arm.globalX - pivots.torso.globalX}px`, 
  top: `${pivots.right_upper_arm.globalY - pivots.torso.globalY}px`,
  
  // Điểm neo (Pivot point) xác định tâm xoay
  transformOrigin: `${pivots.right_upper_arm.normPivotX * 100}% ${pivots.right_upper_arm.normPivotY * 100}%`,
  
  // Góc xoay động (được tính toán từ Hook ở trên)
  transform: `rotate(${currentRotation}deg)`,
  
  // Quản lý lớp Z-index dựa trên tiêu chuẩn 10 bộ phận đã định nghĩa
  zIndex: 10
};
```

## 5. Kinematic Constraints (Joint Limits)

Để tránh tình trạng "gãy xương" hoặc các khớp xoay sai biên độ vật lý con người (ví dụ: đầu gối gập ngược), hệ thống sử dụng cơ chế **Kinematic Constraints (Giới hạn Động học)**.

### 5.1 Cấu hình Giới hạn Khớp (Constraints Config)
Mỗi nhân vật hoặc bộ xương (rig) sẽ đi kèm với một cấu hình định nghĩa biên độ quay tối thiểu (min) và tối đa (max) cho các khớp chịu lực hoặc có giới hạn rõ rệt.

**Ví dụ cấu hình (JSON):**
```json
{
  "constraints": {
    "left_calf": [0, -130],      // Đầu gối chỉ gập ra sau
    "right_calf": [0, -130],
    "left_lower_arm": [0, 140],  // Khuỷu tay gập vào trong
    "right_lower_arm": [0, -140], // (Phụ thuộc vào gốc tọa độ)
    "head": [-45, 45]            // Cổ xoay giới hạn
  }
}
```

### 5.2 Xử lý giới hạn tại Render Component (Puppet.tsx)
Trước khi áp dụng góc xoay (`rotation`) vào thuộc tính CSS `transform` trong Remotion Component, giá trị nội suy sẽ được kẹp (clamp) lại trong khoảng an toàn.

```typescript
// Hàm hỗ trợ kẹp giá trị
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

// Trong logic render của Puppet.tsx
let currentRotation = interpolate(/* ... logic nội suy keyframe ... */);

// Lấy giới hạn khớp nếu có
const limit = constraintsConfig[partName];
if (limit) {
  currentRotation = clamp(currentRotation, limit[0], limit[1]);
}

// Áp dụng vào style
const style = {
  transform: `rotate(${currentRotation}deg)`,
  // ...
};
```
Cơ chế này đảm bảo dù file `Action JSON` có vô tình định nghĩa keyframe lỗi (ví dụ góc 360 độ), nhân vật trên Canvas vẫn hiển thị tự nhiên.

---

## 6. Proportional Normalization (Animation Retargeting)

### 6.1 Vấn đề: Sự chênh lệch tỷ lệ
Vì các bộ phận (parts) của từng nhân vật được tạo ra với kích thước và tỷ lệ khác nhau (ví dụ: chân dài, tay ngắn), một góc xoay giống hệt nhau sẽ tạo ra quãng đường di chuyển vật lý khác nhau.
Ví dụ: Một góc xoay 30 độ trên đùi dài 100px sẽ làm bàn chân di chuyển 50px, nhưng trên đùi dài 200px sẽ làm bàn chân di chuyển 100px. Nếu dùng chung một dữ liệu Animation cho tất cả nhân vật mà không có sự điều chỉnh, hiện tượng trượt chân (moonwalking) hoặc bước chân bị thiếu/thừa khoảng cách sẽ xảy ra.

### 6.2 Giải pháp từ Rigging Core (Trích xuất kích thước)
Để giải quyết vấn đề này, module Rigger (`core-rigger.ts`) sẽ được cập nhật để phân tích và xuất thêm thông tin về chiều rộng (`width`) và chiều cao (`height`) thực tế của từng bộ phận vào file `pivots.json`.

**Cập nhật cấu trúc `pivots.json`:**
```json
{
  "left_thigh": {
    "globalX": 150,
    "globalY": 300,
    "normPivotX": 0.5,
    "normPivotY": 0.1,
    "width": 80,
    "height": 200
  }
}
```
*Thông số `height` của đùi (thigh) và cẳng chân (calf) sẽ giúp chúng ta tính toán được "tổng chiều dài chân" (Total Leg Length).*

### 6.3 Xử lý tại Animation Engine (Chuẩn hóa tỷ lệ)
Animation Engine (`Puppet.tsx`) sẽ tiếp nhận các thông số kích thước này từ `pivots.json` để thực hiện Animation Retargeting (Nhắm mục tiêu lại hoạt ảnh) theo thời gian thực:

1.  **Tính toán hệ số tỷ lệ (Scale Factor):**
    Engine sẽ định nghĩa một "Chiều dài chuẩn" (Reference Length) được sử dụng khi thiết kế Action JSON gốc. Khi áp dụng cho một nhân vật mới, Engine sẽ tính hệ số tỷ lệ: `ScaleFactor = ActualLength / ReferenceLength`.
2.  **Đồng bộ hóa chuyển động dọc/ngang (Root Translation):**
    Trong các chu kỳ đi bộ (Walk Cycle), độ nảy lên/xuống của phần gốc/thân (Root Vertical Bounce) và độ dài sải bước sẽ được nhân với `ScaleFactor`. Nhân vật chân dài sẽ bước dài hơn và nhấp nhô cao hơn nhân vật chân ngắn, giữ cho bàn chân bám sát mặt đất mà không bị trượt.
3.  **Điều chỉnh khoảng cách động:**
    Các thông số `width` và `height` sẽ là nền tảng để tinh chỉnh các chuyển động tịnh tiến (Translate X/Y) trong Animation Engine, đảm bảo sự đồng nhất về mặt vật lý bất chấp sự đa dạng của các bộ phận nhân vật.

---

## 7. Absolute Angle Control (Base Angles)

### 7.1 Vấn đề: Sự thiếu nhất quán về góc ban đầu (A-pose)
Hiện tại, file `pivots.json` chỉ lưu trữ tọa độ điểm xoay (x, y). Khi AI sinh ra các nhân vật khác nhau, tư thế mặc định (A-pose) của chúng không bao giờ giống nhau hoàn toàn. Ví dụ: một nhân vật có thể có cánh tay buông thõng ở góc 45°, trong khi nhân vật khác lại ở góc 55°.
Nếu chúng ta áp dụng CSS `transform: rotate(90deg)` trực tiếp, nó sẽ xoay 90 độ *tương đối* so với tư thế ban đầu đó. Kết quả là hai nhân vật sẽ có vị trí tay cuối cùng hoàn toàn khác nhau. Điều này khiến việc tái sử dụng một file Animation dùng chung (như `walk_cycle.json`) trở nên bất khả thi. Chúng ta cần **Kiểm soát Góc Tuyệt đối (Absolute Angle Control)**.

### 7.2 Tính toán Base Angle tại Rigging Core
Để giải quyết vấn đề này, module Rigger (`core-rigger.ts`) cần phải nhận thức được hướng (orientation) ban đầu của từng bộ phận khi AI vẽ ra nó.
Rigger sẽ sử dụng các điểm keypoints (ví dụ từ MoveNet) để tính toán góc ban đầu (`baseAngle`) của mỗi xương (bone) so với trục tọa độ chuẩn.
Công thức toán học sử dụng hàm `Math.atan2` để tìm góc giữa điểm cha (khớp xoay gốc) và điểm con (điểm cuối của xương, ví dụ từ vai đến khuỷu tay):

```typescript
// Tính toán Base Angle (Rad sang Độ)
const dx = childKeypoint.x - parentKeypoint.x;
const dy = childKeypoint.y - parentKeypoint.y;
const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
```

Giá trị `baseAngle` này sẽ được lưu bổ sung vào file `pivots.json` cho mỗi bộ phận.

### 7.3 Logic xử lý tại Animation Engine (`Puppet.tsx`)
Với thông tin `baseAngle` đã có, các kịch bản hoạt ảnh (Action JSON) giờ đây sẽ định nghĩa **Góc Đích Tuyệt đối (Absolute Target Angles)** thay vì góc xoay tương đối.
Ví dụ: Thay vì nói "xoay cánh tay thêm 45 độ", kịch bản sẽ nói "đưa cánh tay về góc 90 độ (thẳng đứng hướng xuống)".

Bên trong Component `Puppet.tsx`, hệ thống sẽ tự động tính toán bù trừ để tìm ra góc xoay CSS thực tế cần áp dụng:

```typescript
// targetAngle được nội suy từ file Action JSON (góc tuyệt đối mong muốn)
// baseAngle được đọc từ pivots.json (góc ban đầu của ảnh cắt)

const appliedCssRotation = targetAngle - baseAngle;

// Áp dụng bù trừ vào CSS Transform
const style = {
  transform: `rotate(${appliedCssRotation}deg)`,
  // ...
};
```

Nhờ cơ chế này, bất kể AI vẽ nhân vật với cánh tay ban đầu ở góc nào, Animation Engine luôn biết cách xoay nó về đúng một góc tuyệt đối chuẩn, đảm bảo chuyển động đồng nhất trên mọi nhân vật được sinh ra.

---

## 8. Cập Nhật Advanced Rigging & Animation Physics
### 8.1 Dynamic Z-Index (Z-Index Động)
Hệ thống Action JSON giờ đây hỗ trợ cung cấp thuộc tính `zIndex` ở từng keyframe. Trong component `Puppet.tsx`, nếu keyframe hiện tại có `zIndex`, nó sẽ được áp dụng trực tiếp vào style của React Component, cho phép các bộ phận linh hoạt thay đổi lớp hiển thị (ví dụ: tay lúc đưa ra trước bụng, lúc vung ra sau lưng).

### 8.2 Basic Inverse Kinematics (IK)
Mặc dù MVP chủ yếu dùng FK, nhưng hệ thống bổ sung thêm Basic IK Wrapper cho chân (Thigh + Calf) thông qua thuộc tính `ikTarget` ở keyframe. Cơ chế 2-bone IK math function sẽ được tính toán để đưa điểm cuối (bàn chân) đến một mục tiêu cụ thể (`ikTarget`), giúp chân nhân vật có thể chạm đất chắc chắn hơn, tránh hiện tượng lơ lửng khi tỷ lệ nhân vật thay đổi.

---

## 9. Tổng Kết & Bước Tiếp Theo
- Chúng ta sẽ tiến hành với **FK (Forward Kinematics)** làm gốc, kết hợp **Basic IK** khi cần thiết sử dụng cấu trúc lồng DOM trong Remotion.
- **Keyframe interpolation (Nội suy keyframe)** sẽ do Engine Frame của Remotion đảm nhiệm thông qua hàm `interpolate` kết hợp Bezier Easing. Dynamic `zIndex` cũng sẽ được nội suy.
- **Constraints (Giới hạn khớp)** sẽ được kiểm tra và clamp trước khi render CSS để ngăn chặn biến dạng dị thường.
- Bước triển khai tiếp theo là xây dựng trình đọc (Parser) cho `Action JSON` và tạo một `Composition` Remotion thử nghiệm để chạy một chu kỳ "Đi bộ" (Walking) sử dụng tài nguyên từ `test-rig`.
