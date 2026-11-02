package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PeriodDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.PeriodType;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PeriodServiceTest {

    private static final Timestamp START = Timestamp.valueOf("2026-11-27 00:00:00");
    private static final Timestamp END = Timestamp.valueOf("2026-11-30 23:59:00");

    @InjectMocks
    private PeriodService periodService;

    @Mock
    private PeriodDAO periodDAO;

    @Mock
    private ProductDAO productDAO;

    @Captor
    private ArgumentCaptor<Period> periodCaptor;

    private IncomingPeriodDTO periodDTO;

    private static Period periodNamed(String name, Timestamp deletedAt) {
        return new Period(1, name, PeriodType.SALE, null, START, END, null, deletedAt, null);
    }

    private void saveReturnsThePeriod() {
        when(periodDAO.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void assertRejected(String message) {
        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.addPeriod(periodDTO));
        assertEquals(message, exception.getMessage());
        verify(periodDAO, never()).save(any());
    }

    @BeforeEach
    public void setUp() {
        periodDTO = new IncomingPeriodDTO("Black Friday", PeriodType.SALE, null, START, END);
    }

    @Test
    public void addPeriod_validPeriod_saveDetails() {
        saveReturnsThePeriod();

        periodService.addPeriod(periodDTO);

        verify(periodDAO).save(periodCaptor.capture());
        Period savedPeriod = periodCaptor.getValue();
        assertEquals("Black Friday", savedPeriod.getName());
        assertEquals(PeriodType.SALE, savedPeriod.getType());
        assertNull(savedPeriod.getStore());
        assertEquals(START, savedPeriod.getPeriodStarted());
        assertEquals(END, savedPeriod.getPeriodEnded());
    }

    @Test
    public void addPeriod_nullName_throwException() {
        periodDTO.setName(null);

        assertRejected("Name is required!");
    }

    @Test
    public void addPeriod_blankName_throwException() {
        periodDTO.setName("  ");

        assertRejected("Name is required!");
    }

    @Test
    public void addPeriod_nameWithSurroundingSpaces_saveTrimmedName() {
        periodDTO.setName("  Black Friday  ");
        saveReturnsThePeriod();

        periodService.addPeriod(periodDTO);

        verify(periodDAO).save(argThat(period -> "Black Friday".equals(period.getName())));
    }

    @Test
    public void addPeriod_nullType_throwException() {
        periodDTO.setType(null);

        assertRejected("Type is required!");
    }

    @Test
    public void addPeriod_nullStart_throwException() {
        periodDTO.setPeriodStarted(null);

        assertRejected("Start date is required!");
    }

    @Test
    public void addPeriod_nullEnd_throwException() {
        periodDTO.setPeriodEnded(null);

        assertRejected("End date is required!");
    }

    @Test
    public void addPeriod_endSameAsStart_throwException() {
        periodDTO.setPeriodEnded(START);

        assertRejected("Period end date must be after its start date!");
    }

    @Test
    public void addPeriod_endBeforeStart_throwException() {
        periodDTO.setPeriodStarted(END);
        periodDTO.setPeriodEnded(START);

        assertRejected("Period end date must be after its start date!");
    }

    @Test
    public void addPeriod_store_saveStore() {
        periodDTO.setStore("Store");
        when(productDAO.existsByStoreAndDeletedAtNull("Store")).thenReturn(true);
        saveReturnsThePeriod();

        periodService.addPeriod(periodDTO);

        verify(periodDAO).save(argThat(period -> "Store".equals(period.getStore())));
    }

    @Test
    public void addPeriod_blankStore_saveNullStore() {
        periodDTO.setStore("  ");
        saveReturnsThePeriod();

        periodService.addPeriod(periodDTO);

        verify(periodDAO).save(argThat(period -> period.getStore() == null));
    }

    @Test
    public void addPeriod_unknownStore_throwException() {
        periodDTO.setStore("Store");
        when(productDAO.existsByStoreAndDeletedAtNull("Store")).thenReturn(false);

        assertRejected("Store doesn't exist!");
    }

    @Test
    public void addPeriod_nameExists_throwException() {
        when(periodDAO.findAllByNameIgnoreCase(anyString())).thenReturn(List.of(periodNamed("Black Friday", null)));

        assertRejected("A period with this name already exists!");
    }

    @Test
    public void addPeriod_nameExistsAsDeletedPeriod_throwRestoreMessage() {
        Timestamp deletedAt = Timestamp.valueOf("2026-09-14 00:00:00");
        when(periodDAO.findAllByNameIgnoreCase(anyString())).thenReturn(List.of(periodNamed("Black Friday", deletedAt)));

        assertRejected("A deleted period has this name. Restore it instead!");
    }

    @Test
    public void addPeriod_nameWithSurroundingSpaces_checkTrimmedName() {
        periodDTO.setName("  Black Friday  ");
        saveReturnsThePeriod();

        periodService.addPeriod(periodDTO);

        verify(periodDAO).findAllByNameIgnoreCase("Black Friday");
    }
}
