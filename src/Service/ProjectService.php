<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\ProjectRepository;
use Psr\Cache\InvalidArgumentException;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

readonly class ProjectService
{
    public function __construct(
        private ProjectRepository $projectRepository,
        private CacheInterface    $projectCache,
    )
    {
    }

    /**
     * @throws InvalidArgumentException
     */
    public function getUserProjects(User $user): array
    {
        $cacheKey = 'user_projects_' . $user->getId();

        return $this->projectCache->get($cacheKey, function (ItemInterface $item) use ($user) {
            $item->expiresAfter(60);
            return $this->projectRepository->findByUser($user);
        });
    }

    /**
     * @throws InvalidArgumentException
     */
    public function invalidateUserProjects(User $user): void
    {
        $this->projectCache->delete('user_projects_' . $user->getId());
    }
}
