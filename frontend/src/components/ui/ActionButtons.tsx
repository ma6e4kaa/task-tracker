import React from 'react';
import { EditIcon, TrashIcon, EyeIcon } from '../icons';
import styles from './ActionButtons.module.css';

interface Props {
    onView?: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function ActionButtons({ onView, onEdit, onDelete }: Props) {
    return (
        <div className={styles.actions}>
            {onView && (
                <button onClick={onView} className={styles.actionBtnOpen} title="Открыть">
                    <EyeIcon size={18} />
                </button>
            )}
            <button onClick={onEdit} className={styles.actionBtn} title="Редактировать">
                <EditIcon size={18} />
            </button>
            <button onClick={onDelete} className={styles.actionBtnDelete} title="Удалить">
                <TrashIcon size={18} />
            </button>
        </div>
    );
}
