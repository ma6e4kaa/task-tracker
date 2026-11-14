<?php

namespace App\Controller\Api;

use App\Dto\CreateTaskRequest;
use App\Dto\UpdateTaskRequest;
use App\Dto\UpdateTaskStatusRequest;
use App\Dto\UpdateTaskTagsRequest;
use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\TagRepository;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Security\Voter\ProjectVoter;
use App\Security\Voter\TaskVoter;
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
        'task:read:assignee',
        'task:read:reporter',
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

        $this->denyAccessUnlessGranted(TaskVoter::EDIT, $task);

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
        $this->denyAccessUnlessGranted(ProjectVoter::DELETE, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $this->denyAccessUnlessGranted(TaskVoter::DELETE, $task);

        $em->remove($task);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}/status', name: 'api_tasks_status_update', methods: ['PATCH'])]
    public function updateStatus(
        #[MapEntity(id: 'projectId')] Project $project,
        #[MapEntity(id: 'taskId')] Task $task,
        #[MapRequestPayload] UpdateTaskStatusRequest $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $this->denyAccessUnlessGranted(TaskVoter::CHANGE_STATUS, $task);

        $task->setStatus($request->status);

        if ($request->status === Task::STATUS_DONE) {
            $task->setCompletedAt(new \DateTimeImmutable());
        } else {
            $task->setCompletedAt(null);
        }

        $em->flush();

        return $this->json($task, 200, [], ['groups' => self::ITEM_GROUPS]);
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}/tags', name: 'api_tasks_tags_update', methods: ['PATCH'])]
    public function updateTags(
        #[MapEntity(id: 'projectId')] Project $project,
        #[MapEntity(id: 'taskId')] Task $task,
        #[MapRequestPayload] UpdateTaskTagsRequest $request,
        EntityManagerInterface $em,
        TagRepository $tagRepository
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        // Менять теги задачи может тот, кто может её редактировать
        $this->denyAccessUnlessGranted(TaskVoter::EDIT, $task);

        // 1. Сначала удаляем все текущие теги
        foreach ($task->getTags() as $existingTag) {
            $task->removeTag($existingTag);
        }

        // 2. Добавляем новые (если они есть)
        if (!empty($request->tagIds)) {
            $newTags = $tagRepository->findBy(['id' => $request->tagIds]);
            foreach ($newTags as $tag) {
                $task->addTag($tag);
            }
        }

        $em->flush();

        return $this->json($task, 200, [], ['groups' => self::ITEM_GROUPS]);
    }

    #[Route('/api/me/tasks/assigned', name: 'api_me_tasks_assigned', methods: ['GET'])]
    public function assignedTasks(TaskRepository $taskRepository): JsonResponse
    {
        $user = $this->getUser();

        $tasks = $taskRepository->createQueryBuilder('t')
            ->where('t.assignee = :user')
            ->setParameter('user', $user)
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json($tasks, 200, [], ['groups' => ['task:read', 'task:read:assignee', 'task:read:reporter', 'task:read:project']]);
    }

    #[Route('/api/me/tasks/reported', name: 'api_me_tasks_reported', methods: ['GET'])]
    public function reportedTasks(TaskRepository $taskRepository): JsonResponse
    {
        $user = $this->getUser();

        $tasks = $taskRepository->createQueryBuilder('t')
            ->where('t.reporter = :user')
            ->setParameter('user', $user)
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json($tasks, 200, [], ['groups' => ['task:read', 'task:read:assignee', 'task:read:reporter', 'task:read:project']]);
    }
}
