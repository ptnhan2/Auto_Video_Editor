"""Structured output validation for LLM batch responses.

Layer 1 (Provider): JSON Schema definitions for litellm response_format.
Layer 2 (Client): validate_batch_updates() enforces required fields + enums.
Layer 3 (Feedback): build_validation_feedback() builds targeted retry prompts.
Layer 4 (Degradation): Handled in station-specific _apply_* functions.
"""

# ---------------------------------------------------------------------------
# Layer 1 — Provider-level JSON Schemas (OpenAI strict structured output)
# ---------------------------------------------------------------------------

S5_JSON_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "visual_director_batch",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "final_updates": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "shot_number": {"type": "integer"},
                            "storyboard_id": {"type": "string"},
                            "layout_style": {
                                "type": "string",
                                "enum": [
                                    "diorama",
                                    "scrapbook",
                                    "split_screen",
                                    "frame_in_frame",
                                    "isometric",
                                    "top_down",
                                    "matchbox",
                                    "continuous_scroll",
                                ],
                            },
                            "camera_concept": {
                                "type": "string",
                                "enum": [
                                    "endless_pan",
                                    "micro_macro_zoom",
                                    "whip_pan",
                                    "camera_shake",
                                    "crash_zoom",
                                    "dutch_roll",
                                    "dolly_zoom_2d",
                                ],
                            },
                            "asset_dynamics": {
                                "type": "string",
                                "enum": [
                                    "stop_motion_stutter",
                                    "spring_overshoot",
                                    "wobble_jitter",
                                    "float_drift",
                                    "paper_fold",
                                    "hinge_rigging",
                                    "smear_2d",
                                ],
                            },
                            "visual_metaphor": {
                                "type": "string",
                                "enum": [
                                    "red_string",
                                    "highlight_redact",
                                    "kinetic_typography",
                                    "magnifying_glass",
                                    "blueprint_overlay",
                                    "polaroid_frame",
                                ],
                            },
                            "transition_in": {
                                "type": "string",
                                "enum": [
                                    "paper_tear",
                                    "ink_bleed",
                                    "object_wipe",
                                    "graphic_match_cut",
                                    "page_flip",
                                    "burn_reveal",
                                ],
                            },
                            "atmosphere_fx": {
                                "type": "string",
                                "enum": [
                                    "drop_shadows",
                                    "halftone_filter",
                                    "paper_texture",
                                    "light_leaks",
                                    "chromatic_aberration",
                                    "film_grain",
                                ],
                            },
                            "action_id": {"type": "string"},
                            "expression_tag": {"type": "string"},
                            "background_id": {"type": "string"},
                            "character_positions": {"type": "array"},
                        },
                        "required": [
                            "shot_number",
                            "storyboard_id",
                            "layout_style",
                            "camera_concept",
                            "asset_dynamics",
                            "visual_metaphor",
                            "transition_in",
                            "atmosphere_fx",
                            "action_id",
                            "expression_tag",
                            "background_id",
                        ],
                    },
                }
            },
            "required": ["final_updates"],
        },
    },
}

S6_JSON_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "sound_vfx_batch",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "final_updates": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "shot_number": {"type": "integer"},
                            "storyboard_id": {"type": "string"},
                            "sfx_id": {"type": "string"},
                            "vfx_tags": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "bgm_track": {"type": "string"},
                        },
                        "required": ["shot_number", "storyboard_id"],
                    },
                }
            },
            "required": ["final_updates"],
        },
    },
}

# ---------------------------------------------------------------------------
# Layer 2 — Client-side field schemas (subset for validation)
# ---------------------------------------------------------------------------

S5_SHOT_SCHEMA = {
    "layout_style": {
        "required": True,
        "enum": [
            "diorama",
            "scrapbook",
            "split_screen",
            "frame_in_frame",
            "isometric",
            "top_down",
            "matchbox",
            "continuous_scroll",
        ],
    },
    "camera_concept": {
        "required": True,
        "enum": [
            "endless_pan",
            "micro_macro_zoom",
            "whip_pan",
            "camera_shake",
            "crash_zoom",
            "dutch_roll",
            "dolly_zoom_2d",
        ],
    },
    "asset_dynamics": {
        "required": True,
        "enum": [
            "stop_motion_stutter",
            "spring_overshoot",
            "wobble_jitter",
            "float_drift",
            "paper_fold",
            "hinge_rigging",
            "smear_2d",
        ],
    },
    "visual_metaphor": {
        "required": True,
        "enum": [
            "red_string",
            "highlight_redact",
            "kinetic_typography",
            "magnifying_glass",
            "blueprint_overlay",
            "polaroid_frame",
        ],
    },
    "transition_in": {
        "required": True,
        "enum": [
            "paper_tear",
            "ink_bleed",
            "object_wipe",
            "graphic_match_cut",
            "page_flip",
            "burn_reveal",
        ],
    },
    "atmosphere_fx": {
        "required": True,
        "enum": [
            "drop_shadows",
            "halftone_filter",
            "paper_texture",
            "light_leaks",
            "chromatic_aberration",
            "film_grain",
        ],
    },
    "action_id": {"required": True},
    "expression_tag": {"required": True},
    "background_id": {"required": True},
}

S6_SHOT_SCHEMA = {
    "sfx_id": {"required": False},
    "vfx_tags": {"required": False},
    "bgm_track": {"required": False},
}

# ---------------------------------------------------------------------------
# Layer 2 — Validation function
# ---------------------------------------------------------------------------


def validate_batch_updates(updates, schema, expected_shot_count):
    """Validate every shot update has required fields and valid enum values.

    Args:
        updates: List of shot update dicts from parse.
        schema: Dict of field_name -> {required: bool, enum: list|None}.
        expected_shot_count: Expected number of shots in the batch.

    Returns:
        (is_valid, errors_by_shot):
            is_valid: True if all checks pass.
            errors_by_shot: Dict shot_index -> list of error strings.
    """
    if not updates:
        return False, {"batch": ["No updates parsed (empty list)"]}

    errors = {}

    # Check shot count
    if len(updates) != expected_shot_count:
        errors["batch"] = [
            f"Expected {expected_shot_count} shots, got {len(updates)}"
        ]

    for i, update in enumerate(updates):
        shot_errors = []

        for field, spec in schema.items():
            # Field completely missing
            if field not in update:
                if spec.get("required", False):
                    shot_errors.append(f"MISSING required field '{field}'")
                continue

            val = update.get(field)

            # Field present but empty string or None
            if val is None or (isinstance(val, str) and val.strip() == ""):
                if spec.get("required", False):
                    shot_errors.append(f"EMPTY required field '{field}'")
                continue

            # Skip enum validation for MISSING:... fallback values
            if isinstance(val, str) and val.startswith("MISSING:"):
                continue

            # Enum validation
            allowed = spec.get("enum")
            if allowed and val not in allowed:
                shot_errors.append(
                    f"INVALID enum for '{field}': got '{val}', "
                    f"allowed: {allowed}"
                )

        if shot_errors:
            errors[i] = shot_errors

    is_valid = len(errors) == 0
    return is_valid, errors


# ---------------------------------------------------------------------------
# Layer 3 — Feedback prompt builder
# ---------------------------------------------------------------------------


def build_validation_feedback(errors_by_shot):
    """Build a Vietnamese prompt telling the LLM exactly which fields to fix.

    Args:
        errors_by_shot: Dict from validate_batch_updates().

    Returns:
        String with structured feedback for appending to the prompt.
    """
    lines = [
        "Kết quả kiểm tra JSON của bạn có các lỗi sau. Vui lòng sửa:"
    ]
    lines.append("")

    if "batch" in errors_by_shot:
        for err in errors_by_shot["batch"]:
            lines.append(f"- TOÀN BỘ BATCH: {err}")
        lines.append("")

    shot_keys = sorted(
        [k for k in errors_by_shot.keys() if isinstance(k, int)]
    )
    for shot_idx in shot_keys:
        errs = errors_by_shot[shot_idx]
        lines.append(f"Shot #{shot_idx + 1}:")
        for err in errs:
            lines.append(f"  - {err}")
        lines.append("")

    lines.append(
        "Trả về JSON ĐẦY ĐỦ với TẤT CẢ các field bắt buộc cho MỌI shot. "
        "Nếu không tìm thấy asset phù hợp, dùng 'MISSING: <mô tả>'."
    )
    return "\n".join(lines)
