# Generated by Django 4.2.10 on 2025-03-24 19:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_stop_cycle_hours_at_stop_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='trip',
            name='route',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
