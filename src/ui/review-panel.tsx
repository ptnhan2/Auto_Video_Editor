// ✏️ EDIT ZONE START
'use client';

import { useState, useCallback } from 'react';
import { Check, X, CheckCheck, XCircle, Plus, Minus, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────

/** Một thay đổi được AI đề xuất (add/remove/change element trong project). */
export interface ProposedEdit {
  id: string;
  type: 'add' | 'remove' | 'change';
  elementType: string;
  description: string;
  sceneId?: string;
  trackId?: string;
  before?: unknown;
  after?: unknown;
}

/** Trạng thái review của một edit riêng lẻ. */
type EditReviewState = 'pending' | 'approved' | 'rejected';

interface ReviewPanelProps {
  episodeId: string;
  edits: ProposedEdit[];
  /** Gọi khi review hoàn tất — có thể reload page hoặc đóng panel. */
  onComplete?: (result: { applied: number; rejected: number }) => void;
}

// ── Constants ──────────────────────────────────────────────────────

/**
 * Cấu hình hiển thị cho từng loại edit.
 * Mỗi loại có icon, label, và color class riêng để user phân biệt.
 */
export const EDIT_TYPE_CONFIG = {
  add: {
    icon: Plus,
    label: 'Add',
    badgeClass: 'bg-chart-2/15 text-chart-2 border-chart-2/30',
  },
  remove: {
    icon: Minus,
    label: 'Remove',
    badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
  },
  change: {
    icon: Pencil,
    label: 'Change',
    badgeClass: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  },
} as const;

// ── Main Component ─────────────────────────────────────────────────

/**
 * ReviewPanel hiển thị danh sách proposed edits từ AI và cho phép user
 * duyệt (approve) hoặc từ chối (reject) từng edit hoặc tất cả cùng lúc.
 *
 * Component có 4 state: empty (không có edits), loading (đang gọi API),
 * error (API lỗi), và success (review hoàn tất).
 *
 * @param episodeId - ID của episode đang review
 * @param edits - Danh sách các proposed edits từ AI
 * @param onComplete - Callback sau khi gọi API review xong
 *
 * @sideEffect
 *   - Gọi POST /api/opencut/review khi user bấm Approve All / Reject All
 *   - Gọi POST /api/opencut/review khi user bấm approve/reject từng edit
 */
export function ReviewPanel({ episodeId, edits, onComplete }: ReviewPanelProps) {
  const [editStates, setEditStates] = useState<Record<string, EditReviewState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ applied: number; rejected: number } | null>(null);

  /**
   * Gửi review decision lên API cho một hoặc nhiều edit.
   *
   * @param decision - "approve" hoặc "reject"
   * @param targetEdits - Danh sách edit bị ảnh hưởng (mặc định: tất cả)
   * @sideEffect Cập nhật state và gọi onComplete callback
   */
  const submitReview = useCallback(
    async (decision: 'approve' | 'reject', targetEdits?: ProposedEdit[]) => {
      setLoading(true);
      setError(null);

      const editsToSend = targetEdits ?? edits;

      try {
        const res = await fetch('/api/opencut/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId,
            decision,
            edits: editsToSend,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Review failed');
        }

        // Cập nhật trạng thái từng edit
        const newState: Record<string, EditReviewState> = {};
        for (const edit of editsToSend) {
          newState[edit.id] = decision === 'approve' ? 'approved' : 'rejected';
        }
        setEditStates((prev) => ({ ...prev, ...newState }));
        setResult(data);
        onComplete?.(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [episodeId, edits, onComplete],
  );

  /**
   * Xử lý approve/reject một edit riêng lẻ.
   *
   * @param edit - Edit cần xử lý
   * @param decision - "approve" hoặc "reject"
   */
  const handleSingleEdit = useCallback(
    (edit: ProposedEdit, decision: 'approve' | 'reject') => {
      submitReview(decision, [edit]);
    },
    [submitReview],
  );

  // ── Empty state ──
  if (edits.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
            <CheckCheck className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            No edits to review
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            AI hasn&apos;t proposed any changes for this episode yet.
          </p>
        </div>
      </div>
    );
  }

  // ── Success state ──
  const allResolved = edits.every(
    (e) => editStates[e.id] === 'approved' || editStates[e.id] === 'rejected',
  );

  if (result && !loading && allResolved) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/15">
            <CheckCheck className="h-6 w-6 text-chart-2" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Review Complete</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.applied} edit(s) approved, {result.rejected} edit(s) rejected.
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-destructive">Review Error</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setResult(null);
              }}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit list ──
  const pendingCount = edits.filter(
    (e) => !editStates[e.id] || editStates[e.id] === 'pending',
  ).length;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-card-foreground">Review AI Edits</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendingCount} edit{pendingCount !== 1 ? 's' : ''} pending review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => submitReview('reject')}
            disabled={loading || pendingCount === 0}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold',
              'bg-destructive/10 text-destructive',
              'hover:bg-destructive/20 active:scale-95 transition-all',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject All
          </button>
          <button
            type="button"
            onClick={() => submitReview('approve')}
            disabled={loading || pendingCount === 0}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold',
              'text-primary-foreground',
              'hover:opacity-90 active:scale-95 transition-all',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Approve All
          </button>
        </div>
      </div>

      {/* Edit list */}
      <div className="divide-y divide-border">
        {edits.map((edit) => {
          const state = editStates[edit.id] ?? 'pending';
          const config = EDIT_TYPE_CONFIG[edit.type];
          const TypeIcon = config.icon;

          return (
            <div
              key={edit.id}
              className={cn(
                'flex items-start gap-4 px-6 py-4 transition-colors',
                state === 'approved' && 'bg-chart-2/5',
                state === 'rejected' && 'bg-destructive/5',
              )}
            >
              {/* Type badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                  config.badgeClass,
                )}
              >
                <TypeIcon className="h-3 w-3" />
                {config.label}
              </span>

              {/* Description */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-card-foreground leading-snug">
                  {edit.description}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {edit.elementType}
                  {edit.sceneId && ` · ${edit.sceneId}`}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {state === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSingleEdit(edit, 'reject')}
                      disabled={loading}
                      className={cn(
                        'inline-flex items-center justify-center h-7 w-7 rounded-md',
                        'border border-destructive/30 bg-destructive/10',
                        'text-destructive hover:bg-destructive/20',
                        'active:scale-95 transition-all',
                        'disabled:opacity-40 disabled:cursor-not-allowed',
                      )}
                      aria-label={`Reject: ${edit.description}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSingleEdit(edit, 'approve')}
                      disabled={loading}
                      className={cn(
                        'inline-flex items-center justify-center h-7 w-7 rounded-md',
                        'border border-chart-2/30 bg-chart-2/15',
                        'text-chart-2 hover:bg-chart-2/25',
                        'active:scale-95 transition-all',
                        'disabled:opacity-40 disabled:cursor-not-allowed',
                      )}
                      aria-label={`Approve: ${edit.description}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {state === 'approved' && (
                  <span className="text-[11px] font-semibold text-chart-2 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Approved
                  </span>
                )}
                {state === 'rejected' && (
                  <span className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                    <X className="h-3.5 w-3.5" />
                    Rejected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ✏️ EDIT ZONE END
