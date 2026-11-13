import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid place-items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">This field is still fallow. Try one of these instead.</p>
      <div className="flex gap-2">
        <Link href="/" className={buttonVariants({ className: "px-4" })}>
          Home
        </Link>
        <Link href="/crops" className={buttonVariants({ variant: "outline", className: "px-4" })}>
          Crop library
        </Link>
      </div>
    </div>
  );
}
