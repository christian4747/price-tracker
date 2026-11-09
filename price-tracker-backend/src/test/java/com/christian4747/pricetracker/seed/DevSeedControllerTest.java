package com.christian4747.pricetracker.seed;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DevSeedController.class)
@ActiveProfiles("seed")
class DevSeedControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DevSeeder devSeeder;

    @Test
    void seedRunsTheSeederAndReturnsHowManyRecordsItAdded() throws Exception {
        when(devSeeder.seed(any())).thenReturn(new SeedResult(2, 5, 1));

        mockMvc.perform(post("/dev/seed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products").value(2))
                .andExpect(jsonPath("$.prices").value(5))
                .andExpect(jsonPath("$.periods").value(1));

        verify(devSeeder).seed(any(SeedData.class));
    }
}
