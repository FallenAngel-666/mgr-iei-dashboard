# Plan — Architecture Inspection & Members Management Roadmap

## Phase 1: Read-Only Codebase Inspection
- [ ] Dispatch Explorer 1: Inspect architecture, routing, component tree, and Firebase configuration/integration.
- [ ] Dispatch Explorer 2: Inspect authentication, state management, role definitions, and current member/user data models.
- [ ] Dispatch Explorer 3: Inspect current UI navigation/sidebar, permission guards, credential handling, and existing seeded data.
- [ ] Collect Explorer handoffs and synthesize codebase architecture summary.

## Phase 2: Gap Analysis Against Approved Specifications
- [ ] Evaluate Gap 1: Strict Confidentiality & Privacy Gate (authorized users: Sripriyan, Ramya Sri, Master Admin; hiding from sidebar; blocking unauthorized roles).
- [ ] Evaluate Gap 2: Automated Credential Generation (institutional username format, secure random IEI#... password, copyable credential distribution notice).
- [ ] Evaluate Gap 3: Role Architecture (11 exact roles vs current roles).
- [ ] Evaluate Gap 4: Active Committee Register (23 real seeded accounts with zero dummy/mock data).
- [ ] Evaluate Gap 5: Persistence & Firebase (Dual-layer: reactive store + localStorage + Firestore `iei_members` in `sachin-crackers-smartpos-81c6a`).

## Phase 3: Step-by-Step Implementation Plan
- [ ] Define phased implementation blueprint (Database/Persistence -> State/Models -> Security/Guards -> Credential Generator -> UI/Components -> Verification).
- [ ] Validate alignment with approved specs without introducing unapproved features.

## Phase 4: Final Synthesis & Delivery
- [ ] Compile final inspection report, gap analysis matrix, and implementation plan.
- [ ] Write handoff.md and report to parent agent.
