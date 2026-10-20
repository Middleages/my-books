\set ON_ERROR_STOP on
BEGIN READ ONLY;
SET LOCAL TIME ZONE 'UTC';
-- Two confirmed orders. Explicit order, not a promise about physical row order.
SELECT id FROM db_book_lab.orders
WHERE customer_id = 1 AND status = 'confirmed' ORDER BY id;
-- Three joined item rows: (1001,1), (1001,2), (1002,1).
SELECT o.id AS order_id, i.line_no, i.product_id, i.qty, i.unit_price_won
FROM db_book_lab.orders o
JOIN db_book_lab.order_items i ON i.order_id = o.id
WHERE o.customer_id = 1 AND o.status = 'confirmed'
ORDER BY o.id, i.line_no;
-- Expected: 3 rows, 2 distinct orders, 7 pieces, 36000 KRW.
SELECT count(*) AS item_rows, count(DISTINCT o.id) AS orders,
       sum(i.qty) AS pieces, sum(i.qty::bigint * i.unit_price_won) AS won
FROM db_book_lab.orders o
JOIN db_book_lab.order_items i ON i.order_id = o.id
WHERE o.customer_id = 1 AND o.status = 'confirmed';
-- Customer 3 survives; expected COUNT(*)=1, COUNT(o.id)=0, SUM=NULL.
SELECT c.id, count(*) AS result_rows, count(o.id) AS order_rows, sum(i.qty) AS pieces
FROM db_book_lab.customers c
LEFT JOIN db_book_lab.orders o ON o.customer_id = c.id AND o.status = 'confirmed'
LEFT JOIN db_book_lab.order_items i ON i.order_id = o.id
WHERE c.id = 3 GROUP BY c.id;
-- EXPLAIN does not execute this SELECT; ANALYZE below DOES execute it.
-- This tiny fixture does not reproduce the browser's 64-row growth plan or timing.
EXPLAIN SELECT id FROM db_book_lab.orders WHERE customer_id = 1;
EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM db_book_lab.orders WHERE customer_id = 1;
ROLLBACK;
