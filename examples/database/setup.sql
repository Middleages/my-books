\set ON_ERROR_STOP on
-- Run only after confirming an empty, disposable PostgreSQL 18 source database.
-- The name check is a mistake guard, NOT proof of isolation or authorization.
DO $$ BEGIN
  IF current_database() <> 'db_book_source' THEN
    RAISE EXCEPTION 'Expected the approved disposable db_book_source database';
  END IF;
END; $$;
BEGIN;
SET LOCAL TIME ZONE 'UTC';
\ir schema.sql
\ir seed.sql
COMMIT;
-- Existing db_book_lab is an error. No IF NOT EXISTS, DROP, TRUNCATE, or overwrite.
