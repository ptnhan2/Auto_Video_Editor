// ✏️ EDIT ZONE START
"use client";

import { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import type { Drama } from "@/shared/types/episode";

export interface CreateEpisodeFormProps {
  dramas: Drama[];
  onCreateEpisode: (dramaId: string, title: string) => Promise<void>;
}

export function CreateEpisodeForm({ dramas, onCreateEpisode }: CreateEpisodeFormProps) {
  const [dramaId, setDramaId] = useState("");
  const [title, setTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDramas = dramas.filter(
    (d) => d.status === "draft" || d.status === "in_progress",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dramaId || !title.trim()) {
      setError("Please select a drama and enter a title.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateEpisode(dramaId, title.trim());
      setTitle("");
      setDramaId("");
      setIsOpen(false);
    } catch {
      setError("Failed to create episode. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDramaId("");
    setError(null);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        Create New Episode
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-card-foreground">
        New Episode
      </h3>
      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="drama-select"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Drama
          </label>
          <select
            id="drama-select"
            value={dramaId}
            onChange={(e) => {
              setDramaId(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
            disabled={isSubmitting}
          >
            <option value="">Select a drama...</option>
            {activeDramas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
            {activeDramas.length === 0 && (
              <option disabled>No active dramas available</option>
            )}
          </select>
        </div>
        <div>
          <label
            htmlFor="episode-title"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Episode Title
          </label>
          <input
            id="episode-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="Enter episode title..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring"
            disabled={isSubmitting}
            maxLength={200}
          />
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isSubmitting ? "Creating..." : "Create Episode"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
// ✏️ EDIT ZONE END
