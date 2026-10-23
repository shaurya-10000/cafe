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
      { label: "Our Story", href: "/#about" },
      { label: "Gallery", href: "/#gallery" },
      { label: "Reservations", href: "/#reservations" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/#about" },
      { label: "Careers", href: "/#careers" },
      { label: "Contact", href: "/#contact" },
      { label: "Press", href: "/#press" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", href: "/#faq-section" },
      { label: "Accessibility", href: "/#accessibility" },
      { label: "Privacy", href: "/#privacy" },
      { label: "Terms", href: "/#terms" },
    ],
  },
];

export const DEFAULT_CONTACT_ITEMS: readonly FooterContactItem[] = [
  {
    icon: <Mail aria-hidden="true" size={18} />,
    label: "Email",
    value: "hello@cafecafe.com",
    href: "mailto:com",
  },
  {
    icon: <Phone aria-hidden="true" size={18} />,
    label: "Phone",
    value: "+xx 00000 000000",
    href: "tel:+xx0000000000",
  },
  {
    icon: <MapPin aria-hidden="true" size={18} />,
    label: "Location",
    value: "x, y",
    href: "https://www.google.com/maps/place/x+y",
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
    href: "https://instagram.com/ ",
    external: true,
  },
  {
    name: "X",
    icon: <Twitter aria-hidden="true" size={18} />,
    href: "https://x.com/ ",
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
  { label: "Privacy", href: "/#privacy" },
  { label: "Terms", href: "/#terms" },
  { label: "Cookies", href: "/#cookies" },
];
