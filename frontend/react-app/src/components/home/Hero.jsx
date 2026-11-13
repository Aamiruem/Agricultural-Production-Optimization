import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Button from "react-bootstrap/Button";
import { Link } from "react-router";

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <section className="hero">
      <motion.h1 {...rise(0)}>
        Grow the <em>right crop</em> for your soil.
      </motion.h1>
      <motion.p className="lead text-body-secondary mt-3 mb-0" style={{ maxWidth: "52ch" }} {...rise(0.1)}>
        Enter your soil nutrients and local climate to get crop recommendations from a trained machine-learning
        model, calculate fertilizer doses, manage your farms and ask an AI farm assistant.
      </motion.p>
      <motion.div className="d-flex flex-wrap gap-2 mt-4" {...rise(0.2)}>
        <Button as={Link} to="/recommend" size="lg" className="d-inline-flex align-items-center gap-2">
          Get a recommendation <ArrowRight size={18} />
        </Button>
        <Button as={Link} to="/crops" size="lg" variant="outline-secondary">
          Browse 22 crops
        </Button>
      </motion.div>
      <div className="rows" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => <span key={i} />)}
      </div>
    </section>
  );
}
