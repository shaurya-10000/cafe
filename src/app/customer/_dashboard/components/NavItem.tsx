import { buildBadgeClassName, buildNavItemClassName } from "../styles";
import type { NavItemConfig } from "../types";

interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  /** Badge count; the badge is hidden at 0 or when the item has no badge. */
  count: number;
  /** Items leave the tab order while the sidebar is closed. */
  focusable: boolean;
  onSelect: () => void;
}

export function NavItem({
  item,
  isActive,
  count,
  focusable,
  onSelect,
}: NavItemProps) {
  const { Icon, label, badge } = item;

  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      tabIndex={focusable ? 0 : -1}
      onClick={onSelect}
      className={buildNavItemClassName(isActive)}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} aria-hidden="true" /> {label}
      </div>

      {badge && count > 0 && (
        <span
          aria-label={badge.ariaLabel(count)}
          className={buildBadgeClassName(isActive, badge.tone)}
        >
          {count}
        </span>
      )}
    </button>
  );
}