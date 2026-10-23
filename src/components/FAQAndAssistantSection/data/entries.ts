import type { FAQEntry } from "../types";

export const DEFAULT_FAQ_ENTRIES: readonly FAQEntry[] = [
  {
    id: "reservation-policy",
    category: "reservations",
    q: "What is your reservation & cancellation policy?",
    a: "Reservations can be canceled or rescheduled up to 2 hours prior to your slot directly through your customer dashboard without any fee. Inside the 2-hour window, a small hold may apply on tables of six or more.",
  },
  {
    id: "dietary-restrictions",
    category: "dining",
    q: "Do you cater to specific dietary restrictions?",
    a: "Yes. Our live digital menu highlights vegan, gluten-free, nut-free, and halal choices in real time, and every dish page lists its full allergen profile. Our kitchen also accommodates cross-contamination requests when flagged at checkout.",
  },
  {
    id: "large-groups",
    category: "reservations",
    q: "Is there private event space or large group seating available?",
    a: "For parties larger than 8, please submit a custom inquiry via the AI Concierge or contact our events manager directly. We host private dinners for up to 40 guests in the mezzanine, with dedicated service staff and a bespoke tasting menu.",
  },
  {
    id: "menu-seasons",
    category: "dining",
    q: "How often does the menu change?",
    a: "Our core espresso bar is permanent, but the seasonal food and single-origin pour-over menus rotate every six to eight weeks based on what our roasters and local farms are bringing in.",
  },
  {
    id: "order-pickup",
    category: "orders",
    q: "Can I place an order for pickup or delivery?",
    a: "Yes. Add items to your cart from the menu, then choose pickup or delivery at checkout. Pickup orders are typically ready in 12\u201315 minutes; delivery is handled through our local courier partners within a 3-mile radius.",
  },
  {
    id: "order-modify",
    category: "orders",
    q: "Can I modify or cancel an order after placing it?",
    a: "You can modify or cancel any order from your dashboard until the kitchen marks it as in-progress \u2014 usually a 3\u20135 minute window. Once it's in-progress, please call the store directly and we'll do our best to help.",
  },
  {
    id: "opening-hours",
    category: "visit",
    q: "What are your opening hours?",
    a: "We're open Monday through Friday from 7:00 AM to 8:00 PM, Saturday from 8:00 AM to 9:00 PM, and Sunday from 8:00 AM to 6:00 PM. Holiday hours are posted on our homepage one week in advance.",
  },
  {
    id: "location-parking",
    category: "visit",
    q: "Where are you located and is there parking?",
    a: "We're at 14 Roast Lane in the Old Quarter. There's a paid lot directly behind the building (entrance on Mill Street) and free two-hour street parking on Roast Lane after 6:00 PM.",
  },
  {
    id: "wifi-workspace",
    category: "visit",
    q: "Do you have Wi-Fi and workspace-friendly seating?",
    a: "Yes \u2014 free fiber Wi-Fi, plenty of outlets along the window bar, and a quiet mezzanine for longer sessions. We ask that laptops move to the mezzanine after 11:00 AM on weekends so the main floor stays open for dining.",
  },
  {
    id: "loyalty-program",
    category: "orders",
    q: "Is there a loyalty or rewards program?",
    a: "Yes. Every order earns beans \u2014 one bean per $1 spent. Ten beans gets you a free drink of your choice, and 50 beans unlocks our seasonal tasting flight for two.",
  },
  {
    id: "gift-cards",
    category: "orders",
    q: "Do you offer gift cards?",
    a: "Digital gift cards are available in any amount from $10 to $250 and can be delivered by email or scheduled for a future date. Physical cards are available in-store.",
  },
  {
    id: "kids-pets",
    category: "visit",
    q: "Are children and pets welcome?",
    a: "Absolutely \u2014 we're family-friendly and have a small kids' menu plus high chairs. Well-behaved dogs are welcome on the patio, and we keep water bowls out front during warm months.",
  },
];
