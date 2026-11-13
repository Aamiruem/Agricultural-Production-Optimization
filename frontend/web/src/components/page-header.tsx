export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="space-y-1.5">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
    </header>
  );
}
