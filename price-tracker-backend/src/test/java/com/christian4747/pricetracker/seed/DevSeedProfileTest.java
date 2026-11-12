package com.christian4747.pricetracker.seed;

import com.christian4747.pricetracker.daos.PeriodDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.services.PeriodService;
import com.christian4747.pricetracker.services.PriceService;
import com.christian4747.pricetracker.services.ProductService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Checks which profiles bring in the seeder and its endpoint. Seeding permanently deletes records, so it must never be
 * reachable in production, even if the seed profile is turned on there by mistake.
 */
class DevSeedProfileTest {

    /**
     * Starts a context with the seeder and its endpoint, and mocks of what they need, under the given profiles.
     * @param profiles The profiles to turn on
     * @return A runner that starts the context, for a test to check its beans
     */
    private static ApplicationContextRunner contextWithProfiles(String... profiles) {
        return new ApplicationContextRunner()
                .withInitializer(context -> context.getEnvironment().setActiveProfiles(profiles))
                .withBean(ProductService.class, () -> mock(ProductService.class))
                .withBean(PriceService.class, () -> mock(PriceService.class))
                .withBean(PeriodService.class, () -> mock(PeriodService.class))
                .withBean(ProductDAO.class, () -> mock(ProductDAO.class))
                .withBean(PeriodDAO.class, () -> mock(PeriodDAO.class))
                .withBean(EntityManager.class, () -> mock(EntityManager.class))
                .withUserConfiguration(DevSeeder.class, DevSeedController.class);
    }

    /**
     * Running locally with the dev and seed profiles, as the README says, brings in both.
     */
    @Test
    void seedProfileAddsTheSeederAndItsEndpoint() {
        contextWithProfiles("dev", "seed").run(context -> {
            assertThat(context).hasSingleBean(DevSeeder.class);
            assertThat(context).hasSingleBean(DevSeedController.class);
        });
    }

    /**
     * Running with only the dev profile, as usual, leaves the seed endpoint out, so it can't be called by accident.
     */
    @Test
    void noSeedProfileLeavesOutTheSeederAndItsEndpoint() {
        contextWithProfiles("dev").run(context -> {
            assertThat(context).doesNotHaveBean(DevSeeder.class);
            assertThat(context).doesNotHaveBean(DevSeedController.class);
        });
    }

    /**
     * The prod profile wins over the seed profile, so production never has the endpoint, whatever else is turned on.
     */
    @Test
    void prodProfileLeavesOutTheSeederAndItsEndpointEvenWithTheSeedProfile() {
        contextWithProfiles("prod", "seed").run(context -> {
            assertThat(context).doesNotHaveBean(DevSeeder.class);
            assertThat(context).doesNotHaveBean(DevSeedController.class);
        });
    }
}
