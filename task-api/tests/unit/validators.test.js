const { validateCreateTask, validateUpdateTask, validateAssignTask } = require('../../src/utils/validators');

describe('Validators Unit Tests', () => {
  describe('validateCreateTask()', () => {
    it('should return null for valid task data', () => {
      const valid = {
        title: 'Buy groceries',
        description: 'Milk, Eggs, Bread',
        status: 'todo',
        priority: 'high',
        dueDate: new Date().toISOString(),
      };
      expect(validateCreateTask(valid)).toBeNull();
    });

    it('should return error if title is missing', () => {
      expect(validateCreateTask({})).toBe('title is required and must be a non-empty string');
    });

    it('should return error if title is empty or not string', () => {
      expect(validateCreateTask({ title: '   ' })).toBe('title is required and must be a non-empty string');
      expect(validateCreateTask({ title: 123 })).toBe('title is required and must be a non-empty string');
    });

    it('should return error for invalid status', () => {
      expect(validateCreateTask({ title: 'Valid', status: 'invalid_status' }))
        .toBe('status must be one of: todo, in_progress, done');
    });

    it('should return error for invalid priority', () => {
      expect(validateCreateTask({ title: 'Valid', priority: 'urgent' }))
        .toBe('priority must be one of: low, medium, high');
    });

    it('should return error for invalid dueDate string', () => {
      expect(validateCreateTask({ title: 'Valid', dueDate: 'not-a-date' }))
        .toBe('dueDate must be a valid ISO date string');
    });
  });

  describe('validateUpdateTask()', () => {
    it('should return null for empty body or partial valid updates', () => {
      expect(validateUpdateTask({})).toBeNull();
      expect(validateUpdateTask({ status: 'done' })).toBeNull();
    });

    it('should return error if title is provided but invalid', () => {
      expect(validateUpdateTask({ title: '' })).toBe('title must be a non-empty string');
      expect(validateUpdateTask({ title: 456 })).toBe('title must be a non-empty string');
    });

    it('should return error for invalid status in update', () => {
      expect(validateUpdateTask({ status: 'pending' })).toBe('status must be one of: todo, in_progress, done');
    });

    it('should return error for invalid priority in update', () => {
      expect(validateUpdateTask({ priority: 'critical' })).toBe('priority must be one of: low, medium, high');
    });

    it('should return error for invalid dueDate in update', () => {
      expect(validateUpdateTask({ dueDate: '2025-99-99' })).toBe('dueDate must be a valid ISO date string');
    });
  });

  describe('validateAssignTask()', () => {
    it('should return null for valid string assignee', () => {
      expect(validateAssignTask({ assignee: 'Bob Martin' })).toBeNull();
    });

    it('should return error if assignee is missing or not a string', () => {
      expect(validateAssignTask({})).toBe('assignee is required and must be a non-empty string');
      expect(validateAssignTask({ assignee: 12345 })).toBe('assignee is required and must be a non-empty string');
      expect(validateAssignTask({ assignee: null })).toBe('assignee is required and must be a non-empty string');
    });

    it('should return error if assignee is empty or whitespace only', () => {
      expect(validateAssignTask({ assignee: '' })).toBe('assignee is required and must be a non-empty string');
      expect(validateAssignTask({ assignee: '   ' })).toBe('assignee is required and must be a non-empty string');
    });
  });
});
