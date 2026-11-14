package com.eniac.deaddrop;

import com.eniac.deaddrop.controller.SecretController;
import com.eniac.deaddrop.dto.SecretCreateRequest;
import com.eniac.deaddrop.dto.SecretCreateResponse;
import com.eniac.deaddrop.dto.SecretPayloadResponse;
import com.eniac.deaddrop.service.SecretService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SecretController.class)
public class SecretControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SecretService secretService;

    @Test
    void testPostSecret_ShouldReturn201Created() throws Exception {
        SecretCreateRequest request = new SecretCreateRequest("encryptedBase64", "ivBase64", 3600);
        when(secretService.createSecret(any(SecretCreateRequest.class))).thenReturn(new SecretCreateResponse("uuid-123"));

        mockMvc.perform(post("/api/secrets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("uuid-123"));
    }

    @Test
    void testGetSecret_WhenFound_ShouldReturn200AndPayload() throws Exception {
        when(secretService.getAndBurnSecret("uuid-123"))
                .thenReturn(Optional.of(new SecretPayloadResponse("encryptedBase64", "ivBase64")));

        mockMvc.perform(get("/api/secrets/uuid-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.encryptedPayload").value("encryptedBase64"))
                .andExpect(jsonPath("$.iv").value("ivBase64"));
    }

    @Test
    void testGetSecret_WhenAlreadyBurned_ShouldReturn404NotFound() throws Exception {
        when(secretService.getAndBurnSecret("uuid-burned"))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/secrets/uuid-burned"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("SecretNotFound"));
    }
}
