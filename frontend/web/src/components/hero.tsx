"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import styles from "./hero.module.scss";

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <section className={styles.hero}>
      <motion.h1 className={styles.title} {...rise(0)}>
        Grow the <em>right crop</em> for your soil.
      </motion.h1>
      <motion.p className={styles.lead} {...rise(0.1)}>
        Enter your soil nutrients and local climate to get crop recommendations, calculate
        fertilizer doses in kg per hectare, and plan every field across the kharif, rabi and zaid
        seasons.
      </motion.p>
      <motion.div className="mt-8 flex flex-wrap gap-3" {...rise(0.2)}>
        <Link href="/recommend" className={buttonVariants({ size: "lg", className: "px-4" })}>
          Get a recommendation <ArrowRight />
        </Link>
        <Link
          href="/crops"
          className={buttonVariants({ size: "lg", variant: "outline", className: "px-4" })}
        >
          Browse 22 crops
        </Link>
      </motion.div>
      <div className={styles.rows} aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    </section>
  );
}
