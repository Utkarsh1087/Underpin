# Bug Report & Findings

While exploring the API and writing unit and integration tests, I ran into a few bugs and unexpected behaviors in the original code. Below is a breakdown of what I found, how I spotted them, and how I fixed them.

---

### 1. Page 1 Pagination Skipping the First 10 Tasks
* **The issue:** When requesting page 1 (`GET /tasks?page=1&limit=10`), the API was skipping items 1 to 10 and returning items 11 to 20 instead.
* **Why it happened:** In `taskService.js`, the offset calculation was written as `const offset = page * limit;`. Because pages are 1-indexed for API clients, `1 * 10` gave an offset of 10 instead of 0.
* **How I found it:** I wrote a unit test in `taskService.test.js` that seeded 15 tasks and fetched page 1 with a limit of 10. The test expected `"Task 1"` at index 0, but received `"Task 11"`.
* **The fix:** I updated the calculation to `(page - 1) * limit` and added a helper to ensure `page` and `limit` default to positive integers if invalid query parameters are passed.

---

### 2. Task Completion Resetting Priority to "Medium"
* **The issue:** Marking a task as complete (`PATCH /tasks/:id/complete`) was resetting any task's priority (even high or low priority ones) back to `'medium'`.
* **Why it happened:** Inside `completeTask(id)`, the returned object hardcoded `priority: 'medium'` alongside updating `status` to `'done'`.
* **How I found it:** I created a high-priority task in an integration test and marked it complete. I expected the completed task to stay `priority: 'high'`, but received `'medium'`.
* **The fix:** I removed `priority: 'medium'` from `completeTask()` so that updating status to `'done'` leaves the task's existing priority untouched.

---

### 3. Status Filtering Matching Partial Substrings
* **The issue:** Filtering by status (`GET /tasks?status=...`) returned loose substring matches instead of exact status matches.
* **Why it happened:** `getByStatus` was using `tasks.filter((t) => t.status.includes(status))`. If someone queried `?status=do`, it would match both `todo` and `done`.
* **How I found it:** I added an edge-case test searching for status `'do'`. I expected 0 results, but it returned `done` tasks.
* **The fix:** I changed `.includes(status)` to an exact match `t.status === status`.

---

### 4. Combining Status Filters and Pagination Ignored Page & Limit
* **The issue:** Sending a request like `GET /tasks?status=todo&page=1&limit=5` returned all `todo` tasks without applying pagination.
* **Why it happened:** In `routes/tasks.js`, `if (status)` returned early with `taskService.getByStatus(status)` before checking if `page` or `limit` were passed.
* **How I found it:** An integration test checking pagination on filtered tasks failed because it received all matching tasks regardless of the limit.
* **The fix:** I created `getFilteredAndPaginated(status, page, limit)` in `taskService.js` to handle filtering and paginating in one clean step.

---

### 5. Task Updates Overwriting Primary Key (`id`) and `createdAt`
* **The issue:** Sending a `PUT /tasks/:id` request with fields like `{ id: "custom-id", createdAt: "1970-01-01" }` allowed overwriting internal task properties.
* **Why it happened:** `taskService.update()` used object spread (`{ ...tasks[index], ...fields }`) without stripping immutable fields.
* **How I found it:** I wrote a unit test passing `{ id: "hacked-id" }` in the payload and noticed the task ID changed in memory.
* **The fix:** Destructured fields in `taskService.update()` to ignore `id` and `createdAt` from incoming payloads before merging updates.

---

### 6. Documentation Mismatch for Task Status Enums
* **The issue:** `README.md` listed status values as `pending | in-progress | completed`, but `validators.js` enforced `todo | in_progress | done`.
* **The fix:** Updated the documentation in `README.md` so future developers aren't confused by invalid status errors.
