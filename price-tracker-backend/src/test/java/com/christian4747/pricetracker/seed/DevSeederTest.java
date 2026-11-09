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

@DatabaseTest
@ActiveProfiles({"test", "seed"})
@Import({DevSeeder.class, ProductService.class, PriceService.class, PeriodService.class})
class DevSeederTest {

    private static final Instant ADDED = Instant.parse("2024-03-01T01:00:00Z");
    private static final Instant UPDATED = Instant.parse("2025-06-01T01:00:00Z");
    private static final Instant STARTED = Instant.parse("2024-03-02T03:00:00Z");
    private static final Instant ENDED = Instant.parse("2024-03-09T14:59:00Z");
    private static final Instant PRICE_DELETED = Instant.parse("2025-12-01T01:00:00Z");
    private static final Instant PRODUCT_DELETED = Instant.parse("2026-01-10T01:00:00Z");

    private static SeedProduct product(String name, String store, SeedPrice... prices) {
        return new SeedProduct(name, store, null, "", true, ADDED, UPDATED, null, List.of(prices));
    }

    private static SeedPrice price(double amount, Instant started) {
        return new SeedPrice(amount, "USD", "", 0, 0, started, null, false, started, null);
    }

    private static SeedPeriod period(String name) {
        return new SeedPeriod(name, PeriodType.SALE, null, STARTED, ENDED, ADDED, null);
    }

    private static SeedData data(List<SeedProduct> products, List<SeedPeriod> periods) {
        return new SeedData(products, periods);
    }

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

    private Product findProduct(String name, String store) {
        return productDAO.findAllByName(name).stream()
                .filter(product -> product.getStore().equals(store))
                .findFirst()
                .orElseThrow();
    }

    private List<Price> findPrices(Product product) {
        return priceDAO.findAll().stream()
                .filter(price -> price.getProduct().getProductId() == product.getProductId())
                .sorted(Comparator.comparing(Price::getPriceId))
                .toList();
    }

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

    @Test
    void seedSavesAnInactiveProductAsInactive() {
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", null, "", false, ADDED, UPDATED,
                null, List.of());

        devSeeder.seed(data(List.of(mouse), List.of()));

        assertThat(findProduct("Wireless mouse", "Corner Electronics").isActive()).isFalse();
    }

    @Test
    void seedSetsTheAddedAndUpdatedTimesOfProducts() {
        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics")), List.of()));

        Product saved = findProduct("Wireless mouse", "Corner Electronics");
        assertThat(saved.getCreatedAt()).isEqualTo(at(ADDED));
        assertThat(saved.getUpdatedAt()).isEqualTo(at(UPDATED));
    }

    @Test
    void seedSetsTheAddedAndUpdatedTimesOfPricesToTheirAddedTime() {
        Instant priceAdded = STARTED.plusSeconds(3600);
        SeedPrice price = new SeedPrice(25, "USD", "", 0, 0, STARTED, null, false, priceAdded, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        assertThat(saved.getCreatedAt()).isEqualTo(at(priceAdded));
        assertThat(saved.getUpdatedAt()).isEqualTo(at(priceAdded));
    }

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

    @Test
    void seedWorksOutTheDiscountedAndReturnAmountsFromThePercentages() {
        SeedPrice price = new SeedPrice(100, "USD", "", 0.2, 0.05, STARTED, null, false, STARTED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        assertThat(saved.getDiscountAmount()).isEqualTo(80);
        assertThat(saved.getReturnAmount()).isEqualTo(4);
        assertThat(saved.getTotalAmount()).isEqualTo(76);
    }

    @Test
    void seedRoundsTheDiscountedAndReturnAmountsToCents() {
        SeedPrice price = new SeedPrice(49.99, "USD", "", 0.15, 0.1, STARTED, null, false, STARTED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        assertThat(saved.getDiscountAmount()).isEqualTo(42.49);
        assertThat(saved.getReturnAmount()).isEqualTo(4.25);
    }

    @Test
    void seedAddsARangePriceAsTheSaleAndTheFullPriceAfterIt() {
        SeedPrice sale = new SeedPrice(100, "USD", "Spring sale", 0.2, 0, STARTED, ENDED, true, STARTED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", sale)), List.of()));

        List<Price> saved = findPrices(findProduct("Wireless mouse", "Corner Electronics"));
        assertThat(saved).hasSize(2);
        assertThat(saved.getLast().getPriceStarted()).isEqualTo(at(ENDED.plusSeconds(60)));
        assertThat(saved.getLast().getDiscountAmount()).isEqualTo(100);
    }

    @Test
    void seedSetsTheAddedTimeOfBothPricesOfARange() {
        SeedPrice sale = new SeedPrice(100, "USD", "", 0.2, 0, STARTED, ENDED, true, ADDED, null);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", sale)), List.of()));

        assertThat(findPrices(findProduct("Wireless mouse", "Corner Electronics")))
                .extracting(Price::getCreatedAt)
                .containsExactly(at(ADDED), at(ADDED));
    }

    @Test
    void seedDeletesAPriceAtItsDeletedTime() {
        SeedPrice price = new SeedPrice(25, "USD", "", 0, 0, STARTED, null, false, STARTED, PRICE_DELETED);

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics", price)), List.of()));

        Price saved = findPrices(findProduct("Wireless mouse", "Corner Electronics")).getFirst();
        assertThat(saved.getDeletedAt()).isEqualTo(at(PRICE_DELETED));
    }

    @Test
    void seedDeletesAProductAndItsPricesAtTheProductsDeletedTime() {
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", null, "", true, ADDED, UPDATED,
                PRODUCT_DELETED, List.of(price(25, STARTED)));

        devSeeder.seed(data(List.of(mouse), List.of()));

        Product saved = findProduct("Wireless mouse", "Corner Electronics");
        assertThat(saved.getDeletedAt()).isEqualTo(at(PRODUCT_DELETED));
        assertThat(findPrices(saved)).extracting(Price::getDeletedAt).containsExactly(at(PRODUCT_DELETED));
    }

    @Test
    void seedKeepsAPriceDeletedBeforeItsProductDeletedWhenTheProductIsRestored() {
        SeedPrice deletedFirst = new SeedPrice(30, "USD", "", 0, 0, STARTED, null, false, STARTED, PRICE_DELETED);
        SeedPrice deletedWithProduct = price(25, STARTED.plusSeconds(86400));
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", null, "", true, ADDED, UPDATED,
                PRODUCT_DELETED, List.of(deletedFirst, deletedWithProduct));
        devSeeder.seed(data(List.of(mouse), List.of()));

        productService.restoreProduct(findProduct("Wireless mouse", "Corner Electronics").getProductId());
        entityManager.flush();
        entityManager.clear();

        assertThat(findPrices(findProduct("Wireless mouse", "Corner Electronics")))
                .extracting(Price::getAmount, Price::getDeletedAt)
                .containsExactly(
                        tuple(30.0, at(PRICE_DELETED)),
                        tuple(25.0, null)
                );
    }

    @Test
    void seedAddsPeriodsWithTheirDetailsAndTimes() {
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

    @Test
    void seedReturnsHowManyRecordsItAdded() {
        SeedPrice sale = new SeedPrice(100, "USD", "", 0.2, 0, STARTED, ENDED, true, STARTED, null);
        SeedProduct mouse = product("Wireless mouse", "Corner Electronics", sale, price(90, ENDED.plusSeconds(86400)));
        SeedProduct keyboard = product("Keyboard", "Corner Electronics");

        SeedResult result = devSeeder.seed(data(List.of(mouse, keyboard), List.of(period("Spring sale"))));

        assertThat(result).isEqualTo(new SeedResult(2, 3, 1));
    }

    @Test
    void seedAgainReplacesTheSeededRecordsInsteadOfAddingMore() {
        SeedProduct mouse = product("Wireless mouse", "Corner Electronics", price(25, STARTED));
        SeedData seedData = data(List.of(mouse), List.of(period("Spring sale")));
        devSeeder.seed(seedData);
        int firstProductId = findProduct("Wireless mouse", "Corner Electronics").getProductId();

        devSeeder.seed(seedData);

        Product reseeded = findProduct("Wireless mouse", "Corner Electronics");
        assertThat(productDAO.findAllByName("Wireless mouse")).hasSize(1);
        assertThat(reseeded.getProductId()).isNotEqualTo(firstProductId);
        assertThat(findPrices(reseeded)).hasSize(1);
        assertThat(priceDAO.findAll()).hasSize(1);
        assertThat(periodDAO.findAllByNameIgnoreCase("Spring sale")).hasSize(1);
    }

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

    @Test
    void seedAddsTheWholeDevDataSet() {
        SeedData devData = DevSeedData.build(Instant.now());
        int priceCount = devData.products().stream().mapToInt(product -> product.prices().stream()
                .mapToInt(price -> price.range() ? 2 : 1).sum()).sum();

        SeedResult result = devSeeder.seed(devData);

        assertThat(result).isEqualTo(new SeedResult(devData.products().size(), priceCount, devData.periods().size()));
        assertThat(productDAO.count()).isEqualTo(devData.products().size());
        assertThat(priceDAO.count()).isEqualTo(priceCount);
    }

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

    @Test
    void seedLeavesAProductWithTheSameNameAtAnotherStoreAlone() {
        Product ownProduct = productService.addProduct(
                new IncomingProductDTO(null, "Wireless mouse", "", "Harbor Mart", true));
        priceService.addPrice(new IncomingPriceDTO(27, "USD", "", 27, 0, at(STARTED), null,
                ownProduct.getProductId(), 0, 0, 0, 0));

        devSeeder.seed(data(List.of(product("Wireless mouse", "Corner Electronics")), List.of()));

        assertThat(findPrices(findProduct("Wireless mouse", "Harbor Mart")))
                .extracting(Price::getAmount)
                .containsExactly(27.0);
    }

    @Test
    void seedLeavesAPeriodThatIsntInTheSeedAlone() {
        periodService.addPeriod(new IncomingPeriodDTO("Summer sale", PeriodType.SALE, null, at(STARTED), at(ENDED)));

        devSeeder.seed(data(List.of(), List.of(period("Spring sale"))));

        assertThat(periodDAO.findAllByNameIgnoreCase("Summer sale")).hasSize(1);
    }
}
