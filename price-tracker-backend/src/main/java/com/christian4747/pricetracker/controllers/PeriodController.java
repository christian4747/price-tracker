package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import com.christian4747.pricetracker.services.PeriodService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/periods")
@CrossOrigin
public class PeriodController {

    private final PeriodService periodService;

    public PeriodController(PeriodService periodService) {
        this.periodService = periodService;
    }

    /**
     * Gets the Periods for the given store, along with the Periods for all stores.
     * @param store Store of the Periods to get, or none for every store's Periods
     * @param showDeleted Whether to include soft deleted Periods (default false)
     * @return A list of the store's Periods, current and upcoming first, then past
     */
    @GetMapping
    public ResponseEntity<List<Period>> getPeriods(
            @RequestParam(required = false) String store, @RequestParam(defaultValue = "false") Boolean showDeleted) {
        return ResponseEntity.ok(periodService.getPeriods(store, showDeleted));
    }

    /**
     * Adds a new Period to the 'periods' database table.
     * @param periodDTO The new Period details
     * @return The newly added Period
     */
    @PostMapping
    public ResponseEntity<Period> addPeriod(@RequestBody IncomingPeriodDTO periodDTO) {
        return ResponseEntity.ok(periodService.addPeriod(periodDTO));
    }

    /**
     * Updates a Period in the 'periods' database table.
     * @param periodId The ID of the Period to update
     * @param periodDTO The updated Period details
     * @return The updated Period
     */
    @PutMapping("/{periodId}")
    public ResponseEntity<Period> updatePeriod(@PathVariable Integer periodId, @RequestBody IncomingPeriodDTO periodDTO) {
        return ResponseEntity.ok(periodService.updatePeriod(periodId, periodDTO));
    }

    /**
     * Deletes a Period from the 'periods' database table.
     * @param periodId The ID of the Period to delete
     * @return The deleted Period
     */
    @DeleteMapping("/{periodId}")
    public ResponseEntity<Period> deletePeriod(@PathVariable Integer periodId) {
        return ResponseEntity.ok(periodService.deletePeriod(periodId));
    }

    /**
     * Restores a soft deleted Period in the 'periods' database table.
     * @param periodId The ID of the Period to restore
     * @return The restored Period
     */
    @PutMapping("/{periodId}/restore")
    public ResponseEntity<Period> restorePeriod(@PathVariable Integer periodId) {
        return ResponseEntity.ok(periodService.restorePeriod(periodId));
    }

    /**
     * Permanently removes a soft deleted Period from the database. This can't be undone.
     * @param periodId The ID of the Period to remove
     * @return The removed Period
     */
    @DeleteMapping("/{periodId}/permanent")
    public ResponseEntity<Period> permanentlyDeletePeriod(@PathVariable Integer periodId) {
        return ResponseEntity.ok(periodService.permanentlyDeletePeriod(periodId));
    }
}
