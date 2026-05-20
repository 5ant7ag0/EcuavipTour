import os
import sys

# Add parent directory to path so app can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database import db
from sqlalchemy import text

def migrate():
    with app.app_context():
        print("Starting database migration for Vehiculo...")
        
        # SQL statements to add columns to the 'vehiculo' table
        queries = [
            "ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS licencia_tipo VARCHAR(100);",
            "ALTER TABLE vehiculo ADD COLUMN IF NOT EXISTS licencia_vigencia VARCHAR(100);"
        ]
        
        for q in queries:
            try:
                db.session.execute(text(q))
                db.session.commit()
                print(f"Executed: {q}")
            except Exception as e:
                db.session.rollback()
                print(f"Error executing '{q}': {str(e)}")
                
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
