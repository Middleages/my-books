\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() <> 'db_book_source' THEN RAISE EXCEPTION 'Wrong lab database'; END IF;
  IF (SELECT available_qty FROM db_book_lab.products WHERE id = 101) IS DISTINCT FROM 5
    THEN RAISE EXCEPTION 'Expected unchanged canonical stock 5'; END IF;
END; $$;
BEGIN;
UPDATE db_book_lab.products SET available_qty = available_qty - 1
WHERE id = 101 AND available_qty >= 1 RETURNING id, available_qty;
-- This session sees 4; this is not a complete order transaction.
SELECT available_qty FROM db_book_lab.products WHERE id = 101;
ROLLBACK;
-- Expected 5 again. No order/header/item was inserted.
SELECT available_qty FROM db_book_lab.products WHERE id = 101;
