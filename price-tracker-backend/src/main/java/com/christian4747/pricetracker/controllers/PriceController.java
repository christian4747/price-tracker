package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.services.PriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping
    @RequestMapping("/all")
    public ResponseEntity<List<Price>> getAllPrices(Pageable pageable) {
        return ResponseEntity.ok(priceService.getAllPrices(pageable).getContent());
    }
}
