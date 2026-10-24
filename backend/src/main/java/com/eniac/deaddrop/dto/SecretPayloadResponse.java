package com.eniac.deaddrop.dto;

public record SecretPayloadResponse(String encryptedPayload, String iv) {}
