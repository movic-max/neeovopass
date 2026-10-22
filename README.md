# NEEOVOPASS — Miss Lékié 2e Édition

Plateforme de vote et billetterie **NEEOVOPASS** (*Publie. Vends. Fais Voter.*) hébergeant le concours **Miss Lékié 2e Édition**.

## Lancer en local

- Node.js 18.17+ recommandé
- `npm install`
- `npm run dev`
- Ouvrir `http://localhost:3000`

## Structure

- `app/page.tsx` : accueil et données candidates de démonstration
- `app/globals.css` : design system responsive, palette, motif SVG, composants visuels
- `app/layout.tsx` : métadonnées SEO / Open Graph
- `public/miss-likie-hero.jpg` : visuel éditorial de couverture

Les portraits de la galerie utilisent des URL Unsplash pour cette maquette uniquement. Remplacer par les photos approuvées avant mise en production. Les votes et chiffres affichés sont fictifs.

## Étape 2 — pages événement et candidates

- `/evenement/miss-lekie-2e-edition` : présentation de l’édition et classement de démonstration.
- `/evenement/miss-lekie-2e-edition/candidate/merveille-nkoa` (et slugs des autres candidates) : fiche, partage et sélecteur de votes interactif.
- Tarification illustrative : 100 FCFA par vote, saisie directe ou boutons rapides.
- Le parcours de paiement affiche un avertissement : les paiements ne sont pas branchés et aucun débit n’est possible.

## Mode suspense du classement

La page événement conditionne le rendu du classement à `demoEvent.rankingVisible` dans `lib/demo.ts`. À `false`, les rangs, votes et barres de progression ne sont pas rendus : un écran de suspense s’affiche à la place. Le champ de production correspondant est `events.ranking_visible` dans la migration PostgreSQL. Le contrôle depuis un dashboard admin authentifié sera relié lors de l’implémentation complète de l’administration ; ne pas exposer une bascule publique.

## Étape 3 — fondation de données (en cours)

Un premier schéma PostgreSQL/Supabase est disponible dans `supabase/migrations/0001_core.sql`. Il pose les tables événement/candidate, paliers et sponsors, transactions, ledger append-only, rôles admins, audit, bloclist et analytics, ainsi que les premières règles RLS. Il n’est pas encore appliqué à un projet Supabase et ne constitue pas encore l’authentification admin complète : l’écran d’installation unique, MFA/TOTP obligatoire, limitation des tentatives et CRUD authentifié restent à réaliser avant toute mise en production.

Copier `.env.example` vers `.env.local` lorsque le projet Supabase sera créé. Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` au navigateur. La migration ne contient aucun identifiant de compte ni aucune clé.

## Limites de la maquette

Toutes les données et tous les votes affichés sont fictifs. L’authentification, les paiements Mobile Money, les écritures du ledger, les webhooks et la gestion d’administration ne sont pas encore opérationnels. Ne pas accepter de paiement réel sur cette version.
