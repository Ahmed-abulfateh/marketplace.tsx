---
description: "Use when designing marketplace features, drafting product docs, planning marketplace APIs or schemas, or deciding buyer, seller, admin, payments, trust, and logistics behavior for this repository."
---
# Marketplace Product Guidelines

- Default to phased delivery: MVP first, then expansion.
- Treat buyer, seller, and admin workflows as separate surfaces with explicit handoffs.
- Prioritize trust-critical systems early: authentication, seller verification, payment handling, dispute flows, notifications, and auditability.
- When proposing features, distinguish must-have workflows from optional growth features.
- When drafting technical plans, tie each feature to affected modules, entities, and integrations.
- Keep marketplace terminology consistent across docs and code: buyer, seller, listing, order, payout, dispute, shipment, review.
- Call out operational assumptions when a design depends on fulfillment, moderation, refunds, or compliance.
- For MVP recommendations, prefer the smallest design that still supports safe transactions and clear accountability.

## Expected Artifacts

- Product requirements with scope, workflows, edge cases, and success criteria
- API or schema planning with explicit ownership of data and lifecycle states
- Roadmaps that sequence trust, payment, and operations work before growth optimizations

## Avoid

- Mixing marketplace strategy with unrelated startup advice
- Treating chat, reviews, payouts, and disputes as optional if trust depends on them
- Expanding into mobile apps, AI recommendations, or multi-region support before the core transaction loop is stable