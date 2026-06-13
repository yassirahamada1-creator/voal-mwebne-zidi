import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { CircleCheck as CheckCircle2, Wifi } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

/**
 * Pilote les notifications de reconnexion :
 *  - Au retour en ligne : toast "Connexion rétablie, chargement en cours…"
 *  - Une fois la sync globale terminée : toast "Tout est à jour ✓"
 * Le bandeau "Mode hors ligne" est géré séparément par OfflineBanner.
 */
const ConnectionStatus = () => {
  const { lang } = useI18n();
  const { online, status } = useOfflineSync();
  const wasOnline = useRef<boolean>(online);
  const awaitingSyncEnd = useRef<boolean>(false);

  // Détection des bascules online/offline
  useEffect(() => {
    if (online === wasOnline.current) return;
    if (online) {
      // Reconnexion
      toast(
        lang === "fr" ? "Connexion rétablie" : "Mtandao umerejea",
        {
          description: lang === "fr" ? "Chargement en cours…" : "Inapakia…",
          icon: <Wifi className="h-4 w-4" aria-hidden="true" />,
          id: "vdl-conn-status",
          duration: 3500,
        },
      );
      awaitingSyncEnd.current = true;
    }
    // Le passage offline est couvert par OfflineBanner, pas de toast redondant.
    wasOnline.current = online;
  }, [online, lang]);

  // Quand la sync globale qui suit la reconnexion se termine
  useEffect(() => {
    if (status !== "ready") return;
    if (!awaitingSyncEnd.current) return;
    awaitingSyncEnd.current = false;
    toast.success(
      lang === "fr" ? "Tout est à jour" : "Yote ni mapya",
      {
        icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
        id: "vdl-conn-status",
        duration: 2500,
      },
    );
  }, [status, lang]);

  return null;
};

export default ConnectionStatus;
