from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

# Create your models here.

class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=30)
    last_name = models.CharField(_('last name'), max_length=30)
    
    # Fix reverse accessor conflicts
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name='custom_user_set',
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name='custom_user_set',
        related_query_name='custom_user',
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

class Trip(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips', null=True)
    current_location = models.JSONField()
    pickup_location = models.JSONField()
    dropoff_location = models.JSONField()
    current_cycle_hours = models.FloatField()
    status = models.CharField(max_length=20, default='pending')
    route = models.JSONField(null=True, blank=True)  # Store OSRM route data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trip {self.id} - {self.status}"

class Stop(models.Model):
    STOP_TYPES = [
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
        ('rest', 'Rest Stop'),
        ('fuel', 'Fuel Stop'),
    ]

    trip = models.ForeignKey(Trip, related_name='stops', on_delete=models.CASCADE)
    location = models.JSONField()
    sequence = models.IntegerField()
    arrival_time = models.DateTimeField(null=True, blank=True)
    departure_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='pending')
    stop_type = models.CharField(max_length=10, choices=STOP_TYPES, default='pickup')
    duration_minutes = models.IntegerField(default=0)  # Duration of the stop
    cycle_hours_at_stop = models.FloatField(null=True, blank=True)  # Hours in cycle when arriving at stop
    distance_from_last_stop = models.FloatField(null=True, blank=True)  # Distance in miles from previous stop
    summary = models.TextField(null=True, blank=True)  # Summary of the leg
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sequence']

    def __str__(self):
        return f"{self.get_stop_type_display()} {self.sequence} - Trip {self.trip.id}"

class LogSheet(models.Model):
    trip = models.ForeignKey(Trip, related_name='log_sheets', on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    start_location = models.JSONField()
    end_location = models.JSONField(null=True, blank=True)
    start_cycle_hours = models.FloatField()
    end_cycle_hours = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Log Sheet {self.id} - Trip {self.trip.id}"
