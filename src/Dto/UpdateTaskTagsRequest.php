<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateTaskTagsRequest
{
    /**
     * @var int[]
     */
    #[Assert\All([
        new Assert\Positive(message: 'ID тега должен быть больше нуля'),
    ])]
    public array $tagIds = [];
}
