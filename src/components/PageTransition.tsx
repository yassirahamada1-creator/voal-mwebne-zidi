import { memo, useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { consumeNavDirection, type NavDirection } from "@/lib/navDirection";

/**
 * Transition style WhatsApp :
 *  - Page entrante : translateX 100% → 0
 *  - Page sortante : translateX 0 → -30% + overlay sombre 0 → 0.2 (parallax)
 *  - Back : inverse (entrante de gauche -30% → 0, sortante vers droite)
 *  - easing [0.25,0.46,0.45,0.94], durée 0.28s, mode popLayout
 *
 * Direction :
 *  1. Swipe (SwipeNavigator) → consumeNavDirection
 *  2. NavigationType POP → backward
 *  3. Sinon forward
 */

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const DURATION = 0.28;

type Dir = "forward" | "backward";

const variants = {
  initial: (dir: Dir) => ({
    x: dir === "backward" ? "-30%" : "100%",
    opacity: 1,
  }),
  animate: { x: "0%", opacity: 1 },
  exit: (dir: Dir) => ({
    x: dir === "backward" ? "100%" : "-30%",
    opacity: 1,
  }),
};

const overlayVariants = {
  initial: (dir: Dir) => ({ opacity: dir === "backward" ? 0.2 : 0 }),
  animate: { opacity: 0 },
  exit: (dir: Dir) => ({ opacity: dir === "backward" ? 0 : 0.2 }),
};

const PageTransition = memo(({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navType = useNavigationType();
  const reduce = useReducedMotion();
  const dirRef = useRef<Dir>("forward");

  // Détermine la direction au changement de route.
  const swipeDir = consumeNavDirection(location.pathname);
  if (swipeDir === "forward" || swipeDir === "backward") {
    dirRef.current = swipeDir;
  } else if (navType === "POP") {
    dirRef.current = "backward";
  } else {
    dirRef.current = "forward";
  }
  const direction = dirRef.current;

  // Scroll top sur navigation forward (comportement WhatsApp).
  useEffect(() => {
    if (direction === "forward") window.scrollTo(0, 0);
  }, [location.pathname, direction]);

  if (reduce) {
    return <div className="relative">{children}</div>;
  }

  return (
    <div className="relative overflow-x-hidden" style={{ minHeight: "100dvh" }}>
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: DURATION, ease: EASE }}
          style={{ willChange: "transform", position: "relative" }}
        >
          {children}
          <motion.div
            aria-hidden="true"
            custom={direction}
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: DURATION, ease: EASE }}
            className="pointer-events-none absolute inset-0 bg-black"
            style={{ willChange: "opacity" }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

PageTransition.displayName = "PageTransition";

export default PageTransition;
export type { NavDirection };
