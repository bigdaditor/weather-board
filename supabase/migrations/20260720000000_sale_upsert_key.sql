-- A date may have one sale per payment type. This key lets the API update an
-- existing row atomically instead of inserting a duplicate.
alter table public.sale
  add constraint sale_input_date_payment_type_key
  unique (input_date, payment_type);
