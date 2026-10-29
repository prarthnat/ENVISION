# Technical Interview Guide & Architecture Defense — EnvisionStudio

This guide equips you with honest, precise explanations of every architectural decision, along with likely reviewer questions and answers in both English and Hinglish.

---

## 1. Executive Architecture Summary

> **English:**  
> "I built EnvisionStudio as a modular monolith using React, Vite, and TypeScript on the frontend, and Node.js with Express, Prisma, and SQLite on the backend. I modeled Project and Task with a strict one-to-many relationship and database-enforced cascade deletion. Deadlines are treated as date-only ISO strings parsed in UTC to eliminate timezone displacement. All endpoints enforce Zod validation, and task endpoints are strictly scoped to the parent project to prevent cross-project task tampering."

> **Hinglish:**  
> "Maine EnvisionStudio ko modular monolith ke format mein banaya hai—React + Vite frontend aur Express + Prisma + SQLite backend. Project aur Task ke beech 1:N relationship hai with database-level cascade delete. Deadlines ko date-only string ki tarah store aur UTC mein parse kiya hai taaki timezone offset ka koi bug na aaye. Saari routes Zod se validate hoti hain aur task routes project ke under scoped hain taaki cross-project manipulation na ho sake."

---

## 2. Likely Technical Interview Questions & Answers

### Q1: Why did you choose SQLite over PostgreSQL?
- **English Answer:**  
  "For this practical assessment, SQLite provides an embedded, persistent relational database that requires zero infrastructure setup for reviewers. It eliminates external Docker or cloud database dependencies. Because I used Prisma as the ORM abstraction layer, migrating to PostgreSQL in a production scale-out scenario requires only updating `provider = 'postgresql'` in the schema and changing the connection string."
- **Hinglish Answer:**  
  "Assessment review ke liye SQLite perfect hai kyunki reviewer ko koi external Postgres container ya cloud credentials setup nahi karne padte—sirf `npm run dev` se chal jata hai. Aur kyunki Prisma ORM use kiya hai, agar future mein Postgres pe jana ho toh sirf schema mein provider change karna hoga."

---

### Q2: How did you solve the date-only timezone shift issue?
- **English Answer:**  
  "A common bug in full-stack web development occurs when date-only values like `2026-08-15` are stored as full timestamps or parsed using `new Date('2026-08-15')`. In browser environments west of UTC, local midnight is shifted to 8:00 PM the previous evening (`Aug 14`). I solved this by storing the deadline as a strict `YYYY-MM-DD` string in SQLite, validated via regex, and parsed using `Date.UTC(year, month - 1, day)` on the frontend. This guarantees zero date drift across all client devices."
- **Hinglish Answer:**  
  "Jab date ko timestamp ki tarah store karte hain, toh US timezones mein midnight subtract hoke ek din pehle dikhai deti hai (`Aug 14` instead of `Aug 15`). Maine deadline ko strict `YYYY-MM-DD` string format mein SQLite mein rakha aur frontend pe `Date.UTC` use karke format kiya. Isse worldwide kisi bhi browser timezone mein date exactly sahi dikhti hai."

---

### Q3: How do you prevent cross-project task tampering?
- **English Answer:**  
  "Instead of using unconstrained task endpoints like `PUT /api/tasks/:id`, I implemented scoped routes: `/api/projects/:projectId/tasks/:taskId`. When a request arrives, the route handler verifies that the parent project exists, and explicitly checks `if (task.projectId !== projectId)`. If a client attempts to update Task 101 through Project 2's route, the server immediately rejects the request with HTTP 400 and code `CROSS_PROJECT_TASK_MISMATCH`."
- **Hinglish Answer:**  
  "Direct `/api/tasks/:id` route use karne se koi bhi kisi dusre project ka task modify kar sakta tha. Maine routes ko project-scoped banaya: `/api/projects/:projectId/tasks/:taskId`. Handler pehle project check karta hai, fir check karta hai ki kya ye task isi project ka hai. Agar match nahi hota toh turant 400 rejection bhejta hai."

---

### Q4: How is seed idempotency guaranteed?
- **English Answer:**  
  "The seed script runs inside a database transaction (`prisma.$transaction`). It executes `task.deleteMany()` followed by `project.deleteMany()`, and then inserts the 10 employer mock projects and 20 tasks. This guarantees that running `npm run seed` multiple times always results in the exact same 10 projects and 20 tasks without duplicates or primary key sequence collisions."
- **Hinglish Answer:**  
  "`seed.ts` script database transaction ke andar chalta hai. Pehle existing records safely delete karta hai, fir exact 10 projects aur 20 tasks insert karta hai. Is wajah se chahe reviewer 10 baar bhi seed command run kare, database mein koi duplicate data create nahi hota."

---

### Q5: How do you avoid the N+1 query problem on the project list?
- **English Answer:**  
  "Rather than fetching projects and then executing 10 separate queries to count tasks for each project, I leveraged Prisma's `include: { _count: { select: { tasks: true } }, tasks: { select: { status: true } } }`. Prisma batches this into a single optimized query with SQL joins, allowing the server to calculate total tasks and completed tasks in memory before returning the response."
- **Hinglish Answer:**  
  "Har project ke tasks ginne ke liye alag-alag queries run karne se N+1 problem aati hai. Maine Prisma ka `_count` aur selective field inclusion use kiya jo ek single SQL query mein execute hota hai. Isse database round-trips minimize ho jaate hain."

---

## 3. Honest Disclosures & Known Trade-offs

When speaking to a senior interviewer, demonstrating intellectual honesty about limitations builds strong credibility:

1. **Authentication:**
   - *Status:* Intentionally omitted because it was not in the assessment requirements.
   - *Defense:* "Adding mock passwords or unhashed demo logins introduces dangerous security vulnerabilities. If authentication was required, I would implement OAuth 2.0 or JWT session tokens with HTTP-only cookies and bcrypt password hashing."
2. **SQLite Concurrency:**
   - *Status:* SQLite uses file-level locking for writes.
   - *Defense:* "SQLite is ideal for single-container deployment. For high-concurrency multi-instance scaling, I would transition Prisma to a managed PostgreSQL cluster."
3. **Automated E2E Testing:**
   - *Status:* Full API integration tests (22 tests) and client unit tests (3 tests) are automated. Full browser E2E (Playwright) was manually smoke-tested due to time boxing.
