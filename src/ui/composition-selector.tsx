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
 * Dropdown chọn Remotion composition từ danh sách hardcode.
 * Hiển thị label dễ đọc, đánh dấu item đang chọn bằng icon Check.
 * Tự đóng khi click bên ngoài dropdown.
 */
export function CompositionSelector({
  compositions,
  selectedId,
  onSelect,
}: CompositionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown khi click bên ngoài
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
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">
          {selectedItem?.label ?? "Select composition"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-1 w-full min-w-[260px] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
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
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isSelected
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-card-foreground"
                }`}
              >
                <span>{comp.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
// ✏️ EDIT ZONE END
