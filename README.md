# ShadowRaise

Confidential investment intelligence for early-stage founders and investors.

## One-Line Pitch

ShadowRaise lets founders share useful investment signals without exposing raw financial metrics, then lets investors make private testnet investments using sRCC, a confidential token, on Arbitrum Sepolia.

## Problem

Early-stage fundraising has a trust problem.

Founders need capital, but they often do not want to expose raw numbers like revenue, burn, runway, margins, and customer counts too early or too publicly.

Investors have the opposite problem. They do not want to invest blindly based on hype, screenshots, pitch decks, or social media traction. They need structured signals that help them compare opportunities.

ShadowRaise tries to sit in the middle:

- founders keep sensitive metrics private
- investors still get useful public signals
- investment amounts can stay confidential

## Solution

ShadowRaise separates **private founder data** from **public investment signals**.

A founder submits business metrics through the app. Sensitive metrics are encrypted with iExec Nox before contract submission. The registry stores encrypted handles onchain and exposes only public deal signals such as confidence score, revenue band, burn risk band, funding target, and sector.

Investors can browse those public signals, open a deal page, generate an AI memo from public signals only, claim demo sRCC, authorize the private investment flow, and submit an encrypted investment amount.

The important boundary is this:

> Nox stores private founder metrics as encrypted handles and performs selected confidential health checks, while the app exposes only public investment signals.

ShadowRaise does **not** claim that the full investment score is fully verified onchain. This MVP proves the confidential data and private investment flow first.

## How It Uses iExec Nox

ShadowRaise uses Nox in the founder submission flow and registry contract.

Private founder metrics are encrypted client-side before they are sent to the contract. The contract receives encrypted inputs and proofs, converts them with Nox, and stores them as confidential values.

The registry stores encrypted handles for:

- monthly revenue
- monthly burn
- runway months
- gross margin
- customer count

The contract also performs simple confidential health checks over encrypted values, including:

- runway health
- burn discipline
- traction signal

These checks help demonstrate that ShadowRaise is not just storing private-looking data. It is actually using confidential computation over encrypted inputs.

Marketplace reads do not expose raw founder metrics.

## Confidential Tokens / sRCC

ShadowRaise includes a demo ERC-7984 confidential token:

```txt
Name: ShadowRaise Confidential Credit
Symbol: sRCC