# DeadDrop Sprint 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the working Full-Stack DeadDrop application (Next.js Dev-Cyber frontend with Web Crypto AES-256-GCM, Spring Boot REST backend with atomic Redis burn-after-reading) and assemble the Sprint 2 academic deliverables.

**Architecture:** A lightweight 3-tier Zero-Knowledge distributed architecture. The Next.js frontend encrypts data locally and transmits only the encrypted payload to a stateless Spring Boot API, which persists it in Redis with atomic deletion (`GETDEL`) upon retrieval. The decryption key remains strictly on the client-side URL fragment (`#`).

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Web Crypto API, Java 17+, Spring Boot 3, Spring Data Redis, Docker Compose, JUnit 5, Python-docx.

**Spec:** `docs/superpowers/specs/2026-10-23-sprint-2-design.md`

## Global Constraints

- Zero-Knowledge strictly enforced: Secret decryption key MUST NOT be sent to the backend; it resides solely in the URL hash `#`.
- Atomic destruction: Secrets MUST be fetched and deleted in a single atomic step using Redis `opsForValue().getAndDelete()`.
- Simplicity (KISS): No relational databases, no complex OAuth servers, no unnecessary microservices.
- Visual style: Frontend strictly follows the Dev-Cyber Minimalist palette (Dark slate `#090D16`, `#0F172A`, Emerald accents `#10B981`).
- Document format: Academic deliverables must conform to ENIAC template standards.

## Review Focus

1. Attempting to retrieve a secret a second time returns HTTP 404 (burn-after-reading atomic verification).
2. Accessing a secret URL without the `#key` fragment displays a clear warning rather than throwing an unhandled exception.
3. Expired secrets in Redis (after TTL seconds) automatically return HTTP 404.
4. Multi-line sensitive texts (.env, RSA private keys) are encrypted and decrypted preserving exact formatting and UTF-8 encoding.
5. The Sprint 2 academic delivery document incorporates all evaluation criteria (practical architecture, methodology, visual evidence, costs).

---

### Task 1: Environment & Infrastructure Orchestration (Docker Compose)

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

**Interfaces:**
- Produces: Redis service available at `localhost:6379` with in-memory volatile TTL behavior.

- [ ] **Step 1: Write `docker-compose.yml`**
Define Redis 7 Alpine service with port mapping `6379:6379` and lightweight resource limits.

- [ ] **Step 2: Test Redis startup**
Run: `docker compose up -d redis`
Expected: Container `redis` running and responding `PONG` to `docker compose exec redis redis-cli ping`.

- [ ] **Step 3: Commit infrastructure configuration**
```bash
git add docker-compose.yml .env.example
git commit -m "chore: add docker-compose for local redis instance"
```

---

### Task 2: Backend Spring Boot REST API (Atomic Burn-After-Reading)

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/eniac/deaddrop/DeadDropApplication.java`
- Create: `backend/src/main/java/com/eniac/deaddrop/dto/SecretCreateRequest.java`
- Create: `backend/src/main/java/com/eniac/deaddrop/dto/SecretCreateResponse.java`
- Create: `backend/src/main/java/com/eniac/deaddrop/dto/SecretPayloadResponse.java`
- Create: `backend/src/main/java/com/eniac/deaddrop/service/SecretService.java`
- Create: `backend/src/main/java/com/eniac/deaddrop/controller/SecretController.java`
- Test: `backend/src/test/java/com/eniac/deaddrop/SecretServiceTest.java`

**Interfaces:**
- Consumes: Redis `RedisTemplate<String, String>`
- Produces:
  - `POST /api/secrets` -> `{ id: UUID }`
  - `GET /api/secrets/{id}` -> `{ encryptedPayload: String, iv: String }` (atomic deletion)

- [ ] **Step 1: Write failing unit test for `SecretService`**
Test `createSecret` storing payload and `getAndBurnSecret` returning payload on 1st call and `null`/empty on 2nd call.

- [ ] **Step 2: Run test to verify it fails**
Run: `mvn test -Dtest=SecretServiceTest`
Expected: Compilation failure or assertion failure (classes not implemented yet).

- [ ] **Step 3: Implement DTOs, Service and Controller**
- `SecretService`: uses `redisTemplate.opsForValue().set(key, json, ttl, TimeUnit.SECONDS)` and `opsForValue().getAndDelete(key)` for atomic burn.
- `SecretController`: exposes `/api/secrets` with CORS enabled for `http://localhost:3000`.

- [ ] **Step 4: Run unit tests to verify they pass**
Run: `mvn test`
Expected: All tests PASS.

- [ ] **Step 5: Commit backend implementation**
```bash
git add backend/
git commit -m "feat(backend): implement spring boot rest api with atomic redis getAndDelete"
```

---

### Task 3: Frontend Next.js Dev-Cyber Web Crypto Client

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/src/lib/crypto.ts`
- Create: `frontend/src/app/page.tsx` (Secret creation page)
- Create: `frontend/src/app/secret/[id]/page.tsx` (Secret reveal & burn confirmation page)
- Test: `frontend/src/lib/crypto.test.ts`

**Interfaces:**
- Consumes: Web Crypto API (`window.crypto.subtle`), Backend `/api/secrets`
- Produces:
  - `encryptSecret(text: string): Promise<{ ciphertext: string, iv: string, keyBase64: string }>`
  - `decryptSecret(ciphertext: string, iv: string, keyBase64: string): Promise<string>`

- [ ] **Step 1: Write tests for client-side crypto functions**
Test encryption and subsequent decryption of a sample string (e.g. `.env` content) matching original text.

- [ ] **Step 2: Run crypto tests to verify they pass**
Run: `npm test -- crypto.test.ts`
Expected: PASS.

- [ ] **Step 3: Implement Dev-Cyber creation UI (`page.tsx`)**
Integrate text area, expiration dropdown, AES-256 client encryption call, backend POST, and generated link display with copy button.

- [ ] **Step 4: Implement Dev-Cyber reveal UI (`secret/[id]/page.tsx`)**
Read key from `window.location.hash`, show "Revelar e Queimar" confirmation prompt, call `GET /api/secrets/{id}`, decrypt in browser, and display plaintext.

- [ ] **Step 5: Commit frontend implementation**
```bash
git add frontend/
git commit -m "feat(frontend): implement dev-cyber ui with client-side aes-256-gcm crypto"
```

---

### Task 4: Academic Delivery Artifacts (Sprint 2 Report Update)

**Files:**
- Create: `docs/diagrams/c4_containers.mermaid`
- Create: `docs/diagrams/sequence_flow.mermaid`
- Modify: `Sprint_2_DeadDrop_ENIAC.md`
- Create: `Sprint_2_Projeto_Integrador_DeadDrop.docx`

**Interfaces:**
- Consumes: Approved spec `docs/superpowers/specs/2026-10-23-sprint-2-design.md`, Sprint 1 docx template.
- Produces: Complete Sprint 2 delivery document formatted according to ENIAC standards.

- [ ] **Step 1: Write Mermaid diagrams for architecture and sequence flow**
Save clear, readable diagrams in `docs/diagrams/`.

- [ ] **Step 2: Update markdown summary `Sprint_2_DeadDrop_ENIAC.md`**
Incorporate sections: Solution Design, Methodology (3-Sprint Agile, Tools, ADRs), Visual Evidence, and Resource/Cost Estimation.

- [ ] **Step 3: Generate updated Word Document (`Sprint_2_Projeto_Integrador_DeadDrop.docx`)**
Use Python script with `python-docx` to format paragraphs, tables, and sections seamlessly maintaining Open Sans font and official header/footer.

- [ ] **Step 4: Verify document integrity**
Verify paragraphs and tables count in generated docx.

- [ ] **Step 5: Commit academic documents**
```bash
git add docs/diagrams/ Sprint_2*
git commit -m "docs: finalize sprint 2 academic report and diagrams"
```
