\set ON_ERROR_STOP on
-- Use \i inside an INTERACTIVE psql session. -f would close and roll back too soon.
DO $$ BEGIN
  IF current_database() <> 'db_book_source' THEN RAISE EXCEPTION 'Wrong lab database'; END IF;
  IF (SELECT available_qty FROM db_book_lab.products WHERE id = 101) IS DISTINCT FROM 5
    THEN RAISE EXCEPTION 'Expected canonical stock 5'; END IF;
END; $$;
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '60s';
SET LOCAL statement_timeout = '90s';
SET LOCAL idle_in_transaction_session_timeout = '120s';
UPDATE db_book_lab.products SET available_qty = available_qty - 5
WHERE id = 101 AND available_qty >= 5 RETURNING id, available_qty;
-- One row, available_qty=0; leave this transaction open briefly, then follow README.
