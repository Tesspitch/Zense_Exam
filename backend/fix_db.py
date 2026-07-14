import os
import sys
import django
from django.db import connection

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zense_core.settings')
django.setup()

def drop_if_exists():
    with connection.cursor() as cursor:
        try:
            cursor.execute("ALTER TABLE choice DROP COLUMN choice_image_url;")
            print("Dropped choice_image_url from choice")
        except Exception as e:
            print(f"choice_image_url err: {e}")
            
        try:
            cursor.execute("ALTER TABLE question DROP COLUMN qt_image_url;")
            print("Dropped qt_image_url from question")
        except Exception as e:
            print(f"qt_image_url err: {e}")

        try:
            cursor.execute("ALTER TABLE question DROP FOREIGN KEY question_group_id_fk;")
            print("Dropped FK group_id from question")
        except Exception as e:
            pass

        try:
            cursor.execute("ALTER TABLE question DROP COLUMN group_id;")
            print("Dropped group_id from question")
        except Exception as e:
            print(f"group_id err: {e}")
            
        try:
            cursor.execute("DROP TABLE IF EXISTS question_group;")
            print("Dropped question_group table")
        except Exception as e:
            print(f"question_group err: {e}")

if __name__ == '__main__':
    drop_if_exists()
