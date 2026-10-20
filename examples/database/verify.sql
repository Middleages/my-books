\set ON_ERROR_STOP on
BEGIN READ ONLY;
SET LOCAL TIME ZONE 'UTC';
DO $$
DECLARE n integer; amount bigint;
BEGIN
  IF current_database() NOT IN ('db_book_source', 'db_book_restore') THEN
    RAISE EXCEPTION 'Expected a confirmed disposable source or restore target';
  END IF;
  IF (SELECT count(*) FROM db_book_lab.customers) <> 3 OR
     (SELECT count(*) FROM db_book_lab.products) <> 3 OR
     (SELECT count(*) FROM db_book_lab.orders) <> 3 OR
     (SELECT count(*) FROM db_book_lab.order_items) <> 4 THEN
    RAISE EXCEPTION 'Canonical row counts must be 3/3/3/4';
  END IF;
  IF (SELECT array_agg(available_qty ORDER BY id) FROM db_book_lab.products)
       IS DISTINCT FROM ARRAY[5,8,3] THEN RAISE EXCEPTION 'Canonical stock mismatch'; END IF;
  SELECT sum(i.qty::bigint * i.unit_price_won) INTO amount
  FROM db_book_lab.orders o JOIN db_book_lab.order_items i ON i.order_id=o.id
  WHERE o.customer_id=1 AND o.status='confirmed';
  IF amount IS DISTINCT FROM 36000 THEN RAISE EXCEPTION 'Expected 36000 KRW'; END IF;
  IF EXISTS (SELECT 1 FROM db_book_lab.orders o LEFT JOIN db_book_lab.customers c
    ON c.id=o.customer_id WHERE c.id IS NULL) OR EXISTS (
    SELECT 1 FROM db_book_lab.order_items i LEFT JOIN db_book_lab.orders o ON o.id=i.order_id
    LEFT JOIN db_book_lab.products p ON p.id=i.product_id WHERE o.id IS NULL OR p.id IS NULL)
    THEN RAISE EXCEPTION 'Orphan relationship'; END IF;
  -- Also check that constraints exist and are validated, not just that these rows happen to fit.
  SELECT count(*) INTO n FROM pg_catalog.pg_constraint
    WHERE connamespace='db_book_lab'::regnamespace AND contype='p' AND convalidated;
  IF n <> 4 THEN RAISE EXCEPTION 'Expected four validated primary keys'; END IF;
  SELECT count(*) INTO n FROM pg_catalog.pg_constraint
    WHERE connamespace='db_book_lab'::regnamespace AND contype='f' AND convalidated;
  IF n <> 3 THEN RAISE EXCEPTION 'Expected three validated foreign keys'; END IF;
  SELECT count(*) INTO n FROM pg_catalog.pg_constraint
    WHERE connamespace='db_book_lab'::regnamespace AND contype='u' AND convalidated;
  IF n <> 1 THEN RAISE EXCEPTION 'Expected one validated unique request key'; END IF;
END; $$;
-- The same app-shaped SELECT must return 3 rows as the current lab role.
-- This does NOT verify a separate production app role, credentials, network, or service.
SELECT o.id, i.line_no, p.name, i.qty, i.unit_price_won
FROM db_book_lab.orders o JOIN db_book_lab.order_items i ON i.order_id=o.id
JOIN db_book_lab.products p ON p.id=i.product_id
WHERE o.customer_id=1 AND o.status='confirmed' ORDER BY o.id,i.line_no;
ROLLBACK;
