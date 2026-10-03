# ResolveGraph Threat Model

ResolveGraph treats public evidence, agent metadata and AI output as untrusted.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| Prompt injection inside evidence | Evidence prompts explicitly treat page text as data, never instructions. |
| Low-confidence AI approval | PASS below the deterministic score/confidence floor fails closed. |
| Leader fabricates decisive result | Validators independently re-fetch evidence and re-run decisive judgments. |
| Dynamic pages differ across validators | Consensus compares bounded semantic decision fields, not byte-identical live pages. |
| Same source masquerades as independent corroboration | Evidence/support hostnames are normalized and must differ. |
| Sponsor changes criteria after work starts | Requirement/rubric are frozen in step storage. |
| Assignee avoids economic exposure | Step acceptance requires an exact deterministic bond. |
| Sponsor steals passed work before review | Passed rewards cannot settle during the initial challenge window. |
| Challenge is metadata only | Challenge triggers fresh evidence evaluation. |
| Later failure reveals earlier bad work | Successful-step bonds remain locked until workflow terminal settlement. |
| AI arbitrarily slashes a participant | Slash requires a valid workflow step, PARTICIPANT fault class, and a deterministic high-confidence threshold. |
| Validator confidence drift crosses an economic threshold | Attribution validators compare the derived slash target as well as semantic fields, so numerically-close confidence values cannot agree if one would slash and the other would return the bond. |
| V3 appeal changes only the slash consequence | Attribution appeal finalization treats a changed derived slash target as a material outcome change, so the challenger bond follows the actual economic consequence rather than only the textual fault label. |
| Ambiguous fault destroys participant funds | EXTERNAL, MULTIPLE or UNDETERMINED attribution returns bonds. |
| Double payout/refund | Reward and bond settlement flags plus terminal workflow states block repeats. |
| Dependency bypass | A step can submit only after all configured prerequisites are PAID. |
| Graph cycle | Dependencies may reference only earlier steps in the same workflow. |
| Fake agent metadata | Agent references and A2A endpoints are explicitly metadata; no identity guarantee is claimed without external verification. |

## Explicit limitations

ResolveGraph does not prove that a public webpage is truthful, that an ERC-8004 reference is authentic merely because it was supplied, or that two hostnames are organizationally independent.

The product is technical settlement infrastructure, not a legal arbitration service.
