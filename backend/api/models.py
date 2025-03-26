from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

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

class Location(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    street_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.street_name or f'Location at {self.latitude}, {self.longitude}'}"

    class Meta:
        unique_together = ('latitude', 'longitude')

class Trip(models.Model):
    STATUS_CHOICES = [
        ("planned", "Planned"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    current_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="current_trips")
    pickup_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="pickup_trips")
    dropoff_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="dropoff_trips")
    fuel_stop = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="fuel_stop_trips")
    current_cycle_hours = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")
    route = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trip {self.id} - {self.status}"

class Stop(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("skipped", "Skipped"),
    ]

    STOP_TYPE_CHOICES = [
        ("pickup", "Pickup"),
        ("dropoff", "Dropoff"),
        ("fuel", "Fuel"),
        ("rest", "Rest"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops")
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    sequence = models.IntegerField()
    summary = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    stop_type = models.CharField(max_length=20, choices=STOP_TYPE_CHOICES)
    arrival_time = models.DateTimeField()
    duration_minutes = models.IntegerField()
    cycle_hours_at_stop = models.FloatField()
    distance_from_last_stop = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.stop_type} Stop {self.sequence} - {self.status}"

class DutyStatusChange(models.Model):
    STATUS_CHOICES = [
        ("offDuty", "Off Duty"),
        ("sleeper", "Sleeper Berth"),
        ("driving", "Driving"),
        ("onDuty", "On Duty (Not Driving)"),
    ]

    log_sheet = models.ForeignKey('LogSheet', on_delete=models.CASCADE, related_name='duty_status_changes')
    time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    label = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['time']

    def __str__(self):
        return f"{self.status} at {self.time}"

class LogSheet(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="log_sheets")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    start_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="log_start_locations")
    end_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="log_end_locations")
    start_cycle_hours = models.FloatField()
    end_cycle_hours = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    total_miles_driving = models.FloatField(default=0)
    vehicle_numbers = models.CharField(max_length=255, blank=True)
    carrier_name = models.CharField(max_length=255, blank=True)
    carrier_address = models.TextField(blank=True)
    driver_name = models.CharField(max_length=255, blank=True)
    remarks = models.JSONField(default=list)  # List of {time: string, location: string}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Log Sheet {self.id} - {self.status}"

    def calculate_duty_hours(self):
        """Calculate total hours for each duty status"""
        hours = {
            "offDuty": 0,
            "sleeper": 0,
            "driving": 0,
            "onDuty": 0,
        }

        changes = self.duty_status_changes.all().order_by('time')
        for i in range(len(changes) - 1):
            current = changes[i]
            next_change = changes[i + 1]
            duration = (next_change.time - current.time).total_seconds() / 3600  # Convert to hours
            hours[current.status] += duration

        return hours
