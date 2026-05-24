import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type SiteImageKey = "home_hero" | "home_editorial" | "auth_side";

export type SiteImage = {
  key: SiteImageKey;
  url: string;
  alt: string;
};

export async function fetchSiteImages(): Promise<Record<SiteImageKey, SiteImage>> {
  const { data, error } = await supabase
    .from("site_imagenes")
    .select("key, url, alt");
  if (error) throw error;
  const map = {} as Record<SiteImageKey, SiteImage>;
  (data ?? []).forEach((row) => {
    map[row.key as SiteImageKey] = row as SiteImage;
  });
  return map;
}

export async function updateSiteImage(key: SiteImageKey, patch: { url?: string; alt?: string }) {
  const { error } = await supabase
    .from("site_imagenes")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) throw error;
}

export const siteImagesQueryOptions = () =>
  queryOptions({
    queryKey: ["site_imagenes"],
    queryFn: fetchSiteImages,
  });
