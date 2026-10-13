<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class AdminUpdateUserRequest
{
    #[Assert\Email(message: 'Некорректный email')]
    #[Assert\Length(max: 180)]
    public ?string $email = null;

    /**
     * @var string[]|null
     */
    #[Assert\All([
        new Assert\Choice(choices: ['ROLE_USER', 'ROLE_ADMIN']),
    ])]
    public ?array $roles = null;

    public ?bool $isActive = null;
}
