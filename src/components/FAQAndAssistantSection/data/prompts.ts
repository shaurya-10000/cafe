import { Calendar, Clock, MapPin, ShoppingBag, Utensils } from "lucide-react";
import type { SuggestedPrompt } from "../types";

export const DEFAULT_SUGGESTED_PROMPTS: readonly SuggestedPrompt[] = [
  {
    label: "Explore the menu",
    icon: Utensils,
    prompt: "Show me popular dishes on the menu.",
  },
  {
    label: "Add items to cart",
    icon: ShoppingBag,
    prompt: "How can I order or add items to my cart?",
  },
  {
    label: "Reserve a table",
    icon: Calendar,
    prompt: "I'd like to book a table for 2 people.",
  },
  {
    label: "Get directions",
    icon: MapPin,
    prompt: "Where are you located and how do I get there?",
  },
  {
    label: "Opening hours",
    icon: Clock,
    prompt: "What are your opening hours?",
  },
];
