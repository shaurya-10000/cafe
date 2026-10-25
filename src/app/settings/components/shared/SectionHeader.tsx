interface SectionHeaderProps {
  readonly title: string;
  readonly accent: string;
  readonly description: string;
}

export function SectionHeader({
  title,
  accent,
  description,
}: SectionHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-black uppercase leading-none tracking-tighter text-zinc-900 dark:text-zinc-100 md:text-4xl">
        {title}{" "}
        <span className="font-serif lowercase italic text-cafe-accent">
          {accent}
        </span>
      </h1>
      <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
