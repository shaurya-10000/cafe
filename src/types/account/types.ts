export interface OrdersData { tab?: "active" | "history"; }
export interface RateOrderData { orderId?: string; }
export interface FavoriteData { itemId?: string; itemName?: string; }
export interface RewardData { rewardKey?: string; }
export interface NavigationData { sectionId?: string; }

export type ThemeMode = "light" | "dark" | "system";
export type ColorPalette = "espresso" | "emerald" | "rosewood" | "champagne";
export interface ThemeModeData { mode?: ThemeMode; }
export interface ColorPaletteData { palette?: ColorPalette; }

export interface NotificationPreferencesData { type?: string; }

export type AccountAction =
  | { type: "NAVIGATE_SECTION"; label: string; data?: NavigationData }
  | { type: "VIEW_ORDERS"; label: string; data?: OrdersData }
  | { type: "RATE_ORDER"; label: string; data?: RateOrderData }
  | { type: "VIEW_FAVORITES"; label: string; data?: Record<string, never> }
  | { type: "ADD_TO_FAVORITES"; label: string; data?: FavoriteData }
  | { type: "REMOVE_FROM_FAVORITES"; label: string; data?: FavoriteData }
  | { type: "VIEW_COUPONS"; label: string; data?: Record<string, never> }
  | { type: "OPEN_REWARD"; label: string; data?: RewardData }
  | { type: "OPEN_NOTIFICATIONS"; label: string; data?: Record<string, never> }
  | { type: "MUTE_ALL_NOTIFICATIONS"; label: string; data?: Record<string, never> }
  | { type: "UNMUTE_ALL_NOTIFICATIONS"; label: string; data?: Record<string, never> }
  | { type: "MUTE_NOTIFICATION_TYPE"; label: string; data?: NotificationPreferencesData }
  | { type: "UNMUTE_NOTIFICATION_TYPE"; label: string; data?: NotificationPreferencesData }
  | { type: "ENABLE_PUSH"; label: string; data?: Record<string, never> }
  | { type: "DISABLE_PUSH"; label: string; data?: Record<string, never> }
  | { type: "SET_THEME_MODE"; label: string; data?: ThemeModeData }
  | { type: "SET_COLOR_PALETTE"; label: string; data?: ColorPaletteData };
