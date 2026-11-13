<?php

namespace App\Controller\Api;

use App\Dto\CommentRequest;
use App\Entity\Comment;
use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\CommentRepository;
use App\Security\Voter\CommentVoter;
use App\Security\Voter\ProjectVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

class CommentController extends AbstractController
{
    #[Route('/api/projects/{projectId}/tasks/{taskId}/comments', name: 'api_comments_list', methods: ['GET'])]
    public function list(
        #[MapEntity(id: 'projectId')] Project $project,
        #[MapEntity(id: 'taskId')] Task $task,
        CommentRepository $commentRepository
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        $comments = $commentRepository->findBy(['task' => $task], ['createdAt' => 'ASC']);

        return $this->json($comments, 200, [], [
            'groups' => ['task:read:comments', 'task:read:comments:author']
        ]);
    }

    #[Route('/api/projects/{projectId}/tasks/{taskId}/comments', name: 'api_comments_create', methods: ['POST'])]
    public function create(
        #[MapEntity(id: 'projectId')] Project $project,
        #[MapEntity(id: 'taskId')] Task $task,
        #[MapRequestPayload] CommentRequest $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ProjectVoter::VIEW, $project);
        if ($task->getProject() !== $project) throw $this->createNotFoundException();

        /** @var User $user */
        $user = $this->getUser();

        $comment = new Comment();
        $comment->setTask($task);
        $comment->setAuthor($user);
        $comment->setContent($request->content);

        $em->persist($comment);
        $em->flush();

        return $this->json($comment, Response::HTTP_CREATED, [], [
            'groups' => ['task:read:comments', 'task:read:comments:author']
        ]);
    }

    #[Route('/api/comments/{id}', name: 'api_comments_update', methods: ['PATCH'])]
    public function update(
        #[MapEntity(id: 'id')] Comment $comment,
        #[MapRequestPayload] CommentRequest $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted(CommentVoter::EDIT, $comment);

        $comment->setContent($request->content);
        $em->flush();

        return $this->json($comment, 200, [], [
            'groups' => ['task:read:comments', 'task:read:comments:author']
        ]);
    }

    #[Route('/api/comments/{id}', name: 'api_comments_delete', methods: ['DELETE'])]
    public function delete(
        #[MapEntity(id: 'id')] Comment $comment,
        EntityManagerInterface $em
    ): JsonResponse {
        $this->denyAccessUnlessGranted(CommentVoter::DELETE, $comment);

        $em->remove($comment);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
