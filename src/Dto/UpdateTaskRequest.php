<?php

namespace App\Dto;

use App\Entity\Task;
use Symfony\Component\Validator\Constraints as Assert;

class UpdateTaskRequest
{
    #[Assert\Length(min: 1, max: 255)]
    public ?string $title = null;

    public ?string $description = null;

    #[Assert\Choice(choices: Task::STATUSES, message: 'Недопустимый статус')]
    public ?string $status = null;

    #[Assert\Choice(choices: Task::PRIORITIES, message: 'Недопустимый приоритет')]
    public ?string $priority = null;

    public ?int $assigneeId = null;

    public ?string $dueDate = null;

    public bool $clearAssignee = false; // Флаг для сброса исполнителя
}
