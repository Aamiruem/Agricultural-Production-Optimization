import { useState } from "react";

import { cx } from "@/lib/cx.js";
import { cropPhotoUrl } from "@/lib/cropPhotos.js";

import { Icon } from "./primitives.jsx";

/** Rounded crop photo; falls back to an icon when there is no photo or it fails to load. */
export function CropPhoto({ crop, size = 48, className = "" }) {
  const src = cropPhotoUrl(crop);
  const [failed, setFailed] = useState(null);
  const style = { width: size, height: size };

  if (!src || failed === src) {
    return (
      <span
        className={cx("grid shrink-0 place-items-center rounded-2xl bg-good-soft text-good", className)}
        style={style}
        aria-hidden
      >
        <Icon name="grass" size={Math.round(size * 0.58)} />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={`${crop} crop`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
      className={cx("shrink-0 rounded-2xl object-cover", className)}
      style={style}
    />
  );
}
