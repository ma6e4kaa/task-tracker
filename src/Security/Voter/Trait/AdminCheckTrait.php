<?php

namespace App\Security\Voter\Trait;

use App\Entity\User;

trait AdminCheckTrait
{
    private function isAdmin(User $user): bool
    {
        return in_array('ROLE_ADMIN', $user->getRoles(), true);
    }
}
