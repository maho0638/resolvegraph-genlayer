# ResolveGraph Interoperability

ResolveGraph is designed to sit between open agent coordination/payment layers and GenLayer adjudication.

## ERC-8004

ERC-8004 defines portable agent identity, reputation feedback and validation registries. ResolveGraph stores optional agent references on each workflow step so a client can associate an adjudication with an external agent identity.

ResolveGraph does **not** claim that a caller-supplied registry reference is authentic merely because it is present in contract storage. A production adapter must verify the registry and agent identity on the relevant chain.

The TypeScript SDK can export a ResolveGraph decision as a portable receipt containing:

- workflow and step IDs;
- participant wallet;
- optional agent reference;
- outcome and confidence;
- fault class;
- policy version;
- deterministic decision hash.

That receipt can be attached to downstream reputation or validation workflows without requiring those systems to scrape the ResolveGraph UI.

## A2A

A2A Agent Cards advertise agent capabilities and endpoints. ResolveGraph stores an optional HTTPS A2A endpoint per step so a workflow can preserve which agent endpoint was committed at creation time.

ResolveGraph does not currently claim to be a general-purpose A2A task server. It is the adjudication and settlement layer around workflows that may include A2A participants.

## x402 and external payments

ResolveGraph's canonical economic path uses native GEN reward escrow plus participant bonds because that settlement is directly auditable by the Intelligent Contract.

External payment receipts, including x402-style payment evidence, can be supplied as public evidence where a workflow commitment depends on an off-chain or cross-chain payment. The contract does not treat a payment URL as proof without GenLayer semantic evaluation.

## Design rule

Interoperability metadata is useful context; it is never allowed to bypass consensus, authorization, challenge timing or deterministic settlement rules.
