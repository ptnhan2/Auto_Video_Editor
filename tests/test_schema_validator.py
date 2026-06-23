"""Tests for schema_validator.py — 4-layer defense validation logic."""

from src.shared.schema_validator import (
    S5_SHOT_SCHEMA,
    S6_SHOT_SCHEMA,
    validate_batch_updates,
    build_validation_feedback,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_s5_update(shot_number=1, overrides=None):
    """Build a valid S5 shot update dict, optionally overriding fields."""
    base = {
        "shot_number": shot_number,
        "storyboard_id": f"sb_{shot_number}",
        "layout_style": "diorama",
        "camera_concept": "zoom",
        "asset_dynamics": "stop_motion_stutter",
        "visual_metaphor": "red_string",
        "transition_in": "cross-dissolve",
        "atmosphere_fx": "grain",
        "action_id": "act_hero_dodge",
        "expression_tag": "expr_focused",
        "background_id": "bg_arena",
    }
    if overrides:
        base.update(overrides)
    return base


def _make_s6_update(shot_number=1, overrides=None):
    """Build a valid S6 shot update dict, optionally overriding fields."""
    base = {
        "shot_number": shot_number,
        "storyboard_id": f"sb_{shot_number}",
        "sfx_id": "sfx_whoosh",
        "vfx_tags": ["vfx_speed_lines"],
        "bgm_track": "bgm_tension",
    }
    if overrides:
        base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# AC: Pass khi tất cả field hợp lệ
# ---------------------------------------------------------------------------

def test_validate_all_fields_valid_s5():
    """All S5 fields present with valid enum values -> is_valid=True."""
    updates = [_make_s5_update(1), _make_s5_update(2)]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 2)
    assert is_valid is True
    assert errors == {}


def test_validate_all_fields_valid_s6():
    """All S6 fields present -> is_valid=True (S6 has no required enum fields)."""
    updates = [_make_s6_update(1), _make_s6_update(2)]
    is_valid, errors = validate_batch_updates(updates, S6_SHOT_SCHEMA, 2)
    assert is_valid is True
    assert errors == {}


def test_validate_empty_updates():
    """Empty updates list -> is_valid=False, batch-level error."""
    is_valid, errors = validate_batch_updates([], S5_SHOT_SCHEMA, 2)
    assert is_valid is False
    assert "batch" in errors


# ---------------------------------------------------------------------------
# AC: Fail khi thiếu required field -> detect đúng field thiếu
# ---------------------------------------------------------------------------

def test_missing_required_field_detected():
    """Shot missing 'layout_style' -> error mentions the field name."""
    updates = [_make_s5_update(1, {"layout_style": None})]
    del updates[0]["layout_style"]  # completely remove the key
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 1)
    assert is_valid is False
    assert 0 in errors
    field_errors = " ".join(errors[0])
    assert "layout_style" in field_errors
    assert "MISSING" in field_errors


def test_multiple_missing_fields_detected():
    """Shot missing 2 required fields -> both reported."""
    update = _make_s5_update(1)
    del update["camera_concept"]
    del update["background_id"]
    updates = [update]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 1)
    assert is_valid is False
    assert 0 in errors
    combined = " ".join(errors[0])
    assert "camera_concept" in combined
    assert "background_id" in combined


def test_empty_required_field_detected():
    """Required field present but empty string -> EMPTY error."""
    updates = [_make_s5_update(1, {"action_id": ""})]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 1)
    assert is_valid is False
    assert 0 in errors
    field_errors = " ".join(errors[0])
    assert "action_id" in field_errors
    assert "EMPTY" in field_errors


# ---------------------------------------------------------------------------
# AC: Fail khi sai enum -> detect đúng field sai + giá trị nhận được
# ---------------------------------------------------------------------------

def test_invalid_enum_value_detected():
    """layout_style with invalid value -> error contains field, value, allowed."""
    updates = [_make_s5_update(1, {"layout_style": "banana_split"})]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 1)
    assert is_valid is False
    assert 0 in errors
    err_text = errors[0][0]
    assert "layout_style" in err_text
    assert "banana_split" in err_text
    assert "INVALID" in err_text


def test_invalid_enum_multiple_fields():
    """Two fields with wrong enum values -> both detected."""
    updates = [
        _make_s5_update(1, {
            "layout_style": "not_a_layout",
            "transition_in": "not_a_transition",
        })
    ]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 1)
    assert is_valid is False
    assert 0 in errors
    assert len(errors[0]) == 2


# ---------------------------------------------------------------------------
# AC: Fail khi thiếu toàn bộ shot -> detect
# ---------------------------------------------------------------------------

def test_shot_count_mismatch():
    """Expected 3 shots, got 2 -> batch error reports count mismatch."""
    updates = [_make_s5_update(1), _make_s5_update(2)]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 3)
    assert is_valid is False
    assert "batch" in errors
    assert "3" in errors["batch"][0]  # expected
    assert "2" in errors["batch"][0]  # got


# ---------------------------------------------------------------------------
# AC: Bỏ qua field MISSING:... (fallback hợp lệ)
# ---------------------------------------------------------------------------

def test_missing_prefix_skips_enum_validation():
    """Field value 'MISSING: không có action phù hợp' -> treated as valid."""
    updates = [
        _make_s5_update(1, {"action_id": "MISSING: không có action phù hợp"})
    ]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 1)
    assert is_valid is True
    assert errors == {}


def test_missing_prefix_in_enum_field_passes():
    """Enum field with MISSING:... prefix -> skips enum check, passes."""
    updates = [
        _make_s5_update(
            1, {"layout_style": "MISSING: không biết chọn layout nào"}
        )
    ]
    is_valid, errors = validate_batch_updates(updates, S5_SHOT_SCHEMA, 1)
    assert is_valid is True
    assert errors == {}


def test_missing_prefix_none_value_passes():
    """None value in optional fields (like S6) should be treated as absent."""
    updates = [{"shot_number": 1, "storyboard_id": "sb_1", "sfx_id": None}]
    is_valid, errors = validate_batch_updates(updates, S6_SHOT_SCHEMA, 1)
    assert is_valid is True
    assert errors == {}


# ---------------------------------------------------------------------------
# AC: Feedback prompt đúng format
# ---------------------------------------------------------------------------

def test_feedback_format_contains_missing_field():
    """Feedback mentions the missing required field by name."""
    errors = {0: ["MISSING required field 'layout_style'"]}
    feedback = build_validation_feedback(errors)
    assert "Shot #1" in feedback
    assert "layout_style" in feedback
    assert "MISSING" in feedback


def test_feedback_format_contains_enum_error():
    """Feedback includes the invalid value and field name."""
    errors = {
        2: [
            "INVALID enum for 'camera_concept': got 'crazy_zoom', "
            "allowed: ['zoom', 'shake', 'pan', 'rotate', 'static']"
        ]
    }
    feedback = build_validation_feedback(errors)
    assert "Shot #3" in feedback
    assert "camera_concept" in feedback
    assert "crazy_zoom" in feedback


def test_feedback_format_contains_batch_error():
    """Feedback includes batch-level error for shot count mismatch."""
    errors = {"batch": ["Expected 5 shots, got 3"]}
    feedback = build_validation_feedback(errors)
    assert "TOÀN BỘ BATCH" in feedback
    assert "5" in feedback
    assert "3" in feedback


def test_feedback_multiple_shots():
    """Feedback lists errors for each shot separately with correct numbering."""
    errors = {
        0: ["MISSING required field 'action_id'"],
        2: ["INVALID enum for 'transition_in': got 'fade', allowed: [...]"],
        "batch": ["Expected 3 shots, got 2"],
    }
    feedback = build_validation_feedback(errors)
    assert "Shot #1" in feedback
    assert "Shot #3" in feedback
    assert "TOÀN BỘ BATCH" in feedback


# ---------------------------------------------------------------------------
# AC: S6 optional fields — không báo lỗi khi thiếu
# ---------------------------------------------------------------------------

def test_s6_optional_fields_missing_passes():
    """S6 fields sfx_id/vfx_tags/bgm_track are optional -> missing = valid."""
    updates = [{"shot_number": 1, "storyboard_id": "sb_1"}]
    is_valid, errors = validate_batch_updates(updates, S6_SHOT_SCHEMA, 1)
    assert is_valid is True
