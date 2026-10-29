# Technical Interview Guide & Architecture Defense — EnvisionStudio

This guide equips you with honest, precise explanations of every architectural decision, along with likely reviewer questions and answers in both English and Hinglish.

---

## 1. Executive Architecture Summary

> **English:**  
> "I built EnvisionStudio as a modular monolith using React, Vite, and TypeScript on the frontend, and Node.js with Express, Prisma, and SQLite on the backend. Project and Task have a one-to-many relationship with database-enforced cascade deletion. Deadlines are date-only ISO strings, validated as real calendar dates and formatted in UTC. Request bodies and filters use Zod, route IDs use strict positive-integer validation, and the UI uses project-scoped task routes to prevent cross-project task changes."

> **Hinglish:**  
> "Maine EnvisionStudio ko modular monolith ke format mein banaya hai—React + Vite frontend aur Express + Prisma + SQLite backend. Project aur Task ke beech 1:N relationship hai with database-level cascade delete. Deadlines date-only strings hain, valid calendar dates ke roop mein validate hote hain aur UTC mein format hote hain. Request bodies aur filters Zod se validate hote hain, route IDs positive integers check karte hain, aur UI project-scoped task routes use karti hai."

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
  "The API supports both global task endpoints and project-scoped routes. The UI uses `/api/projects/:projectId/tasks/:taskId`; those handlers verify the parent project and explicitly check `if (task.projectId !== projectId)`. If a client attempts to update Task 101 through Project 2's route, the server rejects it with HTTP 400 and code `CROSS_PROJECT_TASK_MISMATCH`."
- **Hinglish Answer:**  
  "API global aur project-scoped dono routes support karti hai. UI `/api/projects/:projectId/tasks/:taskId` use karti hai. Handler parent project check karta hai aur confirm karta hai ki task isi project ka hai. Mismatch par 400 error return hota hai."

---

### Q4: How is seed idempotency guaranteed?
- **English Answer:**  
  "The seed script runs inside a database transaction (`prisma.$transaction`). It deletes tasks before projects and inserts the 10 employer mock projects and 20 tasks. Repeated runs restore the same demo dataset; because it replaces existing records, I only run it against a demo or development database."
- **Hinglish Answer:**  
  "`seed.js` script database transaction ke andar chalta hai. Ye selected database ke existing records ko replace karke exact 10 projects aur 20 tasks insert karta hai. Ye demo reset command hai, isliye ise production data par run nahi karna chahiye."

---

### Q5: How do you avoid the N+1 query problem on the project list?
- **English Answer:**  
  "Rather than fetching projects and then issuing a separate count query for every project, I use Prisma's `_count` and select only task status for the list response. That avoids application-level N+1 calls; the server computes completed task counts before returning the response."
- **Hinglish Answer:**  
  "Har project ke tasks ginne ke liye alag-alag application queries nahi chalata. Prisma `_count` aur sirf task status select karta hai, aur server completed count calculate karta hai."

---

## 3. Honest Disclosures & Known Trade-offs

When speaking to a senior interviewer, demonstrating intellectual honesty about limitations builds strong credibility:

1. **Authentication:**
   - *Status:* Intentionally omitted because it was not in the assessment requirements.
   - *Defense:* "Adding mock passwords or unhashed demo logins introduces dangerous security vulnerabilities. If authentication was required, I would implement OAuth 2.0 or JWT session tokens with HTTP-only cookies and bcrypt password hashing."
2. **SQLite Concurrency:**
   - *Status:* SQLite uses file-level locking for writes.
   - *Defense:* "SQLite is ideal for single-container deployment. For high-concurrency multi-instance scaling, I would transition Prisma to a managed PostgreSQL cluster."
3. **Automated and Browser Testing:**
   - *Status:* 28 API integration tests and 4 client unit tests are automated. This audit also used headless Chrome for key navigation, filtering, CRUD, responsive rendering, and dialog keyboard checks; it does not include a full automated browser suite or screen-reader review.
