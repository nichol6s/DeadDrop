package com.eniac.deaddrop.controller;

import com.eniac.deaddrop.dto.SecretCreateRequest;
import com.eniac.deaddrop.dto.SecretCreateResponse;
import com.eniac.deaddrop.dto.SecretPayloadResponse;
import com.eniac.deaddrop.service.SecretService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/secrets")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class SecretController {

    private final SecretService secretService;

    public SecretController(SecretService secretService) {
        this.secretService = secretService;
    }

    @PostMapping
    public ResponseEntity<SecretCreateResponse> createSecret(@Valid @RequestBody SecretCreateRequest request) {
        SecretCreateResponse response = secretService.createSecret(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAndBurnSecret(@PathVariable String id) {
        return secretService.getAndBurnSecret(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error", "SecretNotFound",
                                "message", "Este segredo não existe, já foi incinerado na primeira leitura ou expirou o tempo limite."
                        )));
    }
}
