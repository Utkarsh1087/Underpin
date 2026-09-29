const taskService = require('../../src/services/taskService');

describe('TaskService Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create()', () => {
    it('should create a task with default values for status, priority, description, and null assignee', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.assignee).toBeNull();
      expect(task).toHaveProperty('createdAt');
    });

    it('should create a task with provided custom fields', () => {
      const dueDate = new Date().toISOString();
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Detailed description',
        status: 'in_progress',
        priority: 'high',
        dueDate,
      });

      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Detailed description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });
  });

  describe('getAll()', () => {
    it('should return an empty array initially', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    it('should return all created tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const tasks = taskService.getAll();
      expect(tasks.length).toBe(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });

    it('should return a shallow copy of tasks array to prevent external direct array mutation', () => {
      taskService.create({ title: 'Task 1' });
      const tasks = taskService.getAll();
      tasks.push({ title: 'Fake Task' });
      expect(taskService.getAll().length).toBe(1);
    });
  });

  describe('findById()', () => {
    it('should return task when matching ID exists', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should return undefined when ID does not exist', () => {
      expect(taskService.findById('non-existent-id')).toBeUndefined();
    });
  });

  describe('getByStatus()', () => {
    it('should filter tasks strictly by exact status', () => {
      taskService.create({ title: 'Todo 1', status: 'todo' });
      taskService.create({ title: 'In Progress 1', status: 'in_progress' });
      taskService.create({ title: 'Done 1', status: 'done' });

      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks.length).toBe(1);
      expect(todoTasks[0].title).toBe('Todo 1');

      const inProgressTasks = taskService.getByStatus('in_progress');
      expect(inProgressTasks.length).toBe(1);
      expect(inProgressTasks[0].title).toBe('In Progress 1');
    });

    it('should NOT return tasks with partial string match (edge case bug test)', () => {
      taskService.create({ title: 'Done Task', status: 'done' });
      // Searching for 'do' should NOT match 'done' if status check is exact
      const partialMatch = taskService.getByStatus('do');
      expect(partialMatch.length).toBe(0);
    });
  });

  describe('getPaginated()', () => {
    beforeEach(() => {
      for (let i = 1; i <= 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }
    });

    it('should return first page (items 1-10) when page=1, limit=10', () => {
      const page1 = taskService.getPaginated(1, 10);
      expect(page1.length).toBe(10);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[9].title).toBe('Task 10');
    });

    it('should return second page (items 11-15) when page=2, limit=10', () => {
      const page2 = taskService.getPaginated(2, 10);
      expect(page2.length).toBe(5);
      expect(page2[0].title).toBe('Task 11');
      expect(page2[4].title).toBe('Task 15');
    });

    it('should return empty array if page is out of bounds', () => {
      const page3 = taskService.getPaginated(3, 10);
      expect(page3).toEqual([]);
    });

    it('should default to page 1 and limit 10 if invalid arguments provided', () => {
      const defaultPage = taskService.getPaginated(0, -5);
      expect(defaultPage.length).toBe(10);
      expect(defaultPage[0].title).toBe('Task 1');
    });
  });

  describe('getStats()', () => {
    it('should calculate counts by status accurately', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'todo' });
      taskService.create({ title: 'Task 3', status: 'in_progress' });
      taskService.create({ title: 'Task 4', status: 'done' });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(0);
    });

    it('should count overdue tasks when dueDate is in the past and status is not done', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day ahead

      taskService.create({ title: 'Overdue Todo', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'Overdue InProgress', status: 'in_progress', dueDate: pastDate });
      taskService.create({ title: 'Overdue Done (Ignored)', status: 'done', dueDate: pastDate });
      taskService.create({ title: 'Future Task', status: 'todo', dueDate: futureDate });

      const stats = taskService.getStats();
      expect(stats.overdue).toBe(2);
    });
  });

  describe('update()', () => {
    it('should update existing task fields', () => {
      const created = taskService.create({ title: 'Original Title' });
      const updated = taskService.update(created.id, { title: 'Updated Title', priority: 'high' });

      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe('high');
      expect(taskService.findById(created.id).title).toBe('Updated Title');
    });

    it('should return null when updating non-existent task', () => {
      const res = taskService.update('non-existent', { title: 'New' });
      expect(res).toBeNull();
    });

    it('should prevent mutating immutable fields (id, createdAt)', () => {
      const created = taskService.create({ title: 'Immutable Test' });
      const originalId = created.id;
      const originalCreatedAt = created.createdAt;

      const updated = taskService.update(created.id, { id: 'hacked-id', createdAt: '1970-01-01T00:00:00.000Z' });
      expect(updated.id).toBe(originalId);
      expect(updated.createdAt).toBe(originalCreatedAt);
    });
  });

  describe('remove()', () => {
    it('should remove existing task and return true', () => {
      const created = taskService.create({ title: 'Delete Me' });
      const result = taskService.remove(created.id);
      expect(result).toBe(true);
      expect(taskService.findById(created.id)).toBeUndefined();
    });

    it('should return false when trying to remove non-existent task', () => {
      expect(taskService.remove('fake-id')).toBe(false);
    });
  });

  describe('completeTask()', () => {
    it('should mark task status as done and set completedAt date', () => {
      const created = taskService.create({ title: 'Finish Me', priority: 'high' });
      const completed = taskService.completeTask(created.id);

      expect(completed.status).toBe('done');
      expect(completed.completedAt).not.toBeNull();
      expect(new Date(completed.completedAt).getTime()).not.toBeNaN();
    });

    it('should PRESERVE original priority when task is completed (bug fix test)', () => {
      const createdHigh = taskService.create({ title: 'High Priority Task', priority: 'high' });
      const completedHigh = taskService.completeTask(createdHigh.id);
      expect(completedHigh.priority).toBe('high');

      const createdLow = taskService.create({ title: 'Low Priority Task', priority: 'low' });
      const completedLow = taskService.completeTask(createdLow.id);
      expect(completedLow.priority).toBe('low');
    });

    it('should return null when completing non-existent task', () => {
      expect(taskService.completeTask('fake-id')).toBeNull();
    });
  });

  describe('assignTask()', () => {
    it('should assign a task to a user and return the updated task', () => {
      const task = taskService.create({ title: 'Unassigned Task' });
      const assigned = taskService.assignTask(task.id, 'Alice Developer');

      expect(assigned).toBeDefined();
      expect(assigned.assignee).toBe('Alice Developer');
      expect(taskService.findById(task.id).assignee).toBe('Alice Developer');
    });

    it('should return null if task does not exist', () => {
      const res = taskService.assignTask('invalid-id', 'Alice');
      expect(res).toBeNull();
    });
  });
});
