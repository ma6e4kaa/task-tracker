<?php

namespace App\Controller\Api;

use App\Dto\CreateTaskRequest;
use App\Dto\UpdateTaskRequest;
use App\Dto\UpdateTaskStatusRequest;
use App\Dto\UpdateTaskTagsRequest;
use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use App\Message\TaskNotification;
use App\Message\TaskReadyForReviewNotification;
use App\Repository\TagRepository;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Security\Voter\ProjectVoter;
use App\Security\Voter\TaskVoter;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Messenger\Exception\ExceptionInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

class TaskController extends AbstractController
{
    private const LIST_GROUPS = [
        'task:read',
        'task:read:assignee',
        'task:read:reporter',
    ];

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

        $tasks = $taskRepository->findByProject($project);

        return $this->json($tasks, 200, [], ['groups' => self::LIST_GROUPS]);
    }

    /**
     * @throws Exception
     * @throws ExceptionInterface
     */
    #[Route('/api/projects/{id}/tasks', name: 'api_tasks_create', methods: ['POST'])]
    public function create(
        Project                                $project,
        #[MapRequestPayload] CreateTaskRequest $request,
        EntityManagerInterface                 $em,
        UserRepository                         $userRepository,
        MessageBusInterface                    $bus,
        ParameterBagInterface                  $params
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);

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
            $task->setDueDate(new DateTimeImmutable($request->dueDate));
        }

        if ($task->getStatus() === Task::STATUS_DONE) {
            $task->setCompletedAt(new DateTimeImmutable());
        }

        $em->persist($task);
        $em->flush();

        // Если назначили исполнителя, и это не сам автор задачи — шлём уведомление в очередь
        if ($task->getAssignee() && $task->getAssignee() !== $user) {
            $url = $params->get('app.frontend_url')
                . '/projects/' . $project->getId()
                . '/tasks/' . $task->getId();

            $bus->dispatch(new TaskNotification(
                $task->getId(),
                $task->getAssignee()->getEmail(),
                $task->getTitle(),
                $project->getName(),
                $url,
                $task->getDueDate()?->format('d.m.Y'),
                'Вам назначена новая задача',
            ));
        }

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

    /**
     * @throws Exception
     * @throws ExceptionInterface
     */
    #[Route('/api/projects/{projectId}/tasks/{taskId}', name: 'api_tasks_update', methods: ['PATCH'])]
    public function update(
        #[MapEntity(id: 'projectId')] Project  $project,
        #[MapEntity(id: 'taskId')] Task        $task,
        #[MapRequestPayload] UpdateTaskRequest $request,
        EntityManagerInterface                 $em,
        UserRepository                         $userRepository,
        MessageBusInterface                    $bus,
        ParameterBagInterface                  $params
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $this->denyAccessUnlessGranted(TaskVoter::EDIT, $task);

        /** @var User $user */
        $user = $this->getUser();

        $oldStatus = $task->getStatus();

        if ($request->title !== null) $task->setTitle($request->title);
        if ($request->description !== null) $task->setDescription($request->description);
        if ($request->priority !== null) $task->setPriority($request->priority);

        if ($request->status !== null) {
            $task->setStatus($request->status);
            if ($request->status === Task::STATUS_DONE && !$task->getCompletedAt()) {
                $task->setCompletedAt(new DateTimeImmutable());
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
            $task->setDueDate($request->dueDate ? new DateTimeImmutable($request->dueDate) : null);
        }

        $em->flush();
        $this->sendEmails($task, $user, $project, $bus, $params, $oldStatus);

        return $this->json($task, 200, [], ['groups' => self::ITEM_GROUPS]);
    }

    /**
     * @throws ExceptionInterface
     */
    private function sendEmails(
        Task                  $task,
        User                  $user,
        Project               $project,
        MessageBusInterface   $bus,
        ParameterBagInterface $params,
        ?string               $oldStatus
    ): void
    {
        if ($oldStatus === $task->getStatus()) {
            return;
        }

        $url = $params->get('app.frontend_url')
            . '/projects/' . $project->getId()
            . '/tasks/' . $task->getId();

        // 1. Задача ушла на проверку (из любого статуса в REVIEW)
        if ($task->getStatus() === Task::STATUS_REVIEW && $task->getReporter() !== $user) {
            $bus->dispatch(new TaskReadyForReviewNotification(
                $task->getId(),
                $task->getReporter()->getEmail(),
                $task->getTitle(),
                $project->getName(),
                $url
            ));
        }

        // 2. Задача возвращена в работу (только если была в REVIEW и стала IN_PROGRESS)
        if ($oldStatus === Task::STATUS_REVIEW && $task->getStatus() === Task::STATUS_IN_PROGRESS && $task->getAssignee() !== $user) {
            $bus->dispatch(new TaskNotification(
                $task->getId(),
                $task->getAssignee()->getEmail(),
                $task->getTitle(),
                $project->getName(),
                $url,
                $task->getDueDate()?->format('d.m.Y'),
                'Задача возвращена в работу'
            ));
        }
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}', name: 'api_tasks_delete', methods: ['DELETE'])]
    public function delete(
        #[MapEntity(id: 'projectId')] Project $project,
        #[MapEntity(id: 'taskId')] Task       $task,
        EntityManagerInterface                $em
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $this->denyAccessUnlessGranted(TaskVoter::DELETE, $task);

        $em->remove($task);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @throws ExceptionInterface
     */
    #[Route('/api/projects/{projectId}/tasks/{taskId}/status', name: 'api_tasks_status_update', methods: ['PATCH'])]
    public function updateStatus(
        #[MapEntity(id: 'projectId')] Project        $project,
        #[MapEntity(id: 'taskId')] Task              $task,
        #[MapRequestPayload] UpdateTaskStatusRequest $request,
        EntityManagerInterface                       $em,
        MessageBusInterface                          $bus,
        ParameterBagInterface                        $params
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $this->denyAccessUnlessGranted(TaskVoter::CHANGE_STATUS, $task);

        /** @var User $user */
        $user = $this->getUser();

        $oldStatus = $task->getStatus();

        $task->setStatus($request->status);

        if ($request->status === Task::STATUS_DONE) {
            $task->setCompletedAt(new DateTimeImmutable());
        } else {
            $task->setCompletedAt(null);
        }

        $em->flush();
        $this->sendEmails($task, $user, $project, $bus, $params, $oldStatus);

        return $this->json($task, 200, [], ['groups' => self::ITEM_GROUPS]);
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}/tags', name: 'api_tasks_tags_update', methods: ['PATCH'])]
    public function updateTags(
        #[MapEntity(id: 'projectId')] Project      $project,
        #[MapEntity(id: 'taskId')] Task            $task,
        #[MapRequestPayload] UpdateTaskTagsRequest $request,
        EntityManagerInterface                     $em,
        TagRepository                              $tagRepository
    ): JsonResponse
    {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $this->denyAccessUnlessGranted(TaskVoter::EDIT, $task);

        foreach ($task->getTags() as $existingTag) {
            $task->removeTag($existingTag);
        }

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
        /** @var User $user */
        $user = $this->getUser();

        $tasks = $taskRepository->findAssignedToUser($user);

        return $this->json($tasks, 200, [], ['groups' => ['task:read', 'task:read:assignee', 'task:read:reporter', 'task:read:project']]);
    }

    #[Route('/api/me/tasks/reported', name: 'api_me_tasks_reported', methods: ['GET'])]
    public function reportedTasks(TaskRepository $taskRepository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $tasks = $taskRepository->findReportedByUser($user);

        return $this->json($tasks, 200, [], ['groups' => ['task:read', 'task:read:assignee', 'task:read:reporter', 'task:read:project']]);
    }
}
