<?php

namespace App\Message\Handler;

use App\Message\TaskReadyForReviewNotification;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Mime\Address;

#[AsMessageHandler]
readonly class TaskReadyForReviewNotificationHandler
{
    public function __construct(
        private MailerInterface $mailer
    )
    {
    }

    /**
     * @throws TransportExceptionInterface
     */
    public function __invoke(TaskReadyForReviewNotification $message): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address('noreply@task-tracker.local', 'Task Tracker'))
            ->to($message->getReporterEmail())
            ->subject('Задача готова к проверке')
            ->htmlTemplate('emails/task_ready_for_review.html.twig')
            ->context([
                'taskTitle' => $message->getTaskTitle(),
                'projectName' => $message->getProjectName(),
                'taskUrl' => $message->getTaskUrl(),
            ]);

        $this->mailer->send($email);
    }
}
