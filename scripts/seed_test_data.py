import sys
import os

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.database import SessionLocal, init_db
from src.db.schema import Drama, Episode, Character, Scene, Storyboard, EpisodeCharacter, EpisodeScene, StoryboardCharacter
from sqlalchemy.orm import Session

def seed_data():
    db: Session = SessionLocal()
    try:
        # 1. Create Drama
        drama = db.query(Drama).filter(Drama.title == 'Ngày Trở Về').first()
        if not drama:
            drama = Drama(
                title='Ngày Trở Về',
                description='Câu chuyện về sự trở về của một người cháu sau nhiều năm xa cách.',
                genre='Drama, Family',
                status='active'
            )
            db.add(drama)
            db.commit()
            db.refresh(drama)
            print(f"Created Drama: {drama.title}")
        else:
            print(f"Drama '{drama.title}' already exists.")

        # 2. Create Characters
        minh = db.query(Character).filter(Character.drama_id == drama.id, Character.name == 'Minh').first()
        if not minh:
            minh = Character(
                drama_id=drama.id,
                name='Minh',
                role='Main Character',
                description='Chàng trai 25 tuổi, làm việc ở thành phố, vừa trở về quê.',
                voice_style='Trẻ trung, ấm áp'
            )
            db.add(minh)
            print(f"Created Character: {minh.name}")
        
        ngoai = db.query(Character).filter(Character.drama_id == drama.id, Character.name == 'Bà Ngoại').first()
        if not ngoai:
            ngoai = Character(
                drama_id=drama.id,
                name='Bà Ngoại',
                role='Supporting Character',
                description='Người bà hiền hậu, sống ở quê, rất thương cháu.',
                voice_style='Già dặn, trìu mến'
            )
            db.add(ngoai)
            print(f"Created Character: {ngoai.name}")
        
        db.commit()
        db.refresh(minh)
        db.refresh(ngoai)

        # 3. Create Episode
        episode = db.query(Episode).filter(Episode.drama_id == drama.id, Episode.episode_number == 1).first()
        if not episode:
            episode = Episode(
                drama_id=drama.id,
                episode_number=1,
                title='Tết Đoàn Viên',
                description='Minh bất ngờ trở về nhà vào chiều 29 Tết.',
                status='active'
            )
            db.add(episode)
            db.commit()
            db.refresh(episode)
            print(f"Created Episode: {episode.title}")
        else:
            print(f"Episode '{episode.title}' already exists.")

        # Link characters to episode
        for char in [minh, ngoai]:
            link = db.query(EpisodeCharacter).filter(
                EpisodeCharacter.episode_id == episode.id,
                EpisodeCharacter.character_id == char.id
            ).first()
            if not link:
                db.add(EpisodeCharacter(episode_id=episode.id, character_id=char.id))

        # 4. Create Scenes
        scene1 = db.query(Scene).filter(Scene.episode_id == episode.id, Scene.location == 'Sân nhà cũ').first()
        if not scene1:
            scene1 = Scene(
                drama_id=drama.id,
                episode_id=episode.id,
                location='Sân nhà cũ',
                time='Chiều tà',
                prompt='Sân nhà cổ kính, cây mai vàng chớm nở, ánh hoàng hôn buông xuống.',
                status='completed'
            )
            db.add(scene1)
            print(f"Created Scene 1: {scene1.location}")
        
        scene2 = db.query(Scene).filter(Scene.episode_id == episode.id, Scene.location == 'Trong bếp').first()
        if not scene2:
            scene2 = Scene(
                drama_id=drama.id,
                episode_id=episode.id,
                location='Trong bếp',
                time='Tối',
                prompt='Gian bếp ấm cúng, khói từ nồi cá kho nghi ngút, ánh đèn vàng nhẹ.',
                status='completed'
            )
            db.add(scene2)
            print(f"Created Scene 2: {scene2.location}")
        
        db.commit()
        db.refresh(scene1)
        db.refresh(scene2)

        # Link scenes to episode
        for sc in [scene1, scene2]:
            link = db.query(EpisodeScene).filter(
                EpisodeScene.episode_id == episode.id,
                EpisodeScene.scene_id == sc.id
            ).first()
            if not link:
                db.add(EpisodeScene(episode_id=episode.id, scene_id=sc.id))

        # 5. Create Storyboards
        storyboard_data = [
            # Scene 1
            {
                "scene_id": scene1.id,
                "storyboard_number": 1,
                "speaker_id": minh.id,
                "dialogue": "Ngoại ơi, con về rồi đây!",
                "action": "Minh xách vali bước vào cổng, gọi to.",
                "shot_type": "Long Shot"
            },
            {
                "scene_id": scene1.id,
                "storyboard_number": 2,
                "speaker_id": ngoai.id,
                "dialogue": "Bố khỉ cái thằng này, làm bà giật mình!",
                "action": "Bà Ngoại đang quét sân, giật mình ngước lên nhìn.",
                "shot_type": "Medium Shot"
            },
            {
                "scene_id": scene1.id,
                "storyboard_number": 3,
                "speaker_id": minh.id,
                "dialogue": "Con nhớ ngoại quá, năm nay con về ăn Tết với ngoại luôn.",
                "action": "Minh chạy đến ôm bà ngoại.",
                "shot_type": "Close Up"
            },
            # Scene 2
            {
                "scene_id": scene2.id,
                "storyboard_number": 4,
                "speaker_id": ngoai.id,
                "dialogue": "Ăn cơm đi con, cá kho tộ món con thích đây.",
                "action": "Bà Ngoại múc cá vào bát cho Minh.",
                "shot_type": "Medium Shot"
            },
            {
                "scene_id": scene2.id,
                "storyboard_number": 5,
                "speaker_id": minh.id,
                "dialogue": "Vẫn là vị của ngoại, con đi xa thèm mãi.",
                "action": "Minh ăn một miếng cá, cười hạnh phúc.",
                "shot_type": "Close Up"
            },
            {
                "scene_id": scene2.id,
                "storyboard_number": 6,
                "speaker_id": ngoai.id,
                "dialogue": "Thèm thì ở lại đây luôn, đi chi cho xa xôi.",
                "action": "Bà Ngoại nhìn Minh trìu mến.",
                "shot_type": "Medium Shot"
            }
        ]

        for sb_info in storyboard_data:
            existing_sb = db.query(Storyboard).filter(
                Storyboard.episode_id == episode.id,
                Storyboard.storyboard_number == sb_info["storyboard_number"]
            ).first()
            
            if not existing_sb:
                sb = Storyboard(
                    episode_id=episode.id,
                    scene_id=sb_info["scene_id"],
                    speaker_id=sb_info["speaker_id"],
                    storyboard_number=sb_info["storyboard_number"],
                    dialogue=sb_info["dialogue"],
                    action=sb_info["action"],
                    shot_type=sb_info["shot_type"],
                    status='pending'
                )
                db.add(sb)
                db.flush() # To get ID for StoryboardCharacter
                
                # Add StoryboardCharacter link
                db.add(StoryboardCharacter(storyboard_id=sb.id, character_id=sb_info["speaker_id"]))
                print(f"Created Storyboard {sb.storyboard_number}")
            else:
                print(f"Storyboard {existing_sb.storyboard_number} already exists.")

        db.commit()
        print("Seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure UTF-8 output for Windows console
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    init_db() # Ensure tables are created
    seed_data()
