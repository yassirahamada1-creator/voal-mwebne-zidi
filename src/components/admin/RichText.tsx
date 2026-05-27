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
          // Collage intelligent : si la source fournit du HTML (Word, Google Docs,
          // pages web, certains PDF), on le nettoie et on conserve le formatage
          // (gras, italique, titres, listes, sauts de ligne, alinéas). Sinon, on
          // retombe sur le texte brut en préservant les sauts de ligne et les
          // espaces en début de ligne (alinéas).
          e.preventDefault();
          const html = e.clipboardData.getData("text/html") || "";
          const text = e.clipboardData.getData("text/plain") || "";

          // Balises et attributs autorisés
          const ALLOWED_TAGS = new Set([
            "P","BR","DIV","SPAN",
            "B","STRONG","I","EM","U","S","STRIKE","SUB","SUP",
            "H1","H2","H3","H4","H5","H6",
            "UL","OL","LI",
            "BLOCKQUOTE","PRE","CODE",
            "A","HR",
            "TABLE","THEAD","TBODY","TR","TD","TH",
          ]);
          const ALLOWED_ATTRS: Record<string, string[]> = {
            A: ["href", "title", "target", "rel"],
            "*": ["style"],
          };
          // Propriétés CSS conservées pour respecter la mise en forme d'origine
          const ALLOWED_CSS = new Set([
            "font-weight","font-style","text-decoration","text-align",
            "margin-left","padding-left","text-indent",
          ]);

          const sanitizeStyle = (val: string) =>
            val
              .split(";")
              .map((d) => d.trim())
              .filter(Boolean)
              .filter((d) => {
                const k = d.split(":")[0]?.trim().toLowerCase();
                return k && ALLOWED_CSS.has(k);
              })
              .join("; ");

          const sanitize = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
              return (node.textContent || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return "";
            const el = node as HTMLElement;
            const tag = el.tagName.toUpperCase();
            const inner = Array.from(el.childNodes).map(sanitize).join("");
            if (!ALLOWED_TAGS.has(tag)) return inner;
            const attrs: string[] = [];
            const allowed = [...(ALLOWED_ATTRS[tag] || []), ...(ALLOWED_ATTRS["*"] || [])];
            for (const name of allowed) {
              const v = el.getAttribute(name);
              if (!v) continue;
              if (name === "style") {
                const safe = sanitizeStyle(v);
                if (safe) attrs.push(`style="${safe.replace(/"/g, "&quot;")}"`);
              } else if (name === "href") {
                if (/^(https?:|mailto:|tel:|#|\/)/i.test(v)) {
                  attrs.push(`href="${v.replace(/"/g, "&quot;")}"`);
                  attrs.push(`target="_blank"`, `rel="noopener noreferrer"`);
                }
              } else {
                attrs.push(`${name}="${v.replace(/"/g, "&quot;")}"`);
              }
            }
            const attrStr = attrs.length ? " " + attrs.join(" ") : "";
            if (tag === "BR" || tag === "HR") return `<${tag.toLowerCase()}/>`;
            return `<${tag.toLowerCase()}${attrStr}>${inner}</${tag.toLowerCase()}>`;
          };

          let out = "";
          if (html.trim()) {
            // Word / Google Docs livrent un fragment HTML. On l'analyse via DOMParser
            // pour profiter du parseur navigateur, puis on en extrait le <body>.
            const doc = new DOMParser().parseFromString(html, "text/html");
            // Supprime les blocs Word inutiles (commentaires, styles, namespaces)
            doc.querySelectorAll("style,script,meta,link,o\\:p,xml").forEach((n) => n.remove());
            out = Array.from(doc.body.childNodes).map(sanitize).join("").trim();
          }

          if (!out && text) {
            // Décode les séquences encodées issues des PDF (%20, %C3%A9, etc.)
            let t = text;
            if (/%[0-9A-Fa-f]{2}/.test(t)) {
              try { t = decodeURIComponent(t); } catch { /* keep original */ }
            }
            t = t.replace(/\r\n?/g, "\n");
            const escape = (s: string) =>
              s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            // Préserve alinéas (espaces / tabulations en début de ligne) et sauts de ligne
            out = t
              .split(/\n{2,}/)
              .map((para) => {
                const lines = para.split("\n").map((line) => {
                  const m = line.match(/^([ \t]+)(.*)$/);
                  if (m) {
                    const indent = m[1].replace(/\t/g, "    ");
                    return "&nbsp;".repeat(indent.length) + escape(m[2]);
                  }
                  return escape(line);
                });
                return `<p>${lines.join("<br/>") || "<br/>"}</p>`;
              })
              .join("");
          }

          document.execCommand("insertHTML", false, out);
          if (ref.current) onChange(ref.current.innerHTML);
        }}


        data-placeholder={placeholder}
        className="prose prose-sm max-w-none min-h-[160px] px-3 py-2 text-sm focus-visible:outline-none [&[contenteditable]:empty]:before:content-[attr(data-placeholder)] [&[contenteditable]:empty]:before:text-muted-foreground"
      />
    </div>
  );
}
