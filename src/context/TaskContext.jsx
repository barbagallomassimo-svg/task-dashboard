import React, { createContext, useState, useContext, useEffect } from 'react';
import { DataHydrationService } from '../common/utils/DataHydrationService';

const STORAGE_KEY = 'task-dashboard:tasks';

const TaskContext = createContext();

export const useTaskContext = () => useContext(TaskContext);

const loadTasks = () => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      if (Array.isArray(parsedTasks)) {
        return parsedTasks;
      }
    }
  } catch (error) {
    console.error('Impossibile leggere le attività salvate:', error);
  }

  return DataHydrationService.shouldHydrate()
    ? DataHydrationService.getInitialTasks()
    : [];
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState(loadTasks);
  const [stats, setStats] = useState({ total: 0, completed: 0, remaining: 0 });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Impossibile salvare le attività:', error);
    }

    const completed = tasks.filter(task => task.isCompleted).length;
    setStats({
      total: tasks.length,
      completed,
      remaining: tasks.length - completed
    });
  }, [tasks]);

  const addTask = (task) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const newTask = { id, ...task };
    setTasks([...tasks, newTask]);
    return newTask;
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const completeAllTasks = (taskIds = null) => {
    if (taskIds) {
      setTasks(tasks.map(task => 
        taskIds.includes(task.id) ? { ...task, isCompleted: true } : task
      ));
    } else {
      setTasks(tasks.map(task => ({ ...task, isCompleted: true })));
    }
  };

  const deleteCompletedTasks = (taskIds = null) => {
    if (taskIds && taskIds.length > 0) {
      setTasks(tasks.filter(task => !taskIds.includes(task.id)));
    } else {
      setTasks(tasks.filter(task => !task.isCompleted));
    }
  };

  const updateTasksWithEditedTag = (oldTag, newTag) => {
    setTasks(tasks.map(task => {
      if (task.tags && task.tags.includes(oldTag)) {
        const updatedTags = task.tags.map(tag => 
          tag === oldTag ? newTag : tag
        );
        return { ...task, tags: updatedTags };
      }
      return task;
    }));
  };

  const updateTasksWithDeletedTag = (tagToDelete) => {
    setTasks(tasks.map(task => {
      if (task.tags && task.tags.includes(tagToDelete)) {
        const updatedTags = task.tags.filter(tag => tag !== tagToDelete);
        return { ...task, tags: updatedTags };
      }
      return task;
    }));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        stats,
        addTask,
        toggleTask,
        deleteTask,
        completeAllTasks,
        deleteCompletedTasks,
        updateTasksWithEditedTag,
        updateTasksWithDeletedTag
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
