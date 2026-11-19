<?php

namespace App\Message;

readonly class TaskReadyForReviewNotification
{
    public function __construct(
        private int    $taskId,
        private string $reporterEmail,
        private string $taskTitle,
        private string $projectName,
        private string $taskUrl,
    )
    {
    }

    public function getTaskId(): int
    {
        return $this->taskId;
    }

    public function getReporterEmail(): string
    {
        return $this->reporterEmail;
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
}
