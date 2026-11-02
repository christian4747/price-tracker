package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PeriodDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PeriodService {

    private static final Logger logger = LoggerFactory.getLogger(PeriodService.class);

    private final PeriodDAO periodDAO;
    private final ProductDAO productDAO;

    @Autowired
    public PeriodService(PeriodDAO periodDAO, ProductDAO productDAO) {
        this.periodDAO = periodDAO;
        this.productDAO = productDAO;
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
        checkStoreExists(store);
        checkForDuplicateName(name);

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
     * Throws if the given store isn't used by any non-deleted Product. A Period's store is picked from existing stores,
     * since stores are plain text on each Product.
     * @param store The store to check, or null for a Period that applies to all stores
     */
    private void checkStoreExists(String store) {
        if (store != null && !productDAO.existsByStoreAndDeletedAtNull(store)) {
            logger.info("Attempted to save a Period with a store that doesn't exist: {}", store);
            throw new IllegalArgumentException("Store doesn't exist!");
        }
    }

    /**
     * Throws if another Period already uses the given name, ignoring case. Deleted Periods count too, so they can be
     * restored instead of duplicated. Names are kept unique so that a list of Periods never shows two with the same name.
     * @param name Name to check, without surrounding spaces
     */
    private void checkForDuplicateName(String name) {
        List<Period> otherPeriods = periodDAO.findAllByNameIgnoreCase(name);
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
