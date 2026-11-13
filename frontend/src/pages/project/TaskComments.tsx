import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { EditIcon, TrashIcon } from '../../components/icons';
import styles from './TaskComments.module.css';

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    author: { id: number; email: string };
}

interface Props {
    projectId: string;
    taskId: string;
}

export function TaskComments({ projectId, taskId }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(true);

    const { user, isAdmin } = useAuth();

    const fetchComments = () => {
        apiFetch<Comment[]>(`/api/projects/${projectId}/tasks/${taskId}/comments`)
            .then(setComments)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchComments();
    }, [projectId, taskId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await apiFetch(`/api/projects/${projectId}/tasks/${taskId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content: newComment })
            });
            setNewComment('');
            fetchComments();
        } catch (err) {
            alert('Ошибка добавления');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить комментарий?')) return;
        try {
            await apiFetch(`/api/comments/${id}`, { method: 'DELETE' });
            fetchComments();
        } catch (err) {
            alert('Ошибка удаления');
        }
    };

    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const handleUpdate = async (id: number) => {
        try {
            await apiFetch(`/api/comments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ content: editContent })
            });
            setEditingId(null);
            fetchComments();
        } catch (err) {
            alert('Ошибка сохранения');
        }
    };

    if (loading) return <div className={styles.loading}>Загрузка комментариев...</div>;

    return (
        <div className={styles.container}>
            <h3 className={styles.sectionTitle}>Комментарии ({comments.length})</h3>

            {/* Список комментариев */}
            <div className={styles.list}>
                {comments.map(comment => {
                    const isAuthor = comment.author?.email === user?.email;
                    const canManage = isAuthor || isAdmin;

                    return (
                        <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                <span className={styles.author}>{comment.author?.email || 'Пользователь'}</span>
                                <span className={styles.date}>
                                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                                </span>
                            </div>

                            {editingId === comment.id ? (
                                <div className={styles.editForm}>
                                    <textarea
                                        className={styles.textarea}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={2}
                                    />
                                    <div className={styles.editActions}>
                                        <Button onClick={() => handleUpdate(comment.id)} variant="success" style={{padding: '4px 12px', fontSize: '12px'}}>Сохранить</Button>
                                        <Button onClick={() => setEditingId(null)} variant="danger" style={{padding: '4px 12px', fontSize: '12px'}}>Отменить</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.commentBody}>
                                    <p className={styles.content}>{comment.content}</p>
                                    {canManage && (
                                        <div className={styles.actions}>
                                            <button onClick={() => startEdit(comment)} className={styles.actionBtn} title="Редактировать">
                                                <EditIcon size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(comment.id)} className={styles.actionBtnDelete} title="Удалить">
                                                <TrashIcon size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {comments.length === 0 && <p className={styles.empty}>Комментариев пока нет.</p>}
            </div>

            {/* Форма добавления */}
            <form onSubmit={handleSubmit} className={styles.addForm}>
                <textarea
                    className={styles.textarea}
                    placeholder="Написать комментарий..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                />
                <Button type="submit" disabled={!newComment.trim()} variant="primary">
                    Отправить
                </Button>
            </form>
        </div>
    );
}
