<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class CommentRequest
{
    #[Assert\NotBlank(message: 'Текст комментария не может быть пустым')]
    #[Assert\Length(max: 5000, maxMessage: 'Комментарий слишком длинный')]
    public string $content = '';
}
