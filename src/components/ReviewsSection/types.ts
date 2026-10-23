export interface Testimonial {
  /** Stable identifier supplied by the CMS/API. */
  readonly id: string;
  readonly name: string;
  readonly rating: number;
  readonly text: string;
  readonly date: string;
}

export interface ReviewsSectionProps {
  readonly testimonials?: readonly Testimonial[];
  readonly autoScrollSpeed?: number;
}
