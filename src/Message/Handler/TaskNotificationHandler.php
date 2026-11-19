<?php

namespace App\Message\Handler;

use App\Message\TaskNotification;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Mime\Address;

#[AsMessageHandler]
readonly class TaskNotificationHandler
{
    public function __construct(
        private MailerInterface $mailer
    )
    {
    }

    /**
     * @throws TransportExceptionInterface
     */
    public function __invoke(TaskNotification $message): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address('noreply@task-tracker.local', 'Task Tracker'))
            ->to($message->toEmail)
            ->subject($message->subject)
            ->htmlTemplate('emails/task_notification.html.twig')
            ->context([
                'subject' => $message->subject,
                'taskTitle' => $message->taskTitle,
                'projectName' => $message->projectName,
                'dueDate' => $message->dueDate ?? 'без срока',
                'taskUrl' => $message->taskUrl,
            ]);

        $this->mailer->send($email);
    }
}
