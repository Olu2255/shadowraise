# ShadowRaise Hackathon Feedback

## What Worked Well Using iExec/Nox

Nox was a strong fit for ShadowRaise because the whole product depends on one clear idea: founders should be able to prove useful business signals without exposing their raw financial data publicly.

The encrypted handle model made sense for this use case. We were able to take sensitive founder metrics, encrypt them before contract submission, and store them onchain without exposing the original values in marketplace reads.

Another part that worked well was the ability to run simple confidential checks inside the contract. For example, ShadowRaise checks things like runway health, burn discipline, and traction signal using encrypted values. That made the project feel like it was actually using confidential computation, not just storing private-looking data.

The privacy boundary was also easy to explain in the demo:

- Raw founder metrics stay encrypted.
- Public deal signals are shown to investors.
- Private investments use confidential sRCC amounts.

That separation made the product story much clearer.

## What Was Difficult

The hardest part was understanding the full frontend-to-contract flow for encrypted inputs.

Getting from normal form values to `externalEuint256`, encrypted handles, proofs, and then `Nox.fromExternal()` inside the contract took some trial and error. Once the flow clicked, it made sense, but getting there was not instant.

It also took time to understand what should happen where:

- frontend: encrypt user inputs
- contract: validate and store encrypted values
- public UI: show safe signals only
- future work: stronger confidential scoring and aggregation

Debugging was another challenge. When a transaction failed, it was not always obvious whether the issue was the wallet network, gas, proof generation, Nox input handling, contract logic, or user rejection. Better debugging guidance would make the developer experience smoother.

ERC-7984 authorization was also powerful but slightly tricky from a product UX point of view. The technical idea makes sense, but the UI copy needs to be very clear so users understand what they are authorizing.

## Where Docs Could Improve

The biggest thing that would help is more full end-to-end examples.

The docs explain important pieces, but for a hackathon builder, it would be very useful to see one complete flow that combines:

- frontend encryption with the JS handle SDK
- viem wallet/client setup
- passing `externalEuint256` and proofs to a contract
- using `Nox.fromExternal()`
- using `Nox.allowThis()` and `Nox.allow()`
- reading public values back into a frontend

A small reference app would save a lot of time.

More troubleshooting examples would also help. For example, common errors around network mismatch, proof issues, gas estimation, encrypted type mismatch, or failed confidential transactions would make debugging much faster.

Clearer Arbitrum Sepolia deployment examples would also be useful, especially for teams trying to move quickly from local development to a working deployed demo.

## Feedback On Confidential Tokens

Confidential Tokens fit the ShadowRaise idea well because investment amounts are exactly the kind of thing that should not always be public.

Using sRCC as a demo confidential investment credit helped show how a private investment flow could work. The investor can claim demo sRCC, authorize the investment flow, and invest privately without showing the amount publicly.

The demo faucet pattern is useful for hackathons, but it should be clearly separated from production token flows. In our case, sRCC is only a testnet demo credit, not a real purchasable investment asset.

The time-bound authorization model is useful, but it needs strong frontend examples. A lot of users will not understand words like “operator” or “registry approval”, so builders need to translate that into clearer product language like “Authorize private investment.”

More examples around confidential transfers, transfer-from flows, and user authorization would help teams avoid wrong assumptions.

## Feedback On Developer Experience

The core Nox primitives are strong and genuinely interesting. Once the flow is working, it opens up product ideas that normal public smart contracts cannot handle well.

The TypeScript and viem integration is workable, but it would be much easier with more examples showing exact input and return shapes. Small type mismatches can slow things down a lot.

Solidity examples are especially important. With confidential types, even small differences in how values are created, converted, allowed, or stored can block progress.

A full-stack starter template would be extremely useful for future builders. Something with a frontend form, encrypted input submission, a basic Nox contract, and a simple frontend read would let teams spend more time on product logic instead of integration setup.

## What We Would Build Next

The next major improvement would be confidential deal-level aggregation.

Right now, ShadowRaise can record private investments, but it does not reveal a public total invested amount because the amounts are encrypted through sRCC. A stronger version would let founders see controlled investment totals without exposing everyone’s private investment amounts publicly.

Other next steps would be:

- investor-specific encrypted portfolio views
- stronger confidential analytics over submitted founder metrics
- better event indexing for deal and investment history
- a stronger verifier path for public investment signals
- more of the scoring workflow backed by confidential computation
- production-grade compliance, investor qualification, and legal workflows

The MVP proves the core idea: private founder data, public investment signals, and confidential token-based investing can work together in one flow.