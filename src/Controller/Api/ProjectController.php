<?php

namespace App\Controller\Api;

use App\Dto\CreateProjectRequest;
use App\Dto\UpdateProjectRequest;
use App\Entity\Project;
use App\Entity\ProjectMember;
use App\Entity\User;
use App\Repository\ProjectRepository;
use App\Security\Voter\ProjectVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

class ProjectController extends AbstractController
{
    #[Route('/api/projects', name: 'api_projects_list', methods: ['GET'])]
    public function list(ProjectRepository $projectRepository): JsonResponse
    {
        $user = $this->getCurrentUser();

        $projects = $projectRepository->findByUser($user);

        return $this->json($projects, Response::HTTP_OK, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    #[Route('/api/projects/{id}', name: 'api_projects_show', methods: ['GET'])]
    public function show(Project $project): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);

        return $this->json($project, Response::HTTP_OK, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    #[Route('/api/projects', name: 'api_projects_create', methods: ['POST'])]
    public function create(
        #[MapRequestPayload] CreateProjectRequest $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse
    {
        $user = $this->getCurrentUser();

        $project = new Project();
        $project->setName($request->name);
        $project->setDescription($request->description);
        $project->setOwner($user);

        $member = new ProjectMember();
        $member->setUser($user);
        $member->setRole(ProjectMember::ROLE_OWNER);
        $project->addMember($member);

        $entityManager->persist($project);
        $entityManager->flush();

        return $this->json($project, Response::HTTP_CREATED, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    #[Route('/api/projects/{id}', name: 'api_projects_update', methods: ['PATCH'])]
    public function update(
        Project $project,
        #[MapRequestPayload] UpdateProjectRequest $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::EDIT, $project);

        if ($request->name !== null) {
            $project->setName($request->name);
        }
        if ($request->description !== null) {
            $project->setDescription($request->description);
        }

        $entityManager->flush();

        return $this->json($project, Response::HTTP_OK, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    #[Route('/api/projects/{id}', name: 'api_projects_delete', methods: ['DELETE'])]
    public function delete(
        Project $project,
        EntityManagerInterface $entityManager
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::DELETE, $project);

        $entityManager->remove($project);
        $entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    private function getCurrentUser(): User
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException();
        }
        return $user;
    }
}
