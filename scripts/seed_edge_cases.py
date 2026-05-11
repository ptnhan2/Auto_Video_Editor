import sys
import os
import importlib

from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_db = importlib.import_module('src.db.database')
SessionLocal = _db.SessionLocal
init_db = _db.init_db

_schema = importlib.import_module('src.db.schema')
Drama = _schema.Drama
Episode = _schema.Episode

# ============================================================
# TEST SUITE 1: HOI THOAI & CAM XUC CUONG DO CAO
# Trong tam: Speaker Routing, Lip-sync, Expression Layer, Micro-sync Subtitle
# ============================================================

TC1_CONTENT = """Nam va Trang da yeu nhau ba nam. Mot dem mua tam ta, Trang dung truoc cua nha Nam, toan than uot sung, mat do hoe.

Nam mo cua va giat minh: "Trang? Em lam gi o day giua dem mua the nay?"
Trang noi trong run ray: "Co phai anh da noi doi em khong? Em thay tin nhan trong dien thoai anh... voi mot nguoi con gai khac."
Nam sung lai. Mat anh bien sac tu ngac nhien sang boi roi. Anh lap bap: "Em... em da doc tin nhan cua anh sao?"

Trang bat khoc. Nhung giot nuoc mat hoa lan voi nuoc mua tren ma. Giong co lon dan, day tuc gian: "Tai sao ha Nam? Em da tin tuong anh tuyet doi! Ba nam qua, em chua tung nghi ngo anh mot lan nao!"
Nam buoc toi mot buoc, giong gap gap co giai thich: "Khong phai nhu em nghi dau Trang! Do chi la dong nghiep thoi ma!"
"DONG NGHIEP?" Trang het len, giong vo oa. Co chi tay thang vao mat Nam: "Dong nghiep ma nhan 'em nho anh' luc nua dem a? Anh coi toi la do ngoc sao?"

Nam tho dai manh, vo dau but toc. Su buc tuc bat dau leo thang trong anh mat anh: "Anh da noi la khong phai roi! Em cu lam am len nhu vay thi noi chuyen duoc gi nua?"
Trang gao len, hai tay nam chat thanh nam dam, ca nguoi run len vi cam xuc hon don: "Anh... anh khong nhung phan boi toi ma con dam lon tieng voi toi sao?" Co dam thinh thich vao nguc Nam, nuoc mat trao ra khong ngung: "Toi GHET ANH! GHET ANH!"

Nam bat lay hai tay Trang, keo co vao long. Giong anh diu lai dot ngot, am ap va an nan: "Anh xin loi Trang. Dung... anh co sai. Nhung khong phai la phan boi. Anh da yeu long mot chut khi dong nghiep do to tinh, nhung anh chua tung phan boi em. Tin anh di."

Trang vung vay mot luc roi nac len trong long Nam. Giong co yeu ot nhu dua tre: "Em so mat anh lam... em khong biet phai song sao neu anh roi di."
Nam vuot toc co, mat cung do hoe. Anh thi tham: "Anh cung so mat em, Trang a."

Con mua ngoai kia van roi. Nhung trong can phong nho, hai con nguoi om lay nhau, trong tieng khoc va ca nhung loi hua hen han gan."""

# ============================================================
# TEST SUITE 2: HANH DONG & NHIP DO NHANH
# Trong tam: Cinematic Camera (whip_pan, camera_shake), VFX Overlay, Asset Dynamics
# ============================================================

TC2_CONTENT = """Trong man dem den kit cua mot khu cong nghiep bo hoang, Hung chay bang qua hang loat container ri set, hoi tho don dap, mo hoi tua ra dam dia. Phia sau anh, ba ten ve si mac do den dang duoi theo sat nut.

Tieng giay dinh dap lop cop tren nen be tong am uot vang vong khap nha kho. Hung liec nhanh ra sau, thay bong bon chung dang tien gan. Mot tia chop loe len ben ngoai, chieu sang toan bo khung canh trong mot giay.

Hung re ngoat sang trai, suyt truot chan tren vung dau, nhung kip bam vao mot thanh sat han gi. Anh nap sau mot container lon, tim dap thinh thich, co gang nin tho. Anh den pin cua bon truy duoi quet qua quet lai, chi vai centimet cach mat anh.

"THAY NO ROI!" Mot giong dan ong vang len khan duc.
Ngay lap tuc, Hung bat nguoi lao ra khoi cho nap. Camera rung lac du doi. Mot cu dam tu ten ve si thu nhat lao toi, Hung cui nguoi ne duoc trong gang tac. Anh xoay nguoi, tung mot cu da moc vao bung han. Cu va cham vang len tieng bop kho khoc.

Ten thu hai lao vao om lay Hung tu phia sau. Hung giat manh khuyu tay ra sau, danh vao mat han. Tieng ren dau vang len ngay sau do. Nhung con ten thu ba da rut ra mot con dao gam, luoi dao anh len trong bong toi.

Khong do du, Hung nhay len thung container, roi phong minh sang mot gian giao kim loai ben canh. Ca khung gian giao rung len ban bat, phat ra am thanh ken ket choi tai. Han khong dung lai - phai chay tiep len tang tren. Cau thang sat hep dan len mai nha kho.

Tren mai kho, gio manh thoi vu vu. Mat trang lo ra khoi dam may, de lo bong dang hai nguoi. Ten ve si cuoi cung cung len toi noi, tho hong hoc. Chung dung doi dien nhau, mat long song soc nhin nhau.

Ten ve si lao toi truoc. Hung do duoc cu dam dau tien, nhung dinh ngay mot cu moc vao mang suon. Anh gap nguoi vi dau. Camera lac manh. Hung chom toi om lay chan doi thu, quat han nga xuong san mai. Mot tieng dong lon vang len.

Hung dung day truoc, tho gap gap. Anh nhin xuong ten ve si dang nam bat dong, roi quay lung buoc di vao man dem. Tren nguoi anh, nhung vet thuong bat dau ri mau, nhung anh mat van kien dinh nhu thep."""

# ============================================================
# TEST SUITE 3: MISSING ASSET FALLBACK / AO GIAC AI
# Trong tam: Tram 6 khong crash, gan co null an toan, log vao missing_assets_backlog.jsonl
# ============================================================

TC3_CONTENT = """Phi hanh gia An tinh day trong khoang dieu khien cua con tau vu tru Zephyr-7. Anh den LED mau tim chap chon nhap nhay, bao hieu he thong ho tro su song dang gap truc trac. An voi vang kiem tra bang dieu khien hologram noi lo lung trong khong trung.

"May tinh, bao cao trang thai!" An ra lenh voi giong cang thang.
Tri tue nhan tao cua tau, mang ten IRIS, vang len voi giong lanh leo: "He thong dieu huong chinh bi hu hai 67%. Phat hien tu truong bat thuong tu tieu hanh tinh gan nhat. Khuyen cao: Chuan bi ha canh khan cap."

Qua khung cua so kinh cuong luc cua khoang lai, An thay mot hanh tinh mau tim ky la voi nhung tinh the lo lung lap lanh ben duoi. Nhung hon dao da troi noi tren bau troi, ket noi voi nhau bang nhung cay cau anh sang mo ao. Chua tung co ban do nao ghi nhan hanh tinh nay.

Tau Zephyr-7 rung lac du doi khi bat dau xuyen qua bau khi quyen dac quanh mau hong. An bau chat lay ghe lai. Tieng coi bao dong rit len. "Hay giu vung, IRIS! Chung ta sap tiep dat roi!"

Tau dap xuong mat dat voi mot cu va cham manh. Khoi boc len nghi ngut xung quanh. An loang choang buoc ra khoi tau, tay cam mot thanh kiem anh sang mau xanh neon lam vu khi tu ve. Mat dat duoi chan anh la nhung phien da phat quang mau tim, moi buoc di lai phat ra am thanh nhu thuy tinh vo.

Dot nhien, tu phia sau mot khoi tinh the khong lo, bon sinh vat robot co hinh dang giong bo ngua khong lo xuat hien. Mat chung phat ra anh sang do ruc, va tren cang cua chung gan nhung khau phao plasma dang keu vo ve.

"XAM PHAM! TIEU DIET!" Giong robotic cua chung vang len dong thanh, choi tai.

An nhanh chong trieu hoi chiec mo-to bay cua minh. Co may lo lung cach mat dat nua met, dong co phan luc ruc sang mau cam. Anh nhay len xe, van ga het co, phong vot di giua nhung tang da lo lung. Nhung tia plasma do ruc bay veo veo qua dau.

An luon lach qua cac khoi tinh the, co gang tim noi tru an. Phia truoc, mot cong dich chuyen khong gian mo ra nhu mot vong xoay anh sang bay sac cau vong. Anh khong con lua chon nao khac - nham mat, tang toc toi da, lao thang vao vong xoay.

Anh sang choi loa bao trum moi thu. Moi am thanh tat lim. An roi vao khoang khong vo dinh, chi con lai tieng tim dap va hoi tho gap gap cua chinh minh. Lieu anh co song sot duoc khong?"""


def seed_edge_cases():
    db: Session = SessionLocal()
    try:
        # ============================================================
        # TC1: HOI THOAI & CAM XUC CUONG DO CAO
        # ============================================================
        tc1_drama = db.query(Drama).filter(Drama.title == "[EDGE-TC1] Con Gian Dem Mua").first()
        if not tc1_drama:
            tc1_drama = Drama(
                title="[EDGE-TC1] Con Gian Dem Mua",
                description="Edge Case Test: Hoi thoai cuong do cao, tranh cai gay gat, cam xuc cuc doan. Kiem thu Speaker Routing, Lip-sync, Expression Layer.",
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
                title="[TC1] Bao Trong Dem",
                description="Edge Case Test: Cuoc tranh cai nay lua giua Nam va Trang trong dem mua.",
                content=TC1_CONTENT,
                status="active"
            )
            db.add(tc1_episode)
            db.commit()
            db.refresh(tc1_episode)
            print(f"[TC1] Created Episode: {tc1_episode.title}")
        else:
            print(f"[TC1] Episode '{tc1_episode.title}' already exists.")

        # ============================================================
        # TC2: HANH DONG & NHIP DO NHANH
        # ============================================================
        tc2_drama = db.query(Drama).filter(Drama.title == "[EDGE-TC2] Cuoc Truy Duoi Trong Bong Toi").first()
        if not tc2_drama:
            tc2_drama = Drama(
                title="[EDGE-TC2] Cuoc Truy Duoi Trong Bong Toi",
                description="Edge Case Test: Danh nhau, ruot duoi, boi canh toi tam. Kiem thu Cinematic Camera, VFX Overlay.",
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
                title="[TC2] Bong Ma Trong Hem",
                description="Edge Case Test: Cuoc ruot duoi va danh nhau trong khu cong nghiep bo hoang.",
                content=TC2_CONTENT,
                status="active"
            )
            db.add(tc2_episode)
            db.commit()
            db.refresh(tc2_episode)
            print(f"[TC2] Created Episode: {tc2_episode.title}")
        else:
            print(f"[TC2] Episode '{tc2_episode.title}' already exists.")

        # ============================================================
        # TC3: MISSING ASSET FALLBACK / AO GIAC AI
        # ============================================================
        tc3_drama = db.query(Drama).filter(Drama.title == "[EDGE-TC3] Du Hanh Vu Tru Phi Ly").first()
        if not tc3_drama:
            tc3_drama = Drama(
                title="[EDGE-TC3] Du Hanh Vu Tru Phi Ly",
                description="Edge Case Test: Asset khong ton tai trong registry. Kiem thu Tram 6 khong crash, log missing_assets_backlog.",
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
                title="[TC3] Hanh Tinh Tinh The Tim",
                description="Edge Case Test: Phi hanh gia, kiem anh sang, mo-to bay, robot bo ngua. Tat ca asset KHONG ton tai.",
                content=TC3_CONTENT,
                status="active"
            )
            db.add(tc3_episode)
            db.commit()
            db.refresh(tc3_episode)
            print(f"[TC3] Created Episode: {tc3_episode.title}")
        else:
            print(f"[TC3] Episode '{tc3_episode.title}' already exists.")

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
        print("Characters NOT pre-created - Station 2 (Extractor) will generate them.")
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
