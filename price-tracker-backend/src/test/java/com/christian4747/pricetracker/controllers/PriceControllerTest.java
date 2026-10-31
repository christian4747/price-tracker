package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.dtos.IncomingPriceRangeDTO;
import com.christian4747.pricetracker.services.PriceService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PriceController.class)
public class PriceControllerTest {

    // The same format the frontend sends
    private static final String RANGE_JSON = """
            {
                "amount": 100,
                "priceStarted": "2026-09-05T12:00:00-04:00",
                "priceEnded": "2026-09-10T12:00:00-04:00",
                "productId": 1,
                "useEndDateDesc": true
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PriceService priceService;

    private Price createPrice(int priceId) {
        Price price = new Price();
        price.setPriceId(priceId);
        return price;
    }

    private ResultActions postRange() throws Exception {
        return mockMvc.perform(post("/prices/range").contentType(MediaType.APPLICATION_JSON).content(RANGE_JSON));
    }

    @Test
    public void addPriceRange_validRange_returnBothPrices() throws Exception {
        when(priceService.addPriceRange(any())).thenReturn(List.of(createPrice(1), createPrice(2)));

        postRange()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].priceId").value(1))
                .andExpect(jsonPath("$[1].priceId").value(2));
    }

    @Test
    public void addPriceRange_validRange_passRequestToService() throws Exception {
        when(priceService.addPriceRange(any())).thenReturn(List.of());

        postRange();

        ArgumentCaptor<IncomingPriceRangeDTO> rangeDTO = ArgumentCaptor.forClass(IncomingPriceRangeDTO.class);
        verify(priceService).addPriceRange(rangeDTO.capture());
        assertTrue(rangeDTO.getValue().isUseEndDateDesc());
        assertEquals(Timestamp.from(Instant.parse("2026-09-10T16:00:00Z")), rangeDTO.getValue().getPriceEnded());
    }

    @Test
    public void addPriceRange_rejectedRange_return400WithMessage() throws Exception {
        when(priceService.addPriceRange(any())).thenThrow(new IllegalArgumentException("Price end date is required!"));

        postRange()
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Price end date is required!"));
    }
}
