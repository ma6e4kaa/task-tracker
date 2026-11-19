<?php

namespace App\Message;

readonly class TaskNotification
{
    public function __construct(
        public int     $taskId,
        public string  $toEmail,
        public string  $taskTitle,
        public string  $projectName,
        public string  $taskUrl,
        public ?string $dueDate = null,
        public string  $subject = 'Уведомление по задаче',
    )
    {
    }

    public function getTaskId(): int
    {
        return $this->taskId;
    }

    public function getToEmail(): string
    {
        return $this->toEmail;
    }

    public function getTaskTitle(): string
    {
        return $this->taskTitle;
    }

    public function getProjectName(): string
    {
        return $this->projectName;
    }

    public function getTaskUrl(): string
    {
        return $this->taskUrl;
    }

    public function getDueDate(): ?string
    {
        return $this->dueDate;
    }

    public function getSubject(): string
    {
        return $this->subject;
    }
}
