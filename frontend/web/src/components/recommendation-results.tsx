"use client";

import LinearProgress from "@mui/material/LinearProgress";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { CropRecommendation } from "@/lib/api/types";
import { formatCropName, formatPercent, seasonLabel } from "@/lib/crops";

export function RecommendationResults({ result }: { result: CropRecommendation }) {
  return (
    <section aria-label="Recommended crops" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recommended crops</h2>
        <Badge variant="outline">
          {result.method === "ml-model" ? "ML model" : "Profile match"}
        </Badge>
      </div>
      <ol className="space-y-3">
        <AnimatePresence initial>
          {result.top.map((item, i) => (
            <motion.li
              key={item.crop}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 24 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/crops/${item.crop}`} className="font-medium hover:underline">
                  <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                  {formatCropName(item.crop)}
                </Link>
                <span className="text-sm tabular-nums">
                  {formatPercent(item.confidence)}
                  <span className="text-muted-foreground"> match</span>
                </span>
              </div>
              {/* Material UI progress bar for the match score */}
              <LinearProgress
                variant="determinate"
                value={item.confidence * 100}
                aria-label={`${formatCropName(item.crop)} match`}
                sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
              />
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">{seasonLabel(item.season)}</Badge>
                <Badge variant="outline" className="capitalize">
                  {item.category}
                </Badge>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
