#! /bin/bash

sh /app/init_database.sh
source .env/bin/activate
pip install -r requirements.txt
pip install tzdata

while ! psql -U "$DB_USER" -d "postgres" -c '\q'; do
	>&2 echo "Postgres is unavailable - sleeping"
	sleep 5
done
python3 /app/auth_service/manage.py makemigrations
python3 /app/auth_service/manage.py migrate
# echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('$DB_USER', 'admin@example.com', '$DB_USER')" | python3 /app/auth_service/manage.py shell && echo "Superuser created successfully."
python3 /app/auth_service/manage.py runserver 0.0.0.0:8000