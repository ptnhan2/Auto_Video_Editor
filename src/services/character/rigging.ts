export const RIGGING_CONFIG = {
    // Assets
    ACTIVE_BLUEPRINT: 'humanoid',
    ASSET_ID: 'char_001',
    
    // Background removal thresholds
    BG_ALPHA_THRESHOLD: 50,
    BG_G_R_DIFF: 30,
    BG_G_B_DIFF: 30,
    BG_G_MIN: 100,

    // Pose Detection
    POSE_MODEL_TYPE: 'SINGLEPOSE_THUNDER',

    // Geometry offsets & constants
    ARMPIT_Y_OFFSET: 50,
    CROTCH_Y_OFFSET: 50,
    JOINT_DEFAULT_RADIUS: 25,
    TRUE_JOINT_DEFAULT_DIST: 15,
    TRUE_JOINT_TRACE_LIMIT: 200,
    HAND_FALLBACK_OFFSET: 100,
    THIGH_TRACE_OFFSET: 5,
    THIGH_FALLBACK_LIMIT: 300,
    SPLIT_MASK_EXT: 500,

    // Face & Chin
    CHIN_Y_OFFSET: -5, // -5 chin offset added recently
    FACE_WIDTH_MULTIPLIER: 1.5,
    LEGACY_CHIN_RATIO: 0.6,

    // Mask Extraction
    EROSION_RADIUS: 2,
    CALF_Y_OFFSET: 20,
    
    // Symmetry Duplication
    MEDIAN_FILTER_SIZE: 5,
};
