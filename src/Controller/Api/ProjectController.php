<?php

namespace App\Controller\Api;

use App\Dto\AddProjectMemberRequest;
use App\Dto\CreateProjectRequest;
use App\Dto\UpdateProjectMemberRequest;
use App\Dto\UpdateProjectRequest;
use App\Entity\Project;
use App\Entity\ProjectMember;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\Voter\ProjectVoter;
use App\Service\ProjectService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Cache\InvalidArgumentException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

class ProjectController extends AbstractController
{
    /**
     * @throws InvalidArgumentException
     */
    #[Route('/api/projects', name: 'api_projects_list', methods: ['GET'])]
    public function list(ProjectService $projectService): JsonResponse
    {
        $user = $this->getCurrentUser();
        $projects = $projectService->getUserProjects($user);

        return $this->json($projects, Response::HTTP_OK, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    private function getCurrentUser(): User
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException();
        }
        return $user;
    }

    #[Route('/api/projects/{id}', name: 'api_projects_show', methods: ['GET'])]
    public function show(Project $project): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);

        return $this->json($project, Response::HTTP_OK, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    /**
     * @throws InvalidArgumentException
     */
    #[Route('/api/projects', name: 'api_projects_create', methods: ['POST'])]
    public function create(
        #[MapRequestPayload] CreateProjectRequest $request,
        EntityManagerInterface                    $em,
        ProjectService                            $projectService,
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

        $em->persist($project);
        $em->flush();
        $projectService->invalidateUserProjects($user);

        return $this->json($project, Response::HTTP_CREATED, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    /**
     * @throws InvalidArgumentException
     */
    #[Route('/api/projects/{id}/members', name: 'api_projects_members_add', methods: ['POST'])]
    public function addMember(
        Project                                      $project,
        #[MapRequestPayload] AddProjectMemberRequest $request,
        EntityManagerInterface                       $em,
        UserRepository                               $userRepository,
        ProjectService                               $projectService
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::MANAGE_MEMBERS, $project);

        $userToAdd = $userRepository->findOneBy(['email' => $request->email]);
        if (!$userToAdd) {
            return $this->json(['error' => 'Пользователь не найден'], Response::HTTP_NOT_FOUND);
        }

        foreach ($project->getMembers() as $member) {
            if ($member->getUser()->getId() === $userToAdd->getId()) {
                return $this->json(['error' => 'Пользователь уже в проекте'], Response::HTTP_CONFLICT);
            }
        }

        $member = new ProjectMember();
        $member->setUser($userToAdd);
        $member->setRole($request->role);
        $project->addMember($member);

        $em->flush();

        $projectService->invalidateUserProjects($userToAdd);

        return $this->json($member, Response::HTTP_CREATED, [], ['groups' => ['project_member:read', 'project_member:read:user']]);
    }

    /**
     * @throws InvalidArgumentException
     */
    #[Route('/api/projects/{id}', name: 'api_projects_update', methods: ['PATCH'])]
    public function update(
        Project                                   $project,
        #[MapRequestPayload] UpdateProjectRequest $request,
        EntityManagerInterface                    $em,
        ProjectService                            $projectService
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::EDIT, $project);

        $user = $this->getCurrentUser();

        if ($request->name !== null) $project->setName($request->name);
        if ($request->description !== null) $project->setDescription($request->description);

        $em->flush();
        $projectService->invalidateUserProjects($user);

        return $this->json($project, Response::HTTP_OK, [], ['groups' => ['project:read', 'project:read:owner']]);
    }

    /**
     * @throws InvalidArgumentException
     */
    #[Route('/api/projects/{id}', name: 'api_projects_delete', methods: ['DELETE'])]
    public function delete(
        Project                $project,
        EntityManagerInterface $em,
        ProjectService         $projectService
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::DELETE, $project);

        $user = $this->getCurrentUser();

        $em->remove($project);
        $em->flush();

        $projectService->invalidateUserProjects($user);

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/api/projects/{id}/members', name: 'api_projects_members_list', methods: ['GET'])]
    public function listMembers(Project $project): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);

        return $this->json($project->getMembers(), Response::HTTP_OK, [], ['groups' => ['project_member:read', 'project_member:read:user']]);
    }

    /**
     * @throws InvalidArgumentException
     */
    #[Route('/api/projects/{id}/members/{memberId}', name: 'api_projects_members_update', methods: ['PATCH'])]
    public function updateMember(
        Project                                         $project,
        int                                             $memberId,
        #[MapRequestPayload] UpdateProjectMemberRequest $request,
        EntityManagerInterface                          $em,
        ProjectService                                  $projectService
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::MANAGE_MEMBERS, $project);

        $member = $em->getRepository(ProjectMember::class)->find($memberId);

        if (!$member || $member->getProject() !== $project) {
            return $this->json(['error' => 'Участник не найден'], Response::HTTP_NOT_FOUND);
        }

        if ($member->getUser()->getId() === $project->getOwner()->getId()) {
            return $this->json(['error' => 'Нельзя менять роль владельца'], Response::HTTP_FORBIDDEN);
        }

        $member->setRole($request->role);
        $em->flush();

        $projectService->invalidateUserProjects($member->getUser());

        return $this->json($member, Response::HTTP_OK, [], ['groups' => ['project_member:read', 'project_member:read:user']]);
    }

    /**
     * @throws InvalidArgumentException
     */
    #[Route('/api/projects/{id}/members/{memberId}', name: 'api_projects_members_delete', methods: ['DELETE'])]
    public function deleteMember(
        Project                $project,
        int                    $memberId,
        EntityManagerInterface $em,
        ProjectService         $projectService
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::MANAGE_MEMBERS, $project);

        $member = $em->getRepository(ProjectMember::class)->find($memberId);

        if (!$member || $member->getProject() !== $project) {
            return $this->json(['error' => 'Участник не найден'], Response::HTTP_NOT_FOUND);
        }

        if ($member->getUser()->getId() === $project->getOwner()->getId()) {
            return $this->json(['error' => 'Нельзя удалить владельца'], Response::HTTP_FORBIDDEN);
        }

        $removedUser = $member->getUser();

        $em->remove($member);
        $em->flush();

        $projectService->invalidateUserProjects($removedUser);

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
