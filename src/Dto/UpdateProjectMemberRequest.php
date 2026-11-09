<?php

namespace App\Dto;

use App\Entity\ProjectMember;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProjectMemberRequest
{
    #[Assert\NotBlank(message: 'Роль обязательна')]
    #[Assert\Choice(choices: ProjectMember::ROLES, message: 'Недопустимая роль')]
    public string $role = ProjectMember::ROLE_DEVELOPER;
}
