/**
 * Unit tests cho ReviewPanel constants và types.
 *
 * Test EDIT_TYPE_CONFIG và ProposedEdit type definitions
 * để đảm bảo component contract hợp lệ.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock tailwind-merge để tránh lỗi module resolution
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { EDIT_TYPE_CONFIG, type ProposedEdit } from '../review-panel';

// ── Sample data ────────────────────────────────────────────────────

const sampleEdits: ProposedEdit[] = [
  {
    id: 'e1',
    type: 'add',
    elementType: 'text',
    description: 'Thêm tiêu đề mới vào scene mở đầu',
    sceneId: 'scene-1',
    trackId: 'track-1',
  },
  {
    id: 'e2',
    type: 'remove',
    elementType: 'effect',
    description: 'Xóa hiệu ứng glitch dư thừa',
    sceneId: 'scene-1',
    trackId: 'track-2',
  },
  {
    id: 'e3',
    type: 'change',
    elementType: 'transition',
    description: 'Đổi transition từ dip-black sang cross-dissolve',
    sceneId: 'scene-2',
    trackId: 'track-1',
  },
];

// ===========================================================================
// Tests: Edit types
// ===========================================================================

describe('ProposedEdit types', () => {
  it('có đủ 3 loại edit: add, remove, change', () => {
    const types = new Set(sampleEdits.map((e) => e.type));
    expect(types.has('add')).toBe(true);
    expect(types.has('remove')).toBe(true);
    expect(types.has('change')).toBe(true);
  });

  it('mỗi edit có id, type, elementType, description', () => {
    for (const edit of sampleEdits) {
      expect(edit.id).toBeTruthy();
      expect(edit.type).toBeTruthy();
      expect(edit.elementType).toBeTruthy();
      expect(edit.description).toBeTruthy();
    }
  });

  it('add edit có sceneId và trackId', () => {
    const addEdit = sampleEdits.find((e) => e.type === 'add');
    expect(addEdit?.sceneId).toBeTruthy();
    expect(addEdit?.trackId).toBeTruthy();
  });
});

// ===========================================================================
// Tests: EDIT_TYPE_CONFIG
// ===========================================================================

describe('EDIT_TYPE_CONFIG', () => {
  it('có config cho cả 3 loại edit', () => {
    expect(EDIT_TYPE_CONFIG.add).toBeDefined();
    expect(EDIT_TYPE_CONFIG.remove).toBeDefined();
    expect(EDIT_TYPE_CONFIG.change).toBeDefined();
  });

  it('mỗi config có label', () => {
    expect(EDIT_TYPE_CONFIG.add.label).toBe('Add');
    expect(EDIT_TYPE_CONFIG.remove.label).toBe('Remove');
    expect(EDIT_TYPE_CONFIG.change.label).toBe('Change');
  });

  it('mỗi config có icon và badgeClass', () => {
    for (const config of Object.values(EDIT_TYPE_CONFIG)) {
      expect(config.icon).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.badgeClass).toBeTruthy();
    }
  });

  it('add config badgeClass chứa chart-2 (màu xanh)', () => {
    expect(EDIT_TYPE_CONFIG.add.badgeClass).toContain('chart-2');
  });

  it('remove config badgeClass chứa destructive (màu đỏ)', () => {
    expect(EDIT_TYPE_CONFIG.remove.badgeClass).toContain('destructive');
  });

  it('change config badgeClass chứa chart-4 (màu cam/vàng)', () => {
    expect(EDIT_TYPE_CONFIG.change.badgeClass).toContain('chart-4');
  });
});

// ===========================================================================
// Tests: ReviewPanel states
// ===========================================================================

describe('ReviewPanel state transitions', () => {
  it('type ProposedEdit hỗ trợ add/remove/change', () => {
    const validTypes = ['add', 'remove', 'change'] as const;
    for (const edit of sampleEdits) {
      expect(validTypes).toContain(edit.type);
    }
  });

  it('sampleEdits có đầy đủ thông tin cần thiết', () => {
    expect(sampleEdits).toHaveLength(3);
    for (const edit of sampleEdits) {
      expect(typeof edit.id).toBe('string');
      expect(typeof edit.description).toBe('string');
      expect(typeof edit.elementType).toBe('string');
    }
  });
});
