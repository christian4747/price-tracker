package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PriceTotalPercentages;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import com.christian4747.pricetracker.models.dtos.OutgoingProductDTO;
import com.christian4747.pricetracker.models.dtos.ProductNameGroupDTO;
import com.christian4747.pricetracker.models.dtos.ResponseAndCount;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

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
        List<Product> existingProducts = productDAO.findAllByName(productDTO.getName());

        if (!existingProducts.isEmpty()) {
            existingProducts
                .forEach(product -> {
                    if (product.getStore().equals(productDTO.getStore())) {
                        logger.info("Attempted to add a Product that already exists: {}, {}",
                                productDTO.getName(), productDTO.getStore());
                        throw new IllegalArgumentException("Product already exists!");
                    }
                });
        }

        Product newProduct = new Product(
                0,
                productDTO.getBrand(),
                productDTO.getName(),
                productDTO.getLink(),
                productDTO.getStore(),
                true,
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
     * Gets all the Products in the 'products' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Products (default 20)
     */
    public ResponseAndCount<OutgoingProductDTO> getAllProducts(Pageable pageable) {
        Page<Product> productPage = productDAO.findAllByOrderByNameAsc(pageable);
        List<Product> productList = productPage.getContent();

        List<OutgoingProductDTO> productsWithDateToday =
                productList.stream().map(this::getProductWithPriceToday).toList();
        
        return new ResponseAndCount<>(productsWithDateToday, productPage.getTotalElements());
    }

    /**
     * Gets the Products grouped by name.
     * The returned list is formatted as ProductNameGroupDTO records and contains the following:
     *  - name: name of the Product
     *  - products: list of the Products corresponding to the 'name'
     * @param pageable Pagination settings
     * @return A list of ProductNameGroupDTO
     */
    public ResponseAndCount<ProductNameGroupDTO> getProductsGroupedByName(Pageable pageable) {
        Page<String> namesPage = productDAO.findDistinctNames(pageable);
        List<Product> productsInNamesPage = productDAO.findByNameIn(namesPage.getContent());
        List<OutgoingProductDTO> outgoingProductDTOS =
                productsInNamesPage.stream().map(this::getProductWithPriceToday).toList();

        Map<String, List<OutgoingProductDTO>> groupedByName = outgoingProductDTOS.stream()
                .collect(Collectors.groupingBy(outgoingProductDTO -> outgoingProductDTO.product().getName()));

        return new ResponseAndCount<>(
                namesPage.getContent().stream()
                        .map(name -> new ProductNameGroupDTO(name, groupedByName.getOrDefault(name, List.of())))
                        .toList(),
                namesPage.getTotalElements()
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
        return new OutgoingProductDTO(product, priceToday, nextPrice, lastUpdated, getPriceCategory(priceTotalPercentages, priceToday, priceCount));
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
