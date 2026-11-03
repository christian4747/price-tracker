package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.PeriodType;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import com.christian4747.pricetracker.services.PeriodService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Timestamp;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PeriodController.class)
public class PeriodControllerTest {

    private static final String PERIOD_JSON = """
        {
            "name": "Black Friday",
            "type": "SALE",
            "store": "Store",
            "periodStarted": "2026-11-27T00:00:00.000Z",
            "periodEnded": "2026-11-30T23:59:00.000Z"
        }
    """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PeriodService periodService;

    @Test
    public void addPeriod_json_passDetailsToService() throws Exception {
        when(periodService.addPeriod(any())).thenReturn(new Period());

        mockMvc.perform(post("/periods").contentType(MediaType.APPLICATION_JSON).content(PERIOD_JSON))
                .andExpect(status().isOk());

        ArgumentCaptor<IncomingPeriodDTO> periodCaptor = ArgumentCaptor.forClass(IncomingPeriodDTO.class);
        verify(periodService).addPeriod(periodCaptor.capture());
        IncomingPeriodDTO periodDTO = periodCaptor.getValue();
        assertEquals("Black Friday", periodDTO.getName());
        assertEquals(PeriodType.SALE, periodDTO.getType());
        assertEquals("Store", periodDTO.getStore());
        assertEquals(Timestamp.from(Instant.parse("2026-11-27T00:00:00Z")), periodDTO.getPeriodStarted());
        assertEquals(Timestamp.from(Instant.parse("2026-11-30T23:59:00Z")), periodDTO.getPeriodEnded());
    }

    @Test
    public void addPeriod_addedPeriod_returnPeriodWithTypeName() throws Exception {
        Period period = new Period();
        period.setPeriodId(1);
        period.setType(PeriodType.RETURN);
        when(periodService.addPeriod(any())).thenReturn(period);

        mockMvc.perform(post("/periods").contentType(MediaType.APPLICATION_JSON).content(PERIOD_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodId").value(1))
                .andExpect(jsonPath("$.type").value("RETURN"));
    }

    @Test
    public void addPeriod_rejectedPeriod_return400WithMessage() throws Exception {
        when(periodService.addPeriod(any())).thenThrow(new IllegalArgumentException("Name is required!"));

        mockMvc.perform(post("/periods").contentType(MediaType.APPLICATION_JSON).content(PERIOD_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Name is required!"));
    }

    @Test
    public void updatePeriod_json_passIdAndDetailsToService() throws Exception {
        when(periodService.updatePeriod(eq(1), any())).thenReturn(new Period());

        mockMvc.perform(put("/periods/1").contentType(MediaType.APPLICATION_JSON).content(PERIOD_JSON))
                .andExpect(status().isOk());

        verify(periodService).updatePeriod(eq(1), argThat(periodDTO -> "Black Friday".equals(periodDTO.getName())));
    }

    @Test
    public void deletePeriod_periodId_passIdToService() throws Exception {
        when(periodService.deletePeriod(1)).thenReturn(new Period());

        mockMvc.perform(delete("/periods/1")).andExpect(status().isOk());

        verify(periodService).deletePeriod(1);
    }

    @Test
    public void restorePeriod_periodId_passIdToService() throws Exception {
        when(periodService.restorePeriod(1)).thenReturn(new Period());

        mockMvc.perform(put("/periods/1/restore")).andExpect(status().isOk());

        verify(periodService).restorePeriod(1);
    }

    @Test
    public void permanentlyDeletePeriod_periodId_passIdToService() throws Exception {
        when(periodService.permanentlyDeletePeriod(1)).thenReturn(new Period());

        mockMvc.perform(delete("/periods/1/permanent")).andExpect(status().isOk());

        verify(periodService).permanentlyDeletePeriod(1);
    }
}
