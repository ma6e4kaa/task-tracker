<?php

namespace App\Controller\Api;

use App\Dto\AdminUpdateUserRequest;
use App\Dto\UpdateProfileRequest;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class UserController extends AbstractController
{
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(UserRepository $userRepository): JsonResponse
    {
        $user = $this->getCurrentUser($userRepository);

        return $this->json($user, 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/api/me', name: 'api_me_update', methods: ['PATCH'])]
    public function updateMe(
        #[MapRequestPayload] UpdateProfileRequest $request,
        UserRepository                            $userRepository,
        EntityManagerInterface                    $em,
        UserPasswordHasherInterface               $hasher,
    ): JsonResponse
    {
        $user = $this->getCurrentUser($userRepository);

        if ($request->email !== null && $request->email !== $user->getEmail()) {
            $existing = $userRepository->findOneBy(['email' => $request->email]);
            if ($existing) {
                return $this->json(
                    ['error' => 'email_taken', 'message' => 'Этот email уже занят'],
                    Response::HTTP_CONFLICT,
                );
            }
            $user->setEmail($request->email);
        }

        if ($request->password !== null) {
            if (!$request->currentPassword) {
                return $this->json(
                    ['error' => 'current_password_required', 'message' => 'Введите текущий пароль'],
                    Response::HTTP_BAD_REQUEST,
                );
            }
            if (!$hasher->isPasswordValid($user, $request->currentPassword)) {
                return $this->json(
                    ['error' => 'invalid_current_password', 'message' => 'Неверный текущий пароль'],
                    Response::HTTP_BAD_REQUEST,
                );
            }
            $user->setPassword($hasher->hashPassword($user, $request->password));
        }

        $em->flush();

        return $this->json($user, 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/api/me', name: 'api_me_delete', methods: ['DELETE'])]
    public function deleteMe(
        UserRepository         $userRepository,
        EntityManagerInterface $em,
    ): JsonResponse
    {
        $user = $this->getCurrentUser($userRepository);
        $user->setIsActive(false);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT); // 204
    }

    #[Route('/api/users', name: 'api_users_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(
        Request        $request,
        UserRepository $userRepository,
    ): JsonResponse
    {
        $search = $request->query->get('search', '');

        $qb = $userRepository->createQueryBuilder('u')
            ->orderBy('u.id', 'ASC');

        if ($search) {
            $qb->andWhere('u.email LIKE :search')
                ->setParameter('search', '%' . $search . '%');
        }

        $users = $qb->getQuery()->getResult();

        return $this->json($users, 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/api/users/{id}', name: 'api_users_show', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function show(int $id, UserRepository $userRepository): JsonResponse
    {
        $user = $userRepository->find($id);

        if (!$user) {
            throw $this->createNotFoundException('User not found');
        }

        return $this->json($user, 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/api/users/{id}', name: 'api_users_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateUser(
        int                                         $id,
        #[MapRequestPayload] AdminUpdateUserRequest $request,
        UserRepository                              $userRepository,
        EntityManagerInterface                      $em,
    ): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user) {
            throw $this->createNotFoundException('User not found');
        }

        // Email
        if ($request->email !== null && $request->email !== $user->getEmail()) {
            $existing = $userRepository->findOneBy(['email' => $request->email]);
            if ($existing) {
                return $this->json(
                    ['error' => 'email_taken', 'message' => 'Этот email уже занят'],
                    Response::HTTP_CONFLICT,
                );
            }
            $user->setEmail($request->email);
        }

        // Roles — только админ
        if ($request->roles !== null) {
            // Валидация: разрешены только ROLE_USER и ROLE_ADMIN
            $allowed = ['ROLE_USER', 'ROLE_ADMIN'];
            $invalid = array_diff($request->roles, $allowed);
            if (!empty($invalid)) {
                return $this->json(
                    ['error' => 'invalid_roles', 'message' => 'Недопустимые роли: ' . implode(', ', $invalid)],
                    Response::HTTP_BAD_REQUEST,
                );
            }
            $user->setRoles($request->roles);
        }

        // isActive — блокировка
        if ($request->isActive !== null) {
            $user->setIsActive($request->isActive);
        }

        $em->flush();

        return $this->json($user, 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/api/users/{id}', name: 'api_users_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteUser(
        int                    $id,
        UserRepository         $userRepository,
        EntityManagerInterface $em,
    ): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user) {
            throw $this->createNotFoundException('User not found');
        }

        // Админ не может деактивировать сам себя
        if ($user === $this->getCurrentUser($userRepository)) {
            return $this->json(
                ['error' => 'cannot_delete_self', 'message' => 'Нельзя деактивировать свой аккаунт через админ-панель'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $user->setIsActive(false);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    private function getCurrentUser(UserRepository $userRepository): User
    {
        $identifier = $this->getUser()->getUserIdentifier();
        $user = $userRepository->findOneBy(['email' => $identifier]);

        if (!$user) {
            throw $this->createNotFoundException('Current user not found');
        }

        return $user;
    }
}
