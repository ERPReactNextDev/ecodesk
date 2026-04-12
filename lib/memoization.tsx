"use client";

import React, { memo, useCallback, useMemo } from "react";

/**
 * Memoized list renderer - prevents re-renders of list items
 * Usage: <MemoizedList data={items} renderItem={(item) => <Row {...item} />} />
 */
interface MemoizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
}

function ListComponent<T>({ data, renderItem, keyExtractor, className }: MemoizedListProps<T>) {
  return (
    <div className={className}>
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  );
}

export const MemoizedList = memo(ListComponent) as <T>(
  props: MemoizedListProps<T>
) => React.ReactElement;

/**
 * Memoized table cell - prevents re-render when row data unchanged
 */
interface MemoizedCellProps {
  value: string | number | React.ReactNode;
  className?: string;
}

export const MemoizedCell = memo(function MemoizedCell({ value, className }: MemoizedCellProps) {
  return <td className={className}>{value}</td>;
});

/**
 * Memoized select option - prevents re-render when options unchanged
 */
interface MemoizedSelectOptionsProps {
  options: { value: string; label: string; disabled?: boolean }[];
}

export const MemoizedSelectOptions = memo(function MemoizedSelectOptions({
  options,
}: MemoizedSelectOptionsProps) {
  return (
    <>
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </>
  );
});

/**
 * useStableCallback - returns stable function reference
 * Use when passing callbacks to memoized children
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * useDeepMemo - memoizes object/array by deep comparison
 * Use when deps are objects/arrays that change reference but not content
 */
export function useDeepMemo<T>(value: T, deps: React.DependencyList): T {
  const ref = React.useRef<{ value: T; deps: React.DependencyList }>({ value, deps });

  const hasChanged = deps.some((dep, i) => {
    const prevDep = ref.current.deps[i];
    return JSON.stringify(dep) !== JSON.stringify(prevDep);
  });

  if (hasChanged) {
    ref.current = { value, deps };
  }

  return ref.current.value;
}

/**
 * Memoized input with stable callbacks
 * Prevents re-render on every parent render
 */
interface MemoizedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

export const MemoizedInput = memo(function MemoizedInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: MemoizedInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
});

/**
 * Virtual scroll container for large lists
 * Renders only visible items
 */
interface VirtualListProps<T> {
  data: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  containerHeight: number;
  overscan?: number;
}

export function VirtualList<T>({
  data,
  itemHeight,
  renderItem,
  keyExtractor,
  containerHeight,
  overscan = 5,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { visibleData, startIndex, offsetY } = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIdx = Math.min(data.length, startIdx + visibleCount);

    return {
      visibleData: data.slice(startIdx, endIdx),
      startIndex: startIdx,
      offsetY: startIdx * itemHeight,
    };
  }, [data, scrollTop, itemHeight, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = data.length * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: "auto" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleData.map((item, index) => (
            <div key={keyExtractor(item, startIndex + index)}>
              {renderItem(item, startIndex + index, { height: itemHeight })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * useMemoizedSelector - stable selector for derived state
 * Prevents recalculation when source hasn't changed
 */
export function useMemoizedSelector<T, R>(
  source: T,
  selector: (source: T) => R,
  deps: React.DependencyList
): R {
  return useMemo(() => selector(source), [source, ...deps]);
}

/**
 * MemoizedButton - stable button that prevents parent re-renders
 */
interface MemoizedButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  disabled?: boolean;
  className?: string;
}

export const MemoizedButton = memo(function MemoizedButton({
  onClick,
  children,
  variant = "default",
  disabled,
  className,
}: MemoizedButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  );
});
