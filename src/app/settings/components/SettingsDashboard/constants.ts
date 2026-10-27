import { Palette, ShoppingBag, User } from "lucide-react";
import type { MenuItem } from "./types";

export const MENU_ITEMS: readonly MenuItem[] = [
  { id: "profile", label: "Account", icon: User },
  { id: "orders", label: "Order Preferences", icon: ShoppingBag },
  { id: "appearance", label: "Appearance", icon: Palette },
];

/** Query param the AI concierge uses to open a settings section. */
export const TAB_PARAM = "tab";

export const SIGN_OUT_REDIRECT_URL = "/";

export const SIGN_OUT_ERROR_MESSAGE =
  "Couldn\u2019t sign you out. Please try again.";
