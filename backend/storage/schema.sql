CREATE TABLE IF NOT EXISTS public.quizzup_storage_meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.quizzup_storage_stores (
  name text PRIMARY KEY,
  layout text NOT NULL,
  revision bigint NOT NULL DEFAULT 1,
  hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quizzup_storage_entities (
  store_name text NOT NULL REFERENCES public.quizzup_storage_stores(name),
  key_hash text NOT NULL,
  entity_key text NOT NULL,
  payload jsonb NOT NULL,
  encoded boolean NOT NULL DEFAULT false,
  digest text NOT NULL,
  PRIMARY KEY (store_name, key_hash)
);
