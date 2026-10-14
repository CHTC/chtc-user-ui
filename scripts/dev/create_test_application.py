#!/usr/bin/env python3
"""
Create a pending user application on the dev API for manual UI testing.

Creates only (never deletes): a throwaway inactive "ZZ Test" user, a "ZZ Test Project"
(reused if it already exists), and a pending application filed as that user.

SECRET_KEY / LOGIN_TOKEN / CSRF_TOKEN are read from .env at runtime and never printed.
Needs PyJWT + httpx, e.g. run with the API repo's venv:

    ../chtc-user-app-api/.venv/bin/python scripts/dev/create_test_application.py [--email addr]
"""
import argparse
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import jwt

API = "https://userapp.chtcdev.chtc.io/api"
UI = "http://localhost:3600"
PROJECT_NAME = "ZZ Test Project"


def load_env(path: Path) -> dict[str, str]:
    env = {}
    for line in path.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def mint(secret: str, **claims) -> str:
    claims["exp"] = datetime.now(timezone.utc) + timedelta(hours=1)
    return jwt.encode(claims, secret, algorithm="HS256")


def client_for(login_token: str, csrf_token: str) -> httpx.Client:
    return httpx.Client(
        base_url=API,
        cookies={"login_token": f"Bearer {login_token}", "csrf_token": csrf_token},
        headers={"X-Csrf-Token": csrf_token},
        timeout=30,
    )


def check(response: httpx.Response, expected: int, what: str):
    if response.status_code != expected:
        sys.exit(f"{what} failed: {response.status_code} {response.text}")
    return response.json()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--env", default=str(Path(__file__).resolve().parents[2] / ".env"))
    parser.add_argument("--email", help="applicant email (default: unreachable example.com address)")
    args = parser.parse_args()

    env = load_env(Path(args.env))
    secret = env["SECRET_KEY"]
    suffix = time.strftime("%Y%m%d-%H%M%S")
    email = args.email or f"zz-test-{suffix}@example.com"

    admin = client_for(env["LOGIN_TOKEN"], env["CSRF_TOKEN"])

    # Project (reuse if present)
    found = check(admin.get("/projects", params={"name": f"eq.{PROJECT_NAME}"}), 200, "project lookup")
    if found:
        project = found[0]
    else:
        project = check(
            admin.post("/projects", json={"name": PROJECT_NAME, "accounting_group": "zz_test"}), 201, "project create"
        )

    # Inactive applicant (pending forms can only be filed by inactive users)
    user = check(
        admin.post(
            "/users",
            json={
                "name": f"ZZ Test {suffix}",
                "username": f"zztest{suffix}",
                "email1": email,
                "active": False,
                "primary_project_id": project["id"],
                "primary_project_role": "MEMBER",
            },
        ),
        201,
        "user create",
    )

    # File the application as that user
    session_id = f"zz-test-{suffix}"
    applicant = client_for(
        mint(secret, user_id=user["id"], is_admin=False, type="login", session_id=session_id),
        mint(secret, random_value="csrf-protection", session_id=session_id, type="csrf"),
    )
    form = check(
        applicant.post(
            "/forms/user-applications",
            json={
                "position": "STAFF",
                "pi_name": "ZZ Test PI",
                "pi_email": "zz-test-pi@example.com",
                "department": "ZZ Test Department",
                "computing_type": "HTC",
                "how_chtc_can_help": "Manual UI test for the post-approval project link",
            },
        ),
        201,
        "application create",
    )

    print(f"user id:        {user['id']} ({user['name']})")
    print(f"project id:     {project['id']} ({project['name']})")
    print(f"application id: {form['id']}")
    print(f"review URL:     {UI}/forms/user-applications/edit/?id={form['id']}")
    print(f"expected link:  {UI}/projects/edit/?id=<id of the project you select>")


if __name__ == "__main__":
    main()
