import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext'; // Чтобы проверять, админ ли
import { TrashIcon } from '../../components/icons';
import styles from './TaskTagsModal.module.css';

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    projectId: number;
    currentTags: Tag[];
    onSave: () => void; // Коллбэк для обновления задачи
}

export function TaskTagsModal({ isOpen, onClose, taskId, projectId, currentTags, onSave }: Props) {
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    // Стейты для создания нового тега
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#007aff');
    const [isCreating, setIsCreating] = useState(false);

    const { isAdmin } = useAuth();

    // Загружаем все доступные теги в системе
    const fetchTags = () => {
        apiFetch<Tag[]>('/api/tags').then(setAllTags);
    };

    useEffect(() => {
        if (isOpen) {
            fetchTags();
            setSelectedIds(currentTags.map(t => t.id));
        }
    }, [isOpen, currentTags]);

    const toggleTag = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch(`/api/projects/${projectId}/tasks/${taskId}/tags`, {
                method: 'PATCH',
                body: JSON.stringify({ tagIds: selectedIds })
            });
            onSave();
            onClose();
        } catch (err) {
            alert('Ошибка сохранения тегов');
        } finally {
            setSaving(false);
        }
    };

    // Создание нового тега
    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        setIsCreating(true);
        try {
            const newTag = await apiFetch<Tag>('/api/tags', {
                method: 'POST',
                body: JSON.stringify({
                    name: newTagName,
                    color: newTagColor
                })
            });
            setNewTagName('');
            fetchTags();
            setSelectedIds(prev => [...prev, newTag.id]);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Ошибка создания');
        } finally {
            setIsCreating(false);
        }
    };

    // Удаление тега из системы (только админ)
    const handleDeleteTag = async (tagId: number, e: React.MouseEvent) => {
        e.preventDefault(); // Чтобы не переключился чекбокс
        if (!window.confirm('Удалить этот тег из системы? Он исчезнет со всех задач.')) return;
        try {
            await apiFetch(`/api/tags/${tagId}`, { method: 'DELETE' });
            setSelectedIds(prev => prev.filter(id => id !== tagId));
            fetchTags();
        } catch (err) {
            alert('Ошибка удаления тега');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Управление тегами">

            {/* Список тегов с чекбоксами */}
            <div className={styles.tagList}>
                {allTags.map(tag => (
                    <div key={tag.id} className={styles.tagRow}>
                        <label className={styles.tagLabel}>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(tag.id)}
                                onChange={() => toggleTag(tag.id)}
                            />
                            <span
                                className={styles.tagBadge}
                                style={{ backgroundColor: tag.color || '#e5e5ea', color: tag.color ? '#fff' : 'inherit' }}
                            >
                                {tag.name}
                            </span>
                        </label>

                        {isAdmin && (
                            <button
                                onClick={(e) => handleDeleteTag(tag.id, e)}
                                className={styles.deleteBtn}
                                title="Удалить тег"
                            >
                                <TrashIcon size={16} />
                            </button>
                        )}
                    </div>
                ))}
                {allTags.length === 0 && <p className={styles.empty}>Нет доступных тегов</p>}
            </div>

            {/* Форма быстрого создания тега */}
            <form onSubmit={handleCreateTag} className={styles.createForm}>
                <div className={styles.createInputWrapper}>
                    <Input
                        label="Создать новый тег"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Название (например, Bug)"
                    />
                </div>

                {/* Инпут выбора цвета */}
                <div className={styles.colorPickerWrapper}>
                    <label className={styles.colorLabel}>Цвет</label>
                    <input
                        type="color"
                        className={styles.colorInput}
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        title="Выберите цвет"
                    />
                </div>

                <Button type="submit" variant="primary" disabled={isCreating || !newTagName.trim()}>
                    {isCreating ? '...' : 'Добавить'}
                </Button>
            </form>

            {/* Кнопки сохранения */}
            <div className={styles.modalActions}>
                <Button variant="danger" onClick={onClose}>Отменить</Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Сохранение...' : 'Применить к задаче'}
                </Button>
            </div>
        </Modal>
    );
}
