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
@patch("src.pipeline.station_5_visual_director.report_missing_asset")
@patch("src.pipeline.station_5_visual_director.update_storyboard_visuals")
def test_zero_tool_batch_processing(mock_update, mock_report, mock_search, mock_gen, mock_db):
    from src.pipeline.station_5_visual_director import run_station_5_visual_director

    # Mock DB
    mock_session = MagicMock()
    mock_db.return_value = mock_session
    mock_query = mock_session.query.return_value.options.return_value.filter.return_value.order_by.return_value

    shot1 = FakeShot("s1", 1, "hero dodge", [FakeChar("Hero")])
    shot2 = FakeShot("s2", 2, "hero attack", [FakeChar("Hero")])
    shot3 = FakeShot("s3", 3, "hero run", [FakeChar("Hero")])
    shot4 = FakeShot("s4", 4, "hero jump", [FakeChar("Hero")])
    shot5 = FakeShot("s5", 5, "hero land", [FakeChar("Hero")])
    mock_query.all.return_value = [shot1, shot2, shot3, shot4, shot5]

    # Mock search
    mock_search.return_value = [{"id": "asset_1"}]

    # Mock update_storyboard_visuals to return success
    mock_update.return_value = {"status": "success"}

    # Mock LLM — shot 2 has MISSING: jump
    mock_res = MagicMock()
    mock_res.choices[0].message.content = """```json
    {
      "final_updates": [
        {
          "shot_number": 1,
          "storyboard_id": "s1",
          "layout_style": "diorama",
          "action_id": "asset_1",
          "atmosphere_fx": ["film_grain", "light_leaks"]
        },
        {
          "shot_number": 2,
          "storyboard_id": "s2",
          "layout_style": "scrapbook",
          "action_id": "MISSING: jump",
          "atmosphere_fx": "film_grain"
        },
        {
          "shot_number": 3,
          "storyboard_id": "s3",
          "layout_style": "diorama",
          "action_id": "asset_1",
          "atmosphere_fx": []
        },
        {
          "shot_number": 4,
          "storyboard_id": "s4",
          "layout_style": "diorama",
          "action_id": "asset_1",
          "atmosphere_fx": ["single"]
        },
        {
          "shot_number": 5,
          "storyboard_id": "s5",
          "layout_style": "diorama",
          "action_id": "asset_1",
          "atmosphere_fx": null
        }
      ]
    }
    ```"""
    mock_gen.return_value = mock_res

    # Setup test registry
    import os
    os.makedirs("public", exist_ok=True)
    registry_path = "public/test_registry.json"
    with open(registry_path, "w") as f:
        json.dump({"actions": [], "expressions": [], "backgrounds": []}, f)

    try:
        result = run_station_5_visual_director("ep_1", registry_path)

        assert result is True
        assert mock_gen.call_count == 1  # Only 1 LLM call for the batch
        assert mock_update.call_count == 5  # All 5 shots updated in DB
        # Verify MISSING asset was reported with correct casing ("Action", not "action")
        assert mock_report.call_count == 1
        report_args = mock_report.call_args
        assert report_args[0][1] == "Action"  # asset_type must be "Action", not "action"
        assert "jump" in report_args[0][2]  # description contains the missing ID
        
        # Verify atmosphere_fx sanitization
        assert mock_update.call_args_list[0][1]['atmosphere_fx'] == "film_grain, light_leaks"
        assert mock_update.call_args_list[1][1]['atmosphere_fx'] == "film_grain"
        assert mock_update.call_args_list[2][1]['atmosphere_fx'] == ""
        assert mock_update.call_args_list[3][1]['atmosphere_fx'] == "single"
        assert mock_update.call_args_list[4][1]['atmosphere_fx'] == ""
    finally:
        # Cleanup temporary registry file
        if os.path.exists(registry_path):
            os.remove(registry_path)
