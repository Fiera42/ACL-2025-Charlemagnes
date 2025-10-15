# acl-2025-charlemagnes
## About
Projet d'intégration en M1 de l'équipe "les charlemagnes" :
- COLLIN Alex (SkyPurl)
- GEORGES Valerian (GamersOD)
- GESNEL Kerrian (KerrianG)
- NAIGEON Adrien (Fiera42)
- TOUSSAINT Jarod (Jarodlp)

## Getting Started

Download dependencies with `npm install` (make sure that npm is up to date if you have any issue)

Run the server with `npm start`, the page will be available at `http://localhost:3000`

## Help

### Routes

Toutes les routes API sont préfixées par `/api`.

### Routes d'Authentification (`/api/auth`)

| Méthode | Route | Description | Body | Réponse |
|---------|-------|-------------|------|---------|
| `POST` | `/api/auth/register` | Inscription d'un nouvel utilisateur | `{ email, password, username }` | Utilisateur créé (201) |
| `POST` | `/api/auth/login` | Connexion d'un utilisateur | `{ email, password }` | Token JWT + infos utilisateur (200) |
| `GET` | `/api/auth/logout` | Déconnexion d'un utilisateur | - | Message de confirmation (200) |

**Exemple - Inscription :**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "username": "John Doe"
}
```

---

### Routes des Calendriers (`/api/calendar`)

**Note:** Toutes ces routes nécessitent un token d'authentification dans le header `Authorization: Bearer <token>`

#### Gestion des Calendriers

| Méthode | Route | Description | Body | Réponse |
|---------|-------|-------------|------|---------|
| `GET` | `/api/calendar/` | Récupérer tous les calendriers de l'utilisateur connecté | - | Liste des calendriers (200) |
| `POST` | `/api/calendar/` | Créer un nouveau calendrier | `{ name, description, color }` | Calendrier créé (201) |
| `GET` | `/api/calendar/:id` | Récupérer un calendrier spécifique par son ID | - | Détails du calendrier (200) |
| `PUT` | `/api/calendar/:id` | Mettre à jour un calendrier | `{ name?, description?, color? }` | Calendrier mis à jour (200) |
| `DELETE` | `/api/calendar/:id` | Supprimer un calendrier | - | Message de confirmation (200) |

**Exemple - Créer un calendrier :**
```json
POST /api/calendar/
{
  "name": "Calendrier Personnel",
  "description": "Mon calendrier personnel",
  "color": "#FF5733"
}
```

#### Partage de Calendriers

| Méthode | Route | Description | Body | Réponse |
|---------|-------|-------------|------|---------|
| `POST` | `/api/calendar/:id/share` | Partager un calendrier avec un autre utilisateur | `{ sharedToId }` | Message de confirmation (200) |
| `DELETE` | `/api/calendar/:id/share/:sharedToId` | Arrêter le partage d'un calendrier | - | Message de confirmation (200) |

**Exemple - Partager un calendrier :**
```json
POST /api/calendar/1/share
{
  "sharedToId": "user-uuid-456"
}
```

---

### Routes des Rendez-vous (`/api/calendar`)

#### Gestion des Rendez-vous par Calendrier

| Méthode | Route | Description | Body | Réponse |
|---------|-------|-------------|------|---------|
| `GET` | `/api/calendar/:calendarId/appointments` | Récupérer tous les rendez-vous d'un calendrier | - | Liste des rendez-vous (200) |
| `POST` | `/api/calendar/:calendarId/appointments` | Créer un rendez-vous (simple ou récurrent) | `{ title, description, startDate, endDate, recursionRule? }` | Rendez-vous créé (201) |

**Exemple - Créer un rendez-vous simple :**
```json
POST /api/calendar/1/appointments
{
  "title": "Réunion d'équipe",
  "description": "Réunion hebdomadaire",
  "startDate": "2024-01-15T10:00:00.000Z",
  "endDate": "2024-01-15T11:00:00.000Z"
}
```

**Exemple - Créer un rendez-vous récurrent :**
```json
POST /api/calendar/1/appointments
{
  "title": "Réunion hebdomadaire",
  "description": "Tous les lundis",
  "startDate": "2024-01-15T10:00:00.000Z",
  "endDate": "2024-01-15T11:00:00.000Z",
  "recursionRule": {
    "frequency": "WEEKLY",
    "interval": 1,
    "until": "2024-12-31T00:00:00.000Z"
  }
}
```

#### Gestion des Rendez-vous Individuels

| Méthode | Route | Description | Body | Réponse |
|---------|-------|-------------|------|---------|
| `GET` | `/api/calendar/appointments/:id` | Récupérer un rendez-vous spécifique | - | Détails du rendez-vous (200) |
| `PUT` | `/api/calendar/appointments/:id` | Mettre à jour un rendez-vous | `{ title?, description?, startDate?, endDate?, recursionRule? }` | Rendez-vous mis à jour (200) |
| `DELETE` | `/api/calendar/appointments/:id` | Supprimer un rendez-vous | - | Message de confirmation (200) |

**Exemple - Modifier un rendez-vous :**
```json
PUT /api/calendar/appointments/1
{
  "title": "Réunion reportée",
  "startDate": "2024-01-15T14:00:00.000Z",
  "endDate": "2024-01-15T15:00:00.000Z"
}
```

#### Partage de Rendez-vous

| Méthode | Route | Description | Body | Réponse |
|---------|-------|-------------|------|---------|
| `POST` | `/api/calendar/appointments/:id/share` | Partager un rendez-vous avec un autre utilisateur | `{ sharedToId }` | Message de confirmation (200) |
| `DELETE` | `/api/calendar/appointments/:id/share/:sharedToId` | Arrêter le partage d'un rendez-vous | - | Message de confirmation (200) |

---

### Routes de Détection de Conflits (`/api/calendar/conflicts`)

| Méthode | Route | Description | Réponse |
|---------|-------|-------------|---------|
| `GET` | `/api/calendar/conflicts/user` | Récupérer tous les conflits de rendez-vous de l'utilisateur connecté | Liste des conflits (200) |
| `GET` | `/api/calendar/conflicts/:calendarId` | Récupérer les conflits d'un calendrier spécifique | Liste des conflits (200) |

**Exemple de réponse - Conflits :**
```json
{
  "conflicts": [
    {
      "appointmentA": {
        "id": "1",
        "title": "Réunion 1",
        "startDate": "2024-01-15T10:00:00.000Z",
        "endDate": "2024-01-15T11:00:00.000Z"
      },
      "appointmentB": {
        "id": "2",
        "title": "Réunion 2",
        "startDate": "2024-01-15T10:30:00.000Z",
        "endDate": "2024-01-15T11:30:00.000Z"
      }
    }
  ]
}
```

---

## Authentification

Toutes les routes (sauf `/api/auth/*`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <votre_token_jwt>
```

Le token est obtenu lors de la connexion via `/api/auth/login`.

## Version History

* 0.1
    * **Affichage mensuelle du calendrier** : Création de l'interface utilisateur pour afficher le calendrier.
    * **Ajouter des rendez-vous** : Permet à l'utilisateur d'ajouter des rendez-vous à un agenda.
    * **Supprimer des rendez-vous** : Permet à l'utilisateur de supprimer des rendez-vous d'un agenda.
    * **Modifier des rendez-vous** : Permet à l'utilisateur de modifier les détails d'un rendez-vous (titre, plage horaire, description).
    * Mise en place du serveur et de la base de données persistante