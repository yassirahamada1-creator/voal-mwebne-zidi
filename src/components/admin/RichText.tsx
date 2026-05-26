import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Éditeur de texte riche minimaliste basé sur contenteditable.
 * Sortie : HTML simple (B, I, UL, OL, H3, BLOCKQUOTE, P).
 */
export default function RichText({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current?.focus();
  };

  const tools: { cmd: string; arg?: string; icon: any; label: string }[] = [
    { cmd: "bold", icon: Bold, label: "Gras" },
    { cmd: "italic", icon: Italic, label: "Italique" },
    { cmd: "formatBlock", arg: "H3", icon: Heading2, label: "Titre" },
    { cmd: "insertUnorderedList", icon: List, label: "Liste" },
    { cmd: "insertOrderedList", icon: ListOrdered, label: "Liste numérotée" },
    { cmd: "formatBlock", arg: "BLOCKQUOTE", icon: Quote, label: "Citation" },
  ];

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap gap-1 border-b border-input p-1.5">
        {tools.map((t, i) => (
          <Button
            key={i}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(t.cmd, t.arg)}
            aria-label={t.label}
            title={t.label}
          >
            <t.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onPaste={(e) => {
          // Coller en texte brut propre, en neutralisant les artefacts
          // venus de Word / PDF (caractères <, >, &, espaces insécables,
          // guillemets typographiques, retours ligne mal interprétés, etc.).
          e.preventDefault();
          let text = e.clipboardData.getData("text/plain") || "";

          // Décode les URL collées depuis un PDF (%20, %C3%A9, etc.)
          if (/%[0-9A-Fa-f]{2}/.test(text)) {
            try {
              text = decodeURIComponent(text);
            } catch {
              /* on garde le texte original */
            }
          }

          // Normalise les caractères spéciaux Word
          text = text
            .replace(/\r\n?/g, "\n")
            .replace(/\u00A0/g, " ") // espace insécable
            .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
            .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
            .replace(/[\u2013\u2014]/g, "-")
            .replace(/\u2026/g, "...");

          // Échappe < > & pour qu'ils s'affichent comme du texte et pas
          // comme du HTML (sinon "<div" pasté apparaît tel quel).
          const escape = (s: string) =>
            s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

          // Transforme les paragraphes / sauts de ligne en HTML propre
          const html = text
            .split(/\n{2,}/)
            .map((para) => escape(para).replace(/\n/g, "<br>"))
            .map((para) => `<p>${para || "<br>"}</p>`)
            .join("");

          document.execCommand("insertHTML", false, html);
          if (ref.current) onChange(ref.current.innerHTML);
        }}

        data-placeholder={placeholder}
        className="prose prose-sm max-w-none min-h-[160px] px-3 py-2 text-sm focus-visible:outline-none [&[contenteditable]:empty]:before:content-[attr(data-placeholder)] [&[contenteditable]:empty]:before:text-muted-foreground"
      />
    </div>
  );
}
