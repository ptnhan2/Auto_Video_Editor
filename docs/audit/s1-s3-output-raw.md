# Bao cao chat luong Pipeline S1-S3

## Input Gốc (Truyện gốc)

Nam và Trang đã yêu nhau ba năm. Một đêm mưa tầm tã, Trang đứng trước cửa nhà Nam, toàn thân ướt sũng, mắt đỏ hoe.

Nam mở cửa và giật mình: "Trang? Em làm gì ở đây giữa đêm mưa thế này?"
Trang nói trong run rẩy: "Có phải anh đã nói dối em không? Em thấy tin nhắn trong điện thoại anh... với một người con gái khác."
Nam sững lại. Mặt anh biến sắc từ ngạc nhiên sang bối rối. Anh lắp bắp: "Em... em đã đọc tin nhắn của anh sao?"

Trang bật khóc. Những giọt nước mắt hòa lẫn với nước mưa trên má. Giọng cô lớn dần, đầy tức giận: "Tại sao hả Nam? Em đã tin tưởng anh tuyệt đối! Ba năm qua, em chưa từng nghi ngờ anh một lần nào!"
Nam bước tới một bước, giọng gấp gáp cố giải thích: "Không phải như em nghĩ đâu Trang! Đó chỉ là đồng nghiệp thôi mà!"
"ĐỒNG NGHIỆP?" Trang hét lên, giọng vỡ òa. Cô chỉ tay thẳng vào mặt Nam: "Đồng nghiệp mà nhắn 'em nhớ anh' lúc nửa đêm à? Anh coi tôi là đồ ngốc sao?"

Nam thở dài mạnh, vò đầu bứt tóc. Sự bực tức bắt đầu leo thang trong ánh mắt anh: "Anh đã nói là không phải rồi! Em cứ làm ầm lên như vậy thì nói chuyện được gì nữa?"
Trang gào lên, hai tay nắm chặt thành nắm đấm, cả người run lên vì cảm xúc hỗn độn: "Anh... anh không những phản bội tôi mà còn dám lớn tiếng với tôi sao?" Cô đấm thình thịch vào ngực Nam, nước mắt trào ra không ngừng: "Tôi GHÉT ANH! GHÉT ANH!"

Nam bắt lấy hai tay Trang, kéo cô vào lòng. Giọng anh dịu lại đột ngột, ấm áp và ăn năn: "Anh xin lỗi Trang. Đúng... anh có sai. Nhưng không phải là phản bội. Anh đã yếu lòng một chút khi đồng nghiệp đó tỏ tình, nhưng anh chưa từng phản bội em. Tin anh đi."

Trang vùng vẫy một lúc rồi nấc lên trong lòng Nam. Giọng cô yếu ớt như đứa trẻ: "Em sợ mất anh lắm... em không biết phải sống sao nếu anh rời đi."
Nam vuốt tóc cô, mắt cũng đỏ hoe. Anh thì thầm: "Anh cũng sợ mất em, Trang à."

Cơn mưa ngoài kia vẫn rơi. Nhưng trong căn phòng nhỏ, hai con người ôm lấy nhau, trong tiếng khóc và cả những lời hứa hẹn hàn gắn.

## Lan chay cuoi: DeepSeek (deepseek/deepseek-chat) - THANH CONG (SAU FIX PR #109)

- S1: OK (170s, DeepSeek) - viet lai kich ban tu content, 6073 tu, 7 canh
- S2: OK (105s, DeepSeek) - trich xuat 3 nhan vat + 7 canh, cap nhat DB
- S3: OK (188s, DeepSeek) - sinh 38 storyboard, luu DB

**FIX CONFIRMED (PR #109):** Sau PR #109 merge, tool schema S3 da duoc cap nhat voi `location` va `time` la required fields. Tat ca 38 storyboard bay gio co `Dia diem` va `Thoi gian` day du (38/38 con). `Goc may (shot_type)` van la None vi S3 system prompt chi dinh khong quan tam den goc may (de danh cho tram sau).

## S1 Output

```markdown
## S01 | Ngoại cảnh · Phố vắng - Trước cửa nhà Nam | Đêm khuya - Mưa tầm tã

Một con phố nhỏ trong đêm. Mưa xối xả trút xuống mặt đường nhựa loang loáng nước. Những hạt mưa nặng trịch đập vào mái tôn, vào vỉa hè, tạo nên một bản nhạc ồn ã duy nhất giữa màn đêm tĩnh mịch.

Bóng dáng một cô gái xuất hiện ở cuối phố. TRANG (25 tuổi), mặc một chiếc áo khoác mỏng, toàn thân ướt sũng. Tóc cô dính chặt vào mặt, nước mưa chảy thành dòng từ mái tóc xuống vai, xuống gấu áo đang nhỏ giọt. Cô bước chậm rãi, từng bước nặng nhọc như thể đôi chân không còn sức lực.

Đôi mắt Trang đỏ hoe, bầu mắt sưng húp. Cô dừng lại trước một cánh cửa gỗ cũ kỹ — căn nhà nhỏ của Nam. Tay cô run run, giơ lên định gõ cửa, nhưng lại chần chừ. Nước mắt cô lặng lẽ lăn dài, hòa vào nước mưa không thể phân biệt.

Cô hít một hơi thật sâu, rồi đập mạnh tay vào cánh cửa.

---

## S02 | Nội cảnh · Phòng khách nhà Nam | Đêm khuya - Mưa

Bên trong căn phòng nhỏ ấm cúng. Một chiếc đèn bàn duy nhất tỏa ánh sáng vàng mờ. NAM (27 tuổi) đang ngồi trên ghế sofa, tay cầm điện thoại. Anh mặc một chiếc áo phông trắng, quần short ở nhà. Trên bàn trước mặt là tách cà phê đã nguội lạnh.

Tiếng gõ cửa dồn dập vang lên.

Nam ngẩng đầu, nhíu mày ngạc nhiên. Đồng hồ trên tường chỉ 11:47 PM. Anh đặt điện thoại xuống bàn, đứng dậy, đi về phía cửa.

Tiếng gõ cửa lại vang lên, lần này mạnh hơn, gấp gáp hơn.

Nam: (Lớn giọng, hơi khó chịu) Ai đấy? Đêm hôm thế này...

Anh vặn tay nắm cửa, kéo cánh cửa mở ra.

---

## S03 | Ngoại cảnh · Trước cửa nhà Nam | Đêm khuya - Mưa

Cánh cửa mở ra. Ánh sáng từ trong nhà hắt ra, soi rõ khuôn mặt Trang — tái nhợt, ướt đẫm, đôi mắt đỏ ngầu vì khóc.

Nam giật mình, mắt mở to. Tay anh vẫn giữ chặt tay nắm cửa, người khựng lại.

Nam: (Kinh ngạc) Trang? Em làm gì ở đây giữa đêm mưa thế này?

Trang đứng im, môi run bần bật. Cô nhìn thẳng vào mắt Nam, ánh mắt đầy tổn thương và hoang mang. Nước mưa vẫn nhỏ giọt từ mái tóc, từ cằm cô, rơi xuống bậc thềm.

Trang: (Giọng run rẩy, khản đặc) Có phải... có phải anh đã nói dối em không?

Nam: (Nhíu mày, giọng thận trọng) Nói dối? Em đang nói gì vậy?

Trang nuốt nước bọt, hít một hơi sâu như để lấy can đảm. Đôi tay cô siết chặt hai bên đùi.

Trang: Em thấy tin nhắn trong điện thoại anh... với một người con gái khác.

---

## S04 | Nội cảnh · Trước cửa ra vào nhà Nam | Đêm khuya

Nam sững lại như trời trồng. Khuôn mặt anh biến sắc — từ ngạc nhiên ban đầu chuyển dần sang bối rối, rồi lo lắng. Mắt anh tránh né ánh nhìn của Trang, đảo qua đảo lại. Hai tay anh buông thõng, ngón tay bấu vào mép cửa.

Nam: (Lắp bắp) Em... em đã đọc tin nhắn của anh sao?

Trang bật khóc. Những tiếng nấc nghẹn bật ra khỏi cổ họng, đau đớn và xé lòng. Nước mắt cô trào ra, hòa lẫn với nước mưa trên má, chảy dài xuống cằm. Cô đưa tay quệt ngang mặt nhưng không thể ngăn được.

Trang: (Giọng lớn dần, đầy tức giận và phẫn uất) Tại sao hả Nam? Tại sao? Em đã tin tưởng anh tuyệt đối! Ba năm qua, em chưa từng nghi ngờ anh một lần nào!

Cô gào lên, giọng vỡ òa giữa màn mưa. Những ngón tay cô run bần bật khi chỉ về phía Nam.

---

## S05 | Nội cảnh · Hành lang cửa ra vào | Đêm khuya

Nam bước tới một bước, đưa tay ra định chạm vào vai Trang nhưng cô lùi lại. Giọng anh gấp gáp, vội vã.

Nam: Không phải như em nghĩ đâu Trang! Đó chỉ là đồng nghiệp thôi mà!

Trang: (Hét lên, giọng xé toạc màn đêm) ĐỒNG NGHIỆP?

Cô chỉ tay thẳng vào mặt Nam, tay cô run lên, những giọt nước mắt vẫn không ngừng rơi.

Trang: (Giọng chua chát, đầy mỉa mai) Đồng nghiệp mà nhắn "em nhớ anh" lúc nửa đêm à? Anh coi tôi là đồ ngốc sao?

Nam thở dài mạnh, đưa hai tay lên vò đầu bứt tóc. Anh đi qua đi lại trước cửa, sự bực tức bắt đầu leo thang trong ánh mắt. Hàm anh nghiến chặt, các cơ trên mặt căng cứng.

Nam: (Giọng bực dọc, cao giọng) Anh đã nói là không phải rồi! Em cứ làm ầm lên như vậy thì nói chuyện được gì nữa?

Trang gào lên, hai tay nắm chặt thành nắm đấm, cả người run lên vì cảm xúc hỗn độn — đau đớn, giận dữ, thất vọng đan xen.

Trang: (Giọng đứt quãng, nghẹn ngào) Anh... anh không những phản bội tôi mà còn dám lớn tiếng với tôi sao?

Cô lao tới, đấm thình thịch vào ngực Nam. Những cú đấm yếu ớt nhưng đầy tuyệt vọng. Nước mắt cô trào ra không ngừng, giọng cô khản đặc.

Trang: Tôi GHÉT ANH! GHÉT ANH!

---

## S06 | Nội cảnh · Phòng khách nhà Nam | Đêm khuya

Nam bắt lấy hai tay Trang, giữ chặt chúng lại. Anh kéo cô vào lòng, vòng tay ôm chặt lấy thân hình run rẩy ướt sũng của cô. Giọng anh đột ngột dịu lại, chuyển từ bực tức sang ấm áp, đầy ăn năn.

Nam: (Nhẹ nhàng, thì thầm bên tai cô) Anh xin lỗi Trang. Đúng... anh có sai.

Trang vẫn nấc lên, nhưng sự vùng vẫy yếu dần. Cô áp mặt vào ngực anh, nước mắt thấm ướt chiếc áo phông trắng của anh.

Nam: (Tiếp tục, giọng trầm và chân thành) Nhưng không phải là phản bội. Anh đã yếu lòng một chút khi đồng nghiệp đó tỏ tình... nhưng anh chưa từng phản bội em. Tin anh đi.

Trang vùng vẫy một lúc, đấm nhẹ vào ngực anh thêm vài cái yếu ớt, rồi bất lực gục xuống. Cô nấc lên trong lòng Nam như một đứa trẻ.

Trang: (Giọng yếu ớt, thì thào) Em sợ mất anh lắm... em không biết phải sống sao nếu anh rời đi.

Nam vuốt tóc cô, những ngón tay luồn qua mái tóc ướt đẫm của cô. Mắt anh cũng đỏ hoe, long lanh. Anh gục mặt xuống tóc cô, hít một hơi thật sâu.

Nam: (Thì thầm, giọng nghẹn) Anh cũng sợ mất em, Trang à.

---

## S07 | Nội cảnh · Phòng khách nhà Nam | Đêm khuya - Mưa vẫn rơi

Cơn mưa ngoài kia vẫn rơi, những hạt mưa đập vào ô cửa kính lộp độp. Gió đêm thổi qua khe cửa mang theo hơi lạnh.

Nhưng trong căn phòng nhỏ, dưới ánh đèn vàng ấm áp, hai con người vẫn ôm chặt lấy nhau. Trang áp mặt vào ngực Nam, vai còn khẽ rung lên theo từng tiếng nấc nghẹn. Nam vòng tay ôm cô, một tay vuốt nhẹ lưng cô, tay kia vẫn giữ chặt bờ vai run rẩy của cô.

Họ không nói gì thêm. Chỉ có tiếng mưa rơi, tiếng nấc nghẹn dần lắng xuống, và hơi thở của hai người hòa vào nhau.

Nam cúi xuống, đặt một nụ hôn nhẹ lên đỉnh đầu Trang. Trang siết chặt vòng tay hơn, như thể không bao giờ muốn buông.

Trong khoảnh khắc đó, giữa những giọt nước mắt và nước mưa, giữa cơn giận dữ và sự hàn gắn, họ vẫn còn nhau.
```

## S2 Output

### Nhan vat trich xuat

- **Trang (TC1)** (Vai: Main Character - Crying/Emotional)
  - Mo ta: Co gai 26 tuoi, phat hien nghi ngo ban trai phan boi. Khoc loc, het len, dam da, sau do yeu duoi so mat nguoi yeu.
  - Tinh cach: Nhạy cam, yeu cuong nhiet, de ton thuong nhung dung cam doi mat
  - Giong: Nu tre, luc khoc giong run run vo oa, luc gian giong choi tai, luc yeu duoi thi thao

- **Nam (TC1)** (Vai: Main Character - Angry/Frustrated)
  - Mo ta: Chang trai 28 tuoi, bi ban gai phat hien co tin nhan dang ngo. Ban dau boi roi, sau chuyen sang tuc gian, cuoi cung an nan hoi loi.
  - Tinh cach: Buong binh, de noi nong nhung sau tham rat yeu ban gai
  - Giong: Nam trung nien, khi tuc gian giong gat gong, khi diu dang giong am ap tram

- **Trang** (Vai: Chinh)
  - Mo ta: Co gai 25 tuoi, ban gai cua Nam. Phat hien tin nhan tinh cam tu mot co gai khac trong dien thoai cua Nam. Trong con mua dem, co chay den nha Nam de doi chat. Trai qua cung bac cam xuc tu dau don, hoang mang, tuc gian, phan uat den yeu duoi va cuoi cung la han gan. Co da yeu Nam suot 3 nam va chua tung nghi ngo anh lan nao truoc day.
  - Tinh cach: Nhạy cam, yeu cuong nhiet va het minh. De ton thuong nhung cung rat dung cam khi doi mat voi su that. Co long tu trong cao, san sang dau tranh cho tinh yeu cua minh. Tuy nhien, sau tham rat yeu duoi va so mat di nguoi minh yeu. Tinh cach boc truc, khong kim nen cam xuc - khi buon thi khoc, khi gian thi het, khi dau thi dam.
  - Ngoai hinh: 25 tuoi, dang nguoi manh khanh. Khuon mat trai xoan thanh tu, lan da trang. Doi mat to tron, den lay nhung dang do hoe, sung hup vi khoc. Mai toc dai den nhanh, uot sung dinh chat vao mat va vai. Mac mot chiec ao khoac mong mau sang, toan than uot dam nuoc mua, nuoc chay thanh dong tu toc xuong vai, xuong gau ao nho giot. Moi tai nhot run ban bat. Hai tay nam chat, mong tay bau vao long ban tay. Khi khoc, nuoc mat lan dai hoa lan voi nuoc mua tren ma.
  - Giong: Nu tre, luc khoc giong run run vo oa, luc gian giong choi tai, luc yeu duoi thi thao

- **Nam** (Vai: Chinh)
  - Mo ta: Chang trai 27 tuoi, ban trai cua Trang. Co mot co dong nghiep nu to tinh va nhan tin 'em nho anh' luc nua dem. Khi Trang den doi chat, anh trai qua nhieu trang thai cam xuc: tu ngac nhien, boi roi, lo lang, den buc tuc va cuoi cung la an nan, diu dang xin loi. Anh thua nhan minh da 'yeu long mot chut' nhung khang dinh chua tung phan boi.
  - Tinh cach: Buong binh, co cai toi cao, de noi nong khi bi chat van. Ban dau co xu huong phong thu va tranh ne trach nhiem. Tuy nhien, sau tham rat yeu Trang va biet an nan khi nhan ra sai lam. Co kha nang chuyen doi cam xuc nhanh - tu gian du sang diu dang. La nguoi tinh cam nhung doi khi yeu long truoc cam do. Biet cach xoa diu va han gan khi da nhan loi.
  - Ngoai hinh: 27 tuoi, dang nguoi cao rao, vai rong. Khuon mat goc canh, nam tinh. Mac ao phong trang don gian va quan short o nha. Toc hoi roi. Doi mat sau, ban dau mo to kinh ngac, sau do tro nen boi roi, roi cang thang voi cac co mat cung lai. Khi tuc gian, ham nghien chat, cac duong gan noi tren tran. Khi diu dang, anh mat tro nen am ap, do hoe, long lanh. Ban tay to, ngon tay dai - ban dau bau chat vao mep cua, sau do vuot toc Trang diu dang.
  - Giong: Nam trung nien, khi tuc gian giong gat gong, khi diu dang giong am ap tram

- **Narrator** (Vai: Narrator)
  - Mo ta: Nguoi dan chuyen mac dinh, dam nhan phan mo ta boi canh, thoi tiet, hanh dong va trang thai cam xuc cua nhan vat trong suot tap phim.
  - Tinh cach: Khach quan, trung tinh, giau chat tho va hinh anh trong cach mieu ta.
  - Ngoai hinh: Khong hien thi hinh anh truc tiep, chi co giong noi vang len nen.

### Canh trich xuat

**S01: Pho vang - Truoc cua nha Nam** (Dem khuya - Mua tam ta)
- Prompt: A small deserted street in the middle of a dark, stormy night. Heavy rain pours down relentlessly onto the wet asphalt pavement, creating shimmering reflections of distant dim lights. Raindrops pound loudly against corrugated iron roofs and sidewalks. The street is empty and silent except for the sound of rain. At the end of the street, a faint silhouette of a young woman appears, walking slowly through the downpour.

**S02: Phong khach nha Nam** (Dem khuya - Mua)
- Prompt: A cozy small living room interior at night. A single desk lamp casts warm yellow dim light across the room. A young man in a white t-shirt and home shorts sits on a sofa, holding a phone. On the table in front of him sits a cold cup of coffee. The wall clock shows 11:47 PM. The room feels warm and intimate, contrasting with the sound of rain outside. A wooden door leads to the outside.

**S03: Truoc cua nha Nam** (Dem khuya - Mua)
- Prompt: The front door of a small house opens, casting warm light onto the doorstep. A young woman stands in the rain, her face pale and drenched, eyes red and swollen from crying. Rainwater drips from her hair and chin onto the steps. The young man stands at the doorway, frozen in shock, his hand still gripping the doorknob. Rain pours heavily around them, creating a dramatic atmosphere.

**S04: Truoc cua ra vao nha Nam** (Dem khuya)
- Prompt: Close-up at the doorway inside the house. The young man stands frozen, his face changing from shock to confusion to worry. His eyes avoid the woman's gaze, darting nervously. His hands hang limp, fingers gripping the door frame. The young woman breaks down crying, sobs escaping her throat, tears mixing with rainwater on her face. She wipes her face with her hand but cannot stop the tears.

**S05: Hanh lang cua ra vao** (Dem khuya)
- Prompt: The narrow hallway near the front door. The young man steps forward, reaching out to touch the woman's shoulder but she steps back. His voice becomes urgent and rushed. The woman points a trembling finger at his face, tears still streaming. She screams with a voice that tears through the night. The man sighs heavily, running his hands through his hair, pacing back and forth in front of the door, frustration rising in his eyes.

**S06: Phong khach nha Nam** (Dem khuya)
- Prompt: Inside the cozy living room. The man grabs the woman's hands, holding them firmly. He pulls her into his embrace, wrapping his arms tightly around her trembling, soaked body. His voice suddenly softens from frustration to warmth and repentance. She buries her face in his chest, tears soaking his white t-shirt. He strokes her wet hair, his fingers running through the soaked strands. His eyes are also red and glistening with emotion.

**S07: Phong khach nha Nam** (Dem khuya - Mua van roi)
- Prompt: The cozy living room with warm yellow lamplight. Rain continues to fall outside, raindrops tapping against the window glass. Night wind blows through cracks, bringing cold air. Inside, two people hold each other tightly. The woman presses her face against the man's chest, her shoulders still trembling with occasional sobs. The man wraps his arms around her, one hand gently stroking her back, the other holding her trembling shoulder. He leans down and places a gentle kiss on the top of her head. She tightens her embrace as if never wanting to let go. A moment of healing and reconciliation amidst tears and rain.

## S3 Output

### Storyboard 1
- **Dia diem:** Phố vắng - Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa tầm tã
- **Goc may:** None
- **Hanh dong:** Mở đầu với một con phố nhỏ vắng lặng trong đêm mưa tầm tã. Mưa xối xả trút xuống mặt đường nhựa loang loáng nước. Những hạt mưa nặng trịch đập vào mái tôn, vào vỉa hè.
- **Duration:** 5s

### Storyboard 2
- **Dia diem:** Phố vắng - Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa tầm tã
- **Goc may:** None
- **Hanh dong:** Bóng dáng Trang xuất hiện ở cuối phố. Cô mặc áo khoác mỏng, toàn thân ướt sũng. Tóc dính chặt vào mặt, nước mưa chảy thành dòng từ tóc xuống vai, xuống gấu áo đang nhỏ giọt.
- **Duration:** 5s

### Storyboard 3
- **Dia diem:** Phố vắng - Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa tầm tã
- **Goc may:** None
- **Hanh dong:** Trang bước chậm rãi, từng bước nặng nhọc như thể đôi chân không còn sức lực. Đôi mắt cô đỏ hoe, bầu mắt sưng húp.
- **Duration:** 4s

### Storyboard 4
- **Dia diem:** Phố vắng - Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa tầm tã
- **Goc may:** None
- **Hanh dong:** Trang dừng lại trước một cánh cửa gỗ cũ kỹ — căn nhà nhỏ của Nam. Tay cô run run, giơ lên định gõ cửa, nhưng lại chần chừ.
- **Duration:** 4s

### Storyboard 5
- **Dia diem:** Phố vắng - Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa tầm tã
- **Goc may:** None
- **Hanh dong:** Trang hít một hơi thật sâu, rồi đập mạnh tay vào cánh cửa.
- **Duration:** 3s

### Storyboard 6
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Bên trong căn phòng nhỏ ấm cúng. Một chiếc đèn bàn duy nhất tỏa ánh sáng vàng mờ. Nam đang ngồi trên ghế sofa, tay cầm điện thoại. Anh mặc áo phông trắng, quần short. Trên bàn là tách cà phê đã nguội.
- **Duration:** 4s

### Storyboard 7
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Tiếng gõ cửa dồn dập vang lên. Nam ngẩng đầu, nhíu mày ngạc nhiên. Đồng hồ trên tường chỉ 11:47 PM.
- **Duration:** 3s

### Storyboard 8
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Nam đặt điện thoại xuống bàn, đứng dậy, đi về phía cửa.
- **Duration:** 3s

### Storyboard 9
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Tiếng gõ cửa lại vang lên, lần này mạnh hơn, gấp gáp hơn. Nam lớn giọng hỏi.
- **Thoai:** Ai đấy? Đêm hôm thế này...
- **Duration:** 4s

### Storyboard 10
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Nam vặn tay nắm cửa, kéo cánh cửa mở ra.
- **Duration:** 3s

### Storyboard 11
- **Dia diem:** Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Cánh cửa mở ra. Ánh sáng từ trong nhà hắt ra, soi rõ khuôn mặt Trang — tái nhợt, ướt đẫm, đôi mắt đỏ ngầu vì khóc.
- **Duration:** 3s

### Storyboard 12
- **Dia diem:** Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Nam giật mình, mắt mở to. Tay anh vẫn giữ chặt tay nắm cửa, người khựng lại.
- **Thoai:** Trang? Em làm gì ở đây giữa đêm mưa thế này?
- **Duration:** 4s

### Storyboard 13
- **Dia diem:** Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Trang đứng im, môi run bần bật. Cô nhìn thẳng vào mắt Nam, ánh mắt đầy tổn thương và hoang mang. Nước mưa vẫn nhỏ giọt từ mái tóc, từ cằm cô, rơi xuống bậc thềm.
- **Thoai:** Có phải... có phải anh đã nói dối em không?
- **Duration:** 5s

### Storyboard 14
- **Dia diem:** Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Nam nhíu mày, giọng thận trọng.
- **Thoai:** Nói dối? Em đang nói gì vậy?
- **Duration:** 3s

### Storyboard 15
- **Dia diem:** Trước cửa nhà Nam
- **Thoi gian:** Đêm khuya - Mưa
- **Goc may:** None
- **Hanh dong:** Trang nuốt nước bọt, hít một hơi sâu như để lấy can đảm. Đôi tay cô siết chặt hai bên đùi.
- **Thoai:** Em thấy tin nhắn trong điện thoại anh... với một người con gái khác.
- **Duration:** 4s

### Storyboard 16
- **Dia diem:** Trước cửa ra vào nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam sững lại như trời trồng. Khuôn mặt anh biến sắc — từ ngạc nhiên chuyển sang bối rối, rồi lo lắng. Mắt anh tránh né ánh nhìn của Trang. Hai tay buông thõng, ngón tay bấu vào mép cửa.
- **Duration:** 4s

### Storyboard 17
- **Dia diem:** Trước cửa ra vào nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam lắp bắp hỏi.
- **Thoai:** Em... em đã đọc tin nhắn của anh sao?
- **Duration:** 3s

### Storyboard 18
- **Dia diem:** Trước cửa ra vào nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang bật khóc. Những tiếng nấc nghẹn bật ra khỏi cổ họng, đau đớn và xé lòng. Nước mắt trào ra, hòa lẫn với nước mưa trên má. Cô đưa tay quệt ngang mặt nhưng không thể ngăn được.
- **Duration:** 4s

### Storyboard 19
- **Dia diem:** Trước cửa ra vào nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang nói lớn dần, đầy tức giận và phẫn uất. Cô gào lên, giọng vỡ òa giữa màn mưa. Những ngón tay run bần bật khi chỉ về phía Nam.
- **Thoai:** Tại sao hả Nam? Tại sao? Em đã tin tưởng anh tuyệt đối! Ba năm qua, em chưa từng nghi ngờ anh một lần nào!
- **Duration:** 5s

### Storyboard 20
- **Dia diem:** Hành lang cửa ra vào
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam bước tới một bước, đưa tay ra định chạm vào vai Trang nhưng cô lùi lại. Giọng anh gấp gáp, vội vã.
- **Thoai:** Không phải như em nghĩ đâu Trang! Đó chỉ là đồng nghiệp thôi mà!
- **Duration:** 4s

### Storyboard 21
- **Dia diem:** Hành lang cửa ra vào
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang hét lên, giọng xé toạc màn đêm. Cô chỉ tay thẳng vào mặt Nam, tay run lên, nước mắt không ngừng rơi.
- **Thoai:** ĐỒNG NGHIỆP? Đồng nghiệp mà nhắn "em nhớ anh" lúc nửa đêm à? Anh coi tôi là đồ ngốc sao?
- **Duration:** 5s

### Storyboard 22
- **Dia diem:** Hành lang cửa ra vào
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam thở dài mạnh, đưa hai tay lên vò đầu bứt tóc. Anh đi qua đi lại trước cửa, sự bực tức bắt đầu leo thang trong ánh mắt. Hàm anh nghiến chặt, các cơ trên mặt căng cứng.
- **Duration:** 4s

### Storyboard 23
- **Dia diem:** Hành lang cửa ra vào
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam nói với giọng bực dọc, cao giọng.
- **Thoai:** Anh đã nói là không phải rồi! Em cứ làm ầm lên như vậy thì nói chuyện được gì nữa?
- **Duration:** 3s

### Storyboard 24
- **Dia diem:** Hành lang cửa ra vào
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang gào lên, hai tay nắm chặt thành nắm đấm, cả người run lên vì cảm xúc hỗn độn — đau đớn, giận dữ, thất vọng đan xen.
- **Thoai:** Anh... anh không những phản bội tôi mà còn dám lớn tiếng với tôi sao?
- **Duration:** 4s

### Storyboard 25
- **Dia diem:** Hành lang cửa ra vào
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang lao tới, đấm thình thịch vào ngực Nam. Những cú đấm yếu ớt nhưng đầy tuyệt vọng. Nước mắt cô trào ra không ngừng, giọng khản đặc.
- **Thoai:** Tôi GHÉT ANH! GHÉT ANH!
- **Duration:** 5s

### Storyboard 26
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam bắt lấy hai tay Trang, giữ chặt chúng lại. Anh kéo cô vào lòng, vòng tay ôm chặt lấy thân hình run rẩy ướt sũng của cô.
- **Duration:** 4s

### Storyboard 27
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Giọng Nam đột ngột dịu lại, chuyển từ bực tức sang ấm áp, đầy ăn năn. Anh thì thầm bên tai cô.
- **Thoai:** Anh xin lỗi Trang. Đúng... anh có sai.
- **Duration:** 4s

### Storyboard 28
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang vẫn nấc lên, nhưng sự vùng vẫy yếu dần. Cô áp mặt vào ngực anh, nước mắt thấm ướt chiếc áo phông trắng của anh.
- **Duration:** 3s

### Storyboard 29
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam tiếp tục nói, giọng trầm và chân thành.
- **Thoai:** Nhưng không phải là phản bội. Anh đã yếu lòng một chút khi đồng nghiệp đó tỏ tình... nhưng anh chưa từng phản bội em. Tin anh đi.
- **Duration:** 5s

### Storyboard 30
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang vùng vẫy một lúc, đấm nhẹ vào ngực anh thêm vài cái yếu ớt, rồi bất lực gục xuống. Cô nấc lên trong lòng Nam như một đứa trẻ.
- **Duration:** 4s

### Storyboard 31
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Trang nói với giọng yếu ớt, thì thào.
- **Thoai:** Em sợ mất anh lắm... em không biết phải sống sao nếu anh rời đi.
- **Duration:** 4s

### Storyboard 32
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam vuốt tóc cô, những ngón tay luồn qua mái tóc ướt đẫm của cô. Mắt anh cũng đỏ hoe, long lanh. Anh gục mặt xuống tóc cô, hít một hơi thật sâu.
- **Duration:** 4s

### Storyboard 33
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya
- **Goc may:** None
- **Hanh dong:** Nam thì thầm, giọng nghẹn ngào.
- **Thoai:** Anh cũng sợ mất em, Trang à.
- **Duration:** 3s

### Storyboard 34
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa vẫn rơi
- **Goc may:** None
- **Hanh dong:** Cơn mưa ngoài kia vẫn rơi, những hạt mưa đập vào ô cửa kính lộp độp. Gió đêm thổi qua khe cửa mang theo hơi lạnh.
- **Duration:** 4s

### Storyboard 35
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa vẫn rơi
- **Goc may:** None
- **Hanh dong:** Trong căn phòng nhỏ, dưới ánh đèn vàng ấm áp, hai con người vẫn ôm chặt lấy nhau. Trang áp mặt vào ngực Nam, vai còn khẽ rung lên theo từng tiếng nấc nghẹn. Nam vòng tay ôm cô, một tay vuốt nhẹ lưng cô, tay kia giữ chặt bờ vai run rẩy.
- **Duration:** 5s

### Storyboard 36
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa vẫn rơi
- **Goc may:** None
- **Hanh dong:** Họ không nói gì thêm. Chỉ có tiếng mưa rơi, tiếng nấc nghẹn dần lắng xuống, và hơi thở của hai người hòa vào nhau.
- **Duration:** 4s

### Storyboard 37
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa vẫn rơi
- **Goc may:** None
- **Hanh dong:** Nam cúi xuống, đặt một nụ hôn nhẹ lên đỉnh đầu Trang. Trang siết chặt vòng tay hơn, như thể không bao giờ muốn buông.
- **Duration:** 4s

### Storyboard 38
- **Dia diem:** Phòng khách nhà Nam
- **Thoi gian:** Đêm khuya - Mưa vẫn rơi
- **Goc may:** None
- **Hanh dong:** Khoảnh khắc cuối: giữa những giọt nước mắt và nước mưa, giữa cơn giận dữ và sự hàn gắn, họ vẫn còn nhau.
- **Duration:** 5s

## Cau hoi can tra loi

### 1. Pipeline S1-S3 chay het khong? Co crash khong?
Pipeline S1-S3 **DA CHAY HET** (sau fix PR #109, DeepSeek).
- S1: OK - viet lai kich ban tu content, 7 canh, 6073 tu (170s)
- S2: OK - trich xuat 3 nhan vat + 7 canh (105s)
- S3: OK - sinh 38 storyboard (188s)
- Tong thoi gian: 463s

### 2. Output co dung schema khong?
- S1: Dung schema. Luu `script_content` voi format screenplay day du.
- S2: Dung schema. Cap nhat bang `characters` (personality, appearance, voice_style) va `scenes` (location, time, prompt).
- S3: Dung schema (**FIX CONFIRMED**). Sinh 38 storyboard. Tat ca co `location` va `time` day du (38/38). `shot_type` van la None do system prompt S3 khong quan tam den goc may.

### 3. Co thieu file output nao khong?
- Khong. Ca 3 tram deu da sinh output va luu vao database.
- Output da duoc trich xuat va ghi vao bao cao nay.
- So voi lan chay truoc (PR #92): bug `Dia diem: None` va `Thoi gian: None` da duoc fix boi PR #109.