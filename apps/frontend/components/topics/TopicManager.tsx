'use client';

import { useEffect, useState, useTransition } from 'react';
import { createTopicAction, deleteTopicAction, updateTopicAction } from '../../lib/topics/actions';
import type { Topic } from '../../lib/types';
import { TopicCard } from './TopicCard';
import { TopicForm } from './TopicForm';

interface TopicManagerProps {
  topics: Topic[];
}

export function TopicManager({ topics }: TopicManagerProps) {
  const [topicList, setTopicList] = useState(topics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    setTopicList(topics);
  }, [topics]);

  const handleCreateSuccess = (topic: Topic) => {
    setTopicList((prev) => {
      const filtered = prev.filter((item) => item.id !== topic.id);
      return [topic, ...filtered];
    });
  };

  const handleUpdateSuccess = (topic: Topic) => {
    setTopicList((prev) => prev.map((item) => (item.id === topic.id ? topic : item)));
    setEditingId(null);
  };

  const handleDelete = (topicId: string) => {
    setDeleteError(null);
    setDeletingId(topicId);
    startDeleteTransition(async () => {
      try {
        const result = await deleteTopicAction(topicId);
        if (result.success) {
          setTopicList((prev) => prev.filter((item) => item.id !== topicId));
        } else if (result.error) {
          setDeleteError(result.error);
        }
      } catch (error) {
        console.error(error);
        setDeleteError('Unable to delete topic right now.');
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="topics-page">
      <section className="topics-page__intro">
        <h1>Topics</h1>
        <p>Manage the filters TrendSurf uses when ingesting new papers.</p>
      </section>
      <section className="topics-page__create">
        <h2>Create a topic</h2>
        <TopicForm action={createTopicAction} submitLabel="Create topic" onSuccess={handleCreateSuccess} />
      </section>
      <section className="topics-page__list">
        <h2>Existing topics</h2>
        {topicList.length === 0 ? (
          <div className="empty-state">
            <p>No topics yet. Create one to start tracking arXiv.</p>
          </div>
        ) : (
          <ul className="topics-page__grid">
            {topicList.map((topic) => (
              <li key={topic.id}>
                {editingId === topic.id ? (
                  <TopicForm
                    action={updateTopicAction.bind(null, topic.id)}
                    initialValues={{
                      name: topic.name,
                      description: topic.description,
                      filters: topic.filters
                    }}
                    submitLabel="Save changes"
                    onCancel={() => setEditingId(null)}
                    onSuccess={handleUpdateSuccess}
                  />
                ) : (
                  <TopicCard
                    topic={topic}
                    onEdit={() => setEditingId(topic.id)}
                    onDelete={() => handleDelete(topic.id)}
                    deleting={isDeleting && deletingId === topic.id}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {deleteError ? <p className="form-error">{deleteError}</p> : null}
      </section>
    </div>
  );
}
