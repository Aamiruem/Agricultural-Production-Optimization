import { Calculator, LibraryBig, Map, Sprout } from "lucide-react";
import Link from "next/link";

import { Hero } from "@/components/hero";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEASONS } from "@/lib/crops";

// Static page (SSG): no request-time data, so Next.js prerenders it at build.

const FEATURES = [
  {
    href: "/recommend",
    icon: Sprout,
    title: "Crop advisor",
    body: "Top-3 crops ranked for your N-P-K, pH, temperature, humidity and rainfall.",
  },
  {
    href: "/fertilizer",
    icon: Calculator,
    title: "Fertilizer calculator",
    body: "Nutrient gaps and DAP, Urea and MOP doses for your field size.",
  },
  {
    href: "/crops",
    icon: LibraryBig,
    title: "Crop library",
    body: "Ideal growing conditions for 22 crops, server-rendered from the API.",
  },
  {
    href: "/planner",
    icon: Map,
    title: "Farm planner",
    body: "Track each field's crop, area, season and progress from sowing to harvest.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <Hero />

      <section aria-labelledby="features" className="space-y-4">
        <h2 id="features" className="text-xl font-semibold">
          What you can do
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ href, icon: Icon, title, body }) => (
            <Link key={href} href={href} className="group rounded-xl focus-visible:outline-2">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <Icon className="mb-2 size-6 text-primary" aria-hidden />
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{body}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="seasons" className="space-y-4">
        <h2 id="seasons" className="text-xl font-semibold">
          Indian cropping seasons
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SEASONS.map((s) => (
            <div key={s.value} className="rounded-xl border bg-card p-4">
              <dt className="font-medium">{s.label}</dt>
              <dd className="text-sm text-muted-foreground">{s.months}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
