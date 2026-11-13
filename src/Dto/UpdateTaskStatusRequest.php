<?php

namespace App\Dto;

use App\Entity\Task;
use Symfony\Component\Validator\Constraints as Assert;

class UpdateTaskStatusRequest
{
    #[Assert\NotBlank(message: 'Статус обязателен')]
    #[Assert\Choice(choices: Task::STATUSES, message: 'Недопустимый статус')]
    public string $status = '';
}
