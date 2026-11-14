<?php

namespace App\Dto;

use App\Entity\Task;
use Symfony\Component\Validator\Constraints as Assert;

class UpdateTaskRequest
{
    #[Assert\Length(min: 1, max: 255)]
    public ?string $title = null;

    #[Assert\Length(max: 5000)]
    public ?string $description = null;

    #[Assert\Choice(choices: Task::STATUSES, message: 'Недопустимый статус')]
    public ?string $status = null;

    #[Assert\Choice(choices: Task::PRIORITIES, message: 'Недопустимый приоритет')]
    public ?string $priority = null;

    #[Assert\Positive(message: 'Некорректный ID исполнителя')]
    public ?int $assigneeId = null;

    #[Assert\Date(message: 'Дата должна быть в формате YYYY-MM-DD')]
    public ?string $dueDate = null;

    public bool $clearAssignee = false;
}
