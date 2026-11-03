package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import com.christian4747.pricetracker.services.PeriodService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/periods")
@CrossOrigin
public class PeriodController {

    private final PeriodService periodService;

    public PeriodController(PeriodService periodService) {
        this.periodService = periodService;
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
