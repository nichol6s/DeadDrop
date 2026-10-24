package com.eniac.deaddrop;

import com.eniac.deaddrop.dto.SecretCreateRequest;
import com.eniac.deaddrop.dto.SecretCreateResponse;
import com.eniac.deaddrop.dto.SecretPayloadResponse;
import com.eniac.deaddrop.service.SecretService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecretServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private SecretService secretService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        secretService = new SecretService(redisTemplate);
    }

    @Test
    void testCreateSecret_ShouldSaveToRedisWithTTL() {
        SecretCreateRequest request = new SecretCreateRequest("c2VjcmV0UGF5bG9hZA==", "aXYxMjM0NQ==", 3600);

        SecretCreateResponse response = secretService.createSecret(request);

        assertNotNull(response);
        assertNotNull(response.id());
        assertFalse(response.id().isEmpty());

        verify(valueOperations).set(
                eq("secret:" + response.id()),
                contains("c2VjcmV0UGF5bG9hZA=="),
                eq(3600L),
                eq(TimeUnit.SECONDS)
        );
    }

    @Test
    void testGetAndBurnSecret_WhenExists_ShouldReturnAndAtomicallyDelete() {
        String secretId = "test-uuid-1234";
        String storedJson = "{\"encryptedPayload\":\"c2VjcmV0UGF5bG9hZA==\",\"iv\":\"aXYxMjM0NQ==\"}";

        when(valueOperations.getAndDelete("secret:" + secretId)).thenReturn(storedJson);

        Optional<SecretPayloadResponse> result = secretService.getAndBurnSecret(secretId);

        assertTrue(result.isPresent());
        assertEquals("c2VjcmV0UGF5bG9hZA==", result.get().encryptedPayload());
        assertEquals("aXYxMjM0NQ==", result.get().iv());

        verify(valueOperations).getAndDelete("secret:" + secretId);
    }

    @Test
    void testGetAndBurnSecret_WhenAlreadyBurnedOrExpired_ShouldReturnEmpty() {
        String secretId = "already-burned-or-expired";

        when(valueOperations.getAndDelete("secret:" + secretId)).thenReturn(null);

        Optional<SecretPayloadResponse> result = secretService.getAndBurnSecret(secretId);

        assertTrue(result.isEmpty());
        verify(valueOperations).getAndDelete("secret:" + secretId);
    }
}
