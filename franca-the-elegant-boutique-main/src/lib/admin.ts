import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  claimFirstAdminServer,
  getAdminStatusServer,
  promoteUserToAdminServer,
} from "@/server/admin.functions";
import { getAccessToken } from "@/lib/auth-headers";

type AdminStatus = { isAdmin: boolean; adminCount: number | null };

const adminStatusCache = new Map<string, AdminStatus>();
const adminStatusRequests = new Map<string, Promise<AdminStatus>>();

async function loadAdminStatus(userId: string) {
  const existing = adminStatusRequests.get(userId);
  if (existing) return existing;

  const request = (async () => {
    const accessToken = await getAccessToken();
    const status = await getAdminStatusServer({ data: { accessToken } });
    const normalized = { isAdmin: status.isAdmin, adminCount: status.adminCount };
    adminStatusCache.set(userId, normalized);
    return normalized;
  })().finally(() => adminStatusRequests.delete(userId));

  adminStatusRequests.set(userId, request);
  return request;
}

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    let cancel = false;

    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setAdminCount(null);
      setChecked(true);
      return;
    }

    const cached = adminStatusCache.get(user.id);
    if (cached) {
      setIsAdmin(cached.isAdmin);
      setAdminCount(cached.adminCount);
      setChecked(true);
    } else {
      setChecked(false);
    }

    (async () => {
      try {
        const status = await loadAdminStatus(user.id);
        if (cancel) return;
        setIsAdmin(status.isAdmin);
        setAdminCount(status.adminCount);
      } catch (error) {
        if (cancel) return;
        console.error("[useIsAdmin] error validando admin:", error);
        setIsAdmin(false);
        setAdminCount(null);
      } finally {
        if (!cancel) setChecked(true);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [userId, authLoading]);

  return { isAdmin, adminCount, loading: authLoading || (!!userId && !checked) };
}

export async function claimFirstAdmin() {
  return claimFirstAdminServer({ data: { accessToken: await getAccessToken() } });
}

export async function promoteUserToAdmin(email: string) {
  return promoteUserToAdminServer({ data: { email, accessToken: await getAccessToken() } });
}
