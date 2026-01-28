#!/usr/bin/env python3
"""
Generate LOGIN_TOKEN and CSRF_TOKEN for development environment.
Tokens are JWT-encoded and written to .env file.
"""
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import jwt
except ImportError:
    print("Installing PyJWT...", file=sys.stderr)
    os.system(f"{sys.executable} -m pip install -q PyJWT")
    import jwt


def create_login_token(expires_delta: timedelta | None = None, **data):
    """Create a JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=60 * 8)
    to_encode.update({"exp": expire})

    # Use a dev secret key if not set
    secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

    encoded_jwt = jwt.encode(
        to_encode, secret_key, algorithm="HS256"
    )
    return encoded_jwt


def update_env_file(env_path: Path, login_token: str, csrf_token: str):
    """Update .env file with generated tokens"""

    # Read existing .env file
    if env_path.exists():
        with open(env_path, 'r') as f:
            lines = f.readlines()
    else:
        lines = []

    # Remove existing token lines
    lines = [line for line in lines if not line.startswith('LOGIN_TOKEN=') and not line.startswith('CSRF_TOKEN=')]

    # Add new tokens
    lines.append(f'\n# Auto-generated tokens (regenerate with: docker compose run --rm setup)\n')
    lines.append(f'LOGIN_TOKEN={login_token}\n')
    lines.append(f'CSRF_TOKEN={csrf_token}\n')

    # Write back to .env
    with open(env_path, 'w') as f:
        f.writelines(lines)

    print(f"✓ Generated tokens written to {env_path}")


def main():
    # Generate LOGIN_TOKEN with extended expiry for dev
    login_token = create_login_token(
        expires_delta=timedelta(days=30),
        user_id=1,
        username="dev_user",
        type="login"
    )

    # Generate CSRF_TOKEN with extended expiry for dev
    csrf_token = create_login_token(
        expires_delta=timedelta(days=30),
        type="csrf"
    )

    print(f"LOGIN_TOKEN: {login_token[:50]}...")
    print(f"CSRF_TOKEN: {csrf_token[:50]}...")

    # Update .env file in working directory
    env_path = Path.cwd() / 'dev.env'
    update_env_file(env_path, login_token, csrf_token)


if __name__ == "__main__":
    main()

