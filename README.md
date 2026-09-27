# Teranga Fit — Gestion de salle de sport

Application mono-salle : membres, abonnements, contrôle d'accès, billetterie/caisse, relances.
Stack : **Next.js + Firebase (Firestore + Auth) + déploiement Vercel**.

## 1. Créer le projet Firebase

1. Va sur https://console.firebase.google.com → **Ajouter un projet**.
2. Dans le projet, active :
   - **Firestore Database** (mode production)
   - **Authentication** → activer la méthode "Email/mot de passe"
3. Va dans **Paramètres du projet > Général > Tes applications** → crée une appli Web → copie la config.
4. Crée manuellement un premier compte utilisateur dans **Authentication > Users > Ajouter un utilisateur** (email + mot de passe) pour te connecter à l'appli.
5. Dans **Firestore Database > Données**, crée une collection `users`. Ajoute un document dont l'**ID est exactement l'email** de ce compte, avec les champs :
   - `name` (string) : ton nom
   - `role` (string) : `superadmin`

   C'est ce document qui te donne accès à la page Super Admin dès ta première connexion. Une fois connecté, tu peux ajouter les autres comptes (gérants) directement depuis cette page — mais il faudra quand même créer leur compte de connexion (étape 4) à la main pour chacun, le SDK client ne permet pas de le faire depuis l'appli.

## 2. Configurer le projet en local

```bash
npm install
cp .env.local.example .env.local
# remplis .env.local avec les valeurs copiées à l'étape 1
npm run dev
```

Ouvre http://localhost:3000, connecte-toi avec le compte créé à l'étape 1.

## 3. Déployer les règles Firestore

Avec la Firebase CLI (`npm install -g firebase-tools`) :

```bash
firebase login
firebase init firestore   # choisis le projet, garde firestore.rules
firebase deploy --only firestore:rules
```

## 4. Déployer sur Vercel

```bash
npm install -g vercel
vercel
```

Ajoute les mêmes variables d'environnement (celles de `.env.local`) dans
**Vercel > Project Settings > Environment Variables**, puis redéploie.

## Structure

```
lib/firebase.js     → connexion au projet Firebase
lib/auth.js          → contexte d'authentification (connexion/déconnexion)
lib/data.js          → toutes les fonctions Firestore (membres, paiements, tickets, accès, relances)
pages/               → une page par écran (dashboard, membres, accès, caisse, relances, login)
firestore.rules      → règles de sécurité (accès réservé aux comptes connectés)
```

## Prochaines étapes suggérées

- Ajouter la gestion des rôles (admin / réception / coach) via les "custom claims" Firebase Auth
- Brancher les vraies API Wave / Orange Money pour capturer les paiements automatiquement
- Brancher l'API WhatsApp Business pour l'envoi réel des relances (actuellement affichées, pas envoyées)
- Ajouter Firebase Storage pour les photos des membres
