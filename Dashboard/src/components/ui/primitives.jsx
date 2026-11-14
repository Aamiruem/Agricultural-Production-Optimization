// Building blocks in the Google Material 3 idiom: rounded surfaces, tonal buttons,
// pill chips, Material Symbols icons. Every colour comes from a theme token.
import { cx } from "@/lib/cx.js";
import { ICON_NAMES } from "@/lib/icons.js";

const KNOWN = new Set(ICON_NAMES);

export function Icon({ name, filled = false, size = 20, className = "", label }) {
  if (import.meta.env?.DEV && !KNOWN.has(name)) console.warn(`Icon "${name}" is not in ICON_NAMES (src/lib/icons.js)`);
  return (
    <span
      className={cx("material-symbols-rounded shrink-0", filled && "filled", className)}
      style={{ fontSize: size, width: size, height: size }}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {name}
    </span>
  );
}

export function Card({ title, subtitle, icon, actions, children, className = "", bodyClassName = "", as: Tag = "section" }) {
  return (
    <Tag className={cx("rounded-3xl border border-outline bg-surface", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <span className="mt-0.5 grid size-9 place-items-center rounded-full bg-primary-soft text-on-primary-soft">
                <Icon name={icon} size={20} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-base font-medium text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-[13px] text-ink-2">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx("p-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}

const BUTTON = {
  filled: "bg-primary text-on-primary hover:bg-primary-hover shadow-none hover:shadow-card",
  tonal: "bg-primary-soft text-on-primary-soft hover:brightness-95 dark:hover:brightness-125",
  outlined: "border border-outline text-primary hover:bg-primary-soft",
  text: "text-primary hover:bg-primary-soft",
  danger: "border border-outline text-bad hover:bg-bad-soft",
};

export function Button({ variant = "filled", icon, children, className = "", loading = false, size = "md", ...props }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-5 text-sm",
        BUTTON[variant],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Icon name="sync" size={18} className="animate-spin" /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx("grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink", className)}
      {...props}
    >
      <Icon name={icon} size={22} />
    </button>
  );
}

/** Status is never colour alone: icon + label + reserved status tone. */
const STATUS = {
  ok: { icon: "check_circle", label: "Healthy", tone: "bg-good-soft text-good" },
  degraded: { icon: "warning", label: "Degraded", tone: "bg-warn-soft text-warn" },
  down: { icon: "error", label: "Down", tone: "bg-bad-soft text-bad" },
  unknown: { icon: "schedule", label: "Checking", tone: "bg-surface-2 text-ink-2" },
};

export function StatusPill({ status = "unknown", label, className = "" }) {
  const s = STATUS[status] ?? STATUS.unknown;
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", s.tone, className)}>
      <Icon name={s.icon} size={16} filled />
      {label ?? s.label}
    </span>
  );
}

export function Chip({ children, icon, active = false, onClick, className = "" }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={cx(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition",
        active ? "border-transparent bg-primary-soft text-on-primary-soft" : "border-outline text-ink-2 hover:bg-surface-2",
        className,
      )}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Tag>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-outline p-0.5">
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium transition",
              active ? "bg-primary-soft text-on-primary-soft" : "text-ink-2 hover:text-ink",
            )}
          >
            {opt.icon && <Icon name={opt.icon} size={16} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Select({ label, value, onChange, options, className = "", id }) {
  const selectId = id ?? `sel-${label?.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={selectId} className={cx("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-xs font-medium text-ink-2">{label}</span>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-0 rounded-xl border border-outline bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none"
      >
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </label>
  );
}

export function TextField({ label, className = "", id, ...props }) {
  const inputId = id ?? `fld-${label?.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={inputId} className={cx("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-xs font-medium text-ink-2">{label}</span>
      <input
        id={inputId}
        className="h-10 min-w-0 rounded-xl border border-outline bg-surface px-3 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none"
        {...props}
      />
    </label>
  );
}

/** Slider + numeric input pair for one soil/climate reading. */
export function RangeField({ id, label, unit, value, min, max, step = 1, onChange, icon }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
          {icon && <Icon name={icon} size={18} className="text-ink-3" />}
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            aria-label={`${label} value`}
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => e.target.value !== "" && onChange(clamp(Number(e.target.value)))}
            className="h-8 w-20 rounded-lg border border-outline bg-surface px-2 text-right text-sm tabular-nums text-ink focus:border-primary focus:outline-none"
          />
          {unit && <span className="w-10 text-xs text-ink-3">{unit}</span>}
        </div>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={cx("animate-pulse rounded-xl bg-surface-2", className)} aria-hidden />;
}

export function ErrorState({ error, onRetry, compact = false }) {
  const offline = error?.status === 0 || error?.status === 503;
  return (
    <div role="alert" className={cx("flex flex-col items-center justify-center gap-2 text-center", compact ? "py-4" : "py-10")}>
      <span className="grid size-11 place-items-center rounded-full bg-bad-soft text-bad">
        <Icon name={offline ? "cloud_off" : "error"} size={24} />
      </span>
      <p className="max-w-sm text-sm text-ink">{error?.message ?? "Something went wrong."}</p>
      {onRetry && <Button variant="text" icon="refresh" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ icon = "info", title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-ink-2">
        <Icon name={icon} size={26} />
      </span>
      {title && <p className="text-sm font-medium text-ink">{title}</p>}
      {children && <p className="max-w-sm text-[13px] text-ink-2">{children}</p>}
      {action}
    </div>
  );
}

/** Meter: fill carries severity; the track is a lighter step of the same tone. */
export function Meter({ value, max = 1, label, valueLabel, tone = "primary" }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const tones = {
    primary: ["bg-primary", "bg-primary-soft"],
    good: ["bg-good", "bg-good-soft"],
    warn: ["bg-warn", "bg-warn-soft"],
    bad: ["bg-bad", "bg-bad-soft"],
  };
  const [fill, track] = tones[tone] ?? tones.primary;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-medium tabular-nums text-ink">{valueLabel}</span>
      </div>
      <div
        className={cx("h-2 overflow-hidden rounded-full", track)}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div className={cx("h-full rounded-full transition-[width] duration-500", fill)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function KeyValue({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex min-w-0 items-baseline justify-between gap-3 border-b border-outline/60 py-1.5">
          <dt className="text-[13px] text-ink-2">{k}</dt>
          <dd className="truncate text-right text-[13px] font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Code({ children, className = "" }) {
  return (
    <code className={cx("rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12.5px] text-ink", className)}>{children}</code>
  );
}
