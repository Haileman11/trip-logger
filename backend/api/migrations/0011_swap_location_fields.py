from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0010_convert_location_data'),
    ]

    operations = [
        # Remove old fields
        migrations.RemoveField(
            model_name='trip',
            name='current_location',
        ),
        migrations.RemoveField(
            model_name='trip',
            name='pickup_location',
        ),
        migrations.RemoveField(
            model_name='trip',
            name='dropoff_location',
        ),
        migrations.RemoveField(
            model_name='trip',
            name='fuel_stop',
        ),
        migrations.RemoveField(
            model_name='stop',
            name='location',
        ),
        migrations.RemoveField(
            model_name='logsheet',
            name='start_location',
        ),
        migrations.RemoveField(
            model_name='logsheet',
            name='end_location',
        ),
        
        # Rename new fields to original names
        migrations.RenameField(
            model_name='trip',
            old_name='current_location_new',
            new_name='current_location',
        ),
        migrations.RenameField(
            model_name='trip',
            old_name='pickup_location_new',
            new_name='pickup_location',
        ),
        migrations.RenameField(
            model_name='trip',
            old_name='dropoff_location_new',
            new_name='dropoff_location',
        ),
        migrations.RenameField(
            model_name='trip',
            old_name='fuel_stop_new',
            new_name='fuel_stop',
        ),
        migrations.RenameField(
            model_name='stop',
            old_name='location_new',
            new_name='location',
        ),
        migrations.RenameField(
            model_name='logsheet',
            old_name='start_location_new',
            new_name='start_location',
        ),
        migrations.RenameField(
            model_name='logsheet',
            old_name='end_location_new',
            new_name='end_location',
        ),
    ] 