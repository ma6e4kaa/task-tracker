<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProfileRequest
{
    #[Assert\Email(message: 'Некорректный email')]
    #[Assert\Length(max: 180)]
    public ?string $email = null;

    #[Assert\Length(min: 6, max: 100)]
    public ?string $password = null;

    public ?string $currentPassword = null;
}
