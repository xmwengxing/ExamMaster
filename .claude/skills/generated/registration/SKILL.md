---
name: registration
description: "Skill for the Registration area of ExamMaster. 12 symbols across 2 files."
---

# Registration

12 symbols | 2 files | Cohesion: 100%

## When to Use

- Working with code in `pages/`
- Understanding how handleOccupationChange, checkMajorMatch, calculateWorkYears work
- Modifying registration-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `pages/Registration/VocationalRegistrationForm.tsx` | handleOccupationChange, checkMajorMatch, calculateWorkYears, handleEducationChange, handleMajorChange (+5) |
| `pages/Registration/RegistrationTypeSelector.tsx` | RegistrationTypeSelector, handleCardClick |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handleOccupationChange` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 139 |
| `checkMajorMatch` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 198 |
| `calculateWorkYears` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 256 |
| `handleEducationChange` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 292 |
| `handleMajorChange` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 297 |
| `handleApplyLevelChange` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 387 |
| `RegistrationTypeSelector` | Function | `pages/Registration/RegistrationTypeSelector.tsx` | 15 |
| `handleCardClick` | Function | `pages/Registration/RegistrationTypeSelector.tsx` | 46 |
| `VocationalRegistrationForm` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 22 |
| `loadOccupations` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 93 |
| `checkPhoneExists` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 309 |
| `handleSubmit` | Function | `pages/Registration/VocationalRegistrationForm.tsx` | 433 |

## How to Explore

1. `gitnexus_context({name: "handleOccupationChange"})` — see callers and callees
2. `gitnexus_query({query: "registration"})` — find related execution flows
3. Read key files listed above for implementation details
