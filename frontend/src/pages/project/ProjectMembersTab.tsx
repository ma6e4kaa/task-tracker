import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import styles from './ProjectMembersTab.module.css';
import { EditIcon, TrashIcon } from '../../components/icons';

interface User {
    id: number;
    email: string;
}

interface ProjectMember {
    id: number;
    role: string;
    user: User;
}

interface Props {
    projectId: number;
    ownerEmail: string;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Владелец',
    manager: 'Менеджер',
    developer: 'Разработчик',
    viewer: 'Наблюдатель',
};

export function ProjectMembersTab({ projectId, ownerEmail }: Props) {
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const isOwner = user?.email === ownerEmail;

    // Состояния модалок
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);

    // Форма добавления
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('developer');
    const [isSaving, setIsSaving] = useState(false);

    const fetchMembers = async () => {
        try {
            const data = await apiFetch<ProjectMember[]>(`/api/projects/${projectId}/members`);
            setMembers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, [projectId]);

    // Фильтрация по поиску
    const filteredMembers = members.filter(m =>
        m.user.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiFetch(`/api/projects/${projectId}/members`, {
                method: 'POST',
                body: JSON.stringify({ email: newEmail, role: newRole }),
            });
            setNewEmail('');
            setIsAddModalOpen(false);
            await fetchMembers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Ошибка');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;
        setIsSaving(true);
        try {
            await apiFetch(`/api/projects/${projectId}/members/${editingMember.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ role: editingMember.role }),
            });
            setEditingMember(null);
            await fetchMembers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Ошибка');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async (memberId: number) => {
        if (!window.confirm('Удалить участника?')) return;
        try {
            await apiFetch(`/api/projects/${projectId}/members/${memberId}`, { method: 'DELETE' });
            await fetchMembers();
        } catch (err) {
            alert('Ошибка удаления');
        }
    };

    if (loading) return <div className={styles.message}>Загрузка...</div>;

    return (
        <div>
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Input
                        label=""
                        type="text"
                        placeholder="Поиск по email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {isOwner && (
                    <Button onClick={() => setIsAddModalOpen(true)}>Добавить участника</Button>
                )}
            </div>

            <table className={styles.table}>
                <thead>
                <tr>
                    <th>Email</th>
                    <th>Роль</th>
                    <th className={styles.textRight}>Действия</th>
                </tr>
                </thead>
                <tbody>
                {filteredMembers.map((member) => {
                    const isMemberOwner = member.user.email === ownerEmail;
                    return (
                        <tr key={member.id}>
                            <td>{member.user.email}</td>
                            <td>{ROLE_LABELS[member.role] || member.role}</td>
                            <td className={styles.textRight}>
                                {isOwner && !isMemberOwner && (
                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => setEditingMember(member)}
                                            className={styles.actionBtn}
                                            title="Редактировать роль"
                                        >
                                            <EditIcon size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRemove(member.id)}
                                            className={styles.actionBtnDelete}
                                            title="Удалить"
                                        >
                                            <TrashIcon size={18} />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {filteredMembers.length === 0 && (
                    <tr>
                        <td colSpan={3} className={styles.emptyState}>Участники не найдены</td>
                    </tr>
                )}
                </tbody>
            </table>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Добавить участника">
                <form onSubmit={handleAdd} className={styles.modalForm}>
                    <Input
                        label="Email пользователя"
                        type="email"
                        className={styles.inputEmail}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                    />
                    <div className={styles.selectWrapper}>
                        <label className={styles.selectLabel}>Роль</label>
                        <select className={styles.select} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="manager">Менеджер</option>
                            <option value="developer">Разработчик</option>
                            <option value="viewer">Наблюдатель</option>
                        </select>
                    </div>
                    <div className={styles.modalActions}>
                        <Button type="button" variant="danger" onClick={() => setIsAddModalOpen(false)}>Отменить</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Сохранение...' : 'Добавить'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!editingMember} onClose={() => setEditingMember(null)} title="Изменить роль">
                {editingMember && (
                    <form onSubmit={handleEdit} className={styles.modalForm}>
                        <p className={styles.modalText}>Пользователь: <strong>{editingMember.user.email}</strong></p>
                        <div className={styles.selectWrapper}>
                            <label className={styles.selectLabel}>Новая роль</label>
                            <select
                                className={styles.select}
                                value={editingMember.role}
                                onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                            >
                                <option value="manager">Менеджер</option>
                                <option value="developer">Разработчик</option>
                                <option value="viewer">Наблюдатель</option>
                            </select>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="danger" onClick={() => setEditingMember(null)}>Отменить</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? 'Сохранение...' : 'Сохранить'}</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
