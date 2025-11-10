# Calestra Backend (services)

## Tjänster & portar
- nexus     – 14000  (gateway/proxy – ej exponerad publikt i P0)
- c-core    – 14500  (produkter/sök)
- infinity  – 15000  (progress/goals)
- orders    – 15100  (orders API – idempotent + HMAC)
- finance   – 15200  (payouts/refunds – idempotent + HMAC)
- status    – 15300  (översikt: /status, /status.json)
- mock-api  –  5399  (sandbox)

## Miljö
Skapa `.env` i repo-roten:
