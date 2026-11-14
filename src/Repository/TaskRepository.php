<?php

namespace App\Repository;

use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

    /**
     * Задачи для конкретного проекта
     * @return Task[]
     */
    public function findByProject(Project $project): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.assignee', 'a')->addSelect('a')
            ->leftJoin('t.reporter', 'r')->addSelect('r')
            ->where('t.project = :project')
            ->setParameter('project', $project)
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Задачи, где я исполнитель
     * @return Task[]
     */
    public function findAssignedToUser(User $user): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.project', 'p')->addSelect('p')
            ->leftJoin('t.reporter', 'r')->addSelect('r')
            ->where('t.assignee = :user')
            ->setParameter('user', $user)
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Задачи, где я постановщик
     * @return Task[]
     */
    public function findReportedByUser(User $user): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.project', 'p')->addSelect('p')
            ->leftJoin('t.assignee', 'a')->addSelect('a')
            ->where('t.reporter = :user')
            ->setParameter('user', $user)
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
