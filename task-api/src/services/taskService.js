const { v4: uuidv4 } = require('uuid');

let tasks = [];

const parsePositiveInt = (val, defaultVal) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) || parsed <= 0 ? defaultVal : parsed;
};

const getAll = () => [...tasks];

const findById = (id) => tasks.find((t) => t.id === id);

const getByStatus = (status) => tasks.filter((t) => t.status === status);

const getPaginated = (page, limit) => {
  const pageNum = parsePositiveInt(page, 1);
  const limitNum = parsePositiveInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;
  return tasks.slice(offset, offset + limitNum);
};

const getFilteredAndPaginated = (status, page, limit) => {
  let filtered = tasks;
  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }

  if (page !== undefined || limit !== undefined) {
    const pageNum = parsePositiveInt(page, 1);
    const limitNum = parsePositiveInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    return filtered.slice(offset, offset + limitNum);
  }

  return filtered;
};

const getStats = () => {
  const now = new Date();
  const counts = { todo: 0, in_progress: 0, done: 0 };
  let overdue = 0;

  tasks.forEach((t) => {
    if (counts[t.status] !== undefined) counts[t.status]++;
    if (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now) {
      overdue++;
    }
  });

  return { ...counts, overdue };
};

const create = ({ title, description = '', status = 'todo', priority = 'medium', dueDate = null, assignee = null }) => {
  const task = {
    id: uuidv4(),
    title,
    description,
    status,
    priority,
    dueDate,
    assignee: assignee ? assignee.trim() : null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  return task;
};

const update = (id, fields) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  // Protect immutable fields (id, createdAt) from being overwritten
  const { id: _, createdAt: __, ...updatableFields } = fields;

  if (updatableFields.assignee !== undefined) {
    updatableFields.assignee = updatableFields.assignee ? updatableFields.assignee.trim() : null;
  }

  const updated = { ...tasks[index], ...updatableFields };
  tasks[index] = updated;
  return updated;
};

const remove = (id) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  return true;
};

const completeTask = (id) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };

  const index = tasks.findIndex((t) => t.id === id);
  tasks[index] = updated;
  return updated;
};

const assignTask = (id, assignee) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    assignee: assignee.trim(),
  };

  const index = tasks.findIndex((t) => t.id === id);
  tasks[index] = updated;
  return updated;
};

const _reset = () => {
  tasks = [];
};

module.exports = {
  getAll,
  findById,
  getByStatus,
  getPaginated,
  getFilteredAndPaginated,
  getStats,
  create,
  update,
  remove,
  completeTask,
  assignTask,
  _reset,
};
