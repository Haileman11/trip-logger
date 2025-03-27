# Trip Logger - ELD and Route Planning Application

A full-stack application built with Django and React that helps truck drivers plan their routes and automatically generates Electronic Logging Device (ELD) logs. This application streamlines the process of route planning, HOS compliance, and log management for commercial drivers.

## Features

### Route Planning
- Interactive map-based route planning with multiple stops
- Drag-and-drop interface for easy stop reordering
- Real-time route optimization
- Support for multiple waypoints and stops
- Distance and time calculations
- Visual route preview on map

### ELD (Electronic Logging Device) Features
- Automatic ELD log generation
- Real-time HOS (Hours of Service) compliance tracking
- Support for multiple duty statuses (driving, on-duty, off-duty, sleeper berth)
- Daily and weekly log viewing
- Log editing capabilities
- Violation alerts and warnings

### Trip Management
- Create and manage multiple trips
- Track trip progress in real-time
- Detailed trip history and analytics
- Support for multiple drivers and vehicles
- Trip status tracking (planned, in-progress, completed)

### HOS Compliance
- Automatic HOS rule enforcement
- Break and rest period tracking
- Violation detection and alerts
- Support for different HOS rulesets
- Real-time compliance status

### Fuel Management
- Fuel stop planning and optimization
- Fuel cost tracking
- Fuel efficiency monitoring
- Integration with popular fuel station networks

### User Interface
- Modern, responsive design
- Dark/light theme support
- Mobile-friendly interface
- Interactive maps with real-time updates
- Intuitive navigation and workflow

## Tech Stack

### Backend
- **Framework**: Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication
- **API Documentation**: Django REST Swagger
- **Task Queue**: Celery (for background tasks)

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit
- **UI Components**: Tailwind CSS + Shadcn UI
- **Maps**: Leaflet
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Validation**: Zod

### Development Tools
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest, React Testing Library

## Project Structure

```
trip-logger/
├── backend/           # Django backend
│   ├── api/          # REST API endpoints
│   ├── core/         # Core application logic
│   ├── config/       # Django settings
│   └── utils/        # Utility functions
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── store/      # Redux store
│   │   ├── hooks/      # Custom React hooks
│   │   ├── utils/      # Utility functions
│   │   └── types/      # TypeScript types
│   └── public/        # Static assets
└── docs/            # Documentation
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 13+
- Git

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
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 