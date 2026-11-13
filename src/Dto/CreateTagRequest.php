<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class CreateTagRequest
{
    #[Assert\NotBlank(message: 'Название тега обязательно')]
    #[Assert\Length(min: 1, max: 50)]
    public string $name = '';

    #[Assert\Regex(
        pattern: '/^#[0-9A-Fa-f]{6}$/',
        message: 'Цвет должен быть в формате HEX (например, #FF0000)'
    )]
    public ?string $color = '#007aff';
}
