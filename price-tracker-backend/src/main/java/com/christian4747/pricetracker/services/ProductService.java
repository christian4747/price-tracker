package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PriceTotalPercentages;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.StartedPrice;
import com.christian4747.pricetracker.models.dtos.*;
import com.christian4747.pricetracker.specification.ProductSpecification;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    // Averages of doubles can be off by tiny amounts, so a price must be below the average by at least this much
    private static final double HALF_CENT = 0.005;

    private final ProductDAO productDAO;
    private final PriceDAO priceDAO;

    @Autowired
    public ProductService(ProductDAO productDAO, PriceDAO priceDAO) {
        this.productDAO = productDAO;
        this.priceDAO = priceDAO;
    }

    /**
     * Adds a new Product to the 'products' database table.
     * @param productDTO The new Product details
     * @return The newly added Product
     */
    public Product addProduct(IncomingProductDTO productDTO) {
        checkForDuplicate(productDTO.getName(), productDTO.getStore(), null);

        Product newProduct = new Product(
                0,
                productDTO.getBrand(),
                productDTO.getName(),
                productDTO.getLink(),
                productDTO.getStore(),
                true,
                null,
                null,
                null,
                null
        );

        Product savedProduct = productDAO.save(newProduct);
        logger.info("Created new Product with ID: {}", savedProduct.getProductId());

        return savedProduct;
    }

    /**
     * Deletes a Product from the 'products' database table.
     * @param productId The ID of the Product to delete
     * @return The deleted Product
     */
    public Product deleteProduct(Integer productId) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isPresent()) {
            productDAO.deleteById(productId);
            logger.info("Successfully deleted Product with ID: {}", productId);
            return existingProduct.get();
        } else {
            logger.info("Attempted to delete a Product that doesn't exist: {}", productId);
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");
        }
    }

    /**
     * Permanently removes a soft deleted Product and all its Prices from the database. Both are removed in one
     * transaction, so if either fails then neither is removed. This can't be undone.
     * @param productId The ID of the Product to remove
     * @return The removed Product
     */
    @Transactional
    public Product permanentlyDeleteProduct(Integer productId) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isEmpty()) {
            logger.info("Attempted to permanently delete a Product that doesn't exist: {}", productId);
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");
        }

        if (existingProduct.get().getDeletedAt() == null) {
            logger.info("Attempted to permanently delete a Product that isn't deleted: {}", productId);
            throw new IllegalArgumentException("Only deleted products can be permanently deleted!");
        }

        int removedPriceCount = priceDAO.permanentlyDeleteByProductId(productId);
        logger.info("Permanently deleted {} Price(s) of Product ID: {}", removedPriceCount, productId);
        // Throwing rolls back the removed Prices if the Product was restored after it was checked
        if (productDAO.permanentlyDeleteById(productId) == 0) {
            logger.info("Attempted to permanently delete a Product that was restored: {}", productId);
            throw new IllegalArgumentException("Only deleted products can be permanently deleted!");
        }
        logger.info("Successfully permanently deleted Product with ID: {}", productId);

        return existingProduct.get();
    }

    /**
     * Restores a soft deleted Product in the 'products' database table, along with the Prices that were deleted with it.
     * Prices deleted separately before the Product stay deleted.
     * @param productId The ID of the Product to restore
     * @return The restored Product
     */
    @Transactional
    public Product restoreProduct(Integer productId) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isEmpty()) {
            logger.info("Attempted to restore a Product that doesn't exist: {}", productId);
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");
        }

        Product productToRestore = existingProduct.get();
        if (productToRestore.getDeletedAt() != null) {
            boolean activeDuplicateExists = findOtherProducts(productToRestore.getName(), productToRestore.getStore(), productId)
                    .stream()
                    .anyMatch(product -> product.getDeletedAt() == null);
            if (activeDuplicateExists) {
                logger.info("Attempted to restore a Product that would duplicate another Product: {}", productId);
                throw new IllegalArgumentException("Another product with the same name and store already exists!");
            }

            int restoredPriceCount = priceDAO.restoreByProductIdAndDeletedAt(productId, productToRestore.getDeletedAt());
            logger.info("Restored {} Price(s) deleted with Product ID: {}", restoredPriceCount, productId);
        }

        productToRestore.setDeletedAt(null);
        Product restoredProduct = productDAO.save(productToRestore);
        logger.info("Successfully restored Product with ID: {}", productId);

        return restoredProduct;
    }

    /**
     * Finds the other Products with the given name and store, including deleted Products.
     * @param name Name to match
     * @param store Store to match
     * @param productId ID of the Product to leave out, or null to check every Product
     * @return The other Products with the given name and store
     */
    private List<Product> findOtherProducts(String name, String store, Integer productId) {
        return productDAO.findAllByName(name).stream()
                .filter(product -> Objects.equals(product.getStore(), store))
                .filter(product -> productId == null || product.getProductId() != productId)
                .toList();
    }

    /**
     * Throws if another Product already uses the given name and store. Deleted Products count too, so they can be
     * restored instead of duplicated.
     * @param name Name to check
     * @param store Store to check
     * @param productId ID of the Product being edited, or null when adding a Product
     */
    private void checkForDuplicate(String name, String store, Integer productId) {
        List<Product> otherProducts = findOtherProducts(name, store, productId);
        if (otherProducts.isEmpty()) return;

        logger.info("Attempted to save a Product that already exists: {}, {}", name, store);
        if (otherProducts.stream().allMatch(product -> product.getDeletedAt() != null)) {
            throw new IllegalArgumentException("Product already exists as a deleted product. Restore it instead!");
        }
        throw new IllegalArgumentException("Product already exists!");
    }

    /**
     * Gets all the products with the given pagination settings, product filter DTO, and price filter DTO.
     * @param productFilterDTO Product filter details
     * @param priceFilterDTO Current price filter details
     * @param pageable Pagination settings
     * @return All products with applied pagination and filter details
     */
    public ResponseAndCount<OutgoingProductDTO> getAllProductsFiltered(ProductFilterDTO productFilterDTO, PriceFilterDTO priceFilterDTO, Pageable pageable) {
        Specification<Product> productSpecification = ProductSpecification
                .filterProductBy(productFilterDTO)
                .and(ProductSpecification.filterProductPriceBy(priceFilterDTO));
        Page<Product> productPage = productDAO.findAll(productSpecification, addSortByStore(addSortByName(pageable)));
        List<Product> productList = productPage.getContent();

        List<OutgoingProductDTO> productsWithDateToday =
                productList.stream().map(this::getProductWithPriceToday).toList();

        return new ResponseAndCount<>(productsWithDateToday, productPage.getTotalElements());
    }

    /**
     * Returns a page request containing the sort options for the 'name' property from the given pageable object.
     * @param pageable The pageable to extract sort options for the 'name' property from
     * @return A page request containing the sort options for the 'name' property from the given pageable object
     */
    private PageRequest getPageRequestForDistinctNames(Pageable pageable) {
        Sort.Order nameOrder = pageable.getSort().getOrderFor("name");
        if (nameOrder != null) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(nameOrder));
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("name").ascending());
    }

    /**
     * Inspects the given pageable object and appends a default 'name' sort if not present.
     * @param pageable The pageable object to inspect
     * @return The given pageable object or a new pageable object with the default 'name' sort
     */
    private PageRequest addSortByName(Pageable pageable) {
        if (pageable.getSort().getOrderFor("name") == null) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort().and(Sort.by("name").ascending()));
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
    }

    /**
     * Inspects the given pageable object and appends a default 'store' sort if not present.
     * @param pageable The pageable object to inspect
     * @return The given pageable object or a new pageable object with the default 'store' sort
     */
    private PageRequest addSortByStore(Pageable pageable) {
        if (pageable.getSort().getOrderFor("store") == null) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort().and(Sort.by("store").ascending()));
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
    }

    /**
     * Gets the Products grouped by name.
     * The returned list is formatted as ProductNameGroupDTO records and contains the following:
     *  - name: name of the Product
     *  - products: list of the Products corresponding to the 'name'
     * @param productFilterDTO Product filter details
     * @param priceFilterDTO Current price filter details
     * @param pageable Pagination settings
     * @param groupBy String to group the Products by
     * @return A list of ProductNameGroupDTO
     */
    public ResponseAndCount<ProductNameGroupDTO> getProductsGroupedByName(ProductFilterDTO productFilterDTO, PriceFilterDTO priceFilterDTO, Pageable pageable, String groupBy) {
        // Separate page settings from sort settings
        PageRequest pageRequest = getPageRequestForDistinctNames(pageable);

        Specification<Product> filterSpecification = ProductSpecification
                .filterProductBy(productFilterDTO)
                .and(ProductSpecification.filterProductPriceBy(priceFilterDTO));

        // Find page of distinct names that match the filters TODO: Change query to find product objects for sorting
        Page<String> uniqueNamesPage = productDAO.findDistinctNames(filterSpecification, pageRequest);

        // Find all products in list of names and filter by specification
        Specification<Product> productSpecification = filterSpecification
                .and(ProductSpecification.inNameList(uniqueNamesPage.getContent()));

        // Apply the specification and sort settings
        List<Product> productsInNamesPage = productDAO.findAll(productSpecification, addSortByStore(addSortByName(pageable)).getSort());

        // Get the names in the sorted order
        List<String> sortedNamesList = productsInNamesPage.stream().map(Product::getName).distinct().toList();

        // Construct OutgoingProductDTO
        List<OutgoingProductDTO> outgoingProductDTOS =
                productsInNamesPage.stream().map(this::getProductWithPriceToday).toList();

        // Group OutgoingProductDTO by name in a map
        Map<String, List<OutgoingProductDTO>> groupedByName = outgoingProductDTOS.stream()
                .collect(Collectors.groupingBy(outgoingProductDTO -> outgoingProductDTO.product().getName()));

        // Construct ProductNameGroupDTO & return it with the count
        return new ResponseAndCount<>(
                sortedNamesList.stream()
                        .filter(name -> !groupedByName.getOrDefault(name, List.of()).isEmpty())
                        .map(name -> new ProductNameGroupDTO(name, groupedByName.get(name)))
                        .toList(),
                uniqueNamesPage.getTotalElements()
        );
    }

    /**
     * Gets the Product in the 'products' database table with the given ID.
     * @param productId ID of the Product to get
     * @return The Product associated with the given ID
     */
    public OutgoingProductDTO getProductById(Integer productId) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isEmpty()) {
            logger.info("Attempted to get a Product that doesn't exist: {}", productId);
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");
        }

        return getProductWithPriceToday(existingProduct.get());
    }

    /**
     * Gets the number of products in the 'products' database table.
     * @return the product count
     */
    public Long getProductCount() {
        return productDAO.count();
    }

    /**
     * Gets a distinct list of the stores of recently added Products.
     * @param pageable Pagination settings
     * @return A distinct list of recently used Product stores (default 20)
     */
    public List<String> getRecentStores(Pageable pageable) {
        return productDAO.findDistinctStores(pageable).getContent();
    }

    /**
     * Returns a product containing the product information, today's price, and price category if applicable.
     * @param product The product to return with today's price and price category
     * @return A product containing the product information, today's price, and price category if applicable
     */
    public OutgoingProductDTO getProductWithPriceToday(Product product) {
        Price priceToday = priceDAO.findPriceToday(product.getProductId()).orElse(null);
        Price nextPrice = priceDAO.findNextPriceAfterToday(product.getProductId()).orElse(null);
        Integer priceCount = priceDAO.findPriceCount(product.getProductId());
        Timestamp lastUpdated = priceDAO.findLastUpdated(product.getProductId()).orElse(null);
        PriceTotalPercentages priceTotalPercentages = getPriceTotalPercentages(product.getProductId(), priceToday);
        // Without a price today, no price has started
        List<StartedPrice> startedPrices = priceToday == null ? List.of() : priceDAO.findStartedPrices(product.getProductId());
        boolean canAverage = canAverage(startedPrices);
        Double averagePrice = canAverage ? getAveragePrice(startedPrices) : null;
        Double weightedAveragePrice = canAverage ? getWeightedAveragePrice(startedPrices) : null;
        return new OutgoingProductDTO(product, priceToday, nextPrice, lastUpdated, getPriceCategory(priceTotalPercentages, priceToday, priceCount), averagePrice, weightedAveragePrice, isBelowAverage(priceToday, averagePrice));
    }

    /**
     * Checks whether the prices can be averaged. An average across different currencies wouldn't mean anything. A price
     * without a currency counts as USD, since that's how it displays.
     * @param startedPrices The prices to check
     * @return Whether at least one price has started and they all share a currency
     */
    private static boolean canAverage(List<StartedPrice> startedPrices) {
        return startedPrices.stream()
                .map(price -> price.currency() == null || price.currency().isEmpty() ? "USD" : price.currency())
                .distinct()
                .count() == 1;
    }

    /**
     * Gets the average total amount of the given prices, counting each price once however long it lasted.
     * @param startedPrices The prices to average
     * @return The average
     */
    private static double getAveragePrice(List<StartedPrice> startedPrices) {
        return startedPrices.stream().mapToDouble(StartedPrice::totalAmount).sum() / startedPrices.size();
    }

    /**
     * Gets the average total amount of the given prices, weighted by how long each price lasted. A price lasts until the
     * next one starts, and the last price counts up to now.
     * @param startedPrices The prices to average, from oldest to newest
     * @return The weighted average
     */
    private static double getWeightedAveragePrice(List<StartedPrice> startedPrices) {
        long now = Instant.now().toEpochMilli();
        double weightedTotal = 0;
        long totalDuration = 0;

        for (int i = 0; i < startedPrices.size(); i++) {
            StartedPrice price = startedPrices.get(i);
            long priceEnd = i + 1 < startedPrices.size() ? startedPrices.get(i + 1).priceStarted().getTime() : now;
            long duration = priceEnd - price.priceStarted().getTime();

            weightedTotal += price.totalAmount() * duration;
            totalDuration += duration;
        }

        // A price that started just now hasn't lasted any time yet
        return totalDuration > 0 ? weightedTotal / totalDuration : startedPrices.getLast().totalAmount();
    }

    /**
     * Checks whether the given price is below the given average.
     * @param priceToday The price to compare to the average
     * @param averagePrice The average, if there is one
     * @return Whether the price is below the average by more than rounding
     */
    private static boolean isBelowAverage(Price priceToday, Double averagePrice) {
        if (priceToday == null || averagePrice == null) return false;

        return averagePrice - priceToday.getTotalAmount() >= HALF_CENT;
    }

    private PriceTotalPercentages getPriceTotalPercentages(Integer productId, Price priceToday) {
        if (priceToday == null) {
            return null;
        }

        Timestamp oneYearAgo = Timestamp.from(Instant.now()
                .atZone(ZoneId.systemDefault())
                .minusYears(1)
                .toInstant());
        Timestamp twoYearsAgo = Timestamp.from(Instant.now()
                .atZone(ZoneId.systemDefault())
                .minusYears(2)
                .toInstant());

        return priceDAO.findPriceTotalPercentages(productId, oneYearAgo, twoYearsAgo).orElse(null);
    }

    /**
     * Gets the price category of the given price.
     * @param percentages The highest price total percentages one year ago, two years ago, and of all time
     * @param price The price to get the category for
     * @return A string representing the price category the price belongs to
     */
    private static @NonNull String getPriceCategory(PriceTotalPercentages percentages, Price price, Integer priceCount) {
        if (percentages == null || price == null || priceCount <= 1) return "";

        String priceCategory = "";

        if (price.getTotalPercentage() >= percentages.allTimeLow()) {
            priceCategory = "all-time";
        } else if (price.getTotalPercentage() >= percentages.twoYearLow()) {
            priceCategory = "two-year";
        } else if (price.getTotalPercentage() >= percentages.oneYearLow()) {
            priceCategory = "one-year";
        }
        return priceCategory;
    }

    /**
     * Updates a Product from the 'products' database table.
     * @param productId The ID of the Product to update
     * @param productDTO The updated Product details
     * @return The updated product
     */
    public Product updateProduct(Integer productId, IncomingProductDTO productDTO) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isEmpty()) {
            logger.info("Attempted to update a Product that doesn't exist: {}", productId);
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");
        }

        checkForDuplicate(productDTO.getName(), productDTO.getStore(), productId);

        Product productToUpdate = existingProduct.get();

        productToUpdate.setBrand(productDTO.getBrand());
        productToUpdate.setName(productDTO.getName());
        productToUpdate.setLink(productDTO.getLink());
        productToUpdate.setStore(productDTO.getStore());
        productToUpdate.setActive(productDTO.isActive());

        Product savedProduct = productDAO.save(productToUpdate);
        logger.info("Successfully updated Product with ID: {}", savedProduct.getProductId());

        return savedProduct;
    }
}
