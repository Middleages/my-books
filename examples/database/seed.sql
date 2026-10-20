-- Exact CANONICAL_FIXTURE; fictional people and orders. Money: integer KRW.
-- available_qty already includes the effect of existing orders. Do not deduct again.
INSERT INTO db_book_lab.customers (id, display_name) VALUES
  (1, '가람'),
  (2, '누리'),
  (3, '다온');

INSERT INTO db_book_lab.products (id, name, unit_price_won, available_qty) VALUES
  (101, '머그', 12000, 5),
  (102, '노트', 4000, 8),
  (103, '파우치', 9000, 3);

INSERT INTO db_book_lab.orders (id, customer_id, request_key, status, created_at) VALUES
  (1001, 1, 'key-1001', 'confirmed', '2026-01-10T01:00:00Z'),
  (1002, 1, 'key-1002', 'confirmed', '2026-01-11T01:00:00Z'),
  (1003, 2, 'key-1003', 'cancelled', '2026-01-11T02:00:00Z');

INSERT INTO db_book_lab.order_items (order_id, line_no, product_id, qty, unit_price_won) VALUES
  (1001, 1, 101, 1, 12000),
  (1001, 2, 102, 4, 4000),
  (1002, 1, 102, 2, 4000),
  (1003, 1, 103, 1, 9000);
