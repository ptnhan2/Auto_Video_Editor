import json
from unittest.mock import MagicMock, patch


class FakeShot:
    """Fake Storyboard for testing — mimics Storyboard fields S6 uses."""
    def __init__(self, sid, num, action, dialogue=None, atmosphere=None, visual_metaphor=None,
                 characters=None, sound_effect=None, bgm_prompt=None):
        self.id = sid
        self.storyboard_number = num
        self.action = action
        self.dialogue = dialogue
        self.atmosphere = atmosphere
        self.visual_metaphor = visual_metaphor
        self.characters = characters or []
        self.sound_effect = sound_effect
        self.bgm_prompt = bgm_prompt


class FakeChar:
    """Fake Character."""
    def __init__(self, name):
        self.name = name


@patch("src.pipeline.station_6_sound_vfx_engineer.SessionLocal")
@patch("src.pipeline.station_6_sound_vfx_engineer.generate_content")
@patch("src.pipeline.station_6_sound_vfx_engineer.search_audio_vfx_registry")
@patch("src.pipeline.station_6_sound_vfx_engineer.report_missing_asset")
@patch("src.pipeline.station_6_sound_vfx_engineer.update_storyboard_audio")
def test_zero_tool_batch_audio_processing(mock_update, mock_report, mock_search, mock_gen, mock_db):
    """Verify S6 batch processing: 5 shots → 1 LLM call, 5 DB updates, correct MISSING handling."""
    from src.pipeline.station_6_sound_vfx_engineer import run_station_6_sound_vfx_engineer

    # Mock DB session
    mock_session = MagicMock()
    mock_db.return_value = mock_session
    mock_query = mock_session.query.return_value.options.return_value.filter.return_value.order_by.return_value

    shot1 = FakeShot("s1", 1, "hero dodge", dialogue="Look out!", atmosphere="tense", visual_metaphor="flash")
    shot2 = FakeShot("s2", 2, "hero punch", dialogue="Hiyah!", atmosphere="action", visual_metaphor="impact")
    shot3 = FakeShot("s3", 3, "hero run", atmosphere="urgent", visual_metaphor="speed_lines")
    shot4 = FakeShot("s4", 4, "hero jump", atmosphere="hopeful", visual_metaphor="sparkle")
    shot5 = FakeShot("s5", 5, "hero dialogue", dialogue="We did it!", atmosphere="emotional", visual_metaphor=None)
    mock_query.all.return_value = [shot1, shot2, shot3, shot4, shot5]

    # Mock search returns mixed results (SFX, VFX, BGM)
    mock_search.return_value = [{"id": "sfx_woosh", "type": "SFX"}, {"id": "vfx_flash", "type": "VFX"}, {"id": "bgm_tense", "type": "BGM"}]

    # Mock update to return success
    mock_update.return_value = {"status": "success"}

    # Mock LLM response — test MISSING handling and vfx_tags as list
    mock_res = MagicMock()
    mock_res.choices[0].message.content = """```json
    {
      "reasoning_and_tracking": [
        {"shot": 1, "logic": "Dodge needs woosh sound", "audio_mood": "tense"},
        {"shot": 2, "logic": "Punch impact", "audio_mood": "action"},
        {"shot": 3, "logic": "Running urgency", "audio_mood": "urgent"},
        {"shot": 4, "logic": "Hopeful jump", "audio_mood": "hopeful"},
        {"shot": 5, "logic": "Emotional resolution", "audio_mood": "emotional"}
      ],
      "final_updates": [
        {
          "shot_number": 1,
          "storyboard_id": "s1",
          "sfx_id": "sfx_woosh",
          "vfx_tags": ["vfx_flash"],
          "bgm_track": "bgm_tense"
        },
        {
          "shot_number": 2,
          "storyboard_id": "s2",
          "sfx_id": "MISSING: punch impact sound",
          "vfx_tags": ["MISSING: impact wave vfx"],
          "bgm_track": "bgm_tense"
        },
        {
          "shot_number": 3,
          "storyboard_id": "s3",
          "sfx_id": "sfx_woosh",
          "vfx_tags": [],
          "bgm_track": "MISSING: urgent chase bgm"
        },
        {
          "shot_number": 4,
          "storyboard_id": "s4",
          "sfx_id": "",
          "vfx_tags": "vfx_flash",
          "bgm_track": ""
        },
        {
          "shot_number": 5,
          "storyboard_id": "s5",
          "sfx_id": "sfx_woosh",
          "vfx_tags": null,
          "bgm_track": "bgm_tense"
        }
      ]
    }
    ```"""
    mock_gen.return_value = mock_res

    # Setup test registry with audio asset types
    import os
    registry_path = "public/test_audio_registry.json"
    with open(registry_path, "w") as f:
        json.dump({"sfx": [{"id": "sfx_woosh"}], "vfx": [{"id": "vfx_flash"}], "bgm": [{"id": "bgm_tense"}]}, f)

    try:
        result = run_station_6_sound_vfx_engineer("ep_1", registry_path)

        assert result is True
        assert mock_gen.call_count == 1  # Only 1 LLM call for the batch

        # All 5 shots should have update_storyboard_audio called
        assert mock_update.call_count == 5

        # Verify MISSING asset reporting
        # Shot 2: sfx_id MISSING → report "SFX"
        # Shot 2: vfx_tags[0] MISSING → report "VFX"
        # Shot 3: bgm_track MISSING → report "BGM"
        assert mock_report.call_count == 3

        # Extract all report calls by asset_type
        report_types = [call[0][1] for call in mock_report.call_args_list]
        assert "SFX" in report_types  # sfx_id missing
        assert "VFX" in report_types  # vfx_tags missing
        assert "BGM" in report_types  # bgm_track missing

        # Verify update_storyboard_audio calls have correct fields
        # Shot 1: all valid
        call_s1 = mock_update.call_args_list[0][1]
        assert call_s1["storyboard_id"] == "s1"
        assert call_s1["sfx_id"] == "sfx_woosh"
        assert call_s1["vfx_tags"] == ["vfx_flash"]
        assert call_s1["bgm_track"] == "bgm_tense"

        # Shot 2: MISSING values cleaned to empty
        call_s2 = mock_update.call_args_list[1][1]
        assert call_s2["storyboard_id"] == "s2"
        assert call_s2["sfx_id"] == ""  # MISSING stripped
        assert call_s2["vfx_tags"] == []  # MISSING removed from list

        # Shot 3: bgm_track MISSING → empty
        call_s3 = mock_update.call_args_list[2][1]
        assert call_s3["sfx_id"] == "sfx_woosh"
        assert call_s3["vfx_tags"] == []
        assert call_s3["bgm_track"] == ""  # MISSING stripped

        # Shot 4: vfx_tags as string → normalized to list
        call_s4 = mock_update.call_args_list[3][1]
        assert call_s4["vfx_tags"] == ["vfx_flash"]  # string → list normalized
        assert call_s4["sfx_id"] == ""

        # Shot 5: vfx_tags as None → normalized to []
        call_s5 = mock_update.call_args_list[4][1]
        assert call_s5["vfx_tags"] == []  # null → [] normalized
        assert call_s5["sfx_id"] == "sfx_woosh"
    finally:
        if os.path.exists(registry_path):
            os.remove(registry_path)


@patch("src.pipeline.station_6_sound_vfx_engineer.SessionLocal")
@patch("src.pipeline.station_6_sound_vfx_engineer.generate_content")
@patch("src.pipeline.station_6_sound_vfx_engineer.search_audio_vfx_registry")
@patch("src.pipeline.station_6_sound_vfx_engineer.report_missing_asset")
@patch("src.pipeline.station_6_sound_vfx_engineer.update_storyboard_audio")
def test_multi_batch_cross_batch_history(mock_update, mock_report, mock_search, mock_gen, mock_db):
    """Verify S6 multi-batch: 15 shots → 2 batches, cross-batch history, db.expire_all().

    AC1: 15 shots → 2 LLM calls, 15 DB updates
    AC2: _build_compact_history sees previous batch data after expire_all
    """
    from src.pipeline.station_6_sound_vfx_engineer import run_station_6_sound_vfx_engineer

    # -- Mock DB session with expire_all tracking --
    mock_session = MagicMock()
    mock_db.return_value = mock_session

    # Setup the full query chain: query(...).options(...).filter(...).order_by(...).all()
    mock_query = mock_session.query.return_value.options.return_value.filter.return_value.order_by.return_value

    # -- Build 15 FakeShot objects (2 batches: 10 + 5) --
    atmospheres = ["tense", "action", "calm", "urgent", "hopeful"]
    shots = []
    for i in range(1, 16):
        shots.append(FakeShot(
            sid=f"s{i}",
            num=i,
            action=f"hero action {i}",
            dialogue=f"Line {i}" if i % 3 == 0 else None,
            atmosphere=atmospheres[i % 5],
            visual_metaphor=f"vfx_{i}" if i % 2 == 0 else None,
        ))
    mock_query.all.return_value = shots

    # -- Mock registry search --
    mock_search.return_value = [
        {"id": "sfx_woosh", "type": "SFX"},
        {"id": "vfx_flash", "type": "VFX"},
        {"id": "bgm_tense", "type": "BGM"},
    ]

    # -- Mock DB update always succeeds --
    mock_update.return_value = {"status": "success"}

    # -- Mock LLM: 2 responses (batch 1: 10 shots, batch 2: 5 shots) --
    def _build_batch_response(start_num, count):
        """Build valid JSON response for N shots starting at start_num."""
        updates = []
        for i in range(start_num, start_num + count):
            updates.append({
                "shot_number": i,
                "storyboard_id": f"s{i}",
                "sfx_id": "sfx_woosh",
                "vfx_tags": ["vfx_flash"],
                "bgm_track": "bgm_tense",
            })
        payload = json.dumps({
            "reasoning_and_tracking": [
                {"shot": i, "logic": f"Shot {i} logic", "audio_mood": "action"}
                for i in range(start_num, start_num + count)
            ],
            "final_updates": updates,
        }, ensure_ascii=False)

        resp = MagicMock()
        resp.choices[0].message.content = f"```json\n{payload}\n```"
        return resp

    mock_gen.side_effect = [
        _build_batch_response(1, 10),   # Batch 1: shots 1-10
        _build_batch_response(11, 5),   # Batch 2: shots 11-15
    ]

    # -- Setup registry file --
    import os
    registry_path = "public/test_multi_batch_registry.json"
    with open(registry_path, "w") as f:
        json.dump({
            "sfx": [{"id": "sfx_woosh"}],
            "vfx": [{"id": "vfx_flash"}],
            "bgm": [{"id": "bgm_tense"}],
        }, f)

    try:
        result = run_station_6_sound_vfx_engineer("ep_1", registry_path)

        # --- AC1: 2 LLM calls, 15 DB updates ---
        assert result is True
        assert mock_gen.call_count == 2, (
            f"Expected 2 LLM calls (2 batches), got {mock_gen.call_count}"
        )
        assert mock_update.call_count == 15, (
            f"Expected 15 DB updates (1 per shot), got {mock_update.call_count}"
        )

        # --- AC2: db.expire_all() called between batches ---
        # Called after each batch (batch 1 + batch 2 = 2 calls)
        assert mock_session.expire_all.call_count >= 2, (
            f"Expected expire_all() called at least 2 times (once per batch), "
            f"got {mock_session.expire_all.call_count}"
        )

        # --- AC2: Cross-batch history in batch 2 prompt ---
        batch2_prompt = mock_gen.call_args_list[1][1]["contents"]

        # History section must exist
        assert "LỊCH SỬ TỪ BATCH TRƯỚC" in batch2_prompt, (
            "Batch 2 prompt must include cross-batch history section"
        )

        # Previous batch shots (1-10) referenced in history
        for shot_num in range(1, 11):
            assert f"Shot {shot_num}" in batch2_prompt, (
                f"Batch 2 history must reference Shot {shot_num} from batch 1"
            )

        # Batch 2 shots themselves (11-15) appear in prompt body (not just history)
        assert "SHOT 11" in batch2_prompt
        assert "SHOT 15" in batch2_prompt

    finally:
        if os.path.exists(registry_path):
            os.remove(registry_path)
