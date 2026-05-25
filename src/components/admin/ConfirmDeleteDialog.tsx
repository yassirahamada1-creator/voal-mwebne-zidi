import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

export type ConfirmDeleteOptions = {
  title?: string;
  /** Nom court de l'élément (ex: "ce module", "la photo"). */
  itemLabel?: string;
  /** Si défini (>1), on affiche un récap "X éléments" et on exige la saisie. */
  itemCount?: number;
  /** Détails optionnels affichés en gris. */
  description?: string;
  /** Forcer la saisie de "SUPPRIMER" (par défaut: true si itemCount>1, sinon false). */
  requireTyping?: boolean;
  confirmLabel?: string;
};

const CONFIRM_WORD = "SUPPRIMER";

type Listener = (opts: ConfirmDeleteOptions, resolve: (v: boolean) => void) => void;
let listener: Listener | null = null;

/**
 * Ouvre la modale de confirmation et résout en true/false.
 * Utilisable depuis n'importe quel composant tant que <ConfirmDeleteProvider /> est monté.
 */
export function confirmDelete(opts: ConfirmDeleteOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!listener) {
      // Fallback prudent — ne devrait jamais arriver si le provider est monté.
      resolve(window.confirm(opts.title ?? "Confirmer la suppression ?"));
      return;
    }
    listener(opts, resolve);
  });
}

export function ConfirmDeleteProvider() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmDeleteOptions>({});
  const [typed, setTyped] = useState("");
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listener = (o, r) => {
      setOpts(o);
      setTyped("");
      setBusy(false);
      setResolver(() => r);
      setOpen(true);
    };
    return () => {
      listener = null;
    };
  }, []);

  const requireTyping = opts.requireTyping ?? (opts.itemCount ?? 0) > 1;
  const canConfirm = !requireTyping || typed.trim().toUpperCase() === CONFIRM_WORD;

  const finish = (value: boolean) => {
    if (resolver) resolver(value);
    setResolver(null);
    setOpen(false);
  };

  const onConfirm = () => {
    if (!canConfirm) return;
    setBusy(true);
    finish(true);
  };

  const onCancel = () => finish(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && resolver) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle>{opts.title ?? "Confirmer la suppression"}</DialogTitle>
              <DialogDescription>
                {opts.itemCount && opts.itemCount > 1
                  ? `${opts.itemCount} ${opts.itemLabel ?? "éléments"} seront supprimés définitivement.`
                  : `${opts.itemLabel ? `Supprimer ${opts.itemLabel}.` : "Cet élément sera supprimé."} Cette action est irréversible.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {opts.description && (
          <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
            {opts.description}
          </p>
        )}

        {requireTyping && (
          <div className="space-y-2">
            <Label htmlFor="confirm-delete-word" className="text-xs">
              Pour confirmer, tapez{" "}
              <span className="font-mono font-bold text-destructive">{CONFIRM_WORD}</span>
            </Label>
            <Input
              id="confirm-delete-word"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConfirm) onConfirm();
              }}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canConfirm || busy}
            autoFocus={!requireTyping}
          >
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            {opts.confirmLabel ?? "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
