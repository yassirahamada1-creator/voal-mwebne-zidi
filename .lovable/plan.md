## Objectif

1. Supprimer entièrement la page **Téléchargements** et son code lié.
2. Mettre à jour la BottomNav, le Dashboard et la home pour ne plus mentionner les téléchargements.
3. Embarquer photos, audios et textes **dans l'APK / le bundle web** pour qu'ils soient consultables dès l'installation, sans connexion ni étape « télécharger ».
4. Garder les **vidéos** en streaming (connexion requise) — comportement déjà acté.

## Approche pour le contenu pré-embarqué

La méthode la plus fiable et compatible Capacitor est de **précompiler le contenu Supabase en JSON statique au moment du `npm run build`**, puis de charger ce JSON depuis le bundle au premier lancement.

### Script de pré-build `scripts/prebuild-content.mjs`
- Se connecte à Supabase avec l'anon key (lecture publique RLS).
- Récupère `modules`, `contents`, `translations`, galerie, hommage, foreword.
- Télécharge les fichiers binaires référencés (images, audios) et les pousse comme assets CDN Lovable via `lovable-assets create`, OU réécrit simplement les URLs publiques Supabase (déjà accessibles offline une fois mises en cache HTTP par le SW).
- Écrit un snapshot dans `src/data/content-snapshot.json` (texte + métadonnées + URLs).
- Hooké dans `package.json` : `"prebuild": "node scripts/prebuild-content.mjs"`.

### Chargement côté app
- `offlineStore.ts` : au premier lancement, si IndexedDB est vide, **importe le snapshot bundlé** au lieu d'appeler le réseau. Le contenu est immédiatement disponible.
- Si en ligne, une resynchronisation silencieuse en tâche de fond rafraîchit le cache (admin updates).
- Les images et audios bundlés sont préchargés (déjà fait via `prewarmStaticAssets`) ; on étend le prewarm aux médias du snapshot.

## Fichiers à supprimer

- `src/pages/DownloadsScreen.tsx`
- `src/components/DownloadQueue.tsx`
- `src/hooks/useDownloadQueue.tsx`
- `src/hooks/useContentDownload.tsx`
- `src/lib/downloadQueue.ts`

## Fichiers à modifier

- `src/App.tsx` : retirer la route `/downloads`, le lazy import, l'entrée dans `TAB_PATHS`.
- `src/components/TabSwiper.tsx` : retirer l'entrée `/downloads` (4 onglets restants).
- `src/components/BottomNav.tsx` : retirer le bouton Téléchargements.
- `src/components/NativeBackHandler.tsx`, `GlobalBackButton.tsx`, `SwipeNavigator.tsx`, `ContentActions.tsx` : retirer toutes les références à `useDownloadQueue` / route `/downloads`.
- `src/config/statusBar.ts` : retirer l'entrée `/downloads`.
- `src/hooks/useOfflineSync.tsx` : retirer l'import `listJobs` / `QUEUE_CHANGED_EVENT` et la logique de file.
- `src/pages/HomeScreen.tsx`, `FavoritesScreen.tsx`, `SettingsScreen.tsx` : retirer les liens / CTA « Mes téléchargements ».
- `src/pages/Dashboard.tsx` : supprimer les widgets liés aux téléchargements (stats, file d'attente). Ajouter à la place un indicateur **« Contenu embarqué »** (taille du snapshot, date de génération) et un bouton « Resynchroniser » qui appelle `resync()`.
- `src/contexts/I18nContext.tsx` (clé `pages.downloads`) : retirer.

## Fichiers à créer

- `scripts/prebuild-content.mjs` — script de génération du snapshot.
- `src/data/content-snapshot.json` — généré par le script (versionné pour builds reproductibles).
- `src/lib/contentSnapshot.ts` — helper qui hydrate IndexedDB depuis le snapshot au premier run.

## Points à confirmer

1. **Vidéos** : restent en streaming uniquement (confirmé dans un échange précédent). ✅
2. **Volume des médias** : les photos + audios doivent rester sous une taille raisonnable (~50-100 Mo idéalement pour un APK). Si la galerie est volumineuse, on peut au choix :
   - tout bundler (APK plus lourd mais 100 % offline immédiat) ;
   - bundler seulement les vignettes + textes, et lazy-télécharger les versions haute résolution en arrière-plan au premier lancement en ligne.
3. **Mises à jour admin** : le snapshot est figé au build. Toute modification admin n'apparaît que sur la prochaine version publiée, sauf si l'utilisateur est en ligne (resync auto en arrière-plan).

## Question avant implémentation

Souhaitez-vous :
- **(A)** Tout bundler dans l'APK (offline 100 % immédiat, APK plus lourd) ?
- **(B)** Bundler textes + vignettes seulement, et télécharger automatiquement et silencieusement les médias HD en arrière-plan dès le premier lancement en ligne (APK léger, offline complet après ~1 min en ligne) ?

L'option (B) reste « pas besoin de connexion pour consulter après l'install » dès lors que l'utilisateur ouvre l'app au moins une fois avec internet, ce qui est en général le cas juste après l'installation depuis le Play Store.
