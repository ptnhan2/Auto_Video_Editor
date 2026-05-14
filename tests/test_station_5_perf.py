import json
from unittest.mock import MagicMock, patch

class FakeShot:
    def __init__(self, sid, num, action, characters, layout=None, cam=None, fx=None, char_pos=None):
        self.id = sid
        self.storyboard_number = num
        self.action = action
        self.characters = characters
        self.layout_style = layout
        self.camera_concept = cam
        self.visual_metaphor = fx
        self.character_position = char_pos

class FakeChar:
    def __init__(self, name):
        self.name = name

@patch("src.pipeline.station_5_visual_director.SessionLocal")
@patch("src.pipeline.station_5_visual_director.generate_content")
@patch("src.pipeline.station_5_visual_director.search_animation_registry")
@patch("src.pipeline.station_5_visual_director.update_storyboard_visuals")
def test_zero_tool_batch_processing(mock_update, mock_search, mock_gen, mock_db):
    from src.pipeline.station_5_visual_director import run_station_5_visual_director
    
    # Mock DB
    mock_session = MagicMock()
    mock_db.return_value = mock_session
    mock_query = mock_session.query.return_value.options.return_value.filter.return_value.order_by.return_value
    
    shot1 = FakeShot("s1", 1, "hero dodge", [FakeChar("Hero")])
    shot2 = FakeShot("s2", 2, "hero attack", [FakeChar("Hero")])
    mock_query.all.return_value = [shot1, shot2]
    
    # Mock search
    mock_search.return_value = [{"id": "asset_1"}]
    
    # Mock LLM
    mock_res = MagicMock()
    mock_res.choices[0].message.content = '''```json
    {
      "final_updates": [
        {
          "shot_number": 1,
          "storyboard_id": "s1",
          "layout_style": "diorama",
          "action_id": "asset_1"
        },
        {
          "shot_number": 2,
          "storyboard_id": "s2",
          "layout_style": "scrapbook",
          "action_id": "MISSING: jump"
        }
      ]
    }
    ```'''
    mock_gen.return_value = mock_res
    
    # Run
    # Write a dummy registry file to satisfy the os.path.exists check
    import os
    if not os.path.exists("public"):
        os.makedirs("public")
    with open("public/test_registry.json", "w") as f:
        json.dump({"actions": [], "expressions": [], "backgrounds": []}, f)
        
    result = run_station_5_visual_director("ep_1", "public/test_registry.json")
    
    assert result is True
    assert mock_gen.call_count == 1 # Only 1 call for the batch
    assert mock_update.call_count == 2 # 2 shots updated
