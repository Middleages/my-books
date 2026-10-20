\set ON_ERROR_STOP on
\set VERBOSITY verbose
DO $$ BEGIN
  IF current_database() <> 'db_book_source' THEN RAISE EXCEPTION 'Wrong lab database'; END IF;
END; $$;
BEGIN;
UPDATE db_book_lab.products SET available_qty = available_qty - 1
WHERE id = 101 AND available_qty >= 1;
-- Intentionally violates CHECK: expect SQLSTATE 23514 and psql -f exit status 3.
UPDATE db_book_lab.products SET available_qty = -1 WHERE id = 101;
-- With ON_ERROR_STOP the above error exits this file before this line.
-- Closing that psql connection rolls back its open transaction, including the first UPDATE.
ROLLBACK;
