package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.models.Price;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PriceService {

    private final PriceDAO priceDAO;

    @Autowired
    public PriceService(PriceDAO priceDAO) {
        this.priceDAO = priceDAO;
    }

    public List<Price> getAllPrices() {
        return priceDAO.findAll();
    }
}
