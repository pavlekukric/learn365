// reader.jsx — Lesson reader (desktop + mobile)

function LessonReader({
  lesson,
  completedIds,
  toggleComplete,
  openChapters,
  toggleChapter,
  onSelectLesson,
  onPrev,
  onNext,
  onNavHome,
  onNavCourse,
  mobile,
  drawerOpen,
  setDrawerOpen,
}) {
  const chapter = CHAPTERS.find((c) => c.id === lesson.chapterId);
  const isDone = completedIds.has(lesson.id);
  const idx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
  const prevLesson = idx > 0 ? ALL_LESSONS[idx - 1] : null;
  const nextLesson = idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null;

  const ReaderBody = (
    <div className="reader">
      <Breadcrumbs
        items={[
          { label: "Početna", onClick: onNavHome },
          { label: "Istorija Srbije 365", onClick: onNavCourse },
          { label: chapter.title, onClick: onNavCourse },
          { label: lesson.title },
        ]}
      />

      <EraTimeline currentLesson={lesson} onJump={onSelectLesson} />

      <div className="reader-meta" style={{ marginTop: 8 }}>
        <span className="mono" style={{ color: "var(--accent)" }}>
          DAN {String(lesson.day).padStart(3, "0")}
        </span>
        <span className="sep" />
        <span>{chapter.eraShort}</span>
        <span className="sep" />
        <span>{lesson.minutes} min čitanja</span>
        <span className="sep" />
        <span>{lesson.year}.</span>
      </div>

      <h1 className="reader-title">{lesson.title}</h1>
      <p className="reader-sub">
        Trenutak u kome se odvojena srpska istorija počinje pisati kao jedna celina —
        i čovek koji je za to bio spreman više od ostalih.
      </p>

      <div className="flourish" style={{ margin: "8px 0 28px" }}>
        <span className="flourish-glyph">✦</span>
      </div>

      <div>
        {SAMPLE_BODY.map((p, i) => (
          <p key={i} className={i === 0 ? "dropcap" : ""}>
            {p}
          </p>
        ))}

        <blockquote>
          „Zakonom valja vladati, a ne silom; jer sila je za jedan dan, a zakon za vek.”
          <div className="tiny mono" style={{ marginTop: 8, fontStyle: "normal" }}>
            — pripisano sv. Savi
          </div>
        </blockquote>

        <h2>Šta je značio sabor iz 1166.</h2>
        <p>
          Sabor velikaša u Rasu nije bio samo formalnost. Njime je Stefan Nemanja
          dobio legitimitet koji mu prosto braterstvo nije moglo dati — pristanak
          najmoćnijih ljudi zemlje da on, a ne neko drugi, vodi Rašku u sledećih
          četrdeset godina. Ostatak njegove vladavine biće logična posledica te
          večeri.
        </p>
        <p>
          U sledećoj lekciji govorimo o tome kako je Nemanja iskoristio crkveni
          raskol sa bogumilima da konsoliduje vlast i da po prvi put u srpskoj
          istoriji crkva i država nastupe kao jedno.
        </p>
      </div>

      {/* Completion + nav */}
      <div
        style={{
          marginTop: 64,
          padding: "32px 0",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CompletionDot state={isDone ? "done" : "active"} />
          <div>
            <div
              className="serif"
              style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.2 }}
            >
              {isDone ? "Lekcija završena" : "Spreman za sledeći dan?"}
            </div>
            <div className="small" style={{ color: "var(--muted)" }}>
              {isDone
                ? "Možeš da pređeš na sledeću ili da se vratiš ovde kasnije."
                : "Označi lekciju kao završenu i nastavi sutra ili odmah."}
            </div>
          </div>
        </div>
        <button
          className={isDone ? "btn btn-ghost" : "btn btn-accent"}
          onClick={() => toggleComplete(lesson.id)}
        >
          {isDone ? "Označeno kao završeno" : "Označi kao završeno"}
          {!isDone && <IconCheck style={{ width: 14, height: 14 }} />}
        </button>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <button
          className="card"
          style={{
            padding: 18,
            textAlign: "left",
            background: "transparent",
            cursor: prevLesson ? "pointer" : "not-allowed",
            opacity: prevLesson ? 1 : 0.4,
          }}
          onClick={() => prevLesson && onPrev()}
          disabled={!prevLesson}
        >
          <div
            className="tiny mono"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <IconArrowLeft style={{ width: 12, height: 12 }} /> PRETHODNA
          </div>
          <div
            className="serif"
            style={{
              fontSize: 16,
              fontWeight: 500,
              marginTop: 6,
              color: "var(--ink-2)",
            }}
          >
            {prevLesson ? prevLesson.title : "Početak kursa"}
          </div>
        </button>
        <button
          className="card"
          style={{
            padding: 18,
            textAlign: "right",
            background: "transparent",
            cursor: nextLesson ? "pointer" : "not-allowed",
            opacity: nextLesson ? 1 : 0.4,
          }}
          onClick={() => nextLesson && onNext()}
          disabled={!nextLesson}
        >
          <div
            className="tiny mono"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            SLEDEĆA <IconArrow style={{ width: 12, height: 12 }} />
          </div>
          <div
            className="serif"
            style={{
              fontSize: 16,
              fontWeight: 500,
              marginTop: 6,
              color: "var(--ink)",
            }}
          >
            {nextLesson ? nextLesson.title : "Kraj kursa"}
          </div>
        </button>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <main style={{ position: "relative" }}>
        <div
          style={{
            position: "sticky",
            top: 64,
            background: "color-mix(in oklch, var(--bg) 92%, transparent)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--rule)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 10,
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            style={{ border: 0 }}
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu style={{ width: 14, height: 14 }} />
            Sadržaj
          </button>
          <div className="tiny mono">
            DAN {String(lesson.day).padStart(3, "0")} · {chapter.eraShort}
          </div>
          <div style={{ width: 60 }}>
            <div className="progress-bar thin">
              <i style={{ width: `${(completedIds.size / TOTAL_LESSONS) * 100}%` }} />
            </div>
          </div>
        </div>
        <div style={{ padding: "0 16px" }}>{ReaderBody}</div>

        {/* Drawer */}
        {drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(20,15,8,.4)",
                zIndex: 90,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "86%",
                maxWidth: 360,
                background: "var(--bg)",
                zIndex: 91,
                overflowY: "auto",
                boxShadow: "12px 0 40px -10px rgba(0,0,0,.2)",
                transform: "translateX(0)",
              }}
            >
              <Sidebar
                currentLessonId={lesson.id}
                completedIds={completedIds}
                openChapters={openChapters}
                onToggleChapter={toggleChapter}
                onSelectLesson={(l) => {
                  onSelectLesson(l);
                  setDrawerOpen(false);
                }}
                onClose={() => setDrawerOpen(false)}
              />
            </div>
          </>
        )}
      </main>
    );
  }

  return (
    <main style={{ display: "flex", alignItems: "flex-start" }}>
      <Sidebar
        currentLessonId={lesson.id}
        completedIds={completedIds}
        openChapters={openChapters}
        onToggleChapter={toggleChapter}
        onSelectLesson={onSelectLesson}
      />
      <div style={{ flex: 1, minWidth: 0, padding: "0 56px" }}>{ReaderBody}</div>
    </main>
  );
}

window.LessonReader = LessonReader;
