from app import app
from flask_jwt_extended import create_access_token
import json
from urllib import request

with app.app_context():
    token = create_access_token(identity="1")
    
req = request.Request("http://127.0.0.1:5000/api/admin/pagos_pendientes")
req.add_header("Authorization", f"Bearer {token}")
try:
    with request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
