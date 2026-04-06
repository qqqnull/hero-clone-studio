ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_order_id_fkey;

ALTER TABLE public.transactions
ALTER COLUMN order_id TYPE text
USING order_id::text;