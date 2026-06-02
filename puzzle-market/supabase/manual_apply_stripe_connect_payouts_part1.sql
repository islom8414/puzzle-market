alter table public.wallet_withdrawal_requests
  add column if not exists provider_reference text,
  add column if not exists provider_transfer_reference text,
  add column if not exists provider_error text,
  add column if not exists paid_at timestamptz;

alter table public.wallet_withdrawal_requests
  drop constraint if exists wallet_withdrawal_requests_method_check;

alter table public.wallet_withdrawal_requests
  add constraint wallet_withdrawal_requests_method_check check (
    method in (
      'visa_card',
      'bank_transfer',
      'paypal',
      'usdt',
      'stripe_instant',
      'stripe_standard'
    )
  );

alter table public.wallet_withdrawal_requests
  drop constraint if exists wallet_withdrawal_requests_status_check;

alter table public.wallet_withdrawal_requests
  add constraint wallet_withdrawal_requests_status_check check (
    status in (
      'pending',
      'processing',
      'paid',
      'rejected',
      'cancelled',
      'failed'
    )
  );
