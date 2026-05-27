"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, ImageOff, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { AssetStatus } from "./StatusBadge";
import type { AssetType } from "./FilterBar";

export interface PreviewAsset {
  id: string;
  type: AssetType;
  prompt: string;
  status: AssetStatus;
  createdAt: string;
  url?: string;
}

interface AssetPreviewModalProps {
  asset: PreviewAsset | null;
  open: boolean;
  onClose: () => void;
}

function isAudioType(type: AssetType): boolean {
  return type === "BGM" || type === "SFX";
}

export function AssetPreviewModal({
  asset,
  open,
  onClose,
}: AssetPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  if (!asset) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "rounded-xl border border-border bg-card p-0 shadow-2xl",
        "backdrop:bg-background/70 backdrop:backdrop-blur-sm",
        "w-[90vw] max-w-xl",
        "open:animate-in open:fade-in open:zoom-in-95",
      )}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Asset Preview
            </h3>
            <StatusBadge status={asset.status} />
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Metadata */}
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              Type:{" "}
              <span className="font-medium text-foreground">
                {asset.type}
              </span>
            </span>
            <span className="text-muted-foreground">
              ID:{" "}
              <span className="font-mono text-xs text-foreground">
                {asset.id}
              </span>
            </span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
            {asset.prompt}
          </p>

          {/* Preview area */}
          <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
            {isAudioType(asset.type) ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Music className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Audio playback requires backend support
                </p>
                {asset.url ? (
                  <audio controls className="w-full max-w-sm">
                    <source src={asset.url} type="audio/mpeg" />
                  </audio>
                ) : (
                  <p className="text-xs text-muted-foreground/60">
                    No audio URL available in preview
                  </p>
                )}
              </div>
            ) : asset.url ? (
              <img
                src={asset.url}
                alt={asset.prompt}
                className="w-full h-auto max-h-[60vh] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <ImageOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No preview available
                </p>
              </div>
            )}
            {/* Fallback for broken image */}
            <div className="hidden flex-col items-center justify-center py-16 px-4">
              <ImageOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Failed to load preview image
              </p>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
