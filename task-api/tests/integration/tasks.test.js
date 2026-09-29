const request = require('supertest');
const app = require('../../src/app');
const taskService = require('../../src/services/taskService');

describe('Tasks API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /', () => {
    it('should return 200 with API status message and available endpoints', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return 200 and initial stats counts', async () => {
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0,
      });
    });

    it('should accurately calculate task counts and overdue tasks', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      taskService.create({ title: 'Task 1', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done' });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body.todo).toBe(1);
      expect(res.body.in_progress).toBe(1);
      expect(res.body.done).toBe(1);
      expect(res.body.overdue).toBe(1);
    });
  });

  describe('GET /tasks', () => {
    it('should return empty list when no tasks exist', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should list all tasks', async () => {
      taskService.create({ title: 'Task A' });
      taskService.create({ title: 'Task B' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task A');
      expect(res.body[1].title).toBe('Task B');
    });

    it('should filter tasks by status (GET /tasks?status=in_progress)', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });

      const res = await request(app).get('/tasks?status=in_progress');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Task 2');
    });

    it('should paginate task list (GET /tasks?page=1&limit=2)', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

    it('should support combined status filtering and pagination (GET /tasks?status=todo&page=1&limit=1)', async () => {
      taskService.create({ title: 'Todo 1', status: 'todo' });
      taskService.create({ title: 'Todo 2', status: 'todo' });
      taskService.create({ title: 'Done 1', status: 'done' });

      const res = await request(app).get('/tasks?status=todo&page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Todo 1');
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return task when matching ID exists', async () => {
      const task = taskService.create({ title: 'Fetch Me' });
      const res = await request(app).get(`/tasks/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
      expect(res.body.title).toBe('Fetch Me');
    });

    it('should return 404 Not Found if task ID does not exist', async () => {
      const res = await request(app).get('/tasks/non-existent-uuid');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });
  });

  describe('POST /tasks', () => {
    it('should create a task and return 201 with created object', async () => {
      const payload = {
        title: 'New Feature Task',
        description: 'Build endpoint',
        priority: 'high',
      };

      const res = await request(app).post('/tasks').send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(payload.title);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.status).toBe('todo');
      expect(res.body.priority).toBe('high');
      expect(res.body.assignee).toBeNull();
    });

    it('should return 400 Bad Request when title is missing', async () => {
      const res = await request(app).post('/tasks').send({ description: 'No title' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 Bad Request when status is invalid', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Bad Status', status: 'unknown' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be one of');
    });

    it('should return 400 Bad Request when dueDate is invalid ISO string', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Bad Date', dueDate: 'invalid-date' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('dueDate must be a valid ISO date string');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update an existing task and return 200', async () => {
      const task = taskService.create({ title: 'Old Title', status: 'todo' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'Updated Title', status: 'in_progress', priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('in_progress');
      expect(res.body.priority).toBe('high');
    });

    it('should return 404 Not Found when updating non-existent task ID', async () => {
      const res = await request(app)
        .put('/tasks/non-existent-uuid')
        .send({ title: 'New Title' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });

    it('should return 400 Bad Request when update payload validation fails', async () => {
      const task = taskService.create({ title: 'Valid Task' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ priority: 'super_high' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('priority must be one of');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete existing task and return 204 No Content', async () => {
      const task = taskService.create({ title: 'To Delete' });

      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);
      expect(res.text).toBe('');

      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return 404 Not Found when deleting non-existent task ID', async () => {
      const res = await request(app).delete('/tasks/non-existent-uuid');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark task as complete, set completedAt, and preserve priority', async () => {
      const task = taskService.create({ title: 'Task to Complete', priority: 'high' });

      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.priority).toBe('high');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should return 404 Not Found when completing non-existent task ID', async () => {
      const res = await request(app).patch('/tasks/non-existent-uuid/complete');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should assign a user to the task and return 200 with updated task', async () => {
      const task = taskService.create({ title: 'Task for Assignment' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Charlie Engineer' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
      expect(res.body.assignee).toBe('Charlie Engineer');
    });

    it('should return 404 Not Found if task ID does not exist', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-uuid/assign')
        .send({ assignee: 'Charlie' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Task not found' });
    });

    it('should return 400 Bad Request if assignee field is missing or empty', async () => {
      const task = taskService.create({ title: 'Unassigned' });

      const res1 = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({});
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '   ' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('assignee is required and must be a non-empty string');
    });
  });
});
