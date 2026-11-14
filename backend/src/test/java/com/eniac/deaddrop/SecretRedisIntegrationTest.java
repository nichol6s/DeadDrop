package com.eniac.deaddrop;

import com.eniac.deaddrop.dto.SecretCreateRequest;
import com.eniac.deaddrop.service.SecretService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/** Uses a real Redis instance; removes only the random keys created by these tests. */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "RUN_REDIS_INTEGRATION_TESTS", matches = "true")
class SecretRedisIntegrationTest {

    @Autowired
    private SecretService service;

    @Autowired
    private StringRedisTemplate redis;

    private final List<String> createdKeys = new ArrayList<>();

    private String createSecret(int ttlSeconds) {
        String id = service.createSecret(
                new SecretCreateRequest("encrypted-fixture", "iv-fixture", ttlSeconds)).id();
        createdKeys.add("secret:" + id);
        return id;
    }

    @AfterEach
    void removeTestKeys() {
        if (!createdKeys.isEmpty()) {
            redis.delete(createdKeys);
        }
    }

    @Test
    void aSecretCanOnlyBeRetrievedOnce() {
        String id = createSecret(30);
        assertThat(service.getAndBurnSecret(id)).hasValueSatisfying(payload -> {
            assertThat(payload.encryptedPayload()).isEqualTo("encrypted-fixture");
            assertThat(payload.iv()).isEqualTo("iv-fixture");
        });
        assertThat(service.getAndBurnSecret(id)).isEmpty();
    }

    @Test
    void unreadSecretsExpireInRedis() {
        String id = createSecret(1);
        assertThat(redis.hasKey("secret:" + id)).isTrue();
        await().atMost(Duration.ofSeconds(5)).untilAsserted(
                () -> assertThat(redis.hasKey("secret:" + id)).isFalse());
        assertThat(service.getAndBurnSecret(id)).isEmpty();
    }

    @Test
    void concurrentReadersHaveExactlyOneWinner() throws Exception {
        String id = createSecret(30);
        var executor = Executors.newFixedThreadPool(8);
        try {
            List<Callable<Boolean>> readers = new ArrayList<>();
            for (int i = 0; i < 8; i++) {
                readers.add(() -> service.getAndBurnSecret(id).isPresent());
            }
            int successfulReaders = 0;
            for (var result : executor.invokeAll(readers)) {
                if (result.get()) {
                    successfulReaders++;
                }
            }
            assertThat(successfulReaders).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }
}
