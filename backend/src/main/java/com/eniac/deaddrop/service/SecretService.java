package com.eniac.deaddrop.service;

import com.eniac.deaddrop.dto.SecretCreateRequest;
import com.eniac.deaddrop.dto.SecretCreateResponse;
import com.eniac.deaddrop.dto.SecretPayloadResponse;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class SecretService {

    private static final String KEY_PREFIX = "secret:";
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public SecretService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = JsonMapper.builder().build();
    }

    public SecretCreateResponse createSecret(SecretCreateRequest request) {
        String id = UUID.randomUUID().toString();
        String redisKey = KEY_PREFIX + id;

        try {
            SecretPayloadResponse payload = new SecretPayloadResponse(request.encryptedPayload(), request.iv());
            String jsonValue = objectMapper.writeValueAsString(payload);
            redisTemplate.opsForValue().set(redisKey, jsonValue, request.ttlSeconds(), TimeUnit.SECONDS);
            return new SecretCreateResponse(id);
        } catch (JacksonException e) {
            throw new RuntimeException("Failed to serialize secret payload", e);
        }
    }

    public Optional<SecretPayloadResponse> getAndBurnSecret(String id) {
        String redisKey = KEY_PREFIX + id;
        String rawJson = redisTemplate.opsForValue().getAndDelete(redisKey);

        if (rawJson == null || rawJson.isBlank()) {
            return Optional.empty();
        }

        try {
            SecretPayloadResponse payload = objectMapper.readValue(rawJson, SecretPayloadResponse.class);
            return Optional.of(payload);
        } catch (JacksonException e) {
            return Optional.empty();
        }
    }
}
