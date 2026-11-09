<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProjectRequest
{
    #[Assert\Length(min: 1, max: 255)]
    public ?string $name = null;

    #[Assert\Length(max: 5000)]
    public ?string $description = null;
}
