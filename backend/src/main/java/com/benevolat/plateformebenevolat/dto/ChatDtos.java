package com.benevolat.plateformebenevolat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class ChatDtos {

    public record ChatMessageDto(
            @NotBlank String role,
            @NotBlank @Size(max = 1000) String content
    ) {}

    public record ChatRequest(
            @NotBlank @Size(max = 500) String message,
            List<ChatMessageDto> history
    ) {}

    public record ChatResponse(
            String reply,
            boolean fallback,
            List<String> suggestions
    ) {}
}
