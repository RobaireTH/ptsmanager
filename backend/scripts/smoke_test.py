from fastapi.testclient import TestClient
from app.main import app
import json

# Simple smoke test: create admin (idempotent), login, and hit protected endpoint

def main():
    with TestClient(app) as client:
        # Health check
        r = client.get("/health")
        r.raise_for_status()

        # Try to create admin (ignore 400 if already exists)
        create_payload = {
            "name": "Admin",
            "email": "admin@example.com",
            "role": "admin",
            "password": "Admin123",
        }
        r = client.post("/api/users/", json=create_payload)
        if r.status_code not in (200, 201, 400, 403):
            r.raise_for_status()

        # Request verification and verify (dev flow returns token)
        r = client.post("/api/auth/request-email-verification", json={"email": "admin@example.com"})
        r.raise_for_status()
        verification_token = r.json().get("verification_token")
        if verification_token:
            rv = client.post("/api/auth/verify-email", json={"token": verification_token})
            rv.raise_for_status()

        # Login (if fails, reset password in dev mode)
        r = client.post("/api/auth/login", json={
            "email": "admin@example.com",
            "password": "Admin123",
        })
        if r.status_code == 401:
            fr = client.post("/api/auth/forgot-password", json={"email": "admin@example.com"})
            fr.raise_for_status()
            reset_token = fr.json().get("reset_token")
            if reset_token:
                rr = client.post("/api/auth/reset-password", json={"token": reset_token, "new_password": "Admin123"})
                rr.raise_for_status()
                r = client.post("/api/auth/login", json={
                    "email": "admin@example.com",
                    "password": "Admin123",
                })
        r.raise_for_status()
        token = r.json()["access_token"]

        # Me
        r = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        me = r.json()

        print(json.dumps({"login_ok": True, "me": me}))


if __name__ == "__main__":
    main()

