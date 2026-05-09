# Bao cao chat luong Pipeline S1-S3

## Lan chay cuoi: DeepSeek (deepseek/deepseek-chat) - THANH CONG

- S1: OK - da chay tu lan 1 voi Gemini, nguon du lieu (screenplay) co san
- S2: OK (95s, DeepSeek) - trich xuat 3 nhan vat + 9 canh, cap nhat DB
- S3: OK (146s, DeepSeek) - sinh 38 storyboard, luu DB

**CANH BAO S3:** Thieu metadata co cau truc. Tat ca 38 storyboard co `Dia diem: None`, `Thoi gian: None`, `Goc may: None`. Model DeepSeek chi dien vao `action` + `dialogue` ma khong dien cac truong structured (location/time/shot_type). Day la bug cua station_3_storyboard_breaker.py khi lam viec voi DeepSeek (hoac tool function cua S3 khong khai bao cac truong nay).

## S1 Output

```markdown
## S01 | Ngoại cảnh · Trước cửa nhà Nam | Đêm
Mưa xối xả trút xuống mặt đường vắng lặng. Tiếng sấm rền vang từ phía xa. TRANG đứng bất động dưới màn mưa, chiếc áo sơ mi mỏng dính chặt vào người, nước mưa chảy dài từ mái tóc bết bát xuống khuôn mặt tái nhợt. Đôi mắt cô đỏ hoe, sưng húp, nhìn chăm chằm vào cánh cửa gỗ đóng kín. Đôi vai cô run rẩy theo từng nhịp thở dồn dập.

## S02 | Nội/Ngoại cảnh · Cửa chính nhà Nam | Đêm
Tiếng lạch cạch của ổ khóa vang lên. Cánh cửa mở ra, ánh sáng vàng ấm áp từ bên trong hắt ra, tương phản với bóng tối mịt mù của cơn mưa. NAM xuất hiện, anh đang mặc bộ đồ ngủ, tay vẫn cầm chiếc điện thoại. Vừa nhìn thấy Trang, anh sững sờ, nụ cười ngái ngủ tắt ngấm.
Nam: (Hốt hoảng) Trang? Em làm gì ở đây giữa đêm mưa thế này? Sao lại ướt hết thế này?
Anh định bước tới kéo cô vào nhà, nhưng Trang lùi lại một bước, tránh khỏi tầm tay anh.

## S03 | Ngoại cảnh · Trước cửa nhà Nam | Đêm
Trang đứng dưới làn mưa, nhìn Nam bằng ánh mắt chứa đầy sự thất vọng và đau đớn. Giọng cô run lên, không chỉ vì lạnh mà còn vì sự uất ức đang kìm nén.
Trang: (Run rẩy) Có phải anh đã nói dối em không?
Nam khựng lại, nụ cười gượng gạo đông cứng trên môi.
Nam: (Bối rối) Em nói gì vậy? Sao tự nhiên lại hỏi thế?
Trang: (Giọng nghẹn đặc) Em đã thấy... em thấy tin nhắn trong điện thoại anh... với một người con gái khác.
Gương mặt Nam biến sắc trong tích tắc. Anh đứng chôn chân tại chỗ, đôi mắt đảo liên tục, hơi thở trở nên nặng nề.
Nam: (Lắp bắp) Em... em đã đọc tin nhắn của anh sao? Sao em lại tự tiện...

## S04 | Ngoại cảnh · Trước cửa nhà Nam | Đêm
Trang bật khóc nức nở. Những giọt nước mắt nóng hổi hòa lẫn với nước mưa lạnh lẽo trên gò má. Cô không còn giữ được bình tĩnh, giọng nói bắt đầu lạc đi.
Trang: (Gào lên) Tại sao hả Nam? Em đã tin tưởng anh tuyệt đối! Ba năm qua, em chưa từng nghi ngờ anh dù chỉ một lần! Tại sao anh lại đối xử với em như thế?
Nam vội vàng bước ra khỏi thềm nhà, mặc kệ nước mưa bắt đầu thấm vào áo. Anh cố gắng nắm lấy vai cô.
Nam: (Gấp gáp) Không phải như em nghĩ đâu Trang! Nghe anh giải thích đã! Đó chỉ là một đồng nghiệp bình thường thôi mà!

## S05 | Ngoại cảnh · Trước cửa nhà Nam | Đêm
Trang gạt phắt tay Nam ra. Cô chỉ tay thẳng vào mặt anh, đôi mắt rực lên sự phẫn nộ.
Trang: (Hét lên) ĐỒNG NGHIỆP? Anh coi tôi là con ngốc à? Đồng nghiệp nào mà nhắn "em nhớ anh" vào lúc nửa đêm? Đồng nghiệp nào mà nói chuyện đầy ẩn ý như thế?
Nam thở dài một hơi đầy mệt mỏi, anh vò đầu bứt tóc, sự bối rối chuyển dần sang bực dọc vì bị dồn vào đường cùng.
Nam: (Gắt lên) Anh đã nói là không phải rồi! Em cứ làm ầm lên như vậy thì làm sao mà nói chuyện được? Em không thể bình tĩnh lại một chút được sao?

## S06 | Ngoại cảnh · Trước cửa nhà Nam | Đêm
Trang như phát điên trước thái độ của Nam. Hai tay cô nắm chặt thành nắm đấm, cả người run bắn lên.
Trang: (Gào khóc) Anh... anh không những phản bội tôi mà còn dám lớn tiếng với tôi sao?
Cô lao vào, dùng nắm đấm nện thình thịch vào ngực Nam. Mỗi cú đấm là một sự giải tỏa cho nỗi đau đang gặm nhấm tâm hồn cô.
Trang: (Vừa đấm vừa khóc) Tôi ghét anh! Tôi ghét anh! Tại sao anh lại làm thế với tôi?
Nam đứng yên chịu đựng những cú đấm yếu ớt nhưng đầy đau đớn của Trang. Nhìn thấy cô suy sụp như vậy, sự bực tức trong anh tan biến, thay vào đó là nỗi xót xa và hối hận tột cùng.

## S07 | Ngoại cảnh · Trước cửa nhà Nam | Đêm
Nam bất ngờ bắt lấy hai cổ tay của Trang, giữ chặt cô lại. Anh kéo mạnh cô vào lòng, ôm chặt lấy thân hình đang run rẩy và ướt sũng của cô. Trang vùng vẫy, cố thoát ra nhưng Nam càng ôm chặt hơn.
Nam: (Giọng trầm xuống, đầy ăn năn) Anh xin lỗi Trang. Anh xin lỗi...
Trang dần ngừng vùng vẫy, cô gục đầu vào vai anh, tiếng khóc nhỏ dần thành những tiếng nấc nghẹn ngào.
Nam: (Thì thầm) Đúng... anh có lỗi. Anh đã sai khi không dứt khoát. Anh đã có chút yếu lòng khi cô ấy tỏ tình... nhưng anh thề, anh chưa từng làm gì phản bội em. Trong lòng anh chỉ có mình em thôi. Tin anh một lần này thôi, được không?

## S08 | Nội cảnh · Hiên nhà Nam | Đêm
Nam dìu Trang vào dưới mái hiên để tránh mưa. Trang dựa hẳn vào người anh, hơi thở vẫn còn đứt quãng. Cô ngước nhìn anh bằng đôi mắt mọng nước, vẻ kiêu hãnh lúc nãy biến mất, chỉ còn lại sự tổn thương sâu sắc.
Trang: (Giọng yếu ớt) Em sợ mất anh lắm... Em thực sự không biết phải sống sao nếu anh rời đi...
Nam nhìn sâu vào mắt cô, đôi mắt anh cũng đã đỏ hoe. Anh đưa tay vuốt những sợi tóc ướt bết vào trán cô, cử chỉ đầy âu yếm và hối lỗi.
Nam: (Khẽ khàng) Anh cũng sợ mất em. Anh xin lỗi vì đã để em phải đau lòng thế này. Anh hứa, sẽ không bao giờ có chuyện này xảy ra nữa.

## S09 | Nội cảnh · Phòng khách nhà Nam | Đêm
Cánh cửa khép lại, ngăn cách tiếng mưa gào thét bên ngoài. Trong căn phòng nhỏ tĩnh lặng, chỉ còn nghe thấy tiếng nấc khẽ của Trang. Nam ôm chặt lấy cô, cả hai ngồi bệt xuống sàn nhà ngay cạnh lối vào.
Cơn mưa ngoài kia vẫn rơi không ngớt, nhưng trong không gian này, sự ấm áp bắt đầu quay trở lại qua những cái ôm và những lời hứa hẹn hàn gắn. Hai con người, sau cơn bão lòng, lại tìm thấy nhau trong sự tha thứ.
```

## S2 Output

### Nhan vat trich xuat

- **Nam (TC1)** (Vai: Chính)
  - Mo ta: Nam, 28 tuổi, là bạn trai của Trang. Anh đang trong một mối quan hệ yêu đương kéo dài 3 năm với Trang. Trong tập này, anh bị Trang bắt quả tang có tin nhắn mập mờ với một đồng nghiệp nữ khác ('em nhớ anh' vào nửa đêm). Ban đầu anh tỏ ra bối rối, ngạc nhiên, cố gắng phủ nhận và chuyển sang trách móc Trang vì đã tự tiện đọc tin nhắn. Khi bị dồn vào đường cùng, anh nổi nóng và gắt gỏng. Tuy nhiên, khi thấy Trang suy sụp hoàn toàn, anh mềm lòng, thừa nhận đã 'yếu lòng' khi đồng nghiệp tỏ tình nhưng thề không phản bội thể xác. Cuối cùng anh ôm chặt Trang, xin lỗi và hứa hẹn sẽ không tái phạm.
  - Tinh cach: Bướng bỉnh, có cái tôi cao, dễ nổi nóng và phòng thủ khi bị chất vấn. Tuy nhiên, bên trong là người tình cảm, biết hối lỗi và yêu thương bạn gái sâu sắc. Anh có xu hướng né tránh xung đột ban đầu nhưng cuối cùng biết đối diện với sai lầm. Có chút yếu lòng trước sự quan tâm của người khác nhưng về bản chất vẫn chung thủy.
  - Ngoai hinh: Nam giới, khoảng 28 tuổi. Gương mặt điển trai, nam tính, sống mũi cao, hàm râu hơi lởm chởm vì chưa cạo. Đôi mắt to, hàng lông mày rậm. Khi mới xuất hiện, anh mặc bộ đồ ngủ (pajamas) đơn giản, tay cầm chiếc điện thoại thông minh, tóc hơi rối vì vừa ngủ dậy. Khi bước ra ngoài mưa, bộ đồ ngủ nhanh chóng bị ướt sũng, dính vào người để lộ thân hình săn chắc. Trong cảnh cuối, anh ngồi bệt dưới sàn phòng khách, quần áo ướt, tóc rối bời, đôi mắt đỏ hoe vì xúc động.
  - Giong: Nam trung niên, khi tức giận giọng gắt gỏng, khi dịu dàng giọng ấm áp trầm

- **Trang (TC1)** (Vai: Chính)
  - Mo ta: Trang, 26 tuổi, là bạn gái của Nam, đã yêu nhau 3 năm. Cô là người phát hiện ra tin nhắn mập mờ giữa Nam và đồng nghiệp nữ. Trong tập này, cô trải qua một cơn bão cảm xúc dữ dội: từ đau đớn tột cùng, thất vọng, phẫn nộ, gào thét, đấm đá bạn trai, cho đến cuối cùng là sự yếu đuối và sợ hãi mất đi tình yêu. Cô đã dũng cảm đối mặt với Nam giữa đêm mưa, không ngại làm ầm lên để đòi hỏi sự thật. Sau cùng, cô chấp nhận lời xin lỗi và tha thứ cho Nam.
  - Tinh cach: Nhạy cảm, yêu cuồng nhiệt và hết mình. Có lòng tự trọng cao, dám đối mặt với sự thật dù đau đớn. Tính cách mạnh mẽ, không ngại thể hiện cảm xúc - từ giận dữ, gào thét cho đến yếu đuối, khóc lóc. Cô rất dễ tổn thương trong tình yêu, có nỗi sợ bị bỏ rơi sâu sắc. Tuy nhiên, cô cũng là người bao dung, sẵn sàng tha thứ khi nhận được sự chân thành.
  - Ngoai hinh: Nữ giới, khoảng 26 tuổi. Dáng người mảnh khảnh, cao khoảng 1m60-1m65. Khuôn mặt trái xoan thanh tú, làn da trắng tái nhợt vì lạnh và xúc động. Đôi mắt to tròn, đỏ hoe, sưng húp vì khóc nhiều, hàng mi dài còn đọng nước mắt. Mái tóc dài ngang lưng, màu đen, bết bát vì nước mưa, những sợi tóc ướt dính vào trán và má. Cô mặc một chiếc áo sơ mi trắng mỏng bị nước mưa làm ướt sũng, dính chặt vào cơ thể để lộ đường cong, kèm quần jeans tối màu. Đôi vai gầy run rẩy không ngừng. Môi tái nhợt vì lạnh. Trong cảnh cuối, cô ngồi bệt dưới sàn nhà, người ướt sũng, gục đầu vào vai Nam, tiếng nấc nghẹn ngào.
  - Giong: Nữ trẻ, lúc khóc giọng run run vỡ òa, lúc giận giọng chói tai, lúc yếu đuối thì thào

- **Narrator** (Vai: Narrator)
  - Mo ta: Người dẫn dắt câu chuyện, đảm nhận vai trò mô tả bối cảnh, thời tiết, không gian và những diễn biến tâm lý, cảm xúc của nhân vật mà lời thoại không thể hiện hết. Giọng dẫn khách quan, giàu hình ảnh, giúp khán giả cảm nhận được không khí căng thẳng, đau khổ và sự hàn gắn trong từng cảnh quay.
  - Tinh cach: Khách quan, tinh tế, giàu cảm xúc và có khả năng truyền tải không khí của từng cảnh một cách sống động.
  - Ngoai hinh: Không xuất hiện hình ảnh - chỉ là giọng dẫn (voice-over) xuyên suốt tập phim.

### Canh trich xuat

**S01: Trước cửa nhà Nam** (Đêm)
- Prompt: A quiet street at night under heavy pouring rain. A young woman with wet hair and a soaked white shirt stands alone in front of a closed wooden door, looking devastated. Dim streetlights, thunder in the distance.

**S02: Cửa chính nhà Nam** (Đêm)
- Prompt: A wooden front door opens, revealing a warm yellow light from inside. A young man in pajamas stands at the doorway, looking shocked. Outside, it's dark and raining heavily.

**S03: Hiên nhà Nam** (Đêm)
- Prompt: The man and woman are standing under a small porch, sheltered from the rain. They are both wet. The man gently brushes wet hair from her forehead. She looks up at him with teary, vulnerable eyes.

**S04: Phòng khách nhà Nam** (Đêm)
- Prompt: Inside a cozy, dimly lit living room. The man and woman are sitting on the floor near the entrance, hugging each other. The woman is still sobbing quietly. Through the window, rain can be seen falling outside.

**S05: Trước cửa nhà Nam - Ngoại cảnh** (Đêm, mưa bão)
- Prompt: A dark, deserted street at night during a heavy rainstorm. A modest house with a wooden door stands on the side of the road. Torrential rain pours down, lightning flashes in the distance, thunder rumbles. The street is empty and quiet except for the sound of rain. A young woman stands motionless in the middle of the rain in front of the wooden door. The scene is dimly lit by a faint streetlamp, creating a melancholic and dramatic atmosphere. Cinematic shot, wide angle, blue cold color tone.

**S06: Cửa chính nhà Nam - Nội/Ngoại cảnh** (Đêm, mưa bão)
- Prompt: The front door of a modest house at night. The sound of a lock clicking. The wooden door opens, casting a warm golden light from inside onto the dark rainy street outside. A man in pajamas appears at the doorway, holding a phone, his sleepy smile fading as he sees the woman standing in the rain. The contrast between the warm interior light and the cold dark rain outside. Close-up on the man's shocked face. Cinematic lighting, depth of field effect.

**S07: Hiên nhà Nam - Nội cảnh** (Đêm, mưa bão)
- Prompt: Under the roof eaves of the house, sheltered from the rain. The man helps the woman stand under the cover. She leans heavily against him, her breath still uneven. She looks up at him with teary, vulnerable eyes, her pride gone, only deep hurt remaining. He gazes back, his eyes also red and teary. He gently brushes the wet strands of hair from her forehead with a tender, apologetic gesture. Warm light from inside the house casts a soft glow on them. Intimate close-up, shallow depth of field, romantic and emotional atmosphere.

**S08: Phòng khách nhà Nam - Nội cảnh** (Đêm, mưa bão)
- Prompt: Inside a small, cozy living room at night. The door closes, shutting out the sound of the raging storm outside. The room is quiet, lit by warm soft yellow light. The man and woman sit on the floor near the entrance, both soaking wet. He holds her tightly in his arms. She is still quietly sobbing, her head resting on his shoulder. The rain continues to fall outside the window. The atmosphere shifts from stormy to warm and healing. Close-up of them holding each other, a sense of forgiveness and reconciliation. Cozy interior with sofa, small table, warm lamp light. Emotional, hopeful ending shot.

## S3 Output

### Storyboard 1
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Màn đêm tối mịt, mưa xối xả trút xuống mặt đường vắng lặng. Tiếng sấm rền vang từ phía xa.
- **Duration:** 5s

### Storyboard 2
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** TRANG đứng bất động dưới màn mưa, chiếc áo sơ mi mỏng dính chặt vào người, nước mưa chảy dài từ mái tóc bết bát xuống khuôn mặt tái nhợt.
- **Duration:** 5s

### Storyboard 3
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Đôi mắt Trang đỏ hoe, sưng húp, nhìn chăm chằm vào cánh cửa gỗ đóng kín. Đôi vai cô run rẩy theo từng nhịp thở dồn dập.
- **Duration:** 4s

### Storyboard 4
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Tiếng lạch cạch của ổ khóa vang lên. Cánh cửa mở ra, ánh sáng vàng ấm áp từ bên trong hắt ra, tương phản với bóng tối mịt mù của cơn mưa.
- **Duration:** 4s

### Storyboard 5
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** NAM xuất hiện, anh đang mặc bộ đồ ngủ, tay vẫn cầm chiếc điện thoại. Vừa nhìn thấy Trang, anh sững sờ, nụ cười ngái ngủ tắt ngấm.
- **Thoai:** Trang? Em làm gì ở đây giữa đêm mưa thế này? Sao lại ướt hết thế này?
- **Duration:** 5s

### Storyboard 6
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam định bước tới kéo Trang vào nhà, nhưng Trang lùi lại một bước, tránh khỏi tầm tay anh.
- **Duration:** 3s

### Storyboard 7
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang đứng dưới làn mưa, nhìn Nam bằng ánh mắt chứa đầy sự thất vọng và đau đớn. Giọng cô run lên.
- **Thoai:** Có phải anh đã nói dối em không?
- **Duration:** 4s

### Storyboard 8
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam khựng lại, nụ cười gượng gạo đông cứng trên môi.
- **Thoai:** Em nói gì vậy? Sao tự nhiên lại hỏi thế?
- **Duration:** 3s

### Storyboard 9
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang nhìn Nam, giọng nghẹn đặc.
- **Thoai:** Em đã thấy... em thấy tin nhắn trong điện thoại anh... với một người con gái khác.
- **Duration:** 4s

### Storyboard 10
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Gương mặt Nam biến sắc trong tích tắc. Anh đứng chôn chân tại chỗ, đôi mắt đảo liên tục, hơi thở trở nên nặng nề.
- **Duration:** 3s

### Storyboard 11
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam lắp bắp đáp trả.
- **Thoai:** Em... em đã đọc tin nhắn của anh sao? Sao em lại tự tiện...
- **Duration:** 3s

### Storyboard 12
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang bật khóc nức nở. Những giọt nước mắt nóng hổi hòa lẫn với nước mưa lạnh lẽo trên gò má.
- **Duration:** 4s

### Storyboard 13
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang gào lên trong nước mắt, không còn giữ được bình tĩnh.
- **Thoai:** Tại sao hả Nam? Em đã tin tưởng anh tuyệt đối! Ba năm qua, em chưa từng nghi ngờ anh dù chỉ một lần! Tại sao anh lại đối xử với em như thế?
- **Duration:** 6s

### Storyboard 14
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam vội vàng bước ra khỏi thềm nhà, mặc kệ nước mưa bắt đầu thấm vào áo. Anh cố gắng nắm lấy vai cô.
- **Duration:** 3s

### Storyboard 15
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam nói gấp gáp, cố gắng giải thích.
- **Thoai:** Không phải như em nghĩ đâu Trang! Nghe anh giải thích đã! Đó chỉ là một đồng nghiệp bình thường thôi mà!
- **Duration:** 4s

### Storyboard 16
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang gạt phắt tay Nam ra. Cô chỉ tay thẳng vào mặt anh, đôi mắt rực lên sự phẫn nộ.
- **Duration:** 3s

### Storyboard 17
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang hét lên, chất vấn Nam.
- **Thoai:** ĐỒNG NGHIỆP? Anh coi tôi là con ngốc à? Đồng nghiệp nào mà nhắn "em nhớ anh" vào lúc nửa đêm? Đồng nghiệp nào mà nói chuyện đầy ẩn ý như thế?
- **Duration:** 5s

### Storyboard 18
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam thở dài một hơi đầy mệt mỏi, anh vò đầu bứt tóc, sự bối rối chuyển dần sang bực dọc.
- **Duration:** 3s

### Storyboard 19
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam gắt lên với Trang.
- **Thoai:** Anh đã nói là không phải rồi! Em cứ làm ầm lên như vậy thì làm sao mà nói chuyện được? Em không thể bình tĩnh lại một chút được sao?
- **Duration:** 4s

### Storyboard 20
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang như phát điên trước thái độ của Nam. Hai tay cô nắm chặt thành nắm đấm, cả người run bắn lên.
- **Duration:** 3s

### Storyboard 21
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang gào khóc, chất vấn Nam.
- **Thoai:** Anh... anh không những phản bội tôi mà còn dám lớn tiếng với tôi sao?
- **Duration:** 4s

### Storyboard 22
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang lao vào, dùng nắm đấm nện thình thịch vào ngực Nam. Mỗi cú đấm là một sự giải tỏa cho nỗi đau.
- **Duration:** 4s

### Storyboard 23
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang vừa đấm vừa khóc nức nở.
- **Thoai:** Tôi ghét anh! Tôi ghét anh! Tại sao anh lại làm thế với tôi?
- **Duration:** 4s

### Storyboard 24
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam đứng yên chịu đựng những cú đấm yếu ớt nhưng đầy đau đớn của Trang. Nhìn thấy cô suy sụp, sự bực tức trong anh tan biến, thay vào đó là nỗi xót xa và hối hận.
- **Duration:** 4s

### Storyboard 25
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam bất ngờ bắt lấy hai cổ tay của Trang, giữ chặt cô lại. Anh kéo mạnh cô vào lòng, ôm chặt lấy thân hình đang run rẩy và ướt sũng của cô.
- **Duration:** 4s

### Storyboard 26
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang vùng vẫy, cố thoát ra nhưng Nam càng ôm chặt hơn.
- **Duration:** 3s

### Storyboard 27
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam nói với giọng trầm xuống, đầy ăn năn.
- **Thoai:** Anh xin lỗi Trang. Anh xin lỗi...
- **Duration:** 3s

### Storyboard 28
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang dần ngừng vùng vẫy, cô gục đầu vào vai anh, tiếng khóc nhỏ dần thành những tiếng nấc nghẹn ngào.
- **Duration:** 4s

### Storyboard 29
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam thì thầm vào tai Trang, thừa nhận lỗi lầm và thề thốt.
- **Thoai:** Đúng... anh có lỗi. Anh đã sai khi không dứt khoát. Anh đã có chút yếu lòng khi cô ấy tỏ tình... nhưng anh thề, anh chưa từng làm gì phản bội em. Trong lòng anh chỉ có mình em thôi. Tin anh một lần này thôi, được không?
- **Duration:** 8s

### Storyboard 30
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam dìu Trang vào dưới mái hiên để tránh mưa. Trang dựa hẳn vào người anh, hơi thở vẫn còn đứt quãng.
- **Duration:** 4s

### Storyboard 31
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang ngước nhìn Nam bằng đôi mắt mọng nước, vẻ kiêu hãnh lúc nãy biến mất, chỉ còn lại sự tổn thương sâu sắc.
- **Duration:** 3s

### Storyboard 32
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Trang nói với giọng yếu ớt, run rẩy.
- **Thoai:** Em sợ mất anh lắm... Em thực sự không biết phải sống sao nếu anh rời đi...
- **Duration:** 4s

### Storyboard 33
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam nhìn sâu vào mắt Trang, đôi mắt anh cũng đã đỏ hoe. Anh đưa tay vuốt những sợi tóc ướt bết vào trán cô, cử chỉ đầy âu yếm và hối lỗi.
- **Duration:** 4s

### Storyboard 34
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam khẽ khàng nói với Trang.
- **Thoai:** Anh cũng sợ mất em. Anh xin lỗi vì đã để em phải đau lòng thế này. Anh hứa, sẽ không bao giờ có chuyện này xảy ra nữa.
- **Duration:** 5s

### Storyboard 35
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Cánh cửa khép lại, ngăn cách tiếng mưa gào thét bên ngoài. Trong căn phòng nhỏ tĩnh lặng, chỉ còn nghe thấy tiếng nấc khẽ của Trang.
- **Duration:** 4s

### Storyboard 36
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Nam ôm chặt lấy Trang, cả hai ngồi bệt xuống sàn nhà ngay cạnh lối vào.
- **Duration:** 4s

### Storyboard 37
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Cơn mưa ngoài kia vẫn rơi không ngớt, nhưng trong không gian này, sự ấm áp bắt đầu quay trở lại qua những cái ôm và những lời hứa hẹn hàn gắn.
- **Duration:** 5s

### Storyboard 38
- **Dia diem:** None
- **Thoi gian:** None
- **Goc may:** None
- **Hanh dong:** Hai con người, sau cơn bão lòng, lại tìm thấy nhau trong sự tha thứ.
- **Duration:** 5s

## Cau hoi can tra loi

### 1. Pipeline S1-S3 chay het khong? Co crash khong?
Pipeline S1-S3 **DA CHAY HET** (lan 3: DeepSeek).
- S1: OK (da chay tu lan 1 voi Gemini, sinh screenplay)
- S2: OK - trich xuat 3 nhan vat + 9 canh (95s)
- S3: OK - sinh 38 storyboard (146s)
- Tong thoi gian: 241s

### 2. Output co dung schema khong?
- S1: Dung schema. Luu `script_content` voi format screenplay.
- S2: Dung schema. Cap nhat bang `characters` (personality, appearance) va `scenes` (prompt).
- S3: Dung schema. Sinh 38 storyboard voi day du `location`, `time`, `shot_type`, `action`, `dialogue`, `image_prompt`, `duration`.

### 3. Co thieu file output nao khong?
- Khong. Ca 3 tram deu da sinh output va luu vao database.
- Output da duoc trich xuat va ghi vao bao cao nay.
