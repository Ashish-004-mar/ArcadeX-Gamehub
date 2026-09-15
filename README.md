# GameHub

GameHub is a Flask + MySQL gaming platform. MySQL stores the central game catalog and categories; player accounts, favorites, recently played games, activity, and player profile data stay in the user's browser storage.

## Project structure

```text
GameHub/
├── app.py
├── config.py
├── database.py
├── requirements.txt
├── Procfile
├── runtime.txt
├── .env.example
├── .gitignore
├── database/
│   └── gamehub_db.sql
├── routes/
├── templates/
├── static/
└── README.md
```

## Local setup

1. Create the MySQL database by importing `database/gamehub_db.sql`.
2. Create a `.env` file from `.env.example` and fill in your MySQL credentials plus a strong `SECRET_KEY` and admin credentials.
3. Create and activate a virtual environment.
4. Install packages:

```bash
pip install -r requirements.txt
```

5. Start Flask:

```bash
python app.py
```

Open `http://127.0.0.1:5000`.

## Authentication model

Normal player accounts are stored only in the browser using LocalStorage. No users table is created in MySQL. Deleting a player account removes the account record, current login session, favorites, recently played data, activity history, and related browser-stored player data.

The administrator account is authenticated server-side from `.env`. An administrator can also use GameHub as a player; their player favorites and history use a separate browser-local admin-player identity and do not create a database user.

## Admin features

Admin can manage games and categories, activate/deactivate content, search/filter the catalog, customize the home page, and publish time-limited marquee announcements.

Games use a single `embed_url`. The play page loads the URL in a responsive iframe after player authentication. The player overlay provides fullscreen and exit controls.

## Deployment

For Render-style deployment, connect the repository and use the included `Procfile`:

```text
web: gunicorn app:app
```

Add these environment variables in the hosting dashboard (never commit `.env`):

```text
SECRET_KEY
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
ADMIN_EMAIL
ADMIN_PASSWORD
```

The repository `.gitignore` excludes `.env`, virtual environments, Python cache files, editor files, logs, and deployment cache directories.
