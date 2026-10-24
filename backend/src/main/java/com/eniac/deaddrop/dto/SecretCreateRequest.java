package com.eniac.deaddrop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SecretCreateRequest(
        @NotBlank(message = "encryptedPayload is mandatory")
        String encryptedPayload,

        @NotBlank(message = "iv is mandatory")
        String iv,

        @NotNull(message = "ttlSeconds is mandatory")
        @Positive(message = "ttlSeconds must be positive")
        Integer ttlSeconds
) {}
