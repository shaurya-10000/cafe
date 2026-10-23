const MAIN_WITH_HEADER = "min-h-screen pt-28 md:pt-32";
const MAIN_WITHOUT_HEADER = "relative min-h-screen w-full";

export function buildMainClassName(hideHeader: boolean): string {
  return hideHeader ? MAIN_WITHOUT_HEADER : MAIN_WITH_HEADER;
}