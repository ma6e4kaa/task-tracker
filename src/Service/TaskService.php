<?php

namespace App\Service;

use App\Entity\Project;
use App\Entity\User;
use App\Repository\TaskRepository;
use Psr\Cache\InvalidArgumentException;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

readonly class TaskService
{
    public function __construct(
        private TaskRepository $taskRepository,
        private CacheInterface $taskCache,
    )
    {
    }

    /**
     * Задачи в конкретном проекте.
     *
     * @throws InvalidArgumentException
     */
    public function getProjectTasks(Project $project): array
    {
        $cacheKey = 'project_tasks_' . $project->getId();

        return $this->taskCache->get($cacheKey, function (ItemInterface $item) use ($project) {
            $item->expiresAfter(60);
            return $this->taskRepository->findByProject($project);
        });
    }

    /**
     * Задачи, назначенные на пользователя («Мои задачи» → вкладка «Назначенные мне»).
     *
     * @throws InvalidArgumentException
     */
    public function getAssignedTasks(User $user): array
    {
        $cacheKey = 'user_assigned_tasks_' . $user->getId();

        return $this->taskCache->get($cacheKey, function (ItemInterface $item) use ($user) {
            $item->expiresAfter(60);
            return $this->taskRepository->findAssignedToUser($user);
        });
    }

    /**
     * Задачи, созданные пользователем («Мои задачи» → вкладка «Мои постановки»).
     *
     * @throws InvalidArgumentException
     */
    public function getReportedTasks(User $user): array
    {
        $cacheKey = 'user_reported_tasks_' . $user->getId();

        return $this->taskCache->get($cacheKey, function (ItemInterface $item) use ($user) {
            $item->expiresAfter(60);
            return $this->taskRepository->findReportedByUser($user);
        });
    }

    /**
     * Сбрасывает кэш задач проекта.
     *
     * @throws InvalidArgumentException
     */
    public function invalidateProjectTasks(Project $project): void
    {
        $this->taskCache->delete('project_tasks_' . $project->getId());
    }

    /**
     * Сбрасывает кэш «назначенных» и «поставленных» задач пользователя.
     *
     * @throws InvalidArgumentException
     */
    public function invalidateUserTasks(User $user): void
    {
        $this->taskCache->delete('user_assigned_tasks_' . $user->getId());
        $this->taskCache->delete('user_reported_tasks_' . $user->getId());
    }
}
