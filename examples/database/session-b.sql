\set ON_ERROR_STOP on
-- A second interactive psql connection to the SAME approved source database.
DO $$ BEGIN
  IF current_database() <> 'db_book_source' THEN RAISE EXCEPTION 'Wrong lab database'; END IF;
END; $$;
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '60s';
SET LOCAL statement_timeout = '90s';
SET LOCAL idle_in_transaction_session_timeout = '120s';
UPDATE db_book_lab.products SET available_qty = available_qty - 5
WHERE id = 101 AND available_qty >= 5 RETURNING id, available_qty;
-- Waits while A holds the conflict. Waiting has no affected-row result yet.
-- After A ROLLBACK: one row, qty=0. Then type ROLLBACK in B to restore qty=5.
-- After A COMMIT (optional changed-state branch): 0 rows. Still type ROLLBACK in B.
