import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import type {
  FooterBrandConfig,
  FooterContactItem,
  FooterNavColumn,
  FooterNavLink,
  FooterSocialItem,
} from "./types";

export const DEFAULT_BRAND: FooterBrandConfig = {
  name: "Cafe",
  initial: "Z",
  href: "/",
};

export const DEFAULT_NAV_COLUMNS: readonly FooterNavColumn[] = [
  {
    heading: "Experience",
    links: [
      { label: "Menu", href: "/#menu" },
      { label: "Reservations", href: "/#bookings" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

export const DEFAULT_CONTACT_ITEMS: readonly FooterContactItem[] = [
  {
    icon: <Mail aria-hidden="true" size={18} />,
    label: "Email",
    value: "hello@cafecafe.com",
    href: "mailto:hello@cafe.example",
  },
  {
    icon: <Phone aria-hidden="true" size={18} />,
    label: "Phone",
    value: "+1 (555) 010-0000",
    href: "tel:+15550100000",
  },
  {
    icon: <MapPin aria-hidden="true" size={18} />,
    label: "Location",
    value: "View our locations",
    href: "/#locations",
    external: true,
  },
  {
    icon: <Clock aria-hidden="true" size={18} />,
    label: "Hours",
    value: "Mon\u2013Sun \u00b7 8:00 AM\u201311:00 PM",
    href: "/#hours",
  },
];

export const DEFAULT_SOCIAL_ITEMS: readonly FooterSocialItem[] = [
  {
    name: "Instagram",
    icon: <Instagram aria-hidden="true" size={18} />,
    href: "https://instagram.com/",
    external: true,
  },
  {
    name: "X",
    icon: <Twitter aria-hidden="true" size={18} />,
    href: "https://x.com/",
    external: true,
  },
  {
    name: "Facebook",
    icon: <Facebook aria-hidden="true" size={18} />,
    href: "https://facebook.com/",
    external: true,
  },
];

export const DEFAULT_LEGAL_LINKS: readonly FooterNavLink[] = [
];
