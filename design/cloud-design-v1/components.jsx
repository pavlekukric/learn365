// components.jsx — shared UI primitives

// ── Brand & top bar ─────────────────────────────────────────────

function Brand({ onClick }) {
  return (
    <div className="brand" onClick={onClick}>
      <div className="brand-mark">i</div>
      <div className="brand-name">
        Istorija<em>365</em>
      </div>
    </div>
  );
}

function TopBar({ route, onNav, completedCount, total }) {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Brand onClick={() => onNav({ name: "home" })} />
        <nav className="nav">
          <a
            className={route.name === "home" ? "active" : ""}
            onClick={() => onNav({ name: "home" })}
          >
            Početna
          </a>
          <a
            className={route.name === "course" || route.name === "lesson" ? "active" : ""}
            onClick={() => onNav({ name: "course" })}
          >
            Kurs
          </a>
          <a>O aplikaciji</a>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingLeft: 24,
              borderLeft: "1px solid var(--rule)",
            }}
          >
            <span className="tiny mono" style={{ fontVariantNumeric: "tabular-nums" }}>
              {String(completedCount).padStart(3, "0")} / {total}
            </span>
            <div style={{ width: 80 }}>
              <div className="progress-bar thin">
                <i style={{ width: `${(completedCount / total) * 100}%` }} />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ── Icons ────────────────────────────────────────────────────────

const IconCheck = (props) => (
  <svg viewBox="0 0 14 14" fill="none" {...props}>
    <path
      d="M3 7.5 5.5 10 11 4.4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChev = (props) => (
  <svg viewBox="0 0 12 12" fill="none" {...props}>
    <path
      d="M4 2.5 7.5 6 4 9.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArrow = (props) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArrowLeft = (props) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M13 8H3M7 4 3 8l4 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconMenu = (props) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconClose = (props) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

// ── Completion dot ──────────────────────────────────────────────

function CompletionDot({ state }) {
  // state: "done" | "active" | "idle"
  return (
    <span className={`dot ${state === "done" ? "done" : ""} ${state === "active" ? "active" : ""}`}>
      {state === "done" && <IconCheck />}
    </span>
  );
}

// ── Breadcrumbs ────────────────────────────────────────────────

function Breadcrumbs({ items }) {
  return (
    <div className="crumbs">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          {it.onClick ? (
            <a onClick={it.onClick}>{it.label}</a>
          ) : (
            <span className="current">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Progress ring ──────────────────────────────────────────────

function ProgressRing({ value, size = 76, stroke = 4, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value);
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .4s var(--t)" }}
        />
      </svg>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>{children}</div>
    </div>
  );
}

// ── Era timeline (compact strip at top of reader) ───────────────

function EraTimeline({ currentLesson, onJump }) {
  // Equal-width band per chapter so modern eras don't crush into the right edge.
  // The marker is still positioned proportionally within the current era's band
  // using the lesson's actual year — so chronology is preserved within a chapter.
  const N = CHAPTERS.length;
  const segW = 100 / N;
  const curChapter = CHAPTERS.find((c) => c.id === currentLesson.chapterId);
  const curIdx = CHAPTERS.indexOf(curChapter);
  const yearSpan = Math.max(1, curChapter.yearEnd - curChapter.yearStart);
  const intra = (currentLesson.year - curChapter.yearStart) / yearSpan;
  const markerLeft = segW * (curIdx + Math.max(0, Math.min(1, intra)));

  return (
    <div className="timeline">
      <div className="timeline-meta">
        <div className="eyebrow">Doba i razdoblja</div>
        <div className="tiny mono" style={{ color: "var(--accent)" }}>
          {curChapter?.eraShort} · {currentLesson.year}.
        </div>
      </div>
      <div className="timeline-track">
        {CHAPTERS.map((c, i) => {
          const isCurrent = c.id === currentLesson.chapterId;
          return (
            <div
              key={c.id}
              className={`timeline-era ${isCurrent ? "current" : ""}`}
              style={{ left: `${i * segW}%`, width: `${segW}%` }}
              onClick={() => {
                const first = ALL_LESSONS.find((l) => l.chapterId === c.id);
                if (first && onJump) onJump(first);
              }}
              title={`${c.title} (${c.yearsLabel})`}
            >
              {c.num}
              <span className="yr">{c.yearStart === 600 ? "VI v." : c.yearStart}</span>
            </div>
          );
        })}
        <div className="timeline-marker" style={{ left: `${markerLeft}%` }} />
      </div>
    </div>
  );
}

// ── Image placeholder ──────────────────────────────────────────

function Placeholder({ label, style, children }) {
  return (
    <div className="placeholder" style={style}>
      {children || <span>{label}</span>}
    </div>
  );
}

// ── Sidebar (course outline) ───────────────────────────────────

function Sidebar({
  currentLessonId,
  completedIds,
  openChapters,
  onToggleChapter,
  onSelectLesson,
  onClose,
}) {
  const completedCount = completedIds.size;
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div className="eyebrow">Kurs</div>
          {onClose && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: 6, border: 0 }}
              onClick={onClose}
              aria-label="Zatvori"
            >
              <IconClose style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
        <div
          className="serif"
          style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.005em", lineHeight: 1.2 }}
        >
          Istorija Srbije 365
        </div>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div className="tiny mono" style={{ fontVariantNumeric: "tabular-nums" }}>
            {String(completedCount).padStart(3, "0")} / {TOTAL_LESSONS}
          </div>
          <div className="tiny mono" style={{ color: "var(--muted)" }}>
            {Math.round((completedCount / TOTAL_LESSONS) * 100)}%
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <i style={{ width: `${(completedCount / TOTAL_LESSONS) * 100}%` }} />
        </div>
      </div>

      <div className="sidebar-body">
        {CHAPTERS.map((c) => {
          const lessons = ALL_LESSONS.filter((l) => l.chapterId === c.id);
          const chDone = lessons.filter((l) => completedIds.has(l.id)).length;
          const isOpen = openChapters.has(c.id);
          const hasCurrent = lessons.some((l) => l.id === currentLessonId);
          return (
            <div key={c.id} className={`chapter ${isOpen ? "open" : ""}`}>
              <div className="chapter-head" onClick={() => onToggleChapter(c.id)}>
                <IconChev className="chev" />
                <div className="ch-meta">
                  <div className="ch-eyebrow">{c.num} · {c.yearsLabel}</div>
                  <div
                    className="ch-title"
                    style={hasCurrent ? { color: "var(--accent-ink)" } : undefined}
                  >
                    {c.title}
                  </div>
                </div>
                <div className="ch-progress">
                  {chDone}/{c.lessonCount}
                </div>
              </div>
              {isOpen && (
                <div className="chapter-lessons">
                  {lessons.slice(0, 12).map((l) => {
                    const done = completedIds.has(l.id);
                    const active = l.id === currentLessonId;
                    return (
                      <div
                        key={l.id}
                        className={`lesson-row ${done ? "completed" : ""} ${active ? "active" : ""}`}
                        onClick={() => onSelectLesson(l)}
                      >
                        <CompletionDot state={done ? "done" : active ? "active" : "idle"} />
                        <div className="day">D{String(l.day).padStart(3, "0")}</div>
                        <div className="title">{l.title}</div>
                        <div className="time">{l.minutes}m</div>
                      </div>
                    );
                  })}
                  {lessons.length > 12 && (
                    <div
                      className="tiny mono"
                      style={{
                        padding: "8px 12px 4px",
                        color: "var(--faint)",
                      }}
                    >
                      + još {lessons.length - 12} lekcija
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

Object.assign(window, {
  Brand,
  TopBar,
  IconCheck,
  IconChev,
  IconArrow,
  IconArrowLeft,
  IconMenu,
  IconClose,
  CompletionDot,
  Breadcrumbs,
  ProgressRing,
  EraTimeline,
  Placeholder,
  Sidebar,
});
