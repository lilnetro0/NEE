# Capability configuration

Local market/platform capabilities live in `capabilities.ts`.

## Resolution inputs

- `platform`: `web` | `ios` | `android`
- `country`: ISO country code (local default `SA`)
- `appVersion`: semantic version string
- `productType`: optional `gift_card` | `direct_topup`

## Capability flags

| Flag | Meaning |
| --- | --- |
| `purchasingEnabled` | Master purchase switch |
| `externalPaymentsEnabled` | Card / Apple Pay / STC Pay rails |
| `giftCardPurchaseEnabled` | Gift-card buy flow |
| `directGameTopUpEnabled` | Direct game top-up flow |
| `walletFundingEnabled` | Deposit/withdraw — **false** in local config |
| `storeCreditEnabled` | NETRO Store Credit balance & checkout spend |
| `savedPaymentMethodsEnabled` | Saved cards management |
| `referralsEnabled` | Referral program |
| `promotionsEnabled` | Promo codes / promotions UI |

## Usage

```ts
const { capabilities, isEnabled, canPurchase, paymentRails } = useCapabilities();
```

Pure helpers for future tests:

- `resolveCapabilities(ctx, config?)`
- `canPurchaseProduct(caps, productType)`
- `resolvePaymentRails(ctx, caps?)`
- `compareAppVersions(a, b)`
- `isCapabilityEnabled(id, ctx, config?)`

Remote configuration is not connected yet. Replace
`DEFAULT_CAPABILITY_CONFIG` or inject a fetched config into
`resolveCapabilities` later without changing screens.
