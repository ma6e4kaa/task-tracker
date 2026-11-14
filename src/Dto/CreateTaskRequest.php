<?php

namespace App\Dto;

use App\Entity\Task;
use Symfony\Component\Validator\Constraints as Assert;

class CreateTaskRequest
{
    #[Assert\NotBlank(message: 'Название обязательно')]
    #[Assert\Length(max: 255)]
    public string $title = '';

    #[Assert\Length(max: 5000)]
    public ?string $description = null;

    #[Assert\Choice(choices: Task::STATUSES, message: 'Недопустимый статус')]
    public string $status = Task::STATUS_TODO;

    #[Assert\Choice(choices: Task::PRIORITIES, message: 'Недопустимый приоритет')]
    public string $priority = Task::PRIORITY_MEDIUM;

    #[Assert\Positive(message: 'Некорректный ID исполнителя')]
    public ?int $assigneeId = null;

    #[Assert\Date(message: 'Дата должна быть в формате YYYY-MM-DD')]
    public ?string $dueDate = null;
}
