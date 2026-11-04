import React, { createContext, useState, useContext, useEffect } from 'react';
import { DataHydrationService } from '../common/utils/DataHydrationService';

const STORAGE_KEY = 'task-dashboard:lists';

const ListContext = createContext();

export const useListContext = () => useContext(ListContext);

const loadTaskLists = () => {
  try {
    const savedLists = localStorage.getItem(STORAGE_KEY);
    if (savedLists) {
      const parsedLists = JSON.parse(savedLists);
      if (Array.isArray(parsedLists) && parsedLists.length > 0) {
        return parsedLists;
      }
    }
  } catch (error) {
    console.error('Impossibile leggere le liste salvate:', error);
  }

  return DataHydrationService.shouldHydrate()
    ? DataHydrationService.getInitialTaskLists()
    : [{ id: 'default', title: 'All Tasks', filters: [] }];
};

export const ListProvider = ({ children }) => {
  const [taskLists, setTaskLists] = useState(loadTaskLists);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskLists));
    } catch (error) {
      console.error('Impossibile salvare le liste:', error);
    }
  }, [taskLists]);

  const addTaskList = () => {
    const newList = {
      id: `list-${Date.now()}`,
      title: 'New List',
      filters: []
    };
    setTaskLists([...taskLists, newList]);
    return newList;
  };

  const updateTaskList = (id, updates) => {
    setTaskLists(
      taskLists.map(list => 
        list.id === id ? { ...list, ...updates } : list
      )
    );
  };

  const deleteTaskList = (id) => {
    if (id === 'default') return;
    setTaskLists(taskLists.filter(list => list.id !== id));
  };

  const getFilteredTasks = (filterConfig, tasks) => {
    if (!filterConfig || filterConfig.length === 0) {
      return tasks;
    }

    return tasks.filter(task => {
      return filterConfig.every(filter => {
        if (filter.type === 'tag') {
          return task.tags && task.tags.includes(filter.value);
        }
        if (filter.type === 'completed') {
          return task.isCompleted === filter.value;
        }
        return true;
      });
    });
  };

  return (
    <ListContext.Provider
      value={{
        taskLists,
        addTaskList,
        updateTaskList,
        deleteTaskList,
        getFilteredTasks
      }}
    >
      {children}
    </ListContext.Provider>
  );
};
