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
}
