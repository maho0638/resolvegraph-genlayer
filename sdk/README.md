# @resolvegraph/sdk

Small TypeScript integration layer for ResolveGraph.

Current helpers:

- parse / format native GEN values;
- compute the deterministic participant bond and V3 appeal bond;
- normalize optional ERC-8004-style agent references;
- reject duplicate evidence hostnames before a transaction is built;
- construct contract write requests, including recipe-bound V3 steps and bonded appeals;
- export portable ResolveGraph adjudication receipts;
- parse canonical GitHub commit / pull-request / Actions-run source references;
- normalize Ethereum mainnet / Sepolia transaction references for source adapters.

The SDK deliberately does not sign transactions or hide wallet approval. Applications can pass the generated method/args/value into GenLayerJS or Transaction Kit.
