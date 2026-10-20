-- Included by setup.sql inside its one transaction. Synthetic book fixture only.
-- Positive ids are this fixture's convention, not a PRIMARY KEY implication.
CREATE SCHEMA db_book_lab;
CREATE TABLE db_book_lab.customers (
  id integer PRIMARY KEY CHECK (id > 0),
  display_name text NOT NULL
);
CREATE TABLE db_book_lab.products (
  id integer PRIMARY KEY CHECK (id > 0),
  name text NOT NULL,
  unit_price_won integer NOT NULL CHECK (unit_price_won >= 0),
  available_qty integer NOT NULL CHECK (available_qty >= 0)
);
CREATE TABLE db_book_lab.orders (
  id integer PRIMARY KEY CHECK (id > 0),
  customer_id integer NOT NULL REFERENCES db_book_lab.customers(id),
  request_key text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL
);
CREATE TABLE db_book_lab.order_items (
  order_id integer NOT NULL REFERENCES db_book_lab.orders(id),
  line_no integer NOT NULL CHECK (line_no > 0),
  product_id integer NOT NULL REFERENCES db_book_lab.products(id),
  qty integer NOT NULL CHECK (qty > 0),
  unit_price_won integer NOT NULL CHECK (unit_price_won >= 0),
  PRIMARY KEY (order_id, line_no)
);
