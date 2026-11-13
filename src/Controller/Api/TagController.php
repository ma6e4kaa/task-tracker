<?php

namespace App\Controller\Api;

use App\Dto\CreateTagRequest;
use App\Entity\Tag;
use App\Repository\TagRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class TagController extends AbstractController
{
    #[Route('/api/tags', name: 'api_tags_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(TagRepository $tagRepository): JsonResponse
    {
        $tags = $tagRepository->findBy([], ['name' => 'ASC']);
        return $this->json($tags, 200, [], ['groups' => ['task:read:tags']]);
    }

    #[Route('/api/tags', name: 'api_tags_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(
        #[MapRequestPayload] CreateTagRequest $request,
        EntityManagerInterface $em,
        TagRepository $tagRepository
    ): JsonResponse {
        // Проверяем уникальность имени (в БД стоит UniqueConstraint на name)
        $existing = $tagRepository->findOneBy(['name' => $request->name]);
        if ($existing) {
            return $this->json(['error' => 'Тег с таким названием уже существует'], Response::HTTP_CONFLICT);
        }

        $tag = new Tag();
        $tag->setName($request->name);
        $tag->setColor($request->color);

        $em->persist($tag);
        $em->flush();

        return $this->json($tag, Response::HTTP_CREATED, [], ['groups' => ['task:read:tags']]);
    }

    #[Route('/api/tags/{id}', name: 'api_tags_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')] // Удалять теги из системы может только админ
    public function delete(Tag $tag, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($tag);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
