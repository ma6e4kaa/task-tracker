<?php

namespace App\Repository;

use App\Entity\Project;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Project>
 */
class ProjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Project::class);
    }

    /**
     * @return Project[]
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('p')
            ->leftJoin('p.owner', 'o')->addSelect('o')
            ->leftJoin('p.members', 'm')->addSelect('m')
            ->where('p.owner = :user')
            ->orWhere('m.user = :user')
            ->setParameter('user', $user)
            ->distinct()
            ->orderBy('p.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
