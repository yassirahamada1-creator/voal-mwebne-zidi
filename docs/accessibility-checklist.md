# Checklist d'accessibilité — Voix de la Lune

À appliquer à **chaque nouvel écran** (et à chaque modification UI significative).

## 1. Noms accessibles (ARIA)

- [ ] Tout bouton/lien icône-seule a un `aria-label` bilingue (`biStr("FR", "SHI")`)
- [ ] Les images informatives ont un `alt` descriptif ; les images décoratives ont `alt=""` ou `aria-hidden`
- [ ] Les icônes décoratives à côté d'un texte portent `aria-hidden`
- [ ] Les champs de formulaire ont un `<label>` associé (ou `aria-label`/`aria-labelledby`)
- [ ] Les régions principales utilisent les éléments sémantiques : `<header>`, `<main>`, `<nav>`, `<section>` (un seul `<main>` par écran)

## 2. Navigation clavier

- [ ] Tous les éléments interactifs sont atteignables via `Tab` (pas de `tabIndex={-1}` arbitraire)
- [ ] L'ordre de tabulation suit l'ordre visuel
- [ ] `Enter`/`Espace` activent les boutons ; `Escape` ferme dialogs/popovers
- [ ] Aucun piège au clavier (focus toujours sortable d'un composant)
- [ ] Les composants Radix/shadcn (Dialog, Dropdown, Accordion, Tabs) sont utilisés tels quels — pas de widget maison

## 3. Focus visible

- [ ] Tout élément interactif a un `focus-visible:ring` clair :
  ```
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-ring focus-visible:ring-offset-2
  ```
- [ ] Sur fonds sombres/colorés : utiliser `ring-primary-foreground` + `ring-offset-<surface>`
- [ ] Le focus n'est jamais masqué par `outline-none` sans alternative visuelle

## 4. Cibles tactiles (WCAG 2.5.5)

- [ ] Boutons icône-seuls : `min-h-11 min-w-11` (44×44 px) — utiliser `inline-flex items-center justify-center`
- [ ] Espacement minimal entre cibles adjacentes : `gap-2` (8 px)
- [ ] Sliders et toggles ont une zone de saisie ≥ 44 px de hauteur

## 5. Couleur & contraste

- [ ] Utiliser uniquement les tokens sémantiques (`text-foreground`, `bg-background`, `text-muted-foreground`…)
- [ ] Pas de `text-gray-300`, `text-white/40` ou opacités < 0.7 sur du texte
- [ ] Vérifier le contraste en mode sombre **et** clair
- [ ] L'information n'est jamais transmise par la couleur seule (ajouter icône, texte ou motif)

## 6. Bilinguisme & lecture

- [ ] Tout texte visible passe par `bi(...)`, `biStr(...)` ou `<BilingualText>`
- [ ] Les `aria-label` sont également bilingues
- [ ] Les titres respectent la hiérarchie : un seul `<h1>` par écran, puis `<h2>`/`<h3>` séquentiels

## 7. Toasts & dialogues

- [ ] Les toasts passent par `toast` importé de `@/components/ui/sonner` (config centralisée)
- [ ] Les `AlertDialog`/`Dialog` ont `AlertDialogTitle` + `AlertDialogDescription`
- [ ] Largeur des dialogs ≤ shell de l'app (`max-w-[calc(28rem-2rem)]`)

## 8. Mouvement & animation

- [ ] Animations < 5 s ou contrôlables
- [ ] Aucun clignotement > 3 fois/seconde
- [ ] Préférer `transition`/`animate-in` Tailwind cohérents avec le reste de l'app

## 9. Navigation entre écrans

- [ ] Bouton retour présent **uniquement** sur les sous-pages (pas sur les onglets racines : Accueil, Apprendre, Hors ligne, Paramètres)
- [ ] Bouton retour : `aria-label` bilingue, 44×44, `focus-visible:ring`
- [ ] Liens internes utilisent `<Link>` de `react-router-dom`, pas `<a href>`

## 10. Test manuel rapide (5 min)

1. Naviguer la page entièrement au clavier (`Tab`, `Shift+Tab`, `Enter`, `Espace`, `Escape`)
2. Vérifier que chaque élément focusable a un anneau visible
3. Zoomer le navigateur à 200 % — pas de débordement horizontal
4. Activer le lecteur d'écran (VoiceOver / NVDA) sur 2-3 éléments clés
5. Inspecter les cibles tactiles en viewport mobile (375 px)
