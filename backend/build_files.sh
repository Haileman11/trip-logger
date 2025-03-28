#!/bin/bash
pip install -r requirements.txt
python manage.py collectstatic --noinput
# Ensure the project structure is correct
mkdir -p trip_logger
cp -r trip_logger/* trip_logger/ 