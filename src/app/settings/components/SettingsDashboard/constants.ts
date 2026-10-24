import { Palette, User } from "lucide-react";
import type { MenuItem } from "./types";

export const MENU_ITEMS: readonly MenuItem[] = [
  { id: "profile", label: "Account", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export const SIGN_OUT_REDIRECT_URL = "/";

export const SIGN_OUT_ERROR_MESSAGE =
  "Couldn\u2019t sign you out. Please try again.";
