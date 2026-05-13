// screens.jsx — Home, CourseOverview, LessonReader

// ── Home ──────────────────────────────────────────────────────

function Home({ onStart, completedCount, currentLesson }) {
  return (
    <main>
      {/* Hero */}
      <section className="shell" style={{ paddingTop: 80, paddingBottom: 96 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 80,
            alignItems: "end",
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 28 }}>
              Volumen I · Kurs br. 001
            </div>
            <h1
              className="display"
              style={{ fontSize: "clamp(56px, 7.2vw, 104px)", margin: 0, marginBottom: 28 }}
            >
              Istorija
              <br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Srbije</em>{" "}
              <span style={{ color: "var(--muted)" }}>365.</span>
            </h1>
            <p
              className="lede"
              style={{ maxWidth: 560, margin: "0 0 36px" }}
            >
              Cela istorija srpskog naroda u 365 kratkih lekcija. Sedam minuta dnevno,
              jedna godina, jasna i celovita slika onoga što nas je oblikovalo.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-accent btn-lg" onClick={onStart}>
                {completedCount > 0 ? "Nastavi kurs" : "Započni kurs"}
                <IconArrow className="arrow" style={{ width: 16, height: 16 }} />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={onStart}>
                Pogledaj sadržaj
              </button>
              <div
                className="tiny mono"
                style={{ marginLeft: 8, color: "var(--muted)" }}
              >
                365 lekcija · 7—10 min · besplatno za sada
              </div>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Placeholder
              label="ilustracija — manastir studenica"
              style={{ aspectRatio: "3/4", borderRadius: 4 }}
            />
            <div
              className="card"
              style={{
                position: "absolute",
                left: -40,
                bottom: 28,
                padding: "14px 18px",
                background: "var(--surface)",
                width: 210,
                boxShadow: "0 16px 40px -20px rgba(40,30,10,.25)",
              }}
            >
              <div className="tiny mono">DAN 014 · NEMANJIĆI</div>
              <div
                className="serif"
                style={{ fontSize: 16, fontWeight: 500, marginTop: 4, lineHeight: 1.25 }}
              >
                Sveti Sava i autokefalnost
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="tiny mono">8 min čitanja</span>
                <CompletionDot state="active" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="shell">
        <div className="flourish">
          <span className="flourish-glyph">✦</span>
        </div>
      </div>

      {/* How it works — 3 columns */}
      <section className="shell" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 80,
            marginBottom: 56,
          }}
        >
          <div className="eyebrow">Kako kurs funkcioniše</div>
          <h2 className="h2" style={{ margin: 0, maxWidth: 720 }}>
            Cela istorija, podeljena na delove koji staju u jedan kafić, jedan voz, jednu
            pauzu za ručak.
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 40,
            borderTop: "1px solid var(--rule)",
            paddingTop: 36,
          }}
        >
          {[
            {
              n: "01",
              title: "365 lekcija",
              body:
                "Od slovenskog doseljavanja do današnjih dana. Svaka lekcija stoji za sebe, ali zajedno čine celinu.",
            },
            {
              n: "02",
              title: "7—10 minuta",
              body:
                "Pažljivo skraćeno i napisano da se čita. Bez akademskog tona, bez romantizacije, bez praznog hoda.",
            },
            {
              n: "03",
              title: "Tvoj ritam",
              body:
                "Svaki dan, dva dana, nedeljno — kako ti odgovara. Aplikacija pamti dokle si stigao i šta sledi.",
            },
          ].map((f) => (
            <div key={f.n}>
              <div
                className="serif"
                style={{
                  fontSize: 40,
                  color: "var(--faint)",
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  marginBottom: 18,
                }}
              >
                {f.n}
              </div>
              <h3 className="h3" style={{ margin: "0 0 10px" }}>
                {f.title}
              </h3>
              <p className="body" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Chapter preview */}
      <section
        style={{
          background:
            "color-mix(in oklch, var(--ink) 4%, transparent)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="shell" style={{ padding: "80px 40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 32,
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                Sadržaj kursa
              </div>
              <h2 className="h2" style={{ margin: 0 }}>
                Osam razdoblja, jedan kontinuitet.
              </h2>
            </div>
            <button className="btn btn-ghost" onClick={onStart}>
              Vidi sva razdoblja <IconArrow className="arrow" style={{ width: 14, height: 14 }} />
            </button>
          </div>

          <div className="card" style={{ overflow: "hidden", background: "var(--surface)" }}>
            {CHAPTERS.slice(0, 4).map((c, i) => (
              <div
                key={c.id}
                className="chapter-card"
                style={i === 0 ? { borderTop: "none" } : undefined}
                onClick={onStart}
              >
                <div className="num">{c.num}</div>
                <div>
                  <div className="years">{c.yearsLabel.toUpperCase()}</div>
                  <div
                    className="serif"
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      marginTop: 4,
                      letterSpacing: "-0.008em",
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    className="small"
                    style={{ marginTop: 8, maxWidth: 540, color: "var(--ink-2)" }}
                  >
                    {c.description}
                  </div>
                </div>
                <div>
                  <div className="progress-bar">
                    <i style={{ width: `${(i === 0 ? 1 / c.lessonCount : 0) * 100}%` }} />
                  </div>
                  <div
                    className="tiny mono"
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--muted)",
                    }}
                  >
                    <span>{c.lessonCount} lekcija</span>
                    <span>{i === 0 ? "1" : "0"} / {c.lessonCount}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <IconArrow style={{ width: 18, height: 18, color: "var(--muted)" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, textAlign: "center" }} className="tiny mono">
            i još četiri razdoblja, do 2026.
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="shell" style={{ padding: "100px 40px", textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          Spreman za prvi dan?
        </div>
        <h2 className="h2" style={{ margin: "0 0 28px", maxWidth: 720, marginInline: "auto" }}>
          Sedam minuta danas. Cela istorija za godinu dana.
        </h2>
        <button className="btn btn-accent btn-lg" onClick={onStart}>
          Otvori kurs <IconArrow className="arrow" style={{ width: 16, height: 16 }} />
        </button>
      </section>

      <footer
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "32px 0",
          textAlign: "center",
        }}
        className="tiny mono"
      >
        Istorija365 — koncept · prototip
      </footer>
    </main>
  );
}

// ── Course overview ───────────────────────────────────────────

function CourseOverview({ onOpenLesson, onContinue, completedIds, currentLesson, nextLesson }) {
  const completedCount = completedIds.size;
  const pct = completedCount / TOTAL_LESSONS;
  const remaining = TOTAL_LESSONS - completedCount;
  const curChapter = CHAPTERS.find((c) => c.id === currentLesson.chapterId);

  return (
    <main className="shell" style={{ paddingTop: 48, paddingBottom: 120 }}>
      <Breadcrumbs
        items={[
          { label: "Početna", onClick: () => onOpenLesson("home") },
          { label: "Istorija Srbije 365" },
        ]}
      />

      <div style={{ marginTop: 24, marginBottom: 48 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 56,
            alignItems: "start",
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              Kurs · jedna godina
            </div>
            <h1
              className="display"
              style={{ fontSize: 64, margin: 0, marginBottom: 20, maxWidth: 720 }}
            >
              Istorija Srbije <em style={{ fontStyle: "italic", color: "var(--accent)" }}>365</em>
            </h1>
            <p className="lede" style={{ margin: "0 0 28px", maxWidth: 640 }}>
              365 lekcija, od slovenskog doseljavanja do današnjih dana. Svakog dana po sedam
              do deset minuta čitanja. Bez praznog hoda, bez patetike.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-accent" onClick={onContinue}>
                {completedCount > 0 ? "Nastavi gde sam stao" : "Započni prvi dan"}
                <IconArrow className="arrow" style={{ width: 14, height: 14 }} />
              </button>
              <button className="btn btn-ghost">Pregledaj plan kursa</button>
            </div>
          </div>

          {/* Progress card */}
          <div
            className="card"
            style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              <ProgressRing value={pct} size={88} stroke={4}>
                <div
                  className="serif"
                  style={{ fontSize: 22, fontWeight: 500, lineHeight: 1 }}
                >
                  {Math.round(pct * 100)}
                  <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 1 }}>%</span>
                </div>
                <div
                  className="tiny mono"
                  style={{ marginTop: 4, color: "var(--muted)" }}
                >
                  završeno
                </div>
              </ProgressRing>
              <div style={{ flex: 1 }}>
                <div
                  className="serif"
                  style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.012em" }}
                >
                  {completedCount}{" "}
                  <span style={{ color: "var(--muted)", fontSize: 18 }}>/ {TOTAL_LESSONS}</span>
                </div>
                <div className="small">završenih lekcija</div>
                <div className="tiny mono" style={{ marginTop: 6, color: "var(--muted)" }}>
                  Preostalo: {remaining} · ~{Math.ceil(remaining / 1)} dana
                </div>
              </div>
            </div>

            <div className="hairline" style={{ paddingTop: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Aktuelno
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 12,
                  alignItems: "start",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--rule)",
                  cursor: "pointer",
                }}
                onClick={() => onOpenLesson(currentLesson)}
              >
                <CompletionDot state="active" />
                <div>
                  <div className="tiny mono">
                    DAN {String(currentLesson.day).padStart(3, "0")} · {curChapter.eraShort.toUpperCase()}
                  </div>
                  <div
                    className="serif"
                    style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}
                  >
                    {currentLesson.title}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 12,
                  padding: "10px 0",
                  cursor: "pointer",
                }}
                onClick={() => onOpenLesson(nextLesson)}
              >
                <CompletionDot state="idle" />
                <div>
                  <div className="tiny mono" style={{ color: "var(--faint)" }}>
                    SLEDEĆE · DAN {String(nextLesson.day).padStart(3, "0")}
                  </div>
                  <div
                    className="serif"
                    style={{ fontSize: 16, fontWeight: 500, marginTop: 2, color: "var(--ink-2)" }}
                  >
                    {nextLesson.title}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>
        Sadržaj · osam razdoblja
      </div>
      <div className="card" style={{ overflow: "hidden", background: "var(--surface)" }}>
        {CHAPTERS.map((c, i) => {
          const lessons = ALL_LESSONS.filter((l) => l.chapterId === c.id);
          const done = lessons.filter((l) => completedIds.has(l.id)).length;
          const chPct = done / c.lessonCount;
          const hasCurrent = c.id === currentLesson.chapterId;
          return (
            <div
              key={c.id}
              className="chapter-card"
              style={i === 0 ? { borderTop: "none" } : undefined}
              onClick={() => onOpenLesson(lessons[0])}
            >
              <div className="num">{c.num}</div>
              <div>
                <div className="years">{c.yearsLabel.toUpperCase()}</div>
                <div
                  className="serif"
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    marginTop: 4,
                    letterSpacing: "-0.008em",
                    color: hasCurrent ? "var(--accent-ink)" : "var(--ink)",
                  }}
                >
                  {c.title}
                </div>
                <div
                  className="small"
                  style={{ marginTop: 8, maxWidth: 560, color: "var(--ink-2)" }}
                >
                  {c.description}
                </div>
              </div>
              <div>
                <div className="progress-bar">
                  <i style={{ width: `${chPct * 100}%` }} />
                </div>
                <div
                  className="tiny mono"
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--muted)",
                  }}
                >
                  <span>{c.lessonCount} lekcija</span>
                  <span>
                    {done} / {c.lessonCount}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {hasCurrent ? (
                  <span className="chip accent">u toku</span>
                ) : done === c.lessonCount ? (
                  <CompletionDot state="done" />
                ) : (
                  <IconArrow style={{ width: 18, height: 18, color: "var(--muted)" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

window.Home = Home;
window.CourseOverview = CourseOverview;
