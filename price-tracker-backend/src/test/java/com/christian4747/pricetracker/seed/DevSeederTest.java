package com.christian4747.pricetracker.seed;

import com.christian4747.pricetracker.daos.DatabaseTest;
import com.christian4747.pricetracker.daos.PeriodDAO;
import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.PeriodType;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPeriodDTO;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import com.christian4747.pricetracker.seed.SeedData.SeedPeriod;
import com.christian4747.pricetracker.seed.SeedData.SeedPrice;
import com.christian4747.pricetracker.seed.SeedData.SeedProduct;
import com.christian4747.pricetracker.services.PeriodService;
import com.christian4747.pricetracker.services.PriceService;
import com.christian4747.pricetracker.services.ProductService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.groups.Tuple.tuple;

/**
 * Checks the seeder against a real database: that it saves what the seed data says, through the real services, and
 * that seeding again replaces its own records without touching anything else.
 */
@DatabaseTest
@ActiveProfiles({"test", "seed"})
@Import({DevSeeder.class, ProductService.class, PriceService.class, PeriodService.class})
class DevSeederTest {

    // Different times for each thing the seeder sets, so a check can tell which time ended up where. None is the
    // moment of the test, which is what the services would stamp if the seeder didn't set a time.
    private static final Instant ADDED = Instant.parse("2024-03-01T01:00:00Z");
    private static final Instant UPDATED = Instant.parse("2025-06-01T01:00:00Z");
    private static final Instant STARTED = Instant.parse("2024-03-02T03:00:00Z");
    // 11:59 PM in Tokyo, as the add price form sets an end date
    private static final Instant ENDED = Instant.parse("2024-03-09T14:59:00Z");
    private static final Instant PRICE_DELETED = Instant.parse("2025-12-01T01:00:00Z");
    private static final Instant PRODUCT_DELETED = Instant.parse("2026-01-10T01:00:00Z");

    /**
     * Makes an active seed Product with no brand or link, added at ADDED and last updated at UPDATED.
     * @param name The Product's name
     * @param store The Product's store
     * @param prices Its Prices
     * @return The seed Product
     */
    private static SeedProduct product(String name, String store, SeedPrice... prices) {
        return new SeedProduct(name, store, null, "", true, ADDED, UPDATED, null, List.of(prices));
    }

    /**
     * Makes a plain seed Price in USD, with no discount, return, or end date, added when it starts.
     * @param amount Its amount
     * @param started When it starts
     * @return The seed Price
     */
    private static SeedPrice price(double amount, Instant started) {
        return new SeedPrice(amount, "USD", "", 0, 0, started, null, false, started, null);
    }

    /**
     * Makes a sale Period for every store, from STARTED to ENDED.
     * @param name The Period's name
     * @return The seed Period
     */
    private static SeedPeriod period(String name) {
        return new SeedPeriod(name, PeriodType.SALE, null, STARTED, ENDED, ADDED, null);
    }

    /**
     * Puts seed Products and Periods together, for the seeder.
     * @param products The Products, with their Prices
     * @param periods The Periods
     * @return The seed data
     */
    private static SeedData data(List<SeedProduct> products, List<SeedPeriod> periods) {
        return new SeedData(products, periods);
    }

    /**
     * Turns a moment into a Timestamp, to compare with what the database returns.
     * @param instant The moment
     * @return The Timestamp
     */
    private static Timestamp at(Instant instant) {
        return Timestamp.from(instant);
    }

    @Autowired
    private DevSeeder devSeeder;

    @Autowired
    private ProductDAO productDAO;

    @Autowired
    private PriceDAO priceDAO;

    @Autowired
    private PeriodDAO periodDAO;

    @Autowired
    private ProductService productService;

    @Autowired
    private PriceService priceService;

    @Autowired
    private PeriodService periodService;

    @Autowired
    private EntityManager entityManager;

    /**
     * Finds a saved Product by its name and store, deleted or not.
     * @param name The Product's name
     * @param store The Product's store
     * @return The Product
     * @throws java.util.NoSuchElementException If there's no such Product
     */
    private Product findProduct(String name, String store) {
        return productDAO.findAllByName(name).stream()
                .filter(product -> product.getStore().equals(store))
                .findFirst()
                .orElseThrow();
    }

    /**
     * Finds a saved Product's Prices, deleted or not, in the order they were added.
     * @param product The Product
     * @return Its Prices, by ID
     */
    private List<Price> findPrices(Product product) {
        return priceDAO.findAll().stream()
                .filter(price -> price.getProduct().getProductId() == product.getProductId())
                .sorted(Comparator.comparing(Price::getPriceId))
                .toList();
    }

    /**
     * A Product keeps the brand and link from the seed, and is saved active and not deleted.
     */
    @Test
    void seedAddsProductsWithTheirDetails() {
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", "Acme", "https://corner.example/mouse",
                true, ADDED, UPDATED, null, List.of());

        devSeeder.seed(data(List.of(mouse), List.of()));

        Product saved = findProduct("Wireless mouse", "Corner Electronics");
        assertThat(saved.getBrand()).isEqualTo("Acme");
        assertThat(saved.getLink()).isEqualTo("https://corner.example/mouse");
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getDeletedAt()).isNull();
    }

    /**
     * Adding a Product through the service always saves it as active, so the seeder has to update an inactive one
     * afterwards.
     */
    @Test
    void seedSavesAnInactiveProductAsInactive() {
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", null, "", false, ADDED, UPDATED,
                null, List.of());

        devSeeder.seed(data(List.of(mouse), List.of()));

        assertThat(findProduct("Wireless mouse", "Corner Electronics").isActive()).isFalse();
    }

    /**
     * The service stamps a Product with the moment it's saved, so the seeder has to replace both times with the seed's.
     */
    @Test
    void seedSetsTheAddedAndUpdatedTimesOfProducts() {
        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics")), List.of()));

        Product saved = findProduct("Wireless mouse", "Corner Electronics");
        assertThat(saved.getCreatedAt()).isEqualTo(at(ADDED));
        assertThat(saved.getUpdatedAt()).isEqualTo(at(UPDATED));
    }

    /**
     * A seed Price was never edited, so its updated time is the same as when it was added.
     */
    @Test
    void seedSetsTheAddedAndUpdatedTimesOfPricesToTheirAddedTime() {
        // An hour after it starts, so the check can tell the added time apart from the start
        Instant priceAdded = STARTED.plusSeconds(3600);
        SeedPrice price = new SeedPrice(25, "USD", "", 0, 0, STARTED, null, false, priceAdded, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        assertThat(saved.getCreatedAt()).isEqualTo(at(priceAdded));
        assertThat(saved.getUpdatedAt()).isEqualTo(at(priceAdded));
    }

    /**
     * A Price keeps its amount, currency, description, and dates from the seed.
     */
    @Test
    void seedAddsPricesWithTheirDetails() {
        SeedPrice price = new SeedPrice(25, "USD", "Spring sale", 0, 0, STARTED, ENDED, false, STARTED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        assertThat(saved.getAmount()).isEqualTo(25);
        assertThat(saved.getCurrency()).isEqualTo("USD");
        assertThat(saved.getDescription()).isEqualTo("Spring sale");
        assertThat(saved.getPriceStarted()).isEqualTo(at(STARTED));
        assertThat(saved.getPriceEnded()).isEqualTo(at(ENDED));
    }

    /**
     * The seed gives percentages, and the seeder works out the amounts from them as the add price form does, so the
     * service's totals come out the same as in the app.
     */
    @Test
    void seedWorksOutTheDiscountedAndReturnAmountsFromThePercentages() {
        SeedPrice price = new SeedPrice(100, "USD", "", 0.2, 0.05, STARTED, null, false, STARTED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        // 20% off $100 leaves $80, 5% of that back is $4, and the total is what's left
        assertThat(saved.getDiscountAmount()).isEqualTo(80);
        assertThat(saved.getReturnAmount()).isEqualTo(4);
        assertThat(saved.getTotalAmount()).isEqualTo(76);
    }

    /**
     * Worked-out amounts are rounded to the cent, rather than saved with extra decimals.
     */
    @Test
    void seedRoundsTheDiscountedAndReturnAmountsToCents() {
        SeedPrice price = new SeedPrice(49.99, "USD", "", 0.15, 0.1, STARTED, null, false, STARTED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        // 15% off $49.99 is $42.4915, and 10% of $42.49 back is $4.249
        assertThat(saved.getDiscountAmount()).isEqualTo(42.49);
        assertThat(saved.getReturnAmount()).isEqualTo(4.25);
    }

    /**
     * A sale is added as a range, as the add price form's Sale Period option does: the sale Price, then the full price
     * again from a minute after the sale ends.
     */
    @Test
    void seedAddsARangePriceAsTheSaleAndTheFullPriceAfterIt() {
        SeedPrice sale = new SeedPrice(100, "USD", "Spring sale", 0.2, 0, STARTED, ENDED, true, STARTED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", sale)), List.of()));

        List<Price> saved = findPrices(findProduct("Wireless mouse", "Corner Electronics"));
        assertThat(saved).hasSize(2);
        assertThat(saved.getLast().getPriceStarted()).isEqualTo(at(ENDED.plusSeconds(60)));
        // The full price again, with no discount
        assertThat(saved.getLast().getDiscountAmount()).isEqualTo(100);
    }

    /**
     * A range's two Prices were added together, so both get the seed Price's added time.
     */
    @Test
    void seedSetsTheAddedTimeOfBothPricesOfARange() {
        SeedPrice sale = new SeedPrice(100, "USD", "", 0.2, 0, STARTED, ENDED, true, ADDED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", sale)), List.of()));

        assertThat(findPrices(findProduct("Wireless mouse", "Corner Electronics")))
                .extracting(Price::getCreatedAt)
                .containsExactly(at(ADDED), at(ADDED));
    }

    /**
     * A Price deleted on its own gets the seed's deleted time, not the moment of seeding.
     */
    @Test
    void seedDeletesAPriceAtItsDeletedTime() {
        SeedPrice price = new SeedPrice(25, "USD", "", 0, 0, STARTED, null, false, STARTED, PRICE_DELETED);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        assertThat(saved.getDeletedAt()).isEqualTo(at(PRICE_DELETED));
    }

    /**
     * Deleting a Product in the app deletes its Prices at the same moment, which is how restoring it later knows which
     * Prices to bring back.
     */
    @Test
    void seedDeletesAProductAndItsPricesAtTheProductsDeletedTime() {
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", null, "", true, ADDED, UPDATED,
                PRODUCT_DELETED, List.of(price(25, STARTED)));

        devSeeder.seed(data(List.of(mouse), List.of()));

        Product saved = findProduct("Wireless mouse", "Corner Electronics");
        assertThat(saved.getDeletedAt()).isEqualTo(at(PRODUCT_DELETED));
        assertThat(findPrices(saved)).extracting(Price::getDeletedAt).containsExactly(at(PRODUCT_DELETED));
    }

    /**
     * Restoring a seeded deleted Product works as in the app: it brings back the Prices deleted with it, and leaves
     * one that was deleted earlier deleted.
     */
    @Test
    void seedKeepsAPriceDeletedBeforeItsProductDeletedWhenTheProductIsRestored() {
        SeedPrice deletedFirst = new SeedPrice(30, "USD", "", 0, 0, STARTED, null, false, STARTED, PRICE_DELETED);
        // A day later, so the two Prices don't start at the same moment
        SeedPrice deletedWithProduct = price(25, STARTED.plusSeconds(86400));
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", null, "", true, ADDED, UPDATED,
                PRODUCT_DELETED, List.of(deletedFirst, deletedWithProduct));
        devSeeder.seed(data(List.of(mouse), List.of()));

        productService.restoreProduct(findProduct("Wireless mouse", "Corner Electronics").getProductId());
        // Writes the restore and forgets the cached records, so the Prices are read back from the database
        entityManager.flush();
        entityManager.clear();

        assertThat(findPrices(findProduct("Wireless mouse", "Corner Electronics")))
                .extracting(Price::getAmount, Price::getDeletedAt)
                .containsExactly(
                        tuple(30.0, at(PRICE_DELETED)),
                        tuple(25.0, null)
                );
    }

    /**
     * A Period keeps its type, store, and dates from the seed, and gets the seed's added and deleted times, with its
     * updated time the same as its added time.
     */
    @Test
    void seedAddsPeriodsWithTheirDetailsAndTimes() {
        // A return Period for one store, deleted, so each of these differs from what the period helper would give
        SeedPeriod spring = new SeedPeriod("Spring sale", PeriodType.RETURN, "Corner Electronics", STARTED, ENDED, ADDED,
                PRODUCT_DELETED);

        devSeeder.seed(data(List.of(), List.of(spring)));

        Period saved = periodDAO.findAllByNameIgnoreCase("Spring sale").getFirst();
        assertThat(saved.getType()).isEqualTo(PeriodType.RETURN);
        assertThat(saved.getStore()).isEqualTo("Corner Electronics");
        assertThat(saved.getPeriodStarted()).isEqualTo(at(STARTED));
        assertThat(saved.getPeriodEnded()).isEqualTo(at(ENDED));
        assertThat(saved.getCreatedAt()).isEqualTo(at(ADDED));
        assertThat(saved.getUpdatedAt()).isEqualTo(at(ADDED));
        assertThat(saved.getDeletedAt()).isEqualTo(at(PRODUCT_DELETED));
    }

    /**
     * The seed endpoint answers with how many records it added, counting each Price of a range.
     */
    @Test
    void seedReturnsHowManyRecordsItAdded() {
        SeedPrice sale = new SeedPrice(100, "USD", "", 0.2, 0, STARTED, ENDED, true, STARTED, null);
        // A plain Price a day after the sale ends, besides the sale's two
        SeedProduct mouse = product("Wireless mouse", "Corner Electronics", sale, price(90, ENDED.plusSeconds(86400)));
        SeedProduct keyboard = product("Keyboard", "Corner Electronics");

        SeedResult result = devSeeder.seed(data(List.of(mouse, keyboard), List.of(period("Spring sale"))));

        // 2 Products, 3 Prices (the sale's two and the plain one), and 1 Period
        assertThat(result).isEqualTo(new SeedResult(2, 3, 1));
    }

    /**
     * Seeding again removes the earlier seed's records and adds them fresh, so rebuilding the data never doubles it.
     */
    @Test
    void seedAgainReplacesTheSeededRecordsInsteadOfAddingMore() {
        SeedProduct mouse = product("Wireless mouse", "Corner Electronics", price(25, STARTED));
        SeedData seedData = data(List.of(mouse), List.of(period("Spring sale")));
        devSeeder.seed(seedData);
        int firstProductId = findProduct("Wireless mouse", "Corner Electronics").getProductId();

        devSeeder.seed(seedData);

        Product reseeded = findProduct("Wireless mouse", "Corner Electronics");
        assertThat(productDAO.findAllByName("Wireless mouse")).hasSize(1);
        // A new ID shows the Product was added again, rather than the earlier one kept
        assertThat(reseeded.getProductId()).isNotEqualTo(firstProductId);
        assertThat(findPrices(reseeded)).hasSize(1);
        // No Prices are left over from the earlier seed's Product either
        assertThat(priceDAO.findAll()).hasSize(1);
        assertThat(periodDAO.findAllByNameIgnoreCase("Spring sale")).hasSize(1);
    }

    /**
     * Seeding again also replaces seeded records that are deleted, which a lookup that left out deleted records would
     * miss, leaving duplicates.
     */
    @Test
    void seedAgainReplacesSeededRecordsThatWereDeleted() {
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", null, "", true, ADDED, UPDATED,
                PRODUCT_DELETED, List.of(price(25, STARTED)));
        SeedPeriod spring = new SeedPeriod("Spring sale", PeriodType.SALE, null, STARTED, ENDED, ADDED, PRODUCT_DELETED);
        SeedData seedData = data(List.of(mouse), List.of(spring));
        devSeeder.seed(seedData);

        devSeeder.seed(seedData);

        assertThat(productDAO.findAllByName("Wireless mouse")).hasSize(1);
        assertThat(priceDAO.findAll()).hasSize(1);
        assertThat(periodDAO.findAllByNameIgnoreCase("Spring sale")).hasSize(1);
    }

    /**
     * The real dummy data seeds without the services rejecting any of it, and every record is saved.
     */
    @Test
    void seedAddsTheWholeDevDataSet() {
        SeedData devData = DevSeedData.build(Instant.now());
        // A range adds two Prices, so it counts twice
        int priceCount = devData.products().stream().mapToInt(product -> product.prices().stream()
                .mapToInt(price -> price.range() ? 2 : 1).sum()).sum();

        SeedResult result = devSeeder.seed(devData);

        assertThat(result).isEqualTo(new SeedResult(devData.products().size(), priceCount, devData.periods().size()));
        assertThat(productDAO.count()).isEqualTo(devData.products().size());
        assertThat(priceDAO.count()).isEqualTo(priceCount);
    }

    /**
     * The three Products set up by hand for the price banners get the banner they're meant to, worked out by the real
     * service from the saved Prices.
     */
    @Test
    void devDataHasProductsAtTheirLowestDiscountOfAllTimeTwoYearsAndOneYearToday() {
        devSeeder.seed(DevSeedData.build(Instant.now()));

        assertThat(productService.getProductWithPriceToday(findProduct("E-reader", DevSeedData.CORNER)).priceCategory())
                .isEqualTo("all-time");
        assertThat(productService.getProductWithPriceToday(findProduct("Air fryer", DevSeedData.HARBOR)).priceCategory())
                .isEqualTo("two-year");
        assertThat(productService.getProductWithPriceToday(findProduct("Robot vacuum", DevSeedData.HARBOR)).priceCategory())
                .isEqualTo("one-year");
    }

    /**
     * Seed Products are matched by name and store together, so a Product sharing a seed Product's name at another
     * store isn't removed.
     */
    @Test
    void seedLeavesAProductWithTheSameNameAtAnotherStoreAlone() {
        // Added through the services, like a Product made in the app
        Product ownProduct = productService.addProduct(
                new IncomingProductDTO(null, "Wireless mouse", "", "Harbor Mart", true));
        priceService.addPrice(new IncomingPriceDTO(27, "USD", "", 27, 0, at(STARTED), null,
                ownProduct.getProductId(), 0, 0, 0, 0));

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics")), List.of()));

        // Its Price is still there, so the Product wasn't removed and added again
        assertThat(findPrices(findProduct("Wireless mouse", "Harbor Mart")))
                .extracting(Price::getAmount)
                .containsExactly(27.0);
    }

    /**
     * Only Periods with a seed Period's name are removed, so Periods made in the app stay.
     */
    @Test
    void seedLeavesAPeriodThatIsntInTheSeedAlone() {
        periodService.addPeriod(new IncomingPeriodDTO("Summer sale", PeriodType.SALE, null, at(STARTED), at(ENDED)));

        devSeeder.seed(data(List.of(), List.of(period("Spring sale"))));

        assertThat(periodDAO.findAllByNameIgnoreCase("Summer sale")).hasSize(1);
    }
}
