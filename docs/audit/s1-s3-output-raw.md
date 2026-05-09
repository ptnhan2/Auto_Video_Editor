# Bao cao chat luong Pipeline S1-S3

## Lan chay 1: Gemini (gemini/gemini-3-flash-preview)

- S1: OK (43s) - sinh screenplay thanh cong, luu vao script_content
- S2: FAILED - RateLimitError (429 Too Many Requests), vuot quota free tier (5 req/min)
- S3: KHONG CHAY - bi gian doan do S2 that bai

## Lan chay 2: DeepSeek (deepseek/deepseek-chat)

- Da sua `src/config/ai_models.py`: station_1_rewriter, station_2_extractor, station_3_breaker doi thanh `deepseek/deepseek-chat`
- S1: DA CHAY THANH CONG o lan 1, khong can chay lai
- S2: FAILED - Authentication Fails, DEEPSEEK_API_KEY khong hop le (401 Unauthorized)
- S3: KHONG CHAY - bi gian doan do S2 that bai

## Ket luan: Pipeline S1-S3 KHONG CHAY HET

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

## S2 Output (Seeded data - pipeline crashed)

- **Nhan vat:** Nam (TC1)
  - **Mo ta:** Chàng trai 28 tuổi, bị bạn gái bắt quả tang tin nhắn mập mờ với đồng nghiệp. Ban đầu anh bối rối, cố gắng phủ nhận và nổi nóng để che đậy, nhưng sau đó đã hối lỗi và tìm cách xoa dịu bạn gái.
  - **Vai tro:** Chính

- **Nhan vat:** Trang (TC1)
  - **Mo ta:** Cô gái 26 tuổi, đang trải qua cú sốc tâm lý khi phát hiện bạn trai có dấu hiệu phản bội. Cô thể hiện sự đau đớn, phẫn nộ và cuối cùng là sự yếu đuối, sợ mất đi tình yêu.
  - **Vai tro:** Chính

- **Nhan vat:** Narrator
  - **Mo ta:** Người dẫn dắt câu chuyện, mô tả bối cảnh và cảm xúc của nhân vật.
  - **Vai tro:** Narrator

## S3 Output (Seeded data - pipeline crashed)

### Canh: Trước cửa nhà Nam
- **Prompt:** A quiet street at night under heavy pouring rain. A young woman with wet hair and a soaked white shirt stands alone in front of a closed wooden door, looking devastated. Dim streetlights, thunder in the distance.
- **So luong storyboard:** 1

### Canh: Cửa chính nhà Nam
- **Prompt:** A wooden front door opens, revealing a warm yellow light from inside. A young man in pajamas stands at the doorway, looking shocked. Outside, it's dark and raining heavily.
- **So luong storyboard:** 1

### Canh: Hiên nhà Nam
- **Prompt:** The man and woman are standing under a small porch, sheltered from the rain. They are both wet. The man gently brushes wet hair from her forehead. She looks up at him with teary, vulnerable eyes.
- **So luong storyboard:** 1

### Canh: Phòng khách nhà Nam
- **Prompt:** Inside a cozy, dimly lit living room. The man and woman are sitting on the floor near the entrance, hugging each other. The woman is still sobbing quietly. Through the window, rain can be seen falling outside.
- **So luong storyboard:** 1

## Cau hoi can tra loi trong bao cao

### 1. Pipeline S1-S3 chay het khong? Co crash khong?
Pipeline S1-S3 **KHONG** chay het. Crash o tram **S2**.
- Lan chay 1 (Gemini): S1 OK. S2 crash voi `RateLimitError (429)`. Quota free tier Gemini (5 req/min) bi vuot.
- Lan chay 2 (DeepSeek): S1 da chay xong o lan 1. S2 crash voi `401 Unauthorized` - DEEPSEEK_API_KEY khong hop le.
- S3 khong kip chay trong ca 2 lan do S2 that bai.

### 2. Output co dung schema khong?
- Output S1 dung schema: luu vao `script_content` theo format markdown screenplay phan canh.
- Output S2 va S3 khong duoc sinh ra moi do crash. Du lieu hien co (character/scene) la du lieu seed san tu `scripts/seed_edge_cases.py`.

### 3. Co thieu file output nao khong?
- Thieu toan bo output moi tu S2 (Extractor) va S3 (Storyboard Breaker) do pipeline crash.
- Can kich hoat DeepSeek API key hop le hoac nang cap Gemini API tier de pipeline chay hoan chinh.
