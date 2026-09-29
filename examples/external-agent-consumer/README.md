# ResolveGraph external agent consumer

This directory behaves like a separate integration project.

It does **not** import ResolveGraph source files directly. The proof workflow:

1. builds `@resolvegraph/sdk@0.1.0`;
2. packs it as an npm tarball;
3. installs that tarball into this consumer through the package boundary;
4. reads the public ResolveGraph production API without a wallet;
5. builds the step adjudication receipt through the installed SDK;
6. compares the SDK receipt with the public receipt API;
7. emits `external-consumer-proof.json`.

The default proof targets the canonical live Studionet workflow
`rg-live-success-v1/source-check`.

This is intentionally read-only. An external agent can use the same SDK request
builders with GenLayerJS / Transaction Kit when it has its own wallet and is
authorized for a state-changing action.
