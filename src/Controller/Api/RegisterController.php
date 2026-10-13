<?php

namespace App\Controller\Api;

use App\Dto\RegisterRequest;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class RegisterController extends AbstractController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        #[MapRequestPayload] RegisterRequest $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
    ): JsonResponse {
        $existing = $em->getRepository(User::class)
            ->findOneBy(['email' => $request->email]);

        if ($existing) {
            return $this->json(
                ['error' => 'email_taken', 'message' => 'Этот email уже зарегистрирован'],
                Response::HTTP_CONFLICT,
            );
        }

        $user = new User();
        $user->setEmail($request->email);
        $user->setPassword($hasher->hashPassword($user, $request->password));
        $user->setRoles(['ROLE_USER']);
        $user->setIsActive(true);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'createdAt' => $user->getCreatedAt()?->format('c'),
        ], Response::HTTP_CREATED);
    }
}
