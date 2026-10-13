<?php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-user',
    description: 'Создать пользователя',
)]
readonly class CreateUserCommand
{
    public function __construct(
        private EntityManagerInterface      $em,
        private UserPasswordHasherInterface $hasher,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Argument('Email пользователя')] string $email,
        #[Argument('Пароль в открытом виде')] string $password,
        #[Option('Создать с ролью админа', shortcut: 'a')] bool $admin = false,
    ): int {
        $user = new User();
        $user->setEmail($email);
        $user->setPassword($this->hasher->hashPassword($user, $password));
        $user->setRoles($admin ? ['ROLE_ADMIN'] : ['ROLE_USER']);
        $user->setIsActive(true);

        $this->em->persist($user);
        $this->em->flush();

        $role = $admin ? 'ADMIN' : 'USER';
        $io->success("Пользователь создан: {$email} ({$role})");

        return Command::SUCCESS;
    }
}
