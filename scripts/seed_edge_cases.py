import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.database import SessionLocal, init_db
from src.db.schema import Drama, Episode, Character, EpisodeCharacter
from sqlalchemy.orm import Session

# ============================================================
# TEST SUITE 1: HỘI THOẠI & CẢM XÚC CƯỜNG ĐỘ CAO
# Trọng tâm: Speaker Routing, Lip-sync, Expression Layer, Micro-sync Subtitle
# ============================================================

TC1_CONTENT = """Nam và Trang đã yêu nhau ba năm. Một đêm mưa tầm tã, Trang đứng trước cửa nhà Nam, toàn thân ướt sũng, mắt đỏ hoe.

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

Cơn mưa ngoài kia vẫn rơi. Nhưng trong căn phòng nhỏ, hai con người ôm lấy nhau, trong tiếng khóc và cả những lời hứa hẹn hàn gắn."""

# ============================================================
# TEST SUITE 2: HÀNH ĐỘNG & NHỊP ĐỘ NHANH
# Trọng tâm: Cinematic Camera (whip_pan, camera_shake), VFX Overlay, Asset Dynamics
# ============================================================

TC2_CONTENT = """Trong màn đêm đen kịt của một khu công nghiệp bỏ hoang, Hùng chạy băng qua hàng loạt container rỉ sét, hơi thở dồn dập, mồ hôi túa ra đầm đìa. Phía sau anh, ba tên vệ sĩ mặc đồ đen đang đuổi theo sát nút.

Tiếng giày đinh đập lộp cộp trên nền bê tông ẩm ướt vang vọng khắp nhà kho. Hùng liếc nhanh ra sau, thấy bóng bọn chúng đang tiến gần. Một tia chớp lóe lên bên ngoài, chiếu sáng toàn bộ khung cảnh trong một giây.

Hùng rẽ ngoặt sang trái, suýt trượt chân trên vũng dầu, nhưng kịp bám vào một thanh sắt han gỉ. Anh nấp sau một container lớn, tim đập thình thịch, cố gắng nín thở. Ánh đèn pin của bọn truy đuổi quét qua quét lại, chỉ vài centimet cách mặt anh.

"THẤY NÓ RỒI!" Một giọng đàn ông vang lên khàn đục.
Ngay lập tức, Hùng bật người lao ra khỏi chỗ nấp. Camera rung lắc dữ dội. Một cú đấm từ tên vệ sĩ thứ nhất lao tới, Hùng cúi người né được trong gang tấc. Anh xoay người, tung một cú đá móc vào bụng hắn. Cú va chạm vang lên tiếng bộp khô khốc.

Tên thứ hai lao vào ôm lấy Hùng từ phía sau. Hùng giật mạnh khuỷu tay ra sau, đánh vào mặt hắn. Tiếng rên đau vang lên ngay sau đó. Nhưng còn tên thứ ba đã rút ra một con dao găm, lưỡi dao ánh lên trong bóng tối.

Không do dự, Hùng nhảy lên thùng container, rồi phóng mình sang một giàn giáo kim loại bên cạnh. Cả khung giàn giáo rung lên bần bật, phát ra âm thanh ken két chói tai. Hắn không dừng lại – phải chạy tiếp lên tầng trên. Cầu thang sắt hẹp dẫn lên mái nhà kho.

Trên mái kho, gió mạnh thổi vù vù. Mặt trăng ló ra khỏi đám mây, để lộ bóng dáng hai người. Tên vệ sĩ cuối cùng cũng lên tới nơi, thở hồng hộc. Chúng đứng đối diện nhau, mắt long sòng sọc nhìn nhau.

Tên vệ sĩ lao tới trước. Hùng đỡ được cú đấm đầu tiên, nhưng dính ngay một cú móc vào mạng sườn. Anh gập người vì đau. Camera lắc mạnh. Hùng chồm tới ôm lấy chân đối thủ, quật hắn ngã xuống sàn mái. Một tiếng động lớn vang lên.

Hùng đứng dậy trước, thở gấp gáp. Anh nhìn xuống tên vệ sĩ đang nằm bất động, rồi quay lưng bước đi vào màn đêm. Trên người anh, những vết thương bắt đầu rỉ máu, nhưng ánh mắt vẫn kiên định như thép."""

# ============================================================
# TEST SUITE 3: MISSING ASSET FALLBACK / ẢO GIÁC AI
# Trọng tâm: Trạm 6 không crash, gán cờ null an toàn, log vào missing_assets_backlog.jsonl
# ============================================================

TC3_CONTENT = """Phi hành gia An tỉnh dậy trong khoang điều khiển của con tàu vũ trụ Zephyr-7. Ánh đèn LED màu tím chập chờn nhấp nháy, báo hiệu hệ thống hỗ trợ sự sống đang gặp trục trặc. An vội vàng kiểm tra bảng điều khiển hologram nổi lơ lửng trong không trung.

"Máy tính, báo cáo trạng thái!" An ra lệnh với giọng căng thẳng.
Trí tuệ nhân tạo của tàu, mang tên IRIS, vang lên với giọng giọng lạnh lẽo: "Hệ thống điều hướng chính bị hư hại 67%. Phát hiện từ trường bất thường từ tiểu hành tinh gần nhất. Khuyến cáo: Chuẩn bị hạ cánh khẩn cấp."

Qua khung cửa sổ kính cường lực của khoang lái, An thấy một hành tinh màu tím kỳ lạ với những tinh thể lơ lửng lấp lánh bên dưới. Những hòn đảo đá trôi nổi trên bầu trời, kết nối với nhau bằng những cây cầu ánh sáng mờ ảo. Chưa từng có bản đồ nào ghi nhận hành tinh này.

Tàu Zephyr-7 rung lắc dữ dội khi bắt đầu xuyên qua bầu khí quyển đặc quánh màu hồng. An bấu chặt lấy ghế lái. Tiếng còi báo động rít lên. "Hãy giữ vững, IRIS! Chúng ta sắp tiếp đất rồi!"

Tàu đáp xuống mặt đất với một cú va chạm mạnh. Khói bốc lên nghi ngút xung quanh. An loạng choạng bước ra khỏi tàu, tay cầm một thanh kiếm ánh sáng màu xanh neon làm vũ khí tự vệ. Mặt đất dưới chân anh là những phiến đá phát quang màu tím, mỗi bước đi lại phát ra âm thanh như thủy tinh vỡ.

Đột nhiên, từ phía sau một khối tinh thể khổng lồ, bốn sinh vật robot có hình dạng giống bọ ngựa khổng lồ xuất hiện. Mắt chúng phát ra ánh sáng đỏ rực, và trên càng của chúng gắn những khẩu pháo plasma đang kêu vo ve.

"XÂM PHẠM! TIÊU DIỆT!" Giọng robotic của chúng vang lên đồng thanh, chói tai.

An nhanh chóng triệu hồi chiếc mô-tô bay của mình. Cỗ máy lơ lửng cách mặt đất nửa mét, động cơ phản lực rực sáng màu cam. Anh nhảy lên xe, vặn ga hết cỡ, phóng vọt đi giữa những tảng đá lơ lửng. Những tia plasma đỏ rực bay vèo vèo qua đầu.

An lượn lách qua các khối tinh thể, cố gắng tìm nơi trú ẩn. Phía trước, một cổng dịch chuyển không gian mở ra như một vòng xoáy ánh sáng bảy sắc cầu vồng. Anh không còn lựa chọn nào khác – nhắm mắt, tăng tốc tối đa, lao thẳng vào vòng xoáy.

Ánh sáng chói lòa bao trùm mọi thứ. Mọi âm thanh tắt lịm. An rơi vào khoảng không vô định, chỉ còn lại tiếng tim đập và hơi thở gấp gáp của chính mình. Liệu anh có sống sót được không?"""


def seed_edge_cases():
    db: Session = SessionLocal()
    try:
        # ============================================================
        # TC1: HỘI THOẠI & CẢM XÚC CƯỜNG ĐỘ CAO
        # ============================================================
        tc1_drama = db.query(Drama).filter(Drama.title == "[EDGE-TC1] Cơn Giận Đêm Mưa").first()
        if not tc1_drama:
            tc1_drama = Drama(
                title="[EDGE-TC1] Cơn Giận Đêm Mưa",
                description="Edge Case Test: Hội thoại cường độ cao, tranh cãi gay gắt, cảm xúc cực đoan (khóc, giận, hòa giải). Kiểm thử Speaker Routing, Lip-sync, Expression Layer, Micro-sync Subtitle.",
                genre="Drama, Romance, Emotional",
                status="active"
            )
            db.add(tc1_drama)
            db.commit()
            db.refresh(tc1_drama)
            print(f"[TC1] Created Drama: {tc1_drama.title}")
        else:
            print(f"[TC1] Drama '{tc1_drama.title}' already exists.")


        tc1_episode = db.query(Episode).filter(
            Episode.drama_id == tc1_drama.id, Episode.episode_number == 1
        ).first()
        if not tc1_episode:
            tc1_episode = Episode(
                drama_id=tc1_drama.id,
                episode_number=1,
                title="[TC1] Bão Trong Đêm",
                description="Edge Case Test: Cuộc tranh cãi nảy lửa giữa Nam và Trang trong đêm mưa. Kiểm thử biểu cảm tức giận, khóc lóc, hòa giải và Speaker Routing.",
                content=TC1_CONTENT,
                status="active"
            )
            db.add(tc1_episode)
            db.commit()
            db.refresh(tc1_episode)
            print(f"[TC1] Created Episode: {tc1_episode.title}")
        else:
            print(f"[TC1] Episode '{tc1_episode.title}' already exists.")

        tc1_nam = db.query(Character).filter(Character.name == "Nam").first()
        tc1_trang = db.query(Character).filter(Character.name == "Trang").first()
        if tc1_nam and tc1_trang:
            for char in [tc1_nam, tc1_trang]:
                link = db.query(EpisodeCharacter).filter(
                    EpisodeCharacter.episode_id == tc1_episode.id,
                    EpisodeCharacter.character_id == char.id
                ).first()
                if not link:
                    db.add(EpisodeCharacter(episode_id=tc1_episode.id, character_id=char.id))
            db.commit()
            print(f"[TC1] Linked characters to episode. Episode ID: {tc1_episode.id}")
        else:
            print(f"[TC1] Characters not yet created in DB. Station 2 will generate them. Episode ID: {tc1_episode.id}")

        # ============================================================
        # TC2: HÀNH ĐỘNG & NHỊP ĐỘ NHANH
        # ============================================================
        tc2_drama = db.query(Drama).filter(Drama.title == "[EDGE-TC2] Cuộc Truy Đuổi Trong Bóng Tối").first()
        if not tc2_drama:
            tc2_drama = Drama(
                title="[EDGE-TC2] Cuộc Truy Đuổi Trong Bóng Tối",
                description="Edge Case Test: Đánh nhau, rượt đuổi, bối cảnh tối tăm, hành động bất ngờ. Kiểm thử Cinematic Camera (whip_pan, camera_shake), VFX Overlay, Asset Dynamics vật lý giấy.",
                genre="Action, Thriller",
                status="active"
            )
            db.add(tc2_drama)
            db.commit()
            db.refresh(tc2_drama)
            print(f"[TC2] Created Drama: {tc2_drama.title}")
        else:
            print(f"[TC2] Drama '{tc2_drama.title}' already exists.")


        tc2_episode = db.query(Episode).filter(
            Episode.drama_id == tc2_drama.id, Episode.episode_number == 1
        ).first()
        if not tc2_episode:
            tc2_episode = Episode(
                drama_id=tc2_drama.id,
                episode_number=1,
                title="[TC2] Bóng Ma Trong Hẻm",
                description="Edge Case Test: Cuộc rượt đuổi và đánh nhau trong khu công nghiệp bỏ hoang giữa đêm. Kiểm thử whip_pan, camera_shake, VFX screen_shake, combat stance, punch SFX.",
                content=TC2_CONTENT,
                status="active"
            )
            db.add(tc2_episode)
            db.commit()
            db.refresh(tc2_episode)
            print(f"[TC2] Created Episode: {tc2_episode.title}")
        else:
            print(f"[TC2] Episode '{tc2_episode.title}' already exists.")

        tc2_hung = db.query(Character).filter(Character.name == "Hùng").first()
        tc2_guard = db.query(Character).filter(Character.name == "Vệ sĩ").first()
        if tc2_hung and tc2_guard:
            for char in [tc2_hung, tc2_guard]:
                link = db.query(EpisodeCharacter).filter(
                    EpisodeCharacter.episode_id == tc2_episode.id,
                    EpisodeCharacter.character_id == char.id
                ).first()
                if not link:
                    db.add(EpisodeCharacter(episode_id=tc2_episode.id, character_id=char.id))
            db.commit()
            print(f"[TC2] Linked characters to episode. Episode ID: {tc2_episode.id}")
        else:
            print(f"[TC2] Characters not yet created in DB. Station 2 will generate them. Episode ID: {tc2_episode.id}")

        # ============================================================
        # TC3: MISSING ASSET FALLBACK / ẢO GIÁC AI
        # ============================================================
        tc3_drama = db.query(Drama).filter(Drama.title == "[EDGE-TC3] Du Hành Vũ Trụ Phi Lý").first()
        if not tc3_drama:
            tc3_drama = Drama(
                title="[EDGE-TC3] Du Hành Vũ Trụ Phi Lý",
                description="Edge Case Test: Đòi hỏi các vật phẩm/bối cảnh KHÔNG có trong asset_registry.json. Kiểm thử Trạm 6 không crash, gán cờ null an toàn, log vào missing_assets_backlog.jsonl, Trạm 8 render không đỏ màn hình.",
                genre="Sci-Fi, Absurd",
                status="active"
            )
            db.add(tc3_drama)
            db.commit()
            db.refresh(tc3_drama)
            print(f"[TC3] Created Drama: {tc3_drama.title}")
        else:
            print(f"[TC3] Drama '{tc3_drama.title}' already exists.")


        tc3_episode = db.query(Episode).filter(
            Episode.drama_id == tc3_drama.id, Episode.episode_number == 1
        ).first()
        if not tc3_episode:
            tc3_episode = Episode(
                drama_id=tc3_drama.id,
                episode_number=1,
                title="[TC3] Hành Tinh Tinh Thể Tím",
                description="Edge Case Test: Phi hành gia cầm kiếm ánh sáng, lái mô-tô bay, robot bọ ngựa bắn plasma, cổng dịch chuyển. Tất cả asset đều KHÔNG tồn tại trong registry.",
                content=TC3_CONTENT,
                status="active"
            )
            db.add(tc3_episode)
            db.commit()
            db.refresh(tc3_episode)
            print(f"[TC3] Created Episode: {tc3_episode.title}")
        else:
            print(f"[TC3] Episode '{tc3_episode.title}' already exists.")

        tc3_an = db.query(Character).filter(Character.name == "An").first()
        tc3_iris = db.query(Character).filter(Character.name == "IRIS").first()
        tc3_robot = db.query(Character).filter(Character.name == "Robot").first()
        if tc3_an and tc3_iris and tc3_robot:
            for char in [tc3_an, tc3_iris, tc3_robot]:
                link = db.query(EpisodeCharacter).filter(
                    EpisodeCharacter.episode_id == tc3_episode.id,
                    EpisodeCharacter.character_id == char.id
                ).first()
                if not link:
                    db.add(EpisodeCharacter(episode_id=tc3_episode.id, character_id=char.id))
            db.commit()
            print(f"[TC3] Linked characters to episode. Episode ID: {tc3_episode.id}")
        else:
            print(f"[TC3] Characters not yet created in DB. Station 2 will generate them. Episode ID: {tc3_episode.id}")

        # ============================================================
        # SUMMARY
        # ============================================================
        print("\n" + "=" * 60)
        print("SEEDING EDGE CASES COMPLETED!")
        print("=" * 60)
        print(f"  [TC1 - Emotion/Argument]  Episode ID: {tc1_episode.id}")
        print(f"  [TC2 - Action/Chase]      Episode ID: {tc2_episode.id}")
        print(f"  [TC3 - Missing Assets]    Episode ID: {tc3_episode.id}")
        print("=" * 60)
        print("Characters NOT pre-created. Station 2 generates them.")
        print("To run pipeline for each test case:")
        print(f"  python scripts/run_pipeline.py {tc1_episode.id}")
        print(f"  python scripts/run_pipeline.py {tc2_episode.id}")
        print(f"  python scripts/run_pipeline.py {tc3_episode.id}")
        print("=" * 60 + "\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding edge cases: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    init_db()
    seed_edge_cases()
