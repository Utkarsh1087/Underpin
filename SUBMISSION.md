# Take-Home Submission Notes

Hi there! Here is a summary of my submission for the **Untested API** take-home assignment.

---

## What I Did

1. **Wrote Unit & Integration Tests:**
   - Set up test suites in `tests/unit/` and `tests/integration/` using Jest and Supertest.
   - Reached **94.76% overall test coverage** (60 passing tests covering happy paths, edge cases, and bug regressions).

2. **Tracked Down & Fixed Bugs:**
   - Documented all findings in [`BUG_REPORT.md`](./BUG_REPORT.md).
   - Fixed the pagination offset calculation error.
   - Fixed the bug where completing a task forced its priority back to `'medium'`.
   - Fixed loose substring matching on status filters.
   - Fixed combined status + pagination queries in `GET /tasks`.
   - Prevented caller payloads from overwriting `id` and `createdAt` timestamps.

3. **Built the `PATCH /tasks/:id/assign` Endpoint:**
   - Added `validateAssignTask` to validate that `assignee` is a non-empty string.
   - Automatically trim whitespace around assignee names.
   - Handled `404` for missing tasks and `400` for invalid inputs.
   - Wrote unit and integration tests covering the new endpoint.

---

## Reflections & Answers

### 1. What would you test next if you had more time?
If I had another day on this project, I’d focus on:
- **Race conditions & concurrent operations:** Even though we're using an in-memory array right now, testing simultaneous updates or async completion calls on the same task ID would be a good check before moving to an async database.
- **Date parsing edge cases:** Adding more boundary tests around `dueDate` (like handling invalid ISO formats, past dates, or timezone offsets).
- **Request payload limits:** Testing how the API handles unexpectedly large JSON payloads or weird data types (like passing arrays/objects into string fields).

### 2. Anything that surprised you in the codebase?
- **The priority reset on task completion:** When I ran my integration test for `PATCH /tasks/:id/complete` on a high-priority task, I was surprised to see its priority change to `'medium'`. It stood out as a logic bug because marking a task done shouldn't change how urgent it originally was.
- **Substring status matching:** Using `.includes()` for status filtering in `taskService.getByStatus` was another interesting surprise—it showed how easy it is for small utility methods to leak unexpected results (like matching `done` when someone asks for `do`).

### 3. Questions I'd ask before shipping this to production:
- **Database & Persistence:** What database are we planning to move to (Postgres, MongoDB)? Also, will we stick with offset-based pagination or move to cursor-based pagination as task volume grows?
- **Auth & Permissions:** Should task assignment (`PATCH /tasks/:id/assign`) or deleting tasks require authentication/roles (like admin vs. regular user)?
- **Soft Deletes:** Do we want `DELETE /tasks/:id` to permanently remove tasks, or should we switch to soft deletes (`isArchived: true`) for audit trails?
- **Logging & Monitoring:** Should we add structured logging (e.g. Winston/Pino) to log status changes and task assignments for observability?
