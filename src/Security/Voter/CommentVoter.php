<?php

namespace App\Security\Voter;

use App\Entity\Comment;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class CommentVoter extends Voter
{
    public const EDIT = 'COMMENT_EDIT';
    public const DELETE = 'COMMENT_DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, [self::EDIT, self::DELETE], true)) {
            return false;
        }
        if (!$subject instanceof Comment) {
            return false;
        }
        return true;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var Comment $comment */
        $comment = $subject;

        return match ($attribute) {
            self::EDIT => $this->canEdit($comment, $user),
            self::DELETE => $this->canDelete($comment, $user),
            default => false,
        };
    }

    private function canEdit(Comment $comment, User $user): bool
    {
        // Автор комментария может редактировать
        if ($comment->getAuthor() === $user) {
            return true;
        }

        return false;
    }

    private function canDelete(Comment $comment, User $user): bool
    {
        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return true;
        }

        // Автор комментария может удалять
        if ($comment->getAuthor() === $user) {
            return true;
        }

        return false;
    }
}
