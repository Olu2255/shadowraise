# ShadowRaise Submission Notes

## Final Demo Steps

1. Confirm wallet is on Arbitrum Sepolia.
2. Confirm `.env` contains the deployed registry and sRCC token addresses.
3. Start the app with `npm run dev`.
4. Founder submits a confidential deal from `/submit`.
5. Show the deal appearing in `/dashboard` Marketplace from onchain reads.
6. Open the deal detail page.
7. Investor claims 1,000 demo sRCC.
8. Investor authorizes private investment.
9. Investor submits an encrypted sRCC investment amount.
10. Return to `/dashboard` and show the investment record under Your Investments.
11. Connect with the founder wallet and show Founder View on the deal page.

## Required X/Twitter Post Checklist

- Mention project name: ShadowRaise.
- Mention iExec Nox.
- Mention confidential founder financial metrics.
- Mention demo sRCC confidential investment credits.
- Mention Arbitrum Sepolia deployment.
- Include demo video link.
- Include repository link.
- Include required hackathon hashtag or organizer tag.

## Four-Minute Video Plan

0:00-0:30: Problem and pitch.

0:30-1:15: Founder submits confidential financial metrics.

1:15-2:00: Explain Nox encrypted handles and confidential health checks.

2:00-2:45: Marketplace reads public onchain deal signals.

2:45-3:30: Investor claims demo sRCC, authorizes private investment, and invests privately.

3:30-4:00: Dashboard investment record, founder view, limitations, and next steps.

## Contract Addresses

Network: Arbitrum Sepolia

```txt
ShadowRaiseDealRegistry: <paste deployed registry address>
ShadowRaiseConfidentialToken / sRCC: <paste deployed token address>
```

## Repo Checklist

- README explains the project and demo flow.
- `.env.example` contains required placeholders.
- `feedback.md` is included for iExec/Nox feedback.
- Contract compile command passes.
- Typecheck passes.
- Production build passes.
- Demo video recorded.
- Contract addresses added to README and submission notes.
- No real private keys committed.

## Important Demo Framing

- sRCC is a demo testnet confidential investment credit.
- Investment amounts are encrypted.
- Public totals are not revealed in this MVP.
- Deal-level confidential aggregation is future work.
- ShadowRaise is not a production fundraising, broker-dealer, investment, legal, or compliance product.
