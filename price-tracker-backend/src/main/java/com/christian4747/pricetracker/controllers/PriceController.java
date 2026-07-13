package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import com.christian4747.pricetracker.services.PriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prices")
@CrossOrigin
public class PriceController {

    private final PriceService priceService;

    @Autowired
    public PriceController(PriceService priceService) {
        this.priceService = priceService;
    }

    /**
     * Adds a new Price to the 'prices' database table.
     * @param priceDTO The new Price details
     * @return The newly added Price
     */
    @PostMapping
    public ResponseEntity<Price> addPrice(@RequestBody IncomingPriceDTO priceDTO) {
        return ResponseEntity.ok(priceService.addPrice(priceDTO));
    }

    /**
     * Deletes a Price from the 'prices' database table.
     * @param priceId The ID of the Price to delete
     * @return The deleted Price
     */
    @DeleteMapping("/{priceId}")
    public ResponseEntity<Price> deletePrice(@PathVariable Integer priceId) {
        return ResponseEntity.ok(priceService.deletePrice(priceId));
    }

    /**
     * Gets all the Prices in 'prices' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Prices (default 20)
     */
    @GetMapping
    public ResponseEntity<List<Price>> getAllPrices(Pageable pageable) {
        return ResponseEntity.ok(priceService.getAllPrices(pageable).getContent());
    }

    /**
     * Updates a Price from the 'prices' database table.
     * @param priceId The ID of the Price to update
     * @param priceDTO The updated Price details
     * @return The updated Price
     */
    @PutMapping("/{priceId}")
    public ResponseEntity<Price> updatePrice(@PathVariable Integer priceId, @RequestBody IncomingPriceDTO priceDTO) {
        return ResponseEntity.ok(priceService.updatePrice(priceId, priceDTO));
    }
}
