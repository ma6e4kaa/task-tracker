<?php

namespace App\Security\Voter;

use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class TaskVoter extends Voter
{
    public const EDIT = 'TASK_EDIT';
    public const DELETE = 'TASK_DELETE';
    public const CHANGE_STATUS = 'TASK_CHANGE_STATUS';

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, [self::EDIT, self::DELETE, self::CHANGE_STATUS], true)) {
            return false;
        }

        if (!$subject instanceof Task) {
            return false;
        }

        return true;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var Task $task */
        $task = $subject;
        $project = $task->getProject();

        return match ($attribute) {
            self::EDIT, self::DELETE => $this->canEdit($task, $project, $user),
            self::CHANGE_STATUS => $this->canChangeStatus($task, $project, $user),
            default => false,
        };
    }

    private function canEdit(Task $task, ?Project $project, User $user): bool
    {
        if ($this->isAdmin($user)) return true;
        if ($task->getReporter() === $user) return true; // Постановщик
        if ($project && $project->getOwner() === $user) return true; // Владелец проекта

        return false;
    }

    private function canChangeStatus(Task $task, ?Project $project, User $user): bool
    {
        if ($this->canEdit($task, $project, $user)) return true;

        // Исполнитель тоже может менять статус
        if ($task->getAssignee() === $user) return true;

        return false;
    }

    private function isAdmin(User $user): bool
    {
        return in_array('ROLE_ADMIN', $user->getRoles(), true);
    }
}
