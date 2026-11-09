package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.exceptions.ConflictException;
import com.christian4747.pricetracker.exceptions.NotFoundException;
import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PricePeriod;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import com.christian4747.pricetracker.models.dtos.IncomingPriceRangeDTO;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.models.dtos.RecentPriceData;
import com.christian4747.pricetracker.specification.PriceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class PriceService {

    private static final Logger logger = LoggerFactory.getLogger(PriceService.class);

    // A product's prices, newest first. Prices that start at the same moment are newest first by ID, so their order
    // doesn't change between requests.
    public static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "priceStarted", "priceId");

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
        Timestamp priceStarted = priceDTO.getPriceStarted();
        Timestamp priceEnded = priceDTO.getPriceEnded();
        if (priceStarted != null && priceEnded != null && !priceEnded.after(priceStarted)) {
            logger.info("Attempted to add a Price with an end date ({}) not after its start date ({})", priceEnded, priceStarted);
            throw new IllegalArgumentException("Price end date must be after its start date!");
        }

        Optional<Product> existingProduct = productDAO.findById(priceDTO.getProductId());

        if (existingProduct.isEmpty()) {
            logger.info("Attempted to add a Price to Product ID that doesn't exist: {}", priceDTO.getProductId());
            throw new IllegalArgumentException("Product with ID " + priceDTO.getProductId() + " does not exist!");
        }

        requireActiveProduct(existingProduct.get());

        Price newPrice = new Price(
                0,
                priceDTO.getAmount(),
                priceDTO.getCurrency(),
                priceDTO.getDescription(),
                priceDTO.getDiscountAmount(),
                priceDTO.getDiscountPercentage(),
                false,
                priceDTO.getPriceStarted(),
                priceDTO.getPriceEnded(),
                priceDTO.getReturnAmount(),
                priceDTO.getReturnPercentage(),
                priceDTO.getDiscountAmount() - priceDTO.getReturnAmount(),
                calculateTotalPercentage(priceDTO.getDiscountAmount(), priceDTO.getReturnAmount(), priceDTO.getAmount()),
                null,
                null,
                null,
                existingProduct.get()
        );

        Price savedPrice = priceDAO.save(newPrice);
        logger.info("Created new Price with ID: {}", savedPrice.getPriceId());

        return savedPrice;
    }

    /**
     * Adds a new Price with an end date and the Price that starts one minute after it ends, which returns to the full
     * amount. The end date is the last minute of the first Price. Both are saved in one transaction, so if either fails
     * then neither is saved.
     * @param rangeDTO The new Price details, and whether the end Price keeps the description
     * @return The newly added Price, followed by the newly added end Price
     */
    @Transactional
    public List<Price> addPriceRange(IncomingPriceRangeDTO rangeDTO) {
        if (rangeDTO.getPriceEnded() == null) {
            logger.info("Attempted to add a Price range without an end date");
            throw new IllegalArgumentException("Price end date is required!");
        }

        Price savedPrice = addPrice(rangeDTO);

        // addPrice calculates the totals from the other values, so they don't need to be set here
        IncomingPriceDTO endPriceDTO = new IncomingPriceDTO(
                rangeDTO.getAmount(),
                rangeDTO.getCurrency(),
                rangeDTO.isUseEndDateDesc() ? rangeDTO.getDescription() : "",
                rangeDTO.getAmount(),
                0,
                Timestamp.from(rangeDTO.getPriceEnded().toInstant().plus(Duration.ofMinutes(1))),
                null,
                rangeDTO.getProductId(),
                0,
                0,
                0,
                0
        );
        Price savedEndPrice = addPrice(endPriceDTO);

        return List.of(savedPrice, savedEndPrice);
    }

    /**
     * Rejects a change that would leave an active Price on a deleted Product. Restoring the Product restores the Prices
     * deleted with it, so its Prices can't be added, edited, or restored on their own until then.
     * @param product The Product the Price belongs to, or is being moved to
     */
    private void requireActiveProduct(Product product) {
        if (product.getDeletedAt() != null) {
            logger.info("Attempted to change a Price of a deleted Product: {}", product.getProductId());
            throw new ConflictException("Restore the product first!");
        }
    }

    private double calculateTotalPercentage(double discountAmount, double returnAmount, double amount) {
        double totalPercentage = 1.0;
        if (amount > 0) {
            totalPercentage = 1 - ((discountAmount - returnAmount) / amount);
        }
        return totalPercentage;
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
            throw new NotFoundException("Price with ID " + priceId + " does not exist!");
        }

        priceDAO.deleteById(priceId);
        logger.info("Successfully deleted Price with ID: {}", priceId);

        return existingPrice.get();
    }

    /**
     * Restores a soft deleted Price in the 'prices' database table.
     * @param priceId The ID of the Price to restore
     * @return The restored Price
     */
    public Price restorePrice(Integer priceId) {
        Optional<Price> existingPrice = priceDAO.findById(priceId);

        if (existingPrice.isEmpty()) {
            logger.info("Attempted to restore a Price that doesn't exist: {}", priceId);
            throw new NotFoundException("Price with ID " + priceId + " does not exist!");
        }

        Price priceToRestore = existingPrice.get();
        requireActiveProduct(priceToRestore.getProduct());
        priceToRestore.setDeletedAt(null);
        Price restoredPrice = priceDAO.save(priceToRestore);
        logger.info("Successfully restored Price with ID: {}", priceId);

        return restoredPrice;
    }

    /**
     * Permanently removes a soft deleted Price from the 'prices' database table. This can't be undone.
     * @param priceId The ID of the Price to remove
     * @return The removed Price
     */
    @Transactional
    public Price permanentlyDeletePrice(Integer priceId) {
        Optional<Price> existingPrice = priceDAO.findById(priceId);

        if (existingPrice.isEmpty()) {
            logger.info("Attempted to permanently delete a Price that doesn't exist: {}", priceId);
            throw new NotFoundException("Price with ID " + priceId + " does not exist!");
        }

        if (existingPrice.get().getDeletedAt() == null) {
            logger.info("Attempted to permanently delete a Price that isn't deleted: {}", priceId);
            throw new ConflictException("Only deleted prices can be permanently deleted!");
        }

        priceDAO.permanentlyDeleteById(priceId);
        logger.info("Successfully permanently deleted Price with ID: {}", priceId);

        return existingPrice.get();
    }

    /**
     * Gets all the Prices in the 'prices' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Prices (default 20)
     */
    public List<Price> getAllPrices(Pageable pageable, Boolean showDeleted) {
        return findAllPrices(pageable, showDeleted).getContent();
    }

    private Page<Price> findAllPrices(Pageable pageable, Boolean showDeleted) {
        if (showDeleted) {
            return priceDAO.findAll(pageable);
        } else {
            return priceDAO.findByDeletedAtNull(pageable);
        }
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
            throw new NotFoundException("Price with ID " + priceId + " does not exist!");
        }

        return existingPrice.get();
    }

    /**
     * Counts all the Prices of the given productId, including soft deleted ones.
     * @param productId productId of the Prices to count
     * @return The number of Prices
     */
    public long getPriceCountByProductId(Integer productId) {
        return priceDAO.countByProductProductId(productId);
    }

    /**
     * Gets a list of Prices in the 'prices' database table with the given productId ordered by descending price started
     * timestamp. Adds an extra Price to the list signifying today's price, if a non-deleted Price has started. Every
     * matching Price is returned, since a product's history is only as long as the filter allows.
     * @param productId productId of the Prices to get
     * @param filter Limits the Prices by amount, percentage, and when they started (see PriceSpecification)
     * @param showDeleted Whether to include soft deleted Prices
     * @return The Prices associated with the given productId descending by priceStarted
     */
    public List<Price> getPricesByProductId(Integer productId, PriceFilterDTO filter, Boolean showDeleted) {
        // The sort below keeps NEWEST_FIRST's order for prices that start together, since List.sort is stable
        List<Price> prices = new ArrayList<>(priceDAO.findAll(
                PriceSpecification.filterPricesBy(productId, filter, showDeleted),
                NEWEST_FIRST
        ));
        if (prices.isEmpty()) return List.of();

        Optional<Price> todayPrice = priceDAO.findPriceToday(productId);

        if (todayPrice.isPresent()) {
            Price priceToAdd = todayPrice.get();
            priceToAdd.setToday(true);
            priceToAdd.setPriceStarted(Timestamp.from(Instant.now()));
            prices.add(priceToAdd);
        }

        prices.sort(Comparator.comparing(
                Price::getPriceStarted,
                Comparator.nullsLast(Comparator.naturalOrder())
        ).reversed());

        return prices;
    }

    /**
     * Gets a distinct list of recently added non-deleted Price base amounts for the given product ID.
     * @param pageable Pagination settings
     * @param productId Product to fetch base amounts for
     * @return A distinct list of recently added Price base amounts for the given product ID (default 20)
     */
    private List<Double> getRecentBaseAmounts(Pageable pageable, Integer productId) {
        return priceDAO.findDistinctBaseAmounts(pageable, productId).getContent();
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
     * Gets an object with lists of recent & distinct Price base amount, currencies, descriptions, discount percentage,
     * pricesStarted, pricesEnded, return percentage, and periods for the given product ID.
     * @param pageable Pagination settings
     * @param productId Product to find the recent base amounts for
     * @return An object with lists of recent & distinct Price base amounts, currencies, descriptions,
     * discount percentages, pricesStarted, pricesEnded, return percentages, and periods for the given product ID
     * (default 20)
     */
    public RecentPriceData getRecentData(Pageable pageable, Integer productId) {
        return new RecentPriceData(
                getRecentBaseAmounts(pageable, productId),
                getRecentCurrencies(pageable),
                getRecentDescriptions(pageable),
                getRecentDiscountPercentages(pageable),
                getRecentPricesStarted(pageable),
                getRecentPricesEnded(pageable),
                getRecentReturnPercentages(pageable),
                getRecentPricePeriods(pageable)
        );
    }

    /**
     * Gets a distinct list of the start and end dates of recently added Prices that have both, from all Products.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price periods (default 20)
     */
    private List<PricePeriod> getRecentPricePeriods(Pageable pageable) {
        return priceDAO.findDistinctPricePeriods(pageable).getContent();
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
     * Gets a distinct list of recently added non-deleted Price discount percentages.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price discount percentages (default 20)
     */
    private List<Double> getRecentDiscountPercentages(Pageable pageable) {
        return priceDAO.findDistinctDiscountPercentages(pageable).getContent();
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
     * Gets a distinct list of recently added non-deleted Price return percentages.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price return percentages (default 20)
     */
    private List<Double> getRecentReturnPercentages(Pageable pageable) {
        return priceDAO.findDistinctReturnPercentages(pageable).getContent();
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
            throw new NotFoundException("Price with ID " + priceId + " does not exist!");
        }

        Price priceToUpdate = existingPrice.get();
        requireActiveProduct(priceToUpdate.getProduct());
        priceToUpdate.setAmount(priceDTO.getAmount());
        priceToUpdate.setCurrency(priceDTO.getCurrency());
        priceToUpdate.setDescription(priceDTO.getDescription());
        priceToUpdate.setDiscountAmount(priceDTO.getDiscountAmount());
        priceToUpdate.setDiscountPercentage(priceDTO.getDiscountPercentage());
        priceToUpdate.setPriceStarted(priceDTO.getPriceStarted());
        priceToUpdate.setPriceEnded(priceDTO.getPriceEnded());
        priceToUpdate.setReturnAmount(priceDTO.getReturnAmount());
        priceToUpdate.setReturnPercentage(priceDTO.getReturnPercentage());
        priceToUpdate.setTotalAmount(priceDTO.getDiscountAmount() - priceDTO.getReturnAmount());
        priceToUpdate.setTotalPercentage(calculateTotalPercentage(priceDTO.getDiscountAmount(), priceDTO.getReturnAmount(), priceDTO.getAmount()));

        if (priceToUpdate.getProduct().getProductId() != priceDTO.getProductId()) {
            Optional<Product> existingProduct = productDAO.findById(priceDTO.getProductId());
            if (existingProduct.isEmpty()) {
                logger.info("Attempted to update a Price with a Product ID that doesn't exist: {}", priceDTO.getProductId());
                throw new IllegalArgumentException("Product with ID " + priceDTO.getProductId() + " does not exist!");
            }
            requireActiveProduct(existingProduct.get());
            priceToUpdate.setProduct(existingProduct.get());
        }

        Price updatedPrice = priceDAO.save(priceToUpdate);
        logger.info("Successfully updated Price with ID: {}", updatedPrice.getPriceId());
        
        return updatedPrice;
    }
}
