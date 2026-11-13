#!/usr/bin/env python3
"""
Generate LOGIN_TOKEN and CSRF_TOKEN for development environment.
Tokens are JWT-encoded and written to $TOKENS_FILE, which nginx loads at startup.
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

    secret_key = os.environ["SECRET_KEY"]

    encoded_jwt = jwt.encode(
        to_encode, secret_key, algorithm="HS256"
    )
    return encoded_jwt


def write_tokens_file(tokens_path: Path, login_token: str, csrf_token: str):
    """Write the tokens where nginx's entrypoint sources them, replacing any earlier ones"""

    tokens_path.write_text(f'LOGIN_TOKEN={login_token}\nCSRF_TOKEN={csrf_token}\n')
    print(f"✓ Generated tokens written to {tokens_path}")


def main():
    # Create a synthetic session id for this test client
    session_id = "test-session-admin"

    # Generate LOGIN_TOKEN with extended expiry for dev
    login_token = create_login_token(
        expires_delta=timedelta(days=30),
        user_id=4,
        is_admin=True,
        type="login",
        session_id=session_id,
    )

    # Generate CSRF_TOKEN with extended expiry for dev
    csrf_token = create_login_token(
        expires_delta=timedelta(days=30),
        random_value="csrf-protection",
        session_id=session_id,
        type="csrf"
    )

    print(f"LOGIN_TOKEN: {login_token[:50]}...")
    print(f"CSRF_TOKEN: {csrf_token[:50]}...")

    write_tokens_file(Path(os.environ["TOKENS_FILE"]), login_token, csrf_token)


if __name__ == "__main__":
    main()

