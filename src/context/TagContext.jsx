import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTaskContext } from './TaskContext';
import { DataHydrationService } from '../common/utils/DataHydrationService';

const STORAGE_KEY = 'task-dashboard:tags';

const TagContext = createContext();

export const useTagContext = () => useContext(TagContext);

const loadTags = () => {
  try {
    const savedTags = localStorage.getItem(STORAGE_KEY);
    if (savedTags) {
      const parsedTags = JSON.parse(savedTags);
      if (Array.isArray(parsedTags)) {
        return parsedTags;
      }
    }
  } catch (error) {
    console.error('Impossibile leggere i tag salvati:', error);
  }

  return DataHydrationService.shouldHydrate()
    ? DataHydrationService.getInitialTags()
    : [];
};

export const TagProvider = ({ children }) => {
  const [tags, setTags] = useState(loadTags);
  const { tasks } = useTaskContext();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error('Impossibile salvare i tag:', error);
    }
  }, [tags]);

  useEffect(() => {
    const uniqueTags = new Set(tags);

    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => uniqueTags.add(tag));
      }
    });

    setTags(Array.from(uniqueTags));
  }, [tasks]);

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const editTag = (oldTag, newTag) => {
    setTags(tags.map(tag => tag === oldTag ? newTag : tag));
  };

  const deleteTag = (tagToDelete) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleManageTags = (operation, oldTag, newTag = null) => {
    switch (operation) {
      case 'add':
        addTag(oldTag);
        break;
      case 'edit':
        editTag(oldTag, newTag);
        break;
      case 'delete':
        deleteTag(oldTag);
        break;
      default:
        break;
    }
  };

  return (
    <TagContext.Provider
      value={{
        tags,
        addTag,
        editTag,
        deleteTag,
        handleManageTags
      }}
    >
      {children}
    </TagContext.Provider>
  );
};
