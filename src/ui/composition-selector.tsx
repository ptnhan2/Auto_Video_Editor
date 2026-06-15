// ✏️ EDIT ZONE START
"use client";

import React from "react";
import { Check, ChevronDown } from "lucide-react";

export interface CompositionSelectorProps {
  /** Danh sách composition { id, label } lấy từ registry */
  compositions: { id: string; label: string }[];
  /** ID composition đang được chọn */
  selectedId: string;
  /** Callback khi user chọn composition khác */
  onSelect: (id: string) => void;
}

/**
 * Dropdown chọn Remotion composition.
 *
 * Tự đóng khi click bên ngoài. Hiển thị label dễ đọc,
 * đánh dấu item đang chọn bằng icon Check.
 * Style gọn nhẹ phù hợp với toolbar.
 */
export function CompositionSelector({
  compositions,
  selectedId,
  onSelect,
}: CompositionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = compositions.find((c) => c.id === selectedId);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 max-w-[180px] truncate">
          {selectedItem?.label ?? "Select"}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        >
          {compositions.map((comp) => {
            const isSelected = comp.id === selectedId;
            return (
              <li
                key={comp.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(comp.id);
                  setOpen(false);
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isSelected
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-card-foreground"
                }`}
              >
                <span>{comp.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
// ✏️ EDIT ZONE END
