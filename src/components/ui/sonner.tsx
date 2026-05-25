import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  Configuration centralisée des toasts                                       */
/*  Source unique de vérité pour le placement, la largeur, la durée          */
/*  et les animations.                                                        */
/* -------------------------------------------------------------------------- */

export const TOAST_POSITION = "bottom-center" as const;
export const TOAST_MAX_WIDTH = "min(calc(100vw - 2rem), 26rem)";
export const TOAST_MOBILE_OFFSET = "1rem";
export const TOAST_OFFSET = "5.5rem";
export const TOAST_DURATION = 2500;
export const TOAST_VISIBLE = 3;
export const TOAST_EXPAND = false;

const TOAST_TRANSITION_CLASS =
  "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "data-[swipe=move]:transition-none " +
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 " +
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={TOAST_POSITION}
      offset={TOAST_OFFSET}
      mobileOffset={TOAST_MOBILE_OFFSET}
      duration={TOAST_DURATION}
      visibleToasts={TOAST_VISIBLE}
      expand={TOAST_EXPAND}
      style={
        {
          "--width": TOAST_MAX_WIDTH,
          "--mobile-offset": TOAST_MOBILE_OFFSET,
        } as React.CSSProperties
      }
      closeButton
      richColors={false}
      toastOptions={{
        duration: TOAST_DURATION,
        
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg " +
            TOAST_TRANSITION_CLASS,
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
