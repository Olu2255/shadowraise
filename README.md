# ShadowRaise

Confidential AI-powered investment intelligence for founders and investors.

## One-Line Pitch

ShadowRaise lets founders submit private financial metrics, uses iExec Nox to keep those metrics confidential, and gives investors public deal signals plus private sRCC investment flow on Arbitrum Sepolia.

## Problem

Early-stage fundraising depends on sensitive financial data: revenue, burn, runway, margins, and customer counts. Founders need to share enough signal for investors to evaluate a deal, but exposing raw numbers too early creates trust, privacy, and negotiation risk.

Investors also need a structured marketplace view that helps them compare opportunities without receiving private founder spreadsheets.

## Solution

ShadowRaise separates private financial data from public investment intelligence.

Founders submit confidential metrics. The app encrypts those inputs with Nox, stores encrypted handles onchain, and exposes only derived public signals such as risk level, confidence score, revenue band, and burn risk band. Investors can browse public deal signals, then use demo confidential investment credits to submit private investment amounts.

Correct Nox claim: Nox stores private financial metrics as encrypted handles and performs confidential health checks, while the app exposes only public investment signals.

## How It Uses iExec Nox

ShadowRaise uses iExec Nox in the founder submission flow and registry contract:

- Private founder metrics are encrypted client-side before contract submission.
- The deal registry stores Nox encrypted handles for revenue, burn, runway, margin, and customer count.
- The contract converts external encrypted inputs with Nox and stores them as confidential values.
- The contract performs minimal confidential health checks over encrypted metrics:
  - runway health
  - burn discipline
  - traction signal
- Raw founder metrics are not exposed in marketplace reads.

The MVP does not claim that the full AI investment score is fully verified onchain. The public risk signals are derived by the app and stored publicly, while selected health checks are performed confidentially with Nox.

## Confidential Tokens / sRCC

ShadowRaise includes `ShadowRaiseConfidentialToken`, an ERC-7984 confidential token named ShadowRaise Confidential Credit with symbol `sRCC`.

sRCC is a demo testnet confidential investment credit used only for this hackathon flow. It is not a real purchasable investment asset and should not be treated as a security, payment token, or production fundraising instrument.

In the demo:

- Investors claim 1,000 demo sRCC once per wallet.
- Investors authorize ShadowRaise for the private investment flow.
- Investment amounts are encrypted through sRCC.
- Public totals are not revealed in this MVP.
- Deal-level confidential aggregation is future work.

## End-to-End User Flow

1. Founder connects wallet.
2. Founder opens `/submit`.
3. Founder enters company details and private financial metrics.
4. Frontend encrypts private metrics with the Nox JS handle flow.
5. Frontend calls `ShadowRaiseDealRegistry.createDeal()`.
6. Registry stores public deal metadata and encrypted financial handles.
7. Registry performs confidential Nox health checks over encrypted inputs.
8. Marketplace reads public deal data from `getDealCount()` and `getPublicDeal(id)`.
9. Investor opens `/dashboard` and browses onchain opportunities.
10. Investor opens `/deal/[id]`.
11. Investor claims demo sRCC.
12. Investor authorizes private investment.
13. Investor submits an encrypted sRCC investment amount.
14. Dashboard shows submitted private investment records for the connected investor wallet.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Privy wallet connection
- viem
- iExec Nox handle SDK
- iExec Nox protocol contracts
- ERC-7984 confidential token contracts
- Hardhat
- Arbitrum Sepolia

## Deployed Contract Addresses

Network: Arbitrum Sepolia

```txt
ShadowRaiseDealRegistry: <paste deployed registry address>
ShadowRaiseConfidentialToken / sRCC: <paste deployed token address>
```

Set these values in `.env` after deployment:

```bash
NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS=
NEXT_PUBLIC_SHADOWRAISE_TOKEN_ADDRESS=
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and fill in the values needed for your demo wallet, RPC, Privy app, and deployed contracts.

## Environment Variables

```bash
# Privy wallet connection
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Optional ChainGPT memo generation.
# If unset, the app shows deterministic public signal memos.
CHAINGPT_API_KEY=

# Testnet deployer key. Use a funded testnet-only wallet.
PRIVATE_KEY=your_private_key_here

# Arbitrum Sepolia RPC
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Frontend contract addresses after deployment
NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS=
NEXT_PUBLIC_SHADOWRAISE_TOKEN_ADDRESS=
```

Never commit a real private key.

## Contract Deployment Commands

Compile contracts:

```bash
npm run compile:contracts
```

Deploy to Arbitrum Sepolia:

```bash
npm run deploy:arbitrumSepolia
```

The deployment script deploys:

1. `ShadowRaiseConfidentialToken`
2. `ShadowRaiseDealRegistry`

After deployment, copy the output addresses into `.env`.

## Frontend Run Commands

Start local development:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

## Demo Flow

Use Arbitrum Sepolia in the connected wallet.

Founder path:

1. Open `/submit`.
2. Connect wallet.
3. Enter company and financial metrics.
4. Submit the deal.
5. Confirm the transaction.
6. Open `/dashboard` and verify the deal appears in Marketplace.

Investor path:

1. Open `/dashboard`.
2. Select a marketplace deal.
3. Connect wallet.
4. Claim demo sRCC.
5. Authorize private investment.
6. Enter an sRCC amount.
7. Submit private investment.
8. Return to `/dashboard` and verify the investment record appears under Your Investments.

Founder detail path:

1. Connect with the founder wallet that submitted the deal.
2. Open the deal detail page.
3. Confirm the Founder View appears.
4. Note that deal-level confidential investment aggregation is listed as future work.

## Known Limitations

- This is a hackathon MVP, not a production fundraising or compliance product.
- sRCC is a demo testnet confidential investment credit, not a real investment asset.
- Public risk and confidence signals are stored onchain, but the full AI score is not fully verified onchain.
- Investment amounts are encrypted, so public investment totals are not revealed.
- Deal-level confidential aggregation is not implemented yet.
- Investor suitability, KYC, legal compliance, cap table handling, and fund settlement are out of scope.
- The UI assumes Arbitrum Sepolia for the demo.

## Future Improvements

- Add confidential deal-level aggregation for encrypted investment totals.
- Add stronger founder-side encrypted metric review and selective disclosure.
- Move more signal generation into verifiable confidential workflows.
- Add investor access controls and compliance checks for production use.
- Add indexing for marketplace and investment events.
- Add test coverage for contract reads, writes, and frontend transaction state.
- Add deployment metadata and explorer links after final testnet deployment.
