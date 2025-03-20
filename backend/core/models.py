from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Trip(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    current_location = models.JSONField(help_text='JSON containing latitude and longitude')
    pickup_location = models.JSONField(help_text='JSON containing latitude and longitude')
    dropoff_location = models.JSONField(help_text='JSON containing latitude and longitude')
    current_cycle_hours = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(70)],
        help_text='Current cycle hours used (0-70)'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trip {self.id} - {self.status}"

class LogSheet(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='log_sheets')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    total_hours = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(24)],
        help_text='Total hours for this log sheet (0-24)'
    )
    log_data = models.JSONField(help_text='JSON containing the log sheet data')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Log Sheet for Trip {self.trip.id} - {self.date}"

class Stop(models.Model):
    STOP_TYPE_CHOICES = [
        ('rest', 'Rest Stop'),
        ('fuel', 'Fuel Stop'),
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    location = models.JSONField(help_text='JSON containing latitude and longitude')
    stop_type = models.CharField(max_length=20, choices=STOP_TYPE_CHOICES)
    planned_arrival = models.DateTimeField()
    planned_departure = models.DateTimeField()
    actual_arrival = models.DateTimeField(null=True, blank=True)
    actual_departure = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.stop_type} at {self.location} for Trip {self.trip.id}"
