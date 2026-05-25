import { ImgHTMLAttributes, useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { useOfflineMediaUrl } from "@/hooks/useBackendData";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  /** Affiche un placeholder visuel si l'image est absente ou échoue. Default true. */
  showFallback?: boolean;
};

/**
 * <img> qui résout l'URL distante vers la version en cache (blob:) si disponible,
 * pour rester affichable même en mode totalement hors-ligne. Affiche un
 * placeholder élégant quand l'URL est absente ou que le chargement échoue.
 */
export default function OfflineImage({ src, showFallback = true, className, alt, ...rest }: Props) {
  const { url } = useOfflineMediaUrl(src ?? null);
  const [errored, setErrored] = useState(false);

  // Reset l'état d'erreur si la source change.
  useEffect(() => { setErrored(false); }, [url]);

  if (!url || errored) {
    if (!showFallback) return null;
    return (
      <div
        role="img"
        aria-label={typeof alt === "string" ? alt : undefined}
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}
      >
        <ImageOff className="h-1/3 w-1/3 max-h-6 max-w-6 opacity-60" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
