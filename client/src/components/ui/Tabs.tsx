import { useCallback, useId } from 'react';
import './tabs.css';

export interface TabItem {
  id: string;
  label: string;
  /** Optional badge count. */
  badge?: number;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Accessible label for the tablist. */
  label: string;
  /** Optional. Defaults to "horizontal". */
  orientation?: 'horizontal' | 'vertical';
}

export function Tabs({
  items,
  activeId,
  onChange,
  label,
  orientation = 'horizontal',
}: TabsProps): React.JSX.Element {
  const baseId = useId();

  const tabId = useCallback(
    (id: string): string => `${baseId}-tab-${id}`,
    [baseId],
  );
  const panelId = useCallback(
    (id: string): string => `${baseId}-panel-${id}`,
    [baseId],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      const currentIndex = items.findIndex((item) => item.id === activeId);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (orientation === 'horizontal') {
        if (event.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % items.length;
        } else if (event.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + items.length) % items.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = items.length - 1;
        } else {
          return;
        }
      } else {
        if (event.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % items.length;
        } else if (event.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + items.length) % items.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = items.length - 1;
        } else {
          return;
        }
      }

      event.preventDefault();
      const nextItem = items[nextIndex];
      if (nextItem != null) {
        onChange(nextItem.id);
        // Move focus to the newly-active tab button.
        const tabEl = document.getElementById(tabId(nextItem.id));
        tabEl?.focus();
      }
    },
    [items, activeId, onChange, orientation, tabId],
  );

  return (
    <div className={`tabs${orientation === 'vertical' ? ' tabs--vertical' : ''}`}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        className="tabs__list"
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              id={tabId(item.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId(item.id)}
              tabIndex={isActive ? 0 : -1}
              className="tabs__tab"
              onClick={() => { onChange(item.id); }}
              type="button"
            >
              {item.label}
              {item.badge != null && (
                <span className="tabs__badge" aria-label={`${item.badge} items`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Returns the panel element props for a given tab id (consumed by the parent). */
export function getTabPanelProps(
  tabsBaseId: string,
  tabId: string,
): { id: string; role: 'tabpanel'; 'aria-labelledby': string } {
  return {
    id: `${tabsBaseId}-panel-${tabId}`,
    role: 'tabpanel',
    'aria-labelledby': `${tabsBaseId}-tab-${tabId}`,
  };
}
