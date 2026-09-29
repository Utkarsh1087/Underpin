# Take-Home Assignment — The Untested API

A 2-day take-home assignment codebase. Fully tested, debugged, and enhanced with new features.

See **[SUBMISSION.md](./SUBMISSION.md)** for developer notes, reflection, and submission details.  
See **[BUG_REPORT.md](./BUG_REPORT.md)** for the detailed bug report and resolutions.

---

## Quickstart

**Prerequisites:** Node.js 18+

```bash
cd task-api
npm install
npm start        # runs on http://localhost:3000
```

**Running Tests & Coverage:**

```bash
cd task-api
npm test           # run 60 unit & integration tests
npm run coverage   # run tests with coverage report (94%+ coverage)
```

---

## Project Structure

```
.
├── ASSIGNMENT.md               # Original assignment brief
├── BUG_REPORT.md               # Detailed bug report and resolutions
├── SUBMISSION.md               # Reflection and submission notes
└── task-api/
    ├── src/
    │   ├── app.js              # Express app setup
    │   ├── routes/tasks.js     # Route handlers
    │   ├── services/taskService.js # Business logic & in-memory data store
    │   └── utils/validators.js # Input validation helpers
    ├── tests/
    │   ├── unit/
    │   │   ├── taskService.test.js # Service unit tests
    │   │   └── validators.test.js  # Validator unit tests
    │   └── integration/
    │       └── tasks.test.js   # API route integration tests
    ├── package.json
    └── jest.config.js
```

---

## API Reference

| Method   | Path                      | Description                              |
|----------|---------------------------|------------------------------------------|
| `GET`    | `/tasks`                  | List all tasks. Supports `?status=`, `?page=`, `?limit=` |
| `POST`   | `/tasks`                  | Create a new task                        |
| `PUT`    | `/tasks/:id`              | Full update of a task                    |
| `DELETE` | `/tasks/:id`              | Delete a task (returns 204)              |
| `PATCH`  | `/tasks/:id/complete`     | Mark a task as complete                  |
| `GET`    | `/tasks/stats`            | Counts by status + overdue count         |
| `PATCH`  | `/tasks/:id/assign`       | **Assign a task to a user**              |

### Task shape

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "assignee": "string | null",
  "dueDate": "ISO 8601 or null",
  "completedAt": "ISO 8601 or null",
  "createdAt": "ISO 8601"
}
```

### Sample requests

**Create a task**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write tests", "priority": "high"}'
```

**Assign a task**
```bash
curl -X PATCH http://localhost:3000/tasks/<id>/assign \
  -H "Content-Type: application/json" \
  -d '{"assignee": "Alice Developer"}'
```

**List tasks with filter and pagination**
```bash
curl "http://localhost:3000/tasks?status=todo&page=1&limit=10"
```
