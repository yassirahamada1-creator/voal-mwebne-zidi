import { useI18n } from "@/contexts/I18nContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Share2, RotateCcw, Brain } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useMemo, useState } from "react";
import { useQuizQuestions, type QuizRow } from "@/hooks/useBackendData";
import { bi, biStr } from "@/lib/bilingual";

// Deterministic PRNG (mulberry32) so questions rotate once per day
const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const a = [...arr];
  let s = seed || 1;
  const rand = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getDaySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const QuizScreen = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleSlug = searchParams.get("moduleSlug") ?? undefined;
  const { data: allQuestions, loading } = useQuizQuestions(moduleSlug);

  // Renew daily: deterministic shuffle seeded by current date
  const questions = useMemo<QuizRow[]>(() => {
    if (!allQuestions.length) return [];
    const seed = getDaySeed();
    const shuffled = seededShuffle(allQuestions, seed);
    return shuffled.slice(0, Math.min(10, shuffled.length));
  }, [allQuestions]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <span className="text-5xl">📝</span>
        <p className="mt-4 text-sm text-muted-foreground">
          {bi("Aucune question disponible.", "Hakuna maswali.")}
        </p>
        <p className="mt-3 text-xs text-muted-foreground/80">
          {bi("Glissez depuis le bord gauche pour revenir.", "Telezesha kutoka ukingoni wa kushoto kurudi.")}
        </p>
      </div>
    );
  }

  const q = questions[current];
  const optionsFr = [q.option_a_fr, q.option_b_fr, q.option_c_fr, q.option_d_fr];
  const optionsShi = [q.option_a_shk, q.option_b_shk, q.option_c_shk, q.option_d_shk];
  const visibleCount = optionsFr.filter((o) => !!o).length;

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct_index) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  const progress = ((current + (answered ? 1 : 0)) / questions.length) * 100;
  const goodScore = score >= questions.length * 0.7;

  if (finished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="animate-scale-in">
          <span className="text-6xl">{goodScore ? "🌙" : "📚"}</span>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground" style={{ lineHeight: "1.1" }}>
            {bi("Félicitations !", "Hongera!")}
          </h1>
          <p className="mt-2 text-lg font-semibold text-secondary">
            {bi("Score", "Alama")}: {score}/{questions.length}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {goodScore
              ? bi("Vous maîtrisez bien le patrimoine comorien !", "Unajua vizuri urithi wa Kikomori!")
              : bi("Continuez à apprendre !", "Endelea kujifunza!")}
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={restart}
              className="btn-comorian flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              {bi("Réessayer", "Jaribu tena")}
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition-all active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              {bi("Partager", "Shiriki")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pattern-comorian pb-20">
      <ScreenHeader
        icon={Brain}
        labelFr="Quiz"
        labelShi="Maswali"
        right={
          <span>
            {current + 1}/{questions.length}
          </span>
        }
      />

      <div className="px-4 pt-4 h-2 w-full">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 mt-8 animate-fade-up">
        <h2 className="font-display text-xl font-bold text-foreground" style={{ lineHeight: "1.3" }}>
          {q.question_fr}
          {q.question_shk && (
            <>
              <span className="block text-base font-normal text-muted-foreground mt-1">{q.question_shk}</span>
            </>
          )}
        </h2>

        <div className="mt-6 space-y-3">
          {Array.from({ length: visibleCount }).map((_, idx) => {
            let style = "bg-card border-border text-foreground";
            if (answered) {
              if (idx === q.correct_index) style = "bg-success/10 border-success text-success";
              else if (idx === selected) style = "bg-destructive/10 border-destructive text-destructive";
            } else if (idx === selected) {
              style = "bg-secondary/10 border-secondary text-foreground";
            }

            const fr = optionsFr[idx];
            const shi = optionsShi[idx];

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className={`w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition-all duration-200 active:scale-[0.98] ${style}`}
              >
                <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground align-top">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="inline-block align-top">
                  {fr}
                  {shi && <span className="block text-xs opacity-70 mt-0.5">{shi}</span>}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-4 animate-fade-up">
            <p className={`text-sm font-semibold ${selected === q.correct_index ? "text-success" : "text-destructive"}`}>
              {selected === q.correct_index ? bi("Correct !", "Sahihi!") : bi("Incorrect", "Si sahihi")}
            </p>
            {(q.explanation_fr || q.explanation_shk) && (
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {bi(q.explanation_fr, q.explanation_shk)}
              </p>
            )}
            <button
              onClick={handleNext}
              className="btn-comorian mt-4 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.97]"
            >
              {current + 1 >= questions.length ? bi("Score", "Alama") : bi("Question Suivante", "Swali Lifuatalo")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
