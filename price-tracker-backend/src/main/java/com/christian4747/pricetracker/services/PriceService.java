package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;


@Service
public class PriceService {

    private final PriceDAO priceDAO;
    private final ProductDAO productDAO;

    @Autowired
    public PriceService(PriceDAO priceDAO, ProductDAO productDAO) {
        this.priceDAO = priceDAO;
        this.productDAO = productDAO;
    }

    /**
     * Adds a new Price to the 'prices' database table.
     * @param priceDTO The new Price details
     * @return The newly added Price
     */
    public Price addPrice(IncomingPriceDTO priceDTO) {
        Optional<Product> existingProduct = productDAO.findById(priceDTO.getProductId());

        if (existingProduct.isEmpty())
            throw new IllegalArgumentException("Product with ID " + priceDTO.getProductId() + " does not exist!");

        Price newPrice = new Price(
                0,
                priceDTO.getAmount(),
                priceDTO.getCurrency(),
                priceDTO.getPriceStarted(),
                priceDTO.getPriceEnded(),
                null,
                null,
                existingProduct.get()
        );

        return priceDAO.save(newPrice);
    }

    /**
     * Deletes a Price from the 'prices' database table.
     * @param priceId The ID of the Price to delete
     * @return The deleted Price
     */
    public Price deletePrice(Integer priceId) {
        Optional<Price> existingPrice = priceDAO.findById(priceId);

        if (existingPrice.isEmpty())
            throw new IllegalArgumentException("Price with ID " + priceId + " does not exist!");

        priceDAO.deleteById(priceId);
        return existingPrice.get();
    }

    /**
     * Gets all the Prices in 'prices' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Prices (default 20)
     */
    public Page<Price> getAllPrices(Pageable pageable) {
        return priceDAO.findAll(pageable);
    }

    /**
     * Updates a Price from the 'prices' database table.
     * @param priceId The ID of the Price to update
     * @param priceDTO The updated Price details
     * @return The updated Price
     */
    public Price updatePrice(Integer priceId, IncomingPriceDTO priceDTO) {
        Optional<Price> existingPrice = priceDAO.findById(priceId);

        if (existingPrice.isEmpty())
            throw new IllegalArgumentException("Price with ID " + priceId + " does not exist!");

        Price priceToUpdate = existingPrice.get();
        priceToUpdate.setAmount(priceDTO.getAmount());
        priceToUpdate.setCurrency(priceDTO.getCurrency());
        priceToUpdate.setPriceStarted(priceDTO.getPriceStarted());
        priceToUpdate.setPriceEnded(priceDTO.getPriceEnded());

        if (priceToUpdate.getProduct().getProductId() != priceDTO.getProductId()) {
            Optional<Product> existingProduct = productDAO.findById(priceDTO.getProductId());
            if (existingProduct.isEmpty()) {
                throw new IllegalArgumentException("Product with ID " + priceDTO.getProductId() + " does not exist!");
            }
            priceToUpdate.setProduct(existingProduct.get());
        }

        return priceDAO.save(priceToUpdate);
    }
}
