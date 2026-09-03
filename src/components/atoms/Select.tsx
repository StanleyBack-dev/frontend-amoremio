// Atom: Select — a searchable combobox that keeps the native <select> API.
// Callers still pass <option> children and an onChange reading
// `event.target.value`; this component parses those options and adds a
// type-to-filter dropdown on top.
import React, {
  SelectHTMLAttributes,
  ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import {
  fieldControlClass,
  fieldControlHeight,
  fieldErrorClass,
  fieldErrorTextClass,
  fieldLabelClass,
} from "./field";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  children: ReactNode;
  error?: string;
}

interface OptionData {
  value: string;
  label: string;
  disabled: boolean;
}

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

// Walks the children tree collecting every <option>, so `{list.map(...)}`
// and stray conditionals still work.
function collectOptions(node: ReactNode, out: OptionData[]): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectOptions(child, out));
    return;
  }
  if (!isValidElement(node)) return;
  if (node.type === "option") {
    const props = node.props as {
      value?: string | number;
      children?: ReactNode;
      disabled?: boolean;
    };
    const label = textOf(props.children);
    out.push({
      value: props.value === undefined ? label : String(props.value),
      label,
      disabled: Boolean(props.disabled),
    });
    return;
  }
  collectOptions(
    (node.props as { children?: ReactNode }).children ?? null,
    out,
  );
}

export default function Select({
  label,
  labelClassName = "",
  wrapperClassName = "",
  children,
  error,
  className = "",
  value,
  onChange,
  onBlur,
  disabled,
  required,
  id,
  name,
  "aria-label": ariaLabel,
}: SelectProps) {
  const options = useMemo(() => {
    const out: OptionData[] = [];
    collectOptions(children, out);
    return out;
  }, [children]);

  const currentValue = value === undefined ? "" : String(value);
  const selected = options.find((o) => o.value === currentValue);
  const selectedLabel = selected?.label ?? "";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // The menu is portaled to <body> with fixed positioning so it can never be
  // clipped by a Drawer's overflow or hidden behind a sibling's stacking
  // context. Flips above the field when there isn't room below.
  const updatePosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      ...(openUp
        ? {
            bottom: window.innerHeight - rect.top + 4,
            maxHeight: Math.max(120, Math.min(maxHeight, spaceAbove - 12)),
          }
        : {
            top: rect.bottom + 4,
            maxHeight: Math.max(120, Math.min(maxHeight, spaceBelow - 12)),
          }),
    });
  }, []);

  // Position the menu synchronously, before the browser paints, so it never
  // shows for a frame as a static-flow child of <body> (which would push the
  // page and read as a full-screen flash).
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        close();
      }
    };
    const onReflow = () => updatePosition();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    document.addEventListener("mousedown", onDocDown);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, updatePosition]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[activeIndex] as
        | HTMLElement
        | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  function fireChange(nextValue: string) {
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as unknown as React.ChangeEvent<HTMLSelectElement>);
  }

  function close() {
    if (!open) return;
    setOpen(false);
    setQuery("");
    onBlur?.({} as unknown as React.FocusEvent<HTMLSelectElement>);
  }

  function openMenu() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    const idx = options.findIndex((o) => o.value === currentValue);
    setActiveIndex(idx >= 0 ? idx : 0);
  }

  function pick(option: OptionData) {
    if (option.disabled) return;
    if (option.value !== currentValue) fireChange(option.value);
    setOpen(false);
    setQuery("");
    // Do NOT fire onBlur here: forms that save on blur read state that the
    // fireChange above only just scheduled. onBlur fires later, on real
    // focus-out (see the input's onBlur / close()), once state has settled.
    inputRef.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return openMenu();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) pick(option);
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        close();
      }
    }
  }

  const displayValue = open ? query : selectedLabel;

  return (
    <div className={wrapperClassName} ref={rootRef}>
      {label && (
        <label className={`${fieldLabelClass} ${labelClassName}`} htmlFor={id}>
          {label}
          {required && (
            <span className="ml-0.5 text-err-fg" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          required={required}
          value={displayValue}
          placeholder={selectedLabel || "Selecione"}
          onMouseDown={(event) => {
            if (open) return;
            event.preventDefault();
            openMenu();
            inputRef.current?.focus();
          }}
          onFocus={() => {
            if (!open) openMenu();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // Delay so a click on an option (mousedown) wins the race.
            window.setTimeout(() => {
              if (!rootRef.current?.contains(document.activeElement)) {
                close();
              }
            }, 0);
          }}
          className={`${fieldControlClass} ${fieldControlHeight} cursor-pointer pr-9 ${
            open ? "cursor-text" : ""
          } ${error ? fieldErrorClass : ""} ${className}`}
        />
        <ChevronDown
          size={15}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      {error && <div className={fieldErrorTextClass}>{error}</div>}

      {open &&
        menuStyle &&
        createPortal(
          <ul
            ref={listRef}
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            style={menuStyle}
            className="z-[9999] overflow-y-auto rounded-md border border-hairline-strong bg-card py-1 shadow-pop"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-[13px] text-ink-subtle">
                Nada encontrado
              </li>
            )}
            {filtered.map((option, index) => {
              const isSelected = option.value === currentValue;
              const isActive = index === activeIndex;
              return (
                <li
                  key={`${option.value}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pick(option);
                  }}
                  className={`cursor-pointer px-3 py-2 text-[13px] ${
                    option.disabled
                      ? "cursor-not-allowed text-ink-subtle"
                      : isActive
                        ? "bg-brand-50 text-brand-700"
                        : isSelected
                          ? "font-medium text-ink"
                          : "text-ink"
                  }`}
                >
                  {option.label || "—"}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
