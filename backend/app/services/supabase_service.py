"""
Database Service interacting with Supabase PostgreSQL and RLS.
Provides methods to save, query, and delete prediction records for authenticated users.
Includes resilient fallback when local keys are being configured.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from supabase import create_client, Client
from backend.app.core.config import settings

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self._local_fallback_history: List[Dict[str, Any]] = []

        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            except Exception as e:
                print(f"[!] Supabase client initialization error: {e}")
                self.client = None

    def save_prediction(
        self,
        user_id: str,
        predicted_class: str,
        confidence: float,
        probabilities: Dict[str, float],
        model_version: str = "1.0.0",
        user_access_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Saves a prediction record for the verified user.
        Uses authenticated user client if token provided (enforcing RLS), or fallback client.
        """
        record_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        record = {
            "id": record_id,
            "user_id": user_id,
            "predicted_class": predicted_class,
            "confidence": float(confidence),
            "probabilities": probabilities,
            "model_version": model_version,
            "created_at": created_at
        }

        # If user access token is provided, create a scoped client to enforce RLS
        client_to_use = self.client
        if user_access_token and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                user_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                user_client.postgrest.auth(user_access_token)
                client_to_use = user_client
            except Exception:
                client_to_use = self.client

        if client_to_use:
            try:
                res = client_to_use.table("predictions").insert(record).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[!] Warning: Failed to insert prediction to Supabase: {e}. Storing locally.")

        # Resilient fallback storage
        self._local_fallback_history.append(record)
        return record

    def get_user_history(
        self,
        user_id: str,
        user_access_token: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves prediction history for the authenticated user.
        """
        client_to_use = self.client
        if user_access_token and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                user_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                user_client.postgrest.auth(user_access_token)
                client_to_use = user_client
            except Exception:
                client_to_use = self.client

        if client_to_use:
            try:
                res = client_to_use.table("predictions") \
                    .select("*") \
                    .eq("user_id", user_id) \
                    .order("created_at", desc=True) \
                    .execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                print(f"[!] Warning: Failed to fetch predictions from Supabase: {e}")

        # Return matching local fallback records
        return [r for r in self._local_fallback_history if r["user_id"] == user_id]

    def get_prediction_by_id(
        self,
        prediction_id: str,
        user_id: str,
        user_access_token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single prediction record by ID, verifying ownership.
        """
        client_to_use = self.client
        if user_access_token and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                user_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                user_client.postgrest.auth(user_access_token)
                client_to_use = user_client
            except Exception:
                client_to_use = self.client

        if client_to_use:
            try:
                res = client_to_use.table("predictions") \
                    .select("*") \
                    .eq("id", prediction_id) \
                    .eq("user_id", user_id) \
                    .execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[!] Warning: Failed to fetch prediction {prediction_id}: {e}")

        for r in self._local_fallback_history:
            if r["id"] == prediction_id and r["user_id"] == user_id:
                return r
        return None

    def delete_prediction(
        self,
        prediction_id: str,
        user_id: str,
        user_access_token: Optional[str] = None
    ) -> bool:
        """
        Deletes a prediction record owned by the authenticated user.
        """
        client_to_use = self.client
        if user_access_token and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                user_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                user_client.postgrest.auth(user_access_token)
                client_to_use = user_client
            except Exception:
                client_to_use = self.client

        if client_to_use:
            try:
                res = client_to_use.table("predictions") \
                    .delete() \
                    .eq("id", prediction_id) \
                    .eq("user_id", user_id) \
                    .execute()
                return True
            except Exception as e:
                print(f"[!] Warning: Failed to delete prediction from Supabase: {e}")

        # Remove from local fallback
        initial_len = len(self._local_fallback_history)
        self._local_fallback_history = [
            r for r in self._local_fallback_history
            if not (r["id"] == prediction_id and r["user_id"] == user_id)
        ]
        return len(self._local_fallback_history) < initial_len

# Global instance
db_service = SupabaseService()
