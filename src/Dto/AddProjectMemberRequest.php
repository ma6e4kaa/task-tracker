<?php

namespace App\Dto;

use App\Entity\ProjectMember;

use Symfony\Component\Validator\Constraints as Assert;

class AddProjectMemberRequest
{
    #[Assert\NotBlank(message: 'Email обязателен')]
    #[Assert\Email(message: 'Некорректный email')]
    public string $email = '';

    #[Assert\Choice(choices: ProjectMember::ROLES, message: 'Недопустимая роль')]
    public string $role = ProjectMember::ROLE_DEVELOPER;
}
