package com.christian4747.pricetracker.seed;

import com.christian4747.pricetracker.daos.PeriodDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import com.christian4747.pricetracker.models.dtos.IncomingPriceRangeDTO;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import com.christian4747.pricetracker.seed.SeedData.SeedPeriod;
import com.christian4747.pricetracker.seed.SeedData.SeedPrice;
import com.christian4747.pricetracker.seed.SeedData.SeedProduct;
import com.christian4747.pricetracker.services.PeriodService;
import com.christian4747.pricetracker.services.PriceService;
import com.christian4747.pricetracker.services.ProductService;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * Fills the database with dummy data for trying the app out locally. Only exists with the 'seed' profile, and never
 * with the 'prod' profile.
 * <p>
 * Records are added through the services, so they pass the same checks and get the same totals as records added in the
 * app. The services stamp every record with the moment it was saved, so the seeder then sets the added, updated, and
 * deleted times from the seed data.
 */
@Service
@Profile("seed & !prod")
public class DevSeeder {

    private static final Logger logger = LoggerFactory.getLogger(DevSeeder.class);

    private final ProductService productService;
    private final PriceService priceService;
    private final PeriodService periodService;
    private final ProductDAO productDAO;
    private final PeriodDAO periodDAO;
    private final EntityManager entityManager;

    /**
     * Creates the seeder with what it adds records through, and what it finds and changes them with directly.
     * @param productService Adds and updates Products, with the app's checks
     * @param priceService Adds Prices, with the app's checks and totals
     * @param periodService Adds Periods, with the app's checks
     * @param productDAO Finds an earlier seed's Products
     * @param periodDAO Finds an earlier seed's Periods
     * @param entityManager Runs the updates that set times, and the permanent deletes
     */
    public DevSeeder(ProductService productService, PriceService priceService, PeriodService periodService,
                     ProductDAO productDAO, PeriodDAO periodDAO, EntityManager entityManager) {
        this.productService = productService;
        this.priceService = priceService;
        this.periodService = periodService;
        this.productDAO = productDAO;
        this.periodDAO = periodDAO;
        this.entityManager = entityManager;
    }

    /**
     * Permanently removes the seed's own records from an earlier seed, then adds them again. A Product belongs to the
     * seed when its name and store match a seed Product, and a Period when its name matches a seed Period. Nothing else
     * is changed. Everything happens in one transaction, so if anything fails then nothing changes.
     * @param seedData The records to add
     * @return How many records were added
     */
    @Transactional
    public SeedResult seed(SeedData seedData) {
        removeSeededRecords(seedData);

        int priceCount = 0;
        for (SeedProduct seedProduct : seedData.products()) {
            priceCount += addProduct(seedProduct);
        }
        for (SeedPeriod seedPeriod : seedData.periods()) {
            addPeriod(seedPeriod);
        }

        // Clear the saved entities so later reads in this transaction see the times set above
        entityManager.flush();
        entityManager.clear();

        SeedResult result = new SeedResult(seedData.products().size(), priceCount, seedData.periods().size());
        logger.info("Seeded {} Product(s), {} Price(s), and {} Period(s)", result.products(), result.prices(), result.periods());
        return result;
    }

    /**
     * Permanently removes the records an earlier seed added, so seeding again doesn't add them twice. Uses bulk deletes,
     * since deleting through the services or DAOs only marks a record as deleted.
     * @param seedData The records about to be added, whose names (and stores) pick out the earlier seed's records
     */
    private void removeSeededRecords(SeedData seedData) {
        for (SeedProduct seedProduct : seedData.products()) {
            // Includes deleted Products, since findAllByName doesn't leave them out
            List<Product> seededProducts = productDAO.findAllByName(seedProduct.name()).stream()
                    .filter(product -> Objects.equals(product.getStore(), seedProduct.store()))
                    .toList();
            for (Product product : seededProducts) {
                // The Product's Prices first, since each Price refers to its Product
                entityManager.createQuery("DELETE FROM Price p WHERE p.product.productId = :productId")
                        .setParameter("productId", product.getProductId())
                        .executeUpdate();
                entityManager.createQuery("DELETE FROM Product p WHERE p.productId = :productId")
                        .setParameter("productId", product.getProductId())
                        .executeUpdate();
            }
        }
        for (SeedPeriod seedPeriod : seedData.periods()) {
            // Ignoring case, as Period names are unique regardless of case
            for (Period period : periodDAO.findAllByNameIgnoreCase(seedPeriod.name())) {
                entityManager.createQuery("DELETE FROM Period p WHERE p.periodId = :periodId")
                        .setParameter("periodId", period.getPeriodId())
                        .executeUpdate();
            }
        }
        // The removed records may still be in the persistence context from the lookups above
        entityManager.clear();
    }

    /**
     * Adds a Product with its Prices, then sets their times.
     * @param seedProduct The Product to add, with its Prices
     * @return How many Prices were added
     */
    private int addProduct(SeedProduct seedProduct) {
        Product product = productService.addProduct(new IncomingProductDTO(
                seedProduct.brand(), seedProduct.name(), seedProduct.link(), seedProduct.store(), true));
        // addProduct always saves a new Product as active, so an inactive one is updated afterwards
        if (!seedProduct.active()) {
            product = productService.updateProduct(product.getProductId(), new IncomingProductDTO(
                    seedProduct.brand(), seedProduct.name(), seedProduct.link(), seedProduct.store(), false));
        }

        int priceCount = 0;
        for (SeedPrice seedPrice : seedProduct.prices()) {
            List<Price> prices = addPrice(product.getProductId(), seedPrice);
            priceCount += prices.size();
            // A range adds two Prices, which share the seed Price's times
            for (Price price : prices) {
                setPriceTimes(price.getPriceId(), seedPrice.createdAt(), seedPrice.deletedAt());
            }
        }

        // The service stamped both with the moment of saving, so they're replaced with the seed's
        entityManager.createQuery("UPDATE Product p SET p.createdAt = :createdAt, p.updatedAt = :updatedAt WHERE p.productId = :productId")
                .setParameter("createdAt", toTimestamp(seedProduct.createdAt()))
                .setParameter("updatedAt", toTimestamp(seedProduct.updatedAt()))
                .setParameter("productId", product.getProductId())
                .executeUpdate();
        if (seedProduct.deletedAt() != null) {
            deleteProduct(product.getProductId(), seedProduct.deletedAt());
        }

        return priceCount;
    }

    /**
     * Adds a Price, or both Prices of a range, working out the discounted and return amounts as the add price form does.
     * @param productId The Product the Price belongs to
     * @param seedPrice The Price to add
     * @return The added Prices: one, or two for a range
     */
    private List<Price> addPrice(int productId, SeedPrice seedPrice) {
        // The amount after the discount, which is what discountAmount holds, not the amount taken off
        double discountAmount = toCents(seedPrice.amount() - seedPrice.amount() * seedPrice.discountPercentage());
        // A return is a share of what's paid after any discount
        double returnAmount = toCents(Math.min(discountAmount, seedPrice.amount()) * seedPrice.returnPercentage());

        IncomingPriceDTO priceDTO = seedPrice.range() ? new IncomingPriceRangeDTO() : new IncomingPriceDTO();
        priceDTO.setAmount(seedPrice.amount());
        priceDTO.setCurrency(seedPrice.currency());
        priceDTO.setDescription(seedPrice.description());
        priceDTO.setDiscountAmount(discountAmount);
        priceDTO.setDiscountPercentage(seedPrice.discountPercentage());
        priceDTO.setPriceStarted(toTimestamp(seedPrice.priceStarted()));
        priceDTO.setPriceEnded(toTimestamp(seedPrice.priceEnded()));
        priceDTO.setProductId(productId);
        priceDTO.setReturnAmount(returnAmount);
        priceDTO.setReturnPercentage(seedPrice.returnPercentage());

        if (priceDTO instanceof IncomingPriceRangeDTO rangeDTO) {
            return priceService.addPriceRange(rangeDTO);
        }
        return List.of(priceService.addPrice(priceDTO));
    }

    /**
     * Sets a Price's added and deleted times from the seed. Its updated time matches when it was added, since a seed
     * Price was never edited.
     * @param priceId The Price to change
     * @param createdAt When it was added
     * @param deletedAt When it was deleted, or null
     */
    private void setPriceTimes(int priceId, Instant createdAt, Instant deletedAt) {
        entityManager.createQuery("UPDATE Price p SET p.createdAt = :createdAt, p.updatedAt = :createdAt, p.deletedAt = :deletedAt WHERE p.priceId = :priceId")
                .setParameter("createdAt", toTimestamp(createdAt))
                .setParameter("deletedAt", toTimestamp(deletedAt))
                .setParameter("priceId", priceId)
                .executeUpdate();
    }

    /**
     * Deletes a Product and its Prices that aren't already deleted at the given time, as deleting a Product in the app
     * does, so that restoring the Product brings back the same Prices.
     * @param productId The Product to delete
     * @param deletedAt When it was deleted
     */
    private void deleteProduct(int productId, Instant deletedAt) {
        // A Price deleted earlier keeps its own deleted time, so restoring the Product leaves it deleted
        entityManager.createQuery("UPDATE Price p SET p.deletedAt = :deletedAt WHERE p.product.productId = :productId AND p.deletedAt IS NULL")
                .setParameter("deletedAt", toTimestamp(deletedAt))
                .setParameter("productId", productId)
                .executeUpdate();
        entityManager.createQuery("UPDATE Product p SET p.deletedAt = :deletedAt WHERE p.productId = :productId")
                .setParameter("deletedAt", toTimestamp(deletedAt))
                .setParameter("productId", productId)
                .executeUpdate();
    }

    /**
     * Adds a Period, then sets its added and deleted times from the seed. Like a seed Price, its updated time matches
     * when it was added.
     * @param seedPeriod The Period to add
     */
    private void addPeriod(SeedPeriod seedPeriod) {
        Period period = periodService.addPeriod(new IncomingPeriodDTO(
                seedPeriod.name(),
                seedPeriod.type(),
                seedPeriod.store(),
                toTimestamp(seedPeriod.periodStarted()),
                toTimestamp(seedPeriod.periodEnded())
        ));

        entityManager.createQuery("UPDATE Period p SET p.createdAt = :createdAt, p.updatedAt = :createdAt, p.deletedAt = :deletedAt WHERE p.periodId = :periodId")
                .setParameter("createdAt", toTimestamp(seedPeriod.createdAt()))
                .setParameter("deletedAt", toTimestamp(seedPeriod.deletedAt()))
                .setParameter("periodId", period.getPeriodId())
                .executeUpdate();
    }

    /**
     * Rounds an amount to the cent.
     * @param amount The amount, such as 79.992
     * @return The amount to two decimal places, such as 79.99
     */
    private static double toCents(double amount) {
        return Math.round(amount * 100) / 100.0;
    }

    /**
     * Turns a moment into a Timestamp for the DTOs and queries, keeping a missing one missing.
     * @param instant The moment, or null
     * @return The Timestamp, or null for null
     */
    private static Timestamp toTimestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }
}
