import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trip_logger.settings')

application = get_wsgi_application()

# Vercel specific
app = application 