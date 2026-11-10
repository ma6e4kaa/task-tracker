<?php

namespace App\Controller\Api;

use App\Dto\CreateTaskRequest;
use App\Dto\UpdateTaskRequest;
use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Security\Voter\ProjectVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

class TaskController extends AbstractController
{
    // Группы для списка задач (краткая инфа)
    private const LIST_GROUPS = [
        'task:read',
        'task:read:assignee'
    ];

    // Группы для просмотра одной задачи (полная инфа)
    private const ITEM_GROUPS = [
        'task:read',
        'task:read:assignee',
        'task:read:reporter',
        'task:read:comments',
        'task:read:comments:author',
        'task:read:tags'
    ];

    #[Route('/api/projects/{id}/tasks', name: 'api_tasks_list', methods: ['GET'])]
    public function list(Project $project, TaskRepository $taskRepository): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);

        $tasks = $taskRepository->findBy(['project' => $project], ['id' => 'DESC']);

        return $this->json($tasks, 200, [], ['groups' => self::LIST_GROUPS]);
    }

    #[Route('/api/projects/{id}/tasks', name: 'api_tasks_create', methods: ['POST'])]
    public function create(
        Project                                $project,
        #[MapRequestPayload] CreateTaskRequest $request,
        EntityManagerInterface                 $em,
        UserRepository                         $userRepository
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::EDIT, $project);

        $user = $this->getUser();
        if (!$user instanceof User) throw $this->createAccessDeniedException();

        $task = new Task();
        $task->setTitle($request->title);
        $task->setDescription($request->description);
        $task->setStatus($request->status);
        $task->setPriority($request->priority);
        $task->setProject($project);
        $task->setReporter($user);

        if ($request->assigneeId) {
            $assignee = $userRepository->find($request->assigneeId);
            if ($assignee) $task->setAssignee($assignee);
        }

        if ($request->dueDate) {
            $task->setDueDate(new \DateTimeImmutable($request->dueDate));
        }

        if ($task->getStatus() === Task::STATUS_DONE) {
            $task->setCompletedAt(new \DateTimeImmutable());
        }

        $em->persist($task);
        $em->flush();

        return $this->json($task, Response::HTTP_CREATED, [], ['groups' => self::ITEM_GROUPS]);
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}', name: 'api_tasks_show', methods: ['GET'])]
    public function show(
        #[MapEntity(id: 'projectId')] Project $project,
        #[MapEntity(id: 'taskId')] Task       $task
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        return $this->json($task, 200, [], ['groups' => self::ITEM_GROUPS]);
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}', name: 'api_tasks_update', methods: ['PATCH'])]
    public function update(
        #[MapEntity(id: 'projectId')] Project  $project,
        #[MapEntity(id: 'taskId')] Task        $task,
        #[MapRequestPayload] UpdateTaskRequest $request,
        EntityManagerInterface                 $em,
        UserRepository                         $userRepository
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::EDIT, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        if ($request->title !== null) $task->setTitle($request->title);
        if ($request->description !== null) $task->setDescription($request->description);
        if ($request->priority !== null) $task->setPriority($request->priority);

        if ($request->status !== null) {
            $task->setStatus($request->status);
            if ($request->status === Task::STATUS_DONE && !$task->getCompletedAt()) {
                $task->setCompletedAt(new \DateTimeImmutable());
            } elseif ($request->status !== Task::STATUS_DONE) {
                $task->setCompletedAt(null);
            }
        }

        if ($request->clearAssignee) {
            $task->setAssignee(null);
        } elseif ($request->assigneeId) {
            $assignee = $userRepository->find($request->assigneeId);
            if ($assignee) $task->setAssignee($assignee);
        }

        if ($request->dueDate !== null) {
            $task->setDueDate($request->dueDate ? new \DateTimeImmutable($request->dueDate) : null);
        }

        $em->flush();

        return $this->json($task, 200, [], ['groups' => self::ITEM_GROUPS]);
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}', name: 'api_tasks_delete', methods: ['DELETE'])]
    public function delete(
        #[MapEntity(id: 'projectId')] Project $project,
        #[MapEntity(id: 'taskId')] Task       $task,
        EntityManagerInterface                $em
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::EDIT, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $em->remove($task);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
