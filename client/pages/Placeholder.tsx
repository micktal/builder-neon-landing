interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl rounded-xl border bg-card p-6 text-card-foreground">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
        <p className="mt-4 text-sm text-muted-foreground">
          Cette page est prête à être complétée. Dites-moi quels champs et fonctionnalités vous souhaitez et je l'implémente.
        </p>
      </div>
    </div>
  );
}
