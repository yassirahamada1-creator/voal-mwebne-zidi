## Refonte de la charte visuelle — motifs culturels comoriens

Inspiration : motifs traditionnels comoriens (broderies salouva, henné, géométrie shirazi, treillis bois sculptés des portes de Mutsamudu) — palette chaude (or, terre cuite, bleu profond océan Indien), élégance moderne et lisibilité.

### Pages exclues
Aucun changement à `SplashScreen` ni `Dashboard` (ni leurs sous-composants exclusifs).

### 1. Tokens de design (`src/index.css` + `tailwind.config.ts`)

Affiner la palette existante, déjà alignée :
- `--primary` : bleu nuit indigo plus profond (210 60% 18%) — évoque l'océan et le ciel comorien
- `--secondary` / `--gold` : or chaud légèrement plus saturé (40 75% 52%)
- `--accent` / `--terracotta` : terre cuite plus douce (15 65% 58%)
- `--card` : crème ivoire chaud (38 45% 96%)
- `--muted` : sable doux (35 25% 92%)
- Nouveau `--henna` : brun henné (20 50% 35%) pour textes accentués
- Nouveau `--sea` : turquoise océan (185 55% 42%) pour états info/success doux

Ajouter des tokens motifs :
- `--pattern-opacity` (0.06 par défaut)
- `--shadow-warm` : ombre chaude `0 10px 30px -12px hsl(20 50% 25% / 0.18)`
- `--shadow-elevated` : pour cartes en hover
- `--gradient-sunrise` : `linear-gradient(135deg, hsl(var(--gold)), hsl(var(--terracotta)))`
- `--gradient-ocean` : `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--sea)))`
- Rayon : `--radius` 1rem (plus arrondi, doux)

### 2. Motifs comoriens réutilisables

Créer `src/assets/patterns/` avec 3 SVG inline en composants :
- `ZellijPattern` : treillis géométrique étoilé (style portes sculptées Anjouan)
- `HennaPattern` : motifs floraux henné (lignes courbes fines)
- `WeavePattern` : tressage salouva (chevrons)

Composant `<DecorativePattern variant="zellij|henna|weave" intensity="subtle|medium" />` utilisé en :
- arrière-plans de section (très basse opacité)
- bordures décoratives en haut/bas de cartes
- séparateurs entre blocs

### 3. Composants UI ajustés

- **Card** (`ui/card.tsx`) : bord supérieur fin doré (1px gradient), légère texture motif en filigrane optionnelle
- **Button** : variante `cultural` (gradient sunrise), variante `ghost-gold`, micro-animation au hover (scale subtile + ombre chaude)
- **Header de page** : bandeau motif zellij subtil derrière le titre
- **Tabs / SegmentedControl** : indicateur actif en gradient or
- **Badges** : couleurs dérivées (henna, sea, gold) avec contraste WCAG AA
- **Inputs** : focus-ring or doux, fond crème

### 4. Pages mises à jour (hors splash/dashboard)

- `HomeScreen` : bandeau d'en-tête avec motif zellij en filigrane, cartes catégories avec bord doré
- `CategoryScreen` : header avec gradient ocean + motif weave, cartes contenus revues
- `MediaPlayerScreen` : contrôles plus arrondis, accent or sur progression
- `FavoritesScreen` : état vide illustré avec motif henné
- `ContentDetailScreen`, `Search`, `Settings`, `Auth`, `OfflineManager`, `Admin` (pages utilisateur, pas le dashboard) : application des nouveaux tokens et bandeaux motifs

### 5. Typographie

Conserver Plus Jakarta Sans + polices accessibilité existantes. Ajouter une variante display pour les grands titres (font-weight 800 + letter-spacing -0.02em) — pas de nouvelle police importée.

### Détails techniques

- Aucune couleur en dur : tout via tokens HSL
- Tous les motifs en SVG inline (offline-first, zéro requête)
- Opacités basses (≤ 8 %) pour préserver la lisibilité
- Vérifier contraste AA sur tous les nouveaux couples couleur
- Conserver checklist a11y `docs/accessibility-checklist.md`
- Pas de modification de logique métier ni d'appels API
