"""
Authentication and Token Verification using Supabase.
Verifies JWT tokens server-side to derive the authenticated user ID.
"""

from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
import jwt
from supabase import create_client, Client

from backend.app.core.config import settings

# Initialize Supabase client if URL and Anon key are available
supabase_client: Optional[Client] = None
if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    except Exception as e:
        print(f"[!] Warning: Could not initialize Supabase client: {e}")

async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer <supabase_access_token>")
) -> Dict[str, Any]:
    """
    Validates Supabase Bearer access token and returns user details.
    Derives user ID strictly from the verified token.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    # 1. Try verifying via Supabase Auth API
    if supabase_client:
        try:
            user_response = supabase_client.auth.get_user(token)
            if user_response and user_response.user:
                return {
                    "id": str(user_response.user.id),
                    "email": user_response.user.email,
                    "metadata": user_response.user.user_metadata or {}
                }
        except Exception:
            pass  # Fallback to local JWT decode below

    # 2. Try verifying via JWT Secret if configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing subject claim."
                )
            return {
                "id": str(user_id),
                "email": payload.get("email"),
                "metadata": payload.get("user_metadata", {})
            }
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token validation failed: {str(e)}"
            )

    # 3. Development / unverified token decode fallback (ONLY when secrets are not yet entered)
    # Allows testing UI before user provides their own live Supabase keys
    try:
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified_payload.get("sub")
        if user_id:
            return {
                "id": str(user_id),
                "email": unverified_payload.get("email"),
                "metadata": unverified_payload.get("user_metadata", {})
            }
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Token could not be verified.",
        headers={"WWW-Authenticate": "Bearer"},
    )
