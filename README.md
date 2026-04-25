# Faculty Evaluation Reporting System

A comprehensive system for tracking faculty performance, course evaluations, and providing AI-generated insights for faculty development and academic supervision.

## Tech Stack
- **Backend**: Django, Django REST Framework
- **Frontend**: React (Vite), Material UI, Framer Motion
- **Database**: PostgreSQL (Production), SQLite (Development)
- **AI**: Google Gemini 1.5 Flash (via `google-generativeai`)

---

## Deployment Instructions (Ubuntu VM)

### 1. Prerequisites
Update your system and install necessary packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git nodejs npm nginx postgresql postgresql-contrib libpq-dev
```

### 2. Database Setup (PostgreSQL)
Create a database and user for the application:
```bash
sudo -u postgres psql
```
Inside the psql shell:
```sql
CREATE DATABASE faculty_db;
CREATE USER faculty_user WITH PASSWORD 'your_strong_password';
ALTER ROLE faculty_user SET client_encoding TO 'utf8';
ALTER ROLE faculty_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE faculty_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE faculty_db TO faculty_user;
\q
```

### 3. Clone the Repository
```bash
git clone <your-repo-url>
cd facultyreport
```

### 4. Backend Setup
Create a virtual environment and install dependencies:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Set up your `.env` file:
```bash
cp .env.example .env  # Or create one manually
nano .env
```
Ensure you add:
- `GEMINI_API_KEY`
- `DB_NAME=faculty_db`
- `DB_USER=faculty_user`
- `DB_PASSWORD=your_strong_password`
- `DB_HOST=localhost`
- `DB_PORT=5432`

Run migrations and collect static files:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 4. Frontend Setup
Install dependencies and build the production bundle:
```bash
cd ../frontend
npm install
npm run build
```
This will create a `dist` folder.

### 5. Nginx Configuration
Configure Nginx to serve the frontend and proxy API requests to Gunicorn.
Create a new config:
```bash
sudo nano /etc/nginx/sites-available/facultyreport
```
Paste the following (adjust paths and domain):
```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # Frontend
    location / {
        root /home/ubuntu/facultyreport/frontend/dist;
        index index.html;
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Admin and Static
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location /static/ {
        alias /home/ubuntu/facultyreport/backend/staticfiles/;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/facultyreport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Running the Backend with Gunicorn
Install gunicorn in your venv:
```bash
pip install gunicorn
```
Start the server (use `systemd` for production):
```bash
gunicorn --bind 127.0.0.1:8000 core.wsgi:application
```

---

## Features
- **Multi-Role Support**: Admins, Managers, Faculty, and Supervisors.
- **AI Analytics**: Integrated Gemini AI for mentorship and programmatic strategy.
- **Data Visualization**: Real-time evaluation metrics and historical tracking.
- **Search & Filter**: Powerful filtering by semester, year, and course code.
