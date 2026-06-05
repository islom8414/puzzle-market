# Paysend Enterprise Application Draft

Use this when contacting Paysend Enterprise:
https://paysend.com/business/enterprise

## Company / Product

Puzzle Market is a digital collectibles marketplace where users buy and resell puzzle fragments. We need payout rails for seller withdrawals after marketplace sales.

## Required Payout Coverage

- Uzbekistan: Uzcard, Humo, Visa, Mastercard
- Asia expansion: Kazakhstan, Kyrgyzstan, Tajikistan, Turkey, UAE, South Korea, Singapore
- Fallback where card payout is unavailable: bank account / SWIFT if supported

## Use Case

Marketplace seller payouts. Users request a withdrawal from their Puzzle Market wallet balance. We reserve the balance, review the request, and send payout after fraud/KYC checks.

## API Requirements

- Enterprise Payout API sandbox
- Card payout capability
- Uzbekistan local schemes: Uzcard and Humo
- Visa / Mastercard payout rails
- FX quote and payout status notifications
- Webhook or polling support for payout status
- Production onboarding requirements and fee schedule

## Compliance Questions

- KYB documents required for Puzzle Market
- KYC requirements for recipients in Uzbekistan
- Transaction limits by country and card rail
- Whether full PAN tokenization is available so Puzzle Market does not store full card numbers
- Required payout purpose codes for marketplace seller withdrawals

## Initial MVP Flow

Until Paysend approval is complete, Puzzle Market will create manual payout requests and process them outside the API. After approval, the same withdrawal request flow can call Paysend automatically.
