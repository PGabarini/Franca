-- Convert productos.color from text to text[]
ALTER TABLE public.productos
  ALTER COLUMN color DROP DEFAULT;

ALTER TABLE public.productos
  ALTER COLUMN color TYPE text[]
  USING CASE
    WHEN color IS NULL OR btrim(color) = '' THEN '{}'::text[]
    ELSE ARRAY[btrim(color)]
  END;

ALTER TABLE public.productos
  ALTER COLUMN color SET DEFAULT '{}'::text[],
  ALTER COLUMN color SET NOT NULL;