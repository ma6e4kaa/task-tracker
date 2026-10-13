<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterRequest
{
    #[Assert\NotBlank(message: 'Email обязателен')]
    #[Assert\Email(message: 'Некорректный email')]
    #[Assert\Length(max: 180, maxMessage: 'Email слишком длинный')]
    public string $email = '';

    #[Assert\NotBlank(message: 'Пароль обязателен')]
    #[Assert\Length(
        min: 6,
        max: 100,
        minMessage: 'Пароль должен быть минимум {{ limit }} символов',
    )]
    public string $password = '';
}
