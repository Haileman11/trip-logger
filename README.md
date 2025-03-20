# Trip Logger - ELD and Route Planning Application

A full-stack application built with Django and React that helps truck drivers plan their routes and automatically generates Electronic Logging Device (ELD) logs.

## Features

- Route planning with multiple stops
- ELD log generation
- Interactive map visualization
- HOS (Hours of Service) compliance tracking
- Fuel stop planning

## Tech Stack

- **Backend**: Django REST Framework
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Map API**: Mapbox (free tier)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit

## Project Structure

```
trip-logger/
├── backend/           # Django backend
│   ├── api/          # REST API endpoints
│   ├── core/         # Core application logic
│   └── config/       # Django settings
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── public/
└── docs/            # Documentation
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create `.env` files in both backend and frontend directories with the following variables:

Backend (.env):
```
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
ALLOWED_HOSTS=localhost,127.0.0.1
```

Frontend (.env):
```
VITE_API_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## License

MIT 