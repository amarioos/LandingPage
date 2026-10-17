# DogWalk Maroc

Landing page publique en darija, Tajawal, RTL, chiffres occidentaux. GitHub Pages déploie uniquement index.html, les deux photos optimisées et le lien admin.

- Landing : https://amarioos.github.io/LandingPage/
- Administration : https://dogwalk-saudi-leads.okmar49.chatgpt.site/admin
- Connexion administrateur : compte ChatGPT propriétaire.

## Backend
Les leads et événements sont stockés dans Cloudflare D1 via Sites. Les routes admin vérifient côté serveur le compte propriétaire configuré dans ADMIN_EMAIL (variable runtime secrète, jamais dans le frontend). Les appels publics sont limités à la création de sessions, événements et leads ; ils ne peuvent pas lire les données clients.

Le dépôt backend contient le code spécifique de l’application. Le projet Sites complet et son historique sont conservés séparément par Sites. Le frontend GitHub Pages appelle le backend HTTPS avec CORS limité au domaine GitHub Pages et au domaine backend.

## Fonctionnalités
- Validation maroc 06/07 ou +212, consentement, protection contre doubles envois, confirmation seulement après stockage.
- Sessions et visiteurs navigateur, funnel, clics CTA, scroll, tendances et abandons après 30 min sans activité.
- Heatmap des clics normalisés par section/appareil, sans contenu des champs. Fond schématique identifié.
- Leads filtrables, statut, export CSV.
- Factures brouillons liées aux leads, prix/taxe optionnels, impression. Mentions légales à compléter avant usage commercial.
- Paramètres : prix, taxe, notes, suivi, images marketing et zones CTA transparentes.
- `dumb data` et suppression démo : jeu séparé du réel.

## Configuration commerciale
Le prix, la taxe, le vendeur légal, les modalités de livraison et les conditions de vente ne sont pas inventés. Le formulaire recueille une demande d’intérêt, à confirmer après contact.

## Validation
TypeScript et build production ; tests SQL/handlers de contrôle d’accès, validation, idempotence, factures, événements et isolation de la démo. Les tests de navigateur n’étaient pas disponibles dans cet environnement.
