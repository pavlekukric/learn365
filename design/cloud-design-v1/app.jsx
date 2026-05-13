// app.jsx — top-level state, routing, Tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "A",
  "density": "comfortable",
  "background": "cream",
  "showTweaksHint": true
}/*EDITMODE-END*/;

function useMediaQuery(q) {
  const [m, setM] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(q).matches;
  });
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const fn = (e) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [q]);
  return m;
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isMobile = useMediaQuery("(max-width: 860px)");

  // ── State ────────────────────────────────────────────────────────
  const [route, setRoute] = React.useState({ name: "home" });
  const [completedIds, setCompletedIds] = React.useState(() => new Set());
  const [currentLessonId, setCurrentLessonId] = React.useState(ALL_LESSONS[0].id);
  const [openChapters, setOpenChapters] = React.useState(
    () => new Set([ALL_LESSONS[0].chapterId]),
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Seed: complete the first lesson so progress reads "1 / 365" by default
  // (matches the brief). Done via lazy init in completedIds? Cleaner here.
  React.useEffect(() => {
    setCompletedIds((s) => {
      if (s.size > 0) return s;
      const n = new Set(s);
      // Don't pre-complete — leave at 0/365 so "Started" state is honest.
      // The brief shows "1 / 365 completed" — that's after the user opens the first lesson.
      return n;
    });
  }, []);

  const currentLesson =
    ALL_LESSONS.find((l) => l.id === currentLessonId) || ALL_LESSONS[0];
  const curIdx = ALL_LESSONS.findIndex((l) => l.id === currentLessonId);
  const nextLesson = ALL_LESSONS[Math.min(ALL_LESSONS.length - 1, curIdx + 1)];

  const navigate = (r) => {
    if (r === "home") setRoute({ name: "home" });
    else setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const openLesson = (lesson) => {
    if (lesson === "home") return navigate("home");
    setCurrentLessonId(lesson.id);
    setOpenChapters((s) => new Set([...s, lesson.chapterId]));
    setRoute({ name: "lesson" });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const toggleComplete = (id) => {
    setCompletedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleChapter = (id) => {
    setOpenChapters((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const goNext = () => {
    if (curIdx < ALL_LESSONS.length - 1) {
      // mark current done, advance
      setCompletedIds((s) => new Set([...s, currentLessonId]));
      const next = ALL_LESSONS[curIdx + 1];
      setCurrentLessonId(next.id);
      setOpenChapters((s) => new Set([...s, next.chapterId]));
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };
  const goPrev = () => {
    if (curIdx > 0) {
      const prev = ALL_LESSONS[curIdx - 1];
      setCurrentLessonId(prev.id);
      setOpenChapters((s) => new Set([...s, prev.chapterId]));
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  // ── Direction / theme ────────────────────────────────────────────
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-direction", tweaks.direction);
    root.setAttribute("data-density", tweaks.density);
    // Background tone
    const bg = {
      cream: "oklch(0.962 0.012 85)",
      paper: "oklch(0.975 0.008 78)",
      ivory: "oklch(0.985 0.006 90)",
    }[tweaks.background] || "oklch(0.962 0.012 85)";
    if (tweaks.direction === "A") {
      root.style.setProperty("--bg", bg);
    } else {
      root.style.removeProperty("--bg"); // let [data-direction="B"] CSS rule take over
    }
  }, [tweaks.direction, tweaks.density, tweaks.background]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        route={route}
        onNav={navigate}
        completedCount={completedIds.size}
        total={TOTAL_LESSONS}
      />

      {route.name === "home" && (
        <Home
          onStart={() => navigate({ name: "course" })}
          completedCount={completedIds.size}
          currentLesson={currentLesson}
        />
      )}
      {route.name === "course" && (
        <CourseOverview
          onOpenLesson={openLesson}
          onContinue={() => openLesson(currentLesson)}
          completedIds={completedIds}
          currentLesson={currentLesson}
          nextLesson={nextLesson}
        />
      )}
      {route.name === "lesson" && (
        <LessonReader
          lesson={currentLesson}
          completedIds={completedIds}
          toggleComplete={toggleComplete}
          openChapters={openChapters}
          toggleChapter={toggleChapter}
          onSelectLesson={openLesson}
          onPrev={goPrev}
          onNext={goNext}
          onNavHome={() => navigate("home")}
          onNavCourse={() => navigate({ name: "course" })}
          mobile={isMobile}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
        />
      )}

      <TweaksPanel title="Istorija365 · Tweaks">
        <TweakSection label="Vizuelni pravac">
          <TweakRadio
            label="Direction"
            value={tweaks.direction}
            options={[
              { value: "A", label: "A · Editorial" },
              { value: "B", label: "B · Modern" },
            ]}
            onChange={(v) => setTweak("direction", v)}
          />
        </TweakSection>

        <TweakSection label="Pozadina">
          <TweakRadio
            label="Ton"
            value={tweaks.background}
            options={[
              { value: "cream", label: "Krem" },
              { value: "paper", label: "Papir" },
              { value: "ivory", label: "Ivory" },
            ]}
            onChange={(v) => setTweak("background", v)}
          />
        </TweakSection>

        <TweakSection label="Čitanje">
          <TweakRadio
            label="Gustoća"
            value={tweaks.density}
            options={[
              { value: "compact", label: "Sažeto" },
              { value: "comfortable", label: "Standard" },
              { value: "spacious", label: "Prostrano" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
        </TweakSection>

        <TweakSection label="Skoči" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <TweakButton
            label="Početna"
            secondary
            onClick={() => navigate("home")}
          />
          <TweakButton
            label="Kurs"
            secondary
            onClick={() => navigate({ name: "course" })}
          />
          <TweakButton
            label="Lekcija"
            secondary
            onClick={() => setRoute({ name: "lesson" })}
          />
          <TweakButton
            label="Reset napretka"
            secondary
            onClick={() => setCompletedIds(new Set())}
          />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
