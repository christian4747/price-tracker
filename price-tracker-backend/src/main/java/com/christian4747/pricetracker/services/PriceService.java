package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import com.christian4747.pricetracker.models.dtos.RecentPriceData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
public class PriceService {

    private static final Logger logger = LoggerFactory.getLogger(PriceService.class);

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

        if (existingProduct.isEmpty()) {
            logger.info("Attempted to add a Price to Product ID that doesn't exist: {}", priceDTO.getProductId());
            throw new IllegalArgumentException("Product with ID " + priceDTO.getProductId() + " does not exist!");
        }

        Price newPrice = new Price(
                0,
                priceDTO.getAmount(),
                priceDTO.getCurrency(),
                priceDTO.getDescription(),
                priceDTO.getDiscountAmount(),
                priceDTO.getDiscountPercentage(),
                priceDTO.getPriceStarted(),
                priceDTO.getPriceEnded(),
                priceDTO.getReturnAmount(),
                priceDTO.getReturnPercentage(),
                null,
                null,
                existingProduct.get()
        );

        Price savedPrice = priceDAO.save(newPrice);
        logger.info("Created new Price with ID: {}", savedPrice.getPriceId());

        return savedPrice;
    }

    /**
     * Deletes a Price from the 'prices' database table.
     * @param priceId The ID of the Price to delete
     * @return The deleted Price
     */
    public Price deletePrice(Integer priceId) {
        Optional<Price> existingPrice = priceDAO.findById(priceId);

        if (existingPrice.isEmpty()) {
            logger.info("Attempted to delete a Price that doesn't exist: {}", priceId);
            throw new IllegalArgumentException("Price with ID " + priceId + " does not exist!");
        }

        priceDAO.deleteById(priceId);
        logger.info("Successfully deleted Price with ID: {}", priceId);

        return existingPrice.get();
    }

    /**
     * Gets all the Prices in the 'prices' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Prices (default 20)
     */
    public List<Price> getAllPrices(Pageable pageable) {
        return priceDAO.findAll(pageable).getContent();
    }

    /**
     * Gets the Price in the 'prices' database table with the given ID.
     * @param priceId ID of the Price to get
     * @return The Price associated with the given ID
     */
    public Price getPriceById(Integer priceId) {
        Optional<Price> existingPrice = priceDAO.findById(priceId);

        if (existingPrice.isEmpty()) {
            logger.info("Attempted to get a Price that doesn't exist: {}", priceId);
            throw new IllegalArgumentException("Price with ID " + priceId + " does not exist!");
        }

        return existingPrice.get();
    }

    /**
     * Gets a distinct list of recently added Price currencies.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price currencies (default 20)
     */
    public List<String> getRecentCurrencies(Pageable pageable) {
        return priceDAO.findDistinctCurrency(pageable).getContent();
    }

    /**
     * Gets a distinct list of recently added Price currencies, descriptions, pricesStarted and pricesEnded.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price currencies, descriptions, pricesStarted and pricesEnded (default 20)
     */
    public RecentPriceData getRecentData(Pageable pageable) {
        return new RecentPriceData(
                getRecentCurrencies(pageable),
                getRecentDescriptions(pageable),
                getRecentPricesStarted(pageable),
                getRecentPricesEnded(pageable)
        );
    }

    /**
     * Gets a distinct list of recently added Price descriptions.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price descriptions (default 20)
     */
    public List<String> getRecentDescriptions(Pageable pageable) {
        return priceDAO.findDistinctDescription(pageable).getContent();
    }

    /**
     * Gets a distinct list of recently added Price priceEnded time stamps.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price priceEnded time stamps (default 20)
     */
    public List<Timestamp> getRecentPricesEnded(Pageable pageable) {
        return priceDAO.findDistinctPriceEndedOrderByCreatedAtDesc(pageable).getContent();
    }

    /**
     * Gets a distinct list of recently added Price priceStarted time stamps.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price priceStarted time stamps (default 20)
     */
    public List<Timestamp> getRecentPricesStarted(Pageable pageable) {
        return priceDAO.findDistinctPriceStartedOrderByCreatedAtDesc(pageable).getContent();
    }

    /**
     * Updates a Price from the 'prices' database table.
     * @param priceId The ID of the Price to update
     * @param priceDTO The updated Price details
     * @return The updated Price
     */
    public Price updatePrice(Integer priceId, IncomingPriceDTO priceDTO) {
        Optional<Price> existingPrice = priceDAO.findById(priceId);

        if (existingPrice.isEmpty()) {
            logger.info("Attempted to update a Price that doesn't exist: {}", priceId);
            throw new IllegalArgumentException("Price with ID " + priceId + " does not exist!");
        }

        Price priceToUpdate = existingPrice.get();
        priceToUpdate.setAmount(priceDTO.getAmount());
        priceToUpdate.setCurrency(priceDTO.getCurrency());
        priceToUpdate.setDescription(priceDTO.getDescription());
        priceToUpdate.setDiscountAmount(priceDTO.getDiscountAmount());
        priceToUpdate.setDiscountPercentage(priceDTO.getDiscountPercentage());
        priceToUpdate.setPriceStarted(priceDTO.getPriceStarted());
        priceToUpdate.setPriceEnded(priceDTO.getPriceEnded());
        priceToUpdate.setReturnAmount(priceDTO.getReturnAmount());
        priceToUpdate.setReturnPercentage(priceDTO.getReturnPercentage());

        if (priceToUpdate.getProduct().getProductId() != priceDTO.getProductId()) {
            Optional<Product> existingProduct = productDAO.findById(priceDTO.getProductId());
            if (existingProduct.isEmpty()) {
                logger.info("Attempted to update a Price with a Product ID that doesn't exist: {}", priceDTO.getProductId());
                throw new IllegalArgumentException("Product with ID " + priceDTO.getProductId() + " does not exist!");
            }
            priceToUpdate.setProduct(existingProduct.get());
        }

        Price updatedPrice = priceDAO.save(priceToUpdate);
        logger.info("Successfully updated Price with ID: {}", updatedPrice.getPriceId());
        
        return updatedPrice;
    }
}
