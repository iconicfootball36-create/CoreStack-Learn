# CoreStack Learn - Firestore Security Specification & Invariants

## Data Invariants
1. **User Identity & Multi-Tenancy**: Every student profile in `/users/{userId}` is strictly isolated. Only the authenticated student matching `request.auth.uid == userId` can read or write their profile.
2. **Study Material Isolation**: Study materials in `/studyMaterials/{materialId}` must have `userId == request.auth.uid`. No student can read, query, or mutate another student's syllabus or notes.
3. **Diagnostic Evaluation Integrity**: Socratic evaluations in `/diagnosticEvaluations/{diagnosticId}` are owned by the student. Scores cannot be forged for other accounts.
4. **Learning Session Isolation**: Interactive lecture sessions in `/learningSessions/{sessionId}` are tied strictly to the student's UID.
5. **No Client Query Delegation**: All list operations enforce `resource.data.userId == request.auth.uid` in security rules directly.

## The Dirty Dozen Payloads (Security Test Cases)
1. **Unauthenticated Read**: Attempting to read `/users/test-user` without authentication -> DENIED.
2. **Cross-Tenant Material Read**: Student A attempting to read `/studyMaterials/material-owned-by-B` -> DENIED.
3. **Identity Spoofing on Material Creation**: Student A creating a material with `userId = "user_b"` -> DENIED.
4. **Junk Path ID Poisoning**: Attempting to create `/users/{1.5KB_junk_chars}` -> DENIED (fails `isValidId`).
5. **Volumetric Overflow Attack**: Attempting to write a 5MB string into `title` or `summary` -> DENIED (fails size limit).
6. **Shadow Field Injection**: Attempting to write extra hidden fields (`isAdmin: true`, `role: 'superadmin'`) on user profile creation -> DENIED.
7. **Cross-Tenant Evaluation Mutation**: Student A attempting to edit or delete Student B's Socratic diagnostic score -> DENIED.
8. **Invalid Enum Bypass**: Attempting to set `academicLevel: 'HACKER_LEVEL'` or `level: 'CHEATER'` -> DENIED.
9. **Blanket Query Scraping**: Attempting to list all materials across the entire platform without a userId filter -> DENIED.
10. **Immutable Field Modification**: Attempting to change `createdAt` or `userId` on existing study material -> DENIED.
11. **Negative Score Injection**: Attempting to write `score: -50` or `score: 9999` -> DENIED.
12. **Session Hijacking**: Attempting to write dialogue messages to another student's active lecture session -> DENIED.
