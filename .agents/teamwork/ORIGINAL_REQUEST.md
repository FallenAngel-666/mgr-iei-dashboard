# Original User Request

## Initial Request — 2026-11-09T05:38:20Z

Inspect the existing MGR IEI Student Chapter project architecture without modifying any files, identify missing requirements against the approved specifications, and prepare a step-by-step implementation plan for the Members Management module.

Working directory: C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform
Integrity mode: development

## Requirements

### R1. Read-Only Codebase Inspection
Inspect the existing codebase at `C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform` to understand current architecture, state management, authentication, routing, and data models. The team must not modify, create, or delete any files in the repository during this phase.

### R2. Gap Analysis Against Approved Specifications
Compare the current implementation against the approved requirements and document all gaps:
1. Strict Confidentiality & Privacy Gate: Membership Directory and Members Management module is strictly confidential. Only three users are authorized to access and view it:
   - SRIPRIYAN S (Joint Secretary, username: `sripriyan.jsec-01`, email: `sri.priyan.s.2607@gmail.com`)
   - RAMYA SRI M (Membership Director, username: `ramya.memdir-01`, email: `ramyoshiii017@gmail.com`)
   - Master Administrator (username: `admin.master-01`, role: `Administrator`)
   It must be completely hidden from the sidebar and blocked with security guards for Chairmen, Vice Chairman, Secretaries, Treasurers, Executive Members, and Staff.
2. Automated Credential Generation:
   When an authorized admin adds a new member, the system automatically creates:
   - An institutional username adhering to the standard format: `<firstname>.<roletag>-<sequential_number>` (e.g. `kavitha.exec-12`, `sriman.chair-01`).
   - A secure random password prefixed with `IEI#...` (e.g. `IEI#Ramya*9164`).
   - A copyable official credential distribution notice.
3. Role Architecture:
   11 exact roles: Administrator (Master User), Staff Coordinator, Chairman, Vice Chairman, Secretary, Joint Secretary, Treasurer, Joint Treasurer, Membership Director, Event Management Head, Executive Member.
4. Active Committee Register:
   23 real seeded accounts (21 committee members + 1 Staff Coordinator titled "Staff Coordinator" + 1 Master Administrator) with no dummy or mock example data; clean state for institutional use.
5. Persistence & Firebase:
   Dual-layer architecture: in-memory reactive store backed by localStorage and Firestore (`iei_members` collection) for persistent sync under Firebase project `sachin-crackers-smartpos-81c6a` (Web hosting: `https://sachin-crackers-smartpos-81c6a.web.app`).

### R3. Step-by-Step Implementation Plan
Prepare a comprehensive, step-by-step implementation plan for the Members Management module directly addressing all identified architectural gaps and strictly following the approved requirements without introducing any unapproved features. Deliver the complete plan directly in the final response report without creating or modifying any files in the repository.

## Acceptance Criteria

### Execution & Integrity Guardrails
- [ ] Zero repository files in `C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform` are created, modified, or deleted.
- [ ] All inspection findings and the full implementation plan are delivered directly in the final response report.
- [ ] The inspection report articulates the existing codebase architecture (routing, state management, component tree, and Firebase configuration).
- [ ] The gap analysis addresses all 5 approved core requirements: Strict Confidentiality Gate, Automated Credential Generation, 11-role architecture, 23 seeded accounts register, and dual-layer persistence (localStorage + Firestore `iei_members` collection).
- [ ] The implementation plan defines phased, concrete steps to implement the Members Management module conforming to the approved specifications without introducing any unapproved features.
