<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class CreateProjectRequest
{
    #[Assert\NotBlank(message: 'Название обязательно')]
    #[Assert\Length(min: 1, max: 255)]
    public string $name = '';

    #[Assert\Length(max: 5000)]
    public ?string $description = null;
}
