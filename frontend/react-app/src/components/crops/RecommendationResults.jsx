import { AnimatePresence, motion } from "framer-motion";
import Badge from "react-bootstrap/Badge";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Link } from "react-router";

import { formatCropName, seasonLabel } from "@/utils/crops";
import { formatPercent } from "@/utils/format";

export function RecommendationResults({ result }) {
  return (
    <section aria-label="Recommended crops">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="h5 mb-0">Recommended crops</h2>
        <Badge bg="light" text="dark" className="border">
          {result.method === "ml-model" ? "ML model" : "Profile match"}
        </Badge>
      </div>
      <ol className="list-unstyled d-grid gap-2 mb-0">
        <AnimatePresence initial>
          {result.top.map((item, i) => (
            <motion.li
              key={item.crop}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 24 }}
              className="card card-body py-3"
            >
              <div className="d-flex justify-content-between align-items-baseline">
                <Link to={`/crops/${item.crop}`} className="fw-semibold">
                  <span className="text-body-secondary me-2">#{i + 1}</span>
                  {formatCropName(item.crop)}
                </Link>
                <span className="small tabular">
                  {formatPercent(item.confidence)} <span className="text-body-secondary">match</span>
                </span>
              </div>
              <ProgressBar now={item.confidence * 100} className="my-2" style={{ height: 8 }}
                           aria-label={`${formatCropName(item.crop)} match`} />
              <div className="d-flex gap-2">
                <Badge bg="success-subtle" text="success-emphasis">{seasonLabel(item.season)}</Badge>
                <Badge bg="secondary-subtle" text="secondary-emphasis" className="text-capitalize">{item.category}</Badge>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
