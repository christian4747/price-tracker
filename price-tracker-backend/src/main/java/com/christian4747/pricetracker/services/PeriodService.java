package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PeriodDAO;
import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.models.MatchingPeriodPrice;
import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import com.christian4747.pricetracker.models.dtos.ResponseAndCount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class PeriodService {

    private static final Logger logger = LoggerFactory.getLogger(PeriodService.class);

    private final PeriodDAO periodDAO;
    private final PriceDAO priceDAO;

    @Autowired
    public PeriodService(PeriodDAO periodDAO, PriceDAO priceDAO) {
        this.periodDAO = periodDAO;
        this.priceDAO = priceDAO;
    }

    /**
     * Gets the Periods for the given store, along with the Periods for all stores. Current and upcoming
     * Periods come first, soonest start first, then past Periods, most recently ended first.
     * @param store Store of the Periods to get, or null or blank for every store's Periods
     * @param showDeleted Whether to include soft deleted Periods
     * @return A list of the store's Periods
     */
    public List<Period> getPeriods(String store, Boolean showDeleted) {
        return periodDAO.findAllForStore(nullIfBlank(store), showDeleted, Timestamp.from(Instant.now()));
    }

    /**
     * Gets the non-deleted Prices of non-deleted Products that fall within a Period's dates, newest start first. A
     * Price matches when both its start and end are within the Period, and its Product is at the Period's store when the
     * Period has one.
     * @param periodId The ID of the Period to get the Prices of
     * @param pageable Pagination settings
     * @return The page's matching Prices, each with its Product, and the number of matching Prices across all pages
     */
    public ResponseAndCount<MatchingPeriodPrice> getPeriodPrices(Integer periodId, Pageable pageable) {
        Period period = findPeriod(periodId, "get the Prices of");

        Page<Price> pricePage =
                priceDAO.findAllWithinPeriod(pageable, period.getPeriodStarted(), period.getPeriodEnded(), period.getStore());
        List<MatchingPeriodPrice> matchingPeriodPrices = pricePage.getContent().stream()
                .map(price -> new MatchingPeriodPrice(price, price.getProduct()))
                .toList();

        return new ResponseAndCount<>(matchingPeriodPrices, pricePage.getTotalElements());
    }

    /**
     * Adds a new Period to the 'periods' database table.
     * @param periodDTO The new Period details
     * @return The newly added Period
     */
    public Period addPeriod(IncomingPeriodDTO periodDTO) {
        checkRequiredFields(periodDTO);
        checkDates(periodDTO);
        String name = periodDTO.getName().strip();
        String store = nullIfBlank(periodDTO.getStore());
        checkForDuplicateName(name, null);

        Period newPeriod = new Period(
                0,
                name,
                periodDTO.getType(),
                store,
                periodDTO.getPeriodStarted(),
                periodDTO.getPeriodEnded(),
                null,
                null,
                null
        );

        Period savedPeriod = periodDAO.save(newPeriod);
        logger.info("Created new Period with ID: {}", savedPeriod.getPeriodId());

        return savedPeriod;
    }

    /**
     * Updates a Period in the 'periods' database table.
     * @param periodId The ID of the Period to update
     * @param periodDTO The updated Period details
     * @return The updated Period
     */
    public Period updatePeriod(Integer periodId, IncomingPeriodDTO periodDTO) {
        Period periodToUpdate = findPeriod(periodId, "update");

        checkRequiredFields(periodDTO);
        checkDates(periodDTO);
        String name = periodDTO.getName().strip();
        String store = nullIfBlank(periodDTO.getStore());
        checkForDuplicateName(name, periodId);

        periodToUpdate.setName(name);
        periodToUpdate.setType(periodDTO.getType());
        periodToUpdate.setStore(store);
        periodToUpdate.setPeriodStarted(periodDTO.getPeriodStarted());
        periodToUpdate.setPeriodEnded(periodDTO.getPeriodEnded());

        Period savedPeriod = periodDAO.save(periodToUpdate);
        logger.info("Successfully updated Period with ID: {}", periodId);

        return savedPeriod;
    }

    /**
     * Deletes a Period from the 'periods' database table. Deleted Periods are kept, so they can be restored.
     * @param periodId The ID of the Period to delete
     * @return The deleted Period
     */
    public Period deletePeriod(Integer periodId) {
        Period periodToDelete = findPeriod(periodId, "delete");

        periodDAO.deleteById(periodId);
        logger.info("Successfully deleted Period with ID: {}", periodId);

        return periodToDelete;
    }

    /**
     * Restores a soft deleted Period in the 'periods' database table. No other Period can have its name, since deleted
     * Periods count when names are checked.
     * @param periodId The ID of the Period to restore
     * @return The restored Period
     */
    public Period restorePeriod(Integer periodId) {
        Period periodToRestore = findPeriod(periodId, "restore");

        periodToRestore.setDeletedAt(null);
        Period restoredPeriod = periodDAO.save(periodToRestore);
        logger.info("Successfully restored Period with ID: {}", periodId);

        return restoredPeriod;
    }

    /**
     * Permanently removes a soft deleted Period from the 'periods' database table. This can't be undone.
     * @param periodId The ID of the Period to remove
     * @return The removed Period
     */
    @Transactional
    public Period permanentlyDeletePeriod(Integer periodId) {
        Period periodToRemove = findPeriod(periodId, "permanently delete");

        if (periodToRemove.getDeletedAt() == null) {
            logger.info("Attempted to permanently delete a Period that isn't deleted: {}", periodId);
            throw new IllegalArgumentException("Only deleted periods can be permanently deleted!");
        }

        // The query only removes deleted Periods, so nothing is removed if the Period was restored after it was checked
        if (periodDAO.permanentlyDeleteById(periodId) == 0) {
            logger.info("Attempted to permanently delete a Period that was restored: {}", periodId);
            throw new IllegalArgumentException("Only deleted periods can be permanently deleted!");
        }
        logger.info("Successfully permanently deleted Period with ID: {}", periodId);

        return periodToRemove;
    }

    /**
     * Gets the Period with the given ID, or throws if it doesn't exist.
     * @param periodId The ID of the Period to get
     * @param action What was attempted, for the log
     * @return The Period with the given ID
     */
    private Period findPeriod(Integer periodId, String action) {
        Optional<Period> existingPeriod = periodDAO.findById(periodId);

        if (existingPeriod.isEmpty()) {
            logger.info("Attempted to {} a Period that doesn't exist: {}", action, periodId);
            throw new IllegalArgumentException("Period with ID " + periodId + " does not exist!");
        }

        return existingPeriod.get();
    }

    /**
     * Throws if the given Period details are missing a name, type, start date, or end date.
     * @param periodDTO The Period details to check
     */
    private void checkRequiredFields(IncomingPeriodDTO periodDTO) {
        if (periodDTO.getName() == null || periodDTO.getName().isBlank()) {
            logger.info("Attempted to save a Period without a name");
            throw new IllegalArgumentException("Name is required!");
        }
        if (periodDTO.getType() == null) {
            logger.info("Attempted to save a Period without a type: {}", periodDTO.getName());
            throw new IllegalArgumentException("Type is required!");
        }
        if (periodDTO.getPeriodStarted() == null) {
            logger.info("Attempted to save a Period without a start date: {}", periodDTO.getName());
            throw new IllegalArgumentException("Start date is required!");
        }
        if (periodDTO.getPeriodEnded() == null) {
            logger.info("Attempted to save a Period without an end date: {}", periodDTO.getName());
            throw new IllegalArgumentException("End date is required!");
        }
    }

    /**
     * Throws if the given Period ends at or before its start.
     * @param periodDTO The Period details to check, with both dates set
     */
    private void checkDates(IncomingPeriodDTO periodDTO) {
        if (!periodDTO.getPeriodEnded().after(periodDTO.getPeriodStarted())) {
            logger.info("Attempted to save a Period with an end date ({}) not after its start date ({})", periodDTO.getPeriodEnded(), periodDTO.getPeriodStarted());
            throw new IllegalArgumentException("Period end date must be after its start date!");
        }
    }

    /**
     * Throws if another Period already uses the given name, ignoring case. Deleted Periods count too, so they can be
     * restored instead of duplicated. Names are kept unique so that a list of Periods never shows two with the same name.
     * @param name Name to check, without surrounding spaces
     * @param periodId ID of the Period being edited, or null when adding a Period
     */
    private void checkForDuplicateName(String name, Integer periodId) {
        List<Period> otherPeriods = periodDAO.findAllByNameIgnoreCase(name).stream()
                .filter(period -> periodId == null || period.getPeriodId() != periodId)
                .toList();
        if (otherPeriods.isEmpty()) return;

        logger.info("Attempted to save a Period with a name that already exists: {}", name);
        if (otherPeriods.stream().allMatch(period -> period.getDeletedAt() != null)) {
            throw new IllegalArgumentException("A deleted period has this name. Restore it instead!");
        }
        throw new IllegalArgumentException("A period with this name already exists!");
    }

    /**
     * Converts a blank value to null, so a blank store means all stores.
     * @param value The value to check
     * @return Null if the value is blank, otherwise the value
     */
    private String nullIfBlank(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
