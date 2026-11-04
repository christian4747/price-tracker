package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PeriodDAO;
import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.models.MatchingPeriodPrice;
import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.PeriodType;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import com.christian4747.pricetracker.models.dtos.ResponseAndCount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PeriodServiceTest {

    private static final Timestamp START = Timestamp.valueOf("2026-11-27 00:00:00");
    private static final Timestamp END = Timestamp.valueOf("2026-11-30 23:59:00");
    private static final Timestamp OTHER_START = Timestamp.valueOf("2026-12-20 00:00:00");
    private static final Timestamp OTHER_END = Timestamp.valueOf("2026-12-26 23:59:00");
    private static final Timestamp DELETED = Timestamp.valueOf("2026-12-01 00:00:00");

    @InjectMocks
    private PeriodService periodService;

    @Mock
    private PeriodDAO periodDAO;

    @Mock
    private PriceDAO priceDAO;

    @Captor
    private ArgumentCaptor<Period> periodCaptor;

    private IncomingPeriodDTO periodDTO;

    private static Period period(int periodId, String name, Timestamp deletedAt) {
        return new Period(periodId, name, PeriodType.SALE, null, START, END, null, deletedAt, null);
    }

    /** Stores a Period with ID 1 for the edit, delete, and restore tests to find. */
    private Period storePeriod(String store, Timestamp deletedAt) {
        Period storedPeriod = new Period(1, "Old name", PeriodType.RETURN, store, OTHER_START, OTHER_END, null, deletedAt, null);
        when(periodDAO.findById(1)).thenReturn(Optional.of(storedPeriod));
        return storedPeriod;
    }

    private void saveReturnsThePeriod() {
        when(periodDAO.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void assertAddRejected(String message) {
        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.addPeriod(periodDTO));
        assertEquals(message, exception.getMessage());
        verify(periodDAO, never()).save(any());
    }

    private void assertUpdateRejected(String message) {
        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.updatePeriod(1, periodDTO));
        assertEquals(message, exception.getMessage());
        verify(periodDAO, never()).save(any());
    }

    @BeforeEach
    public void setUp() {
        periodDTO = new IncomingPeriodDTO("Black Friday", PeriodType.SALE, null, START, END);
    }

    @Test
    public void getPeriods_store_passStoreAndCurrentTimeToDAO() {
        List<Period> periods = List.of(period(1, "Black Friday", null));
        when(periodDAO.findAllForStore(eq("Corner shop"), eq(false), any())).thenReturn(periods);
        Instant before = Instant.now();

        List<Period> result = periodService.getPeriods("Corner shop", false);

        ArgumentCaptor<Timestamp> nowCaptor = ArgumentCaptor.forClass(Timestamp.class);
        verify(periodDAO).findAllForStore(eq("Corner shop"), eq(false), nowCaptor.capture());
        assertSame(periods, result);
        assertFalse(nowCaptor.getValue().toInstant().isBefore(before));
        assertFalse(nowCaptor.getValue().toInstant().isAfter(Instant.now()));
    }

    @Test
    public void getPeriods_blankStore_passNullForEveryStore() {
        periodService.getPeriods("  ", false);

        verify(periodDAO).findAllForStore(isNull(), eq(false), any());
    }

    @Test
    public void getPeriods_showDeleted_passShowDeletedToDAO() {
        periodService.getPeriods("Corner shop", true);

        verify(periodDAO).findAllForStore(eq("Corner shop"), eq(true), any());
    }

    @Test
    public void getPeriodPrices_missingPeriod_throwException() {
        when(periodDAO.findById(1)).thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.getPeriodPrices(1, PageRequest.of(0, 20)));
        assertEquals("Period with ID 1 does not exist!", exception.getMessage());
    }

    @Test
    public void getPeriodPrices_period_passDatesAndStoreToDAO() {
        storePeriod("Corner shop", null);
        PageRequest pageable = PageRequest.of(1, 5);
        when(priceDAO.findAllWithinPeriod(any(), any(), any(), any())).thenReturn(Page.empty());

        periodService.getPeriodPrices(1, pageable);

        verify(priceDAO).findAllWithinPeriod(pageable, OTHER_START, OTHER_END, "Corner shop");
    }

    @Test
    public void getPeriodPrices_matchingPrices_pairEachPriceWithItsProduct() {
        storePeriod(null, null);
        Product product = new Product();
        Price price = new Price();
        price.setProduct(product);
        when(priceDAO.findAllWithinPeriod(any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of(price)));

        List<MatchingPeriodPrice> matchingPeriodPrices = periodService.getPeriodPrices(1, PageRequest.of(0, 20)).content();

        assertEquals(1, matchingPeriodPrices.size());
        assertSame(price, matchingPeriodPrices.get(0).price());
        assertSame(product, matchingPeriodPrices.get(0).product());
    }

    @Test
    public void getPeriodPrices_matchingPrices_returnTotalAcrossAllPages() {
        storePeriod(null, null);
        List<Price> lastFivePrices = Stream.generate(() -> {
            Price price = new Price();
            price.setProduct(new Product());
            return price;
        }).limit(5).toList();
        // The third page of 20 holds matches 41 to 45, out of 45 in total
        when(priceDAO.findAllWithinPeriod(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(lastFivePrices, PageRequest.of(2, 20), 45));

        ResponseAndCount<MatchingPeriodPrice> matchingPeriodPrices = periodService.getPeriodPrices(1, PageRequest.of(2, 20));

        assertEquals(45L, matchingPeriodPrices.count());
    }

    @Test
    public void getPeriodPrices_deletedPeriod_stillGetPrices() {
        storePeriod(null, DELETED);
        when(priceDAO.findAllWithinPeriod(any(), any(), any(), isNull())).thenReturn(Page.empty());

        periodService.getPeriodPrices(1, PageRequest.of(0, 20));

        verify(priceDAO).findAllWithinPeriod(any(), eq(OTHER_START), eq(OTHER_END), isNull());
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

        assertAddRejected("Name is required!");
    }

    @Test
    public void addPeriod_blankName_throwException() {
        periodDTO.setName("  ");

        assertAddRejected("Name is required!");
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

        assertAddRejected("Type is required!");
    }

    @Test
    public void addPeriod_nullStart_throwException() {
        periodDTO.setPeriodStarted(null);

        assertAddRejected("Start date is required!");
    }

    @Test
    public void addPeriod_nullEnd_throwException() {
        periodDTO.setPeriodEnded(null);

        assertAddRejected("End date is required!");
    }

    @Test
    public void addPeriod_endSameAsStart_throwException() {
        periodDTO.setPeriodEnded(START);

        assertAddRejected("Period end date must be after its start date!");
    }

    @Test
    public void addPeriod_endBeforeStart_throwException() {
        periodDTO.setPeriodStarted(END);
        periodDTO.setPeriodEnded(START);

        assertAddRejected("Period end date must be after its start date!");
    }

    @Test
    public void addPeriod_store_saveStore() {
        periodDTO.setStore("Store");
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
    public void addPeriod_nameExists_throwException() {
        when(periodDAO.findAllByNameIgnoreCase(anyString())).thenReturn(List.of(period(2, "Black Friday", null)));

        assertAddRejected("A period with this name already exists!");
    }

    @Test
    public void addPeriod_nameExistsAsDeletedPeriod_throwRestoreMessage() {
        Timestamp deletedAt = Timestamp.valueOf("2026-09-14 00:00:00");
        when(periodDAO.findAllByNameIgnoreCase(anyString())).thenReturn(List.of(period(2, "Black Friday", deletedAt)));

        assertAddRejected("A deleted period has this name. Restore it instead!");
    }

    @Test
    public void addPeriod_nameWithSurroundingSpaces_checkTrimmedName() {
        periodDTO.setName("  Black Friday  ");
        saveReturnsThePeriod();

        periodService.addPeriod(periodDTO);

        verify(periodDAO).findAllByNameIgnoreCase("Black Friday");
    }

    @Test
    public void updatePeriod_missingPeriod_throwException() {
        when(periodDAO.findById(1)).thenReturn(Optional.empty());

        assertUpdateRejected("Period with ID 1 does not exist!");
    }

    @Test
    public void updatePeriod_validPeriod_saveDetails() {
        storePeriod(null, null);
        saveReturnsThePeriod();

        periodService.updatePeriod(1, periodDTO);

        verify(periodDAO).save(periodCaptor.capture());
        Period savedPeriod = periodCaptor.getValue();
        assertEquals(1, savedPeriod.getPeriodId());
        assertEquals("Black Friday", savedPeriod.getName());
        assertEquals(PeriodType.SALE, savedPeriod.getType());
        assertNull(savedPeriod.getStore());
        assertEquals(START, savedPeriod.getPeriodStarted());
        assertEquals(END, savedPeriod.getPeriodEnded());
    }

    @Test
    public void updatePeriod_blankName_throwException() {
        storePeriod(null, null);
        periodDTO.setName("  ");

        assertUpdateRejected("Name is required!");
    }

    @Test
    public void updatePeriod_endBeforeStart_throwException() {
        storePeriod(null, null);
        periodDTO.setPeriodStarted(END);
        periodDTO.setPeriodEnded(START);

        assertUpdateRejected("Period end date must be after its start date!");
    }

    @Test
    public void updatePeriod_nameWithSurroundingSpaces_saveTrimmedName() {
        storePeriod(null, null);
        periodDTO.setName("  Black Friday  ");
        saveReturnsThePeriod();

        periodService.updatePeriod(1, periodDTO);

        verify(periodDAO).save(argThat(period -> "Black Friday".equals(period.getName())));
    }

    @Test
    public void updatePeriod_nameOfAnotherPeriod_throwException() {
        storePeriod(null, null);
        when(periodDAO.findAllByNameIgnoreCase("Black Friday")).thenReturn(List.of(period(2, "Black Friday", null)));

        assertUpdateRejected("A period with this name already exists!");
    }

    @Test
    public void updatePeriod_ownNameInADifferentCase_savePeriod() {
        Period storedPeriod = storePeriod(null, null);
        storedPeriod.setName("black friday");
        when(periodDAO.findAllByNameIgnoreCase("Black Friday")).thenReturn(List.of(storedPeriod));
        saveReturnsThePeriod();

        periodService.updatePeriod(1, periodDTO);

        verify(periodDAO).save(argThat(period -> "Black Friday".equals(period.getName())));
    }

    @Test
    public void updatePeriod_store_saveStore() {
        storePeriod(null, null);
        periodDTO.setStore("Store");
        saveReturnsThePeriod();

        periodService.updatePeriod(1, periodDTO);

        verify(periodDAO).save(argThat(period -> "Store".equals(period.getStore())));
    }

    @Test
    public void updatePeriod_blankStore_saveNullStore() {
        storePeriod("Store", null);
        periodDTO.setStore("  ");
        saveReturnsThePeriod();

        periodService.updatePeriod(1, periodDTO);

        verify(periodDAO).save(argThat(period -> period.getStore() == null));
    }

    @Test
    public void deletePeriod_missingPeriod_throwException() {
        when(periodDAO.findById(1)).thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.deletePeriod(1));
        assertEquals("Period with ID 1 does not exist!", exception.getMessage());
        verify(periodDAO, never()).deleteById(anyInt());
    }

    @Test
    public void deletePeriod_existingPeriod_softDeletePeriod() {
        storePeriod(null, null);

        periodService.deletePeriod(1);

        verify(periodDAO).deleteById(1);
    }

    @Test
    public void deletePeriod_existingPeriod_returnPeriod() {
        Period storedPeriod = storePeriod(null, null);

        assertSame(storedPeriod, periodService.deletePeriod(1));
    }

    @Test
    public void restorePeriod_missingPeriod_throwException() {
        when(periodDAO.findById(1)).thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.restorePeriod(1));
        assertEquals("Period with ID 1 does not exist!", exception.getMessage());
        verify(periodDAO, never()).save(any());
    }

    @Test
    public void restorePeriod_deletedPeriod_clearDeletedTime() {
        storePeriod(null, DELETED);
        saveReturnsThePeriod();

        periodService.restorePeriod(1);

        verify(periodDAO).save(argThat(period -> period.getDeletedAt() == null));
    }

    @Test
    public void permanentlyDeletePeriod_missingPeriod_throwException() {
        when(periodDAO.findById(1)).thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.permanentlyDeletePeriod(1));
        assertEquals("Period with ID 1 does not exist!", exception.getMessage());
        verify(periodDAO, never()).permanentlyDeleteById(anyInt());
    }

    @Test
    public void permanentlyDeletePeriod_periodNotDeleted_throwException() {
        storePeriod(null, null);

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.permanentlyDeletePeriod(1));
        assertEquals("Only deleted periods can be permanently deleted!", exception.getMessage());
        verify(periodDAO, never()).permanentlyDeleteById(anyInt());
    }

    @Test
    public void permanentlyDeletePeriod_deletedPeriod_removePeriod() {
        storePeriod(null, DELETED);
        when(periodDAO.permanentlyDeleteById(1)).thenReturn(1);

        periodService.permanentlyDeletePeriod(1);

        verify(periodDAO).permanentlyDeleteById(1);
    }

    @Test
    public void permanentlyDeletePeriod_restoredBeforeRemoving_throwException() {
        storePeriod(null, DELETED);
        when(periodDAO.permanentlyDeleteById(1)).thenReturn(0);

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> periodService.permanentlyDeletePeriod(1));
        assertEquals("Only deleted periods can be permanently deleted!", exception.getMessage());
    }

    // The removal is a @Modifying query, which only runs inside a transaction
    @Test
    public void permanentlyDeletePeriod_isTransactional() throws NoSuchMethodException {
        Method permanentlyDeletePeriod = PeriodService.class.getMethod("permanentlyDeletePeriod", Integer.class);

        assertTrue(permanentlyDeletePeriod.isAnnotationPresent(Transactional.class));
    }
}
