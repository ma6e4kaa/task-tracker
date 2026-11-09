<?php

namespace App\Security\Voter;

use App\Entity\Project;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class ProjectVoter extends Voter
{
    public const VIEW = 'PROJECT_VIEW';
    public const EDIT = 'PROJECT_EDIT';
    public const DELETE = 'PROJECT_DELETE';
    public const MANAGE_MEMBERS = 'PROJECT_MANAGE_MEMBERS';

    /**
     * @inheritDoc
     */
    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, [self::VIEW, self::EDIT, self::DELETE, self::MANAGE_MEMBERS], true)) {
            return false;
        }

        if (!$subject instanceof Project) {
            return false;
        }

        return true;
    }

    /**
     * @inheritDoc
     */
    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var Project $project */
        $project = $subject;

        return match ($attribute) {
            self::VIEW => $this->canView($project, $user),
            self::EDIT, self::DELETE, self::MANAGE_MEMBERS => $this->isOwner($project, $user),
            default => false,
        };
    }

    private function canView(Project $project, User $user): bool
    {
        if ($this->isOwner($project, $user)) {
            return true;
        }

        foreach ($project->getMembers() as $member) {
            if ($member->getUser() === $user) {
                return true;
            }
        }
        return false;
    }

    private function isOwner(Project $project, User $user): bool
    {
        return $project->getOwner() === $user;
    }
}
