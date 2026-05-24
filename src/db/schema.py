from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from .database import Base
from src.shared.id_generator import generate_ulid

# ==========================================
# PIVOT TABLES
# ==========================================

class EpisodeCharacter(Base):
    __tablename__ = 'episode_characters'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    episode_id = Column(String, ForeignKey('episodes.id'), nullable=False)
    character_id = Column(String, ForeignKey('characters.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class EpisodeScene(Base):
    __tablename__ = 'episode_scenes'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    episode_id = Column(String, ForeignKey('episodes.id'), nullable=False)
    scene_id = Column(String, ForeignKey('scenes.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class StoryboardCharacter(Base):
    __tablename__ = 'storyboard_characters'
    
    storyboard_id = Column(String, ForeignKey('storyboards.id'), primary_key=True, nullable=False)
    character_id = Column(String, ForeignKey('characters.id'), primary_key=True, nullable=False)

# ==========================================
# MAIN ENTITIES (CORE PIPELINE)
# ==========================================

class Drama(Base):
    __tablename__ = 'dramas'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    genre = Column(String, nullable=True)
    style = Column(String, default='realistic')
    total_episodes = Column(Integer, default=1)
    total_duration = Column(Integer, default=0)
    status = Column(String, nullable=False, default='draft')
    thumbnail = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    metadata_ = Column('metadata', Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    episodes = relationship("Episode", back_populates="drama")
    characters = relationship("Character", back_populates="drama")
    scenes = relationship("Scene", back_populates="drama")

class Episode(Base):
    __tablename__ = 'episodes'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    drama_id = Column(String, ForeignKey('dramas.id'), nullable=False)
    episode_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    script_content = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    duration = Column(Integer, default=0)
    status = Column(String, default='draft')
    video_url = Column(String, nullable=True)
    thumbnail = Column(String, nullable=True)
    image_config_id = Column(String, nullable=True)
    video_config_id = Column(String, nullable=True)
    audio_config_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    drama = relationship("Drama", back_populates="episodes")
    storyboards = relationship("Storyboard", back_populates="episode")
    
    characters = relationship("Character", secondary='episode_characters', back_populates="episodes")
    scenes = relationship("Scene", secondary='episode_scenes', back_populates="episodes")

class Character(Base):
    __tablename__ = 'characters'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    drama_id = Column(String, ForeignKey('dramas.id'), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    appearance = Column(Text, nullable=True)
    personality = Column(Text, nullable=True)
    voice_style = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    reference_images = Column(Text, nullable=True)
    seed_value = Column(String, nullable=True)
    sort_order = Column(Integer, nullable=True)
    local_path = Column(String, nullable=True)
    voice_sample_url = Column(String, nullable=True)
    voice_provider = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    drama = relationship("Drama", back_populates="characters")
    episodes = relationship("Episode", secondary='episode_characters', back_populates="characters")
    storyboards = relationship("Storyboard", secondary='storyboard_characters', back_populates="characters")

class Scene(Base):
    __tablename__ = 'scenes'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    drama_id = Column(String, ForeignKey('dramas.id'), nullable=False)
    episode_id = Column(String, ForeignKey('episodes.id'), nullable=True)
    location = Column(String, nullable=False)
    time = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    storyboard_count = Column(Integer, default=1)
    image_url = Column(String, nullable=True)
    status = Column(String, default='pending')
    local_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    drama = relationship("Drama", back_populates="scenes")
    episodes = relationship("Episode", secondary='episode_scenes', back_populates="scenes")
    storyboards = relationship("Storyboard", back_populates="scene")

class Storyboard(Base):
    __tablename__ = 'storyboards'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    episode_id = Column(String, ForeignKey('episodes.id'), nullable=False)
    scene_id = Column(String, ForeignKey('scenes.id'), nullable=True)
    speaker_id = Column(String, ForeignKey('characters.id'), nullable=True)
    storyboard_number = Column(Integer, nullable=False)
    title = Column(String, nullable=True)
    location = Column(String, nullable=True)
    time = Column(String, nullable=True)
    shot_type = Column(String, nullable=True)
    angle = Column(String, nullable=True)
    movement = Column(String, nullable=True)
    action = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    atmosphere = Column(String, nullable=True)
    image_prompt = Column(Text, nullable=True)
    video_prompt = Column(Text, nullable=True) # Legacy - Will be replaced by tech specs
    
    # Technical Specifications for Remotion (Graphic Editor Paradigm)
    layout_style = Column(String, nullable=True)     # diorama, scrapbook, split_grid...
    camera_concept = Column(String, nullable=True)   # micro_macro_zoom, endless_pan...
    asset_dynamics = Column(String, nullable=True)   # JSON string for all assets in shot
    visual_metaphor = Column(String, nullable=True)  # red_string, magnifying_glass...
    transition_in = Column(String, nullable=True)    # paper_tear, ink_bleed...
    atmosphere_fx = Column(String, nullable=True)    # halftone_grain, vintage_vignette...
    
    # Mapping Assets
    action_id = Column(String, nullable=True)
    expression_tag = Column(String, nullable=True)
    background_id = Column(String, nullable=True)
    character_position = Column(Text, nullable=True)  # JSON string for character positions per shot
    
    bgm_prompt = Column(Text, nullable=True)
    sound_effect = Column(String, nullable=True)
    dialogue = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    duration = Column(Integer, default=0)
    composed_image = Column(String, nullable=True)
    first_frame_image = Column(String, nullable=True)
    last_frame_image = Column(String, nullable=True)
    reference_images = Column(Text, nullable=True)
    video_url = Column(String, nullable=True)
    tts_audio_url = Column(String, nullable=True)
    subtitle_url = Column(String, nullable=True)
    composed_video_url = Column(String, nullable=True)
    status = Column(String, default='pending')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    episode = relationship("Episode", back_populates="storyboards")
    scene = relationship("Scene", back_populates="storyboards")
    characters = relationship("Character", secondary='storyboard_characters', back_populates="storyboards")

# ==========================================
# OTHER TABLES (EXTENDED ECOSYSTEM)
# ==========================================

class AiServiceConfig(Base):
    __tablename__ = 'ai_service_configs'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    service_type = Column(String, nullable=False)
    provider = Column(String, nullable=True)
    name = Column(String, nullable=False)
    base_url = Column(String, nullable=False)
    api_key = Column(String, nullable=False)
    model = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    query_endpoint = Column(String, nullable=True)
    priority = Column(Integer, default=0)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    settings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AiServiceProvider(Base):
    __tablename__ = 'ai_service_providers'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    name = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    service_type = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    default_url = Column(String, nullable=True)
    preset_models = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AiVoice(Base):
    __tablename__ = 'ai_voices'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    voice_id = Column(String, nullable=False, unique=True)
    voice_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    provider = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class AgentConfig(Base):
    __tablename__ = 'agent_configs'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    agent_type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    model = Column(String, nullable=True)
    system_prompt = Column(Text, nullable=True)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    max_iterations = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

class ImageGeneration(Base):
    __tablename__ = 'image_generations'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    storyboard_id = Column(String, nullable=True)
    drama_id = Column(String, nullable=True)
    scene_id = Column(String, nullable=True)
    character_id = Column(String, nullable=True)
    prop_id = Column(String, nullable=True)
    image_type = Column(String, nullable=True)
    frame_type = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    prompt = Column(Text, nullable=True)
    negative_prompt = Column(Text, nullable=True)
    model = Column(String, nullable=True)
    size = Column(String, nullable=True)
    quality = Column(String, nullable=True)
    style = Column(String, nullable=True)
    steps = Column(Integer, nullable=True)
    cfg_scale = Column(Float, nullable=True)
    seed = Column(Integer, nullable=True)
    image_url = Column(String, nullable=True)
    minio_url = Column(String, nullable=True)
    local_path = Column(String, nullable=True)
    status = Column(String, default='pending')
    task_id = Column(String, nullable=True)
    error_msg = Column(Text, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    reference_images = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

class VideoGeneration(Base):
    __tablename__ = 'video_generations'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    storyboard_id = Column(String, nullable=True)
    drama_id = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    prompt = Column(Text, nullable=True)
    model = Column(String, nullable=True)
    image_gen_id = Column(String, nullable=True)
    reference_mode = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    first_frame_url = Column(String, nullable=True)
    last_frame_url = Column(String, nullable=True)
    reference_image_urls = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)
    fps = Column(Integer, nullable=True)
    resolution = Column(String, nullable=True)
    aspect_ratio = Column(String, nullable=True)
    style = Column(String, nullable=True)
    motion_level = Column(Integer, nullable=True)
    camera_motion = Column(String, nullable=True)
    seed = Column(Integer, nullable=True)
    video_url = Column(String, nullable=True)
    minio_url = Column(String, nullable=True)
    local_path = Column(String, nullable=True)
    status = Column(String, default='pending')
    task_id = Column(String, nullable=True)
    error_msg = Column(Text, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)

class VideoMerge(Base):
    __tablename__ = 'video_merges'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    episode_id = Column(String, nullable=True)
    drama_id = Column(String, nullable=True)
    title = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    model = Column(String, nullable=True)
    status = Column(String, default='pending')
    scenes = Column(Text, nullable=True)
    merged_url = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)
    task_id = Column(String, nullable=True)
    error_msg = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)

class Prop(Base):
    __tablename__ = 'props'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    drama_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    prompt = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    reference_images = Column(Text, nullable=True)
    local_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

class Asset(Base):
    __tablename__ = 'assets'
    
    id = Column(String, primary_key=True, default=generate_ulid)
    drama_id = Column(String, nullable=True)
    episode_id = Column(String, nullable=True)
    storyboard_id = Column(String, nullable=True)
    storyboard_num = Column(Integer, nullable=True)
    name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=True)
    category = Column(String, nullable=True)
    url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    local_path = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)
    format = Column(String, nullable=True)
    image_gen_id = Column(String, nullable=True)
    video_gen_id = Column(String, nullable=True)
    is_favorite = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)


# ==========================================
# ASSET FACTORY QUEUE (Phase 1 - Issue #148)
# ==========================================

class AssetQueue(Base):
    __tablename__ = 'asset_queue'

    id = Column(String, primary_key=True, default=generate_ulid)
    asset_type = Column(String, nullable=False, index=True)
    prompt = Column(Text, nullable=True)
    hash_key = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default='PENDING', index=True)
    result_asset_id = Column(String, nullable=True)
    priority = Column(Integer, default=0)
    error_msg = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
