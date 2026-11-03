package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.PeriodType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class PeriodDAOTest {

    private static final Timestamp START = Timestamp.valueOf("2026-11-27 00:00:00");
    private static final Timestamp END = Timestamp.valueOf("2026-11-30 23:59:00");
    private static final Timestamp DELETED = Timestamp.valueOf("2026-12-01 00:00:00");
    private static final Timestamp NOW = Timestamp.valueOf("2026-11-28 12:00:00");

    @Autowired
    private PeriodDAO periodDAO;

    @Autowired
    private EntityManager entityManager;

    private Period addPeriod(String name, Timestamp deletedAt) {
        Period period = new Period(0, name, PeriodType.SALE, null, START, END, null, deletedAt, null);
        entityManager.persist(period);
        return period;
    }

    private Period addStorePeriod(String name, String store, Timestamp start, Timestamp end) {
        Period period = new Period(0, name, PeriodType.SALE, store, start, end, null, null, null);
        entityManager.persist(period);
        return period;
    }

    private void saveFixtures() {
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void findAllByNameIgnoreCaseMatchesADifferentCase() {
        addPeriod("Black Friday", null);
        saveFixtures();

        assertThat(periodDAO.findAllByNameIgnoreCase("black FRIDAY"))
                .extracting(Period::getName)
                .containsExactly("Black Friday");
    }

    @Test
    void findAllByNameIgnoreCaseIncludesDeletedPeriods() {
        addPeriod("Black Friday", DELETED);
        saveFixtures();

        assertThat(periodDAO.findAllByNameIgnoreCase("Black Friday"))
                .extracting(Period::getName)
                .containsExactly("Black Friday");
    }

    @Test
    void findAllByNameIgnoreCaseLeavesOutNamesThatOnlyContainIt() {
        addPeriod("Black Friday weekend", null);
        saveFixtures();

        assertThat(periodDAO.findAllByNameIgnoreCase("Black Friday")).isEmpty();
    }

    @Test
    void deleteByIdKeepsThePeriodWithADeletedTime() {
        Period period = addPeriod("Black Friday", null);
        saveFixtures();

        periodDAO.deleteById(period.getPeriodId());
        saveFixtures();

        assertThat(entityManager.find(Period.class, period.getPeriodId()).getDeletedAt()).isNotNull();
    }

    @Test
    void deleteByIdKeepsTheFirstDeletedTime() {
        Period period = addPeriod("Black Friday", DELETED);
        saveFixtures();

        periodDAO.deleteById(period.getPeriodId());
        saveFixtures();

        assertThat(entityManager.find(Period.class, period.getPeriodId()).getDeletedAt()).isEqualTo(DELETED);
    }

    @Test
    void permanentlyDeleteByIdRemovesASoftDeletedPeriod() {
        Period period = addPeriod("Black Friday", DELETED);
        saveFixtures();

        int removed = periodDAO.permanentlyDeleteById(period.getPeriodId());
        entityManager.clear();

        assertThat(removed).isEqualTo(1);
        assertThat(entityManager.find(Period.class, period.getPeriodId())).isNull();
    }

    @Test
    void permanentlyDeleteByIdLeavesAPeriodThatIsNotDeleted() {
        Period period = addPeriod("Black Friday", null);
        saveFixtures();

        int removed = periodDAO.permanentlyDeleteById(period.getPeriodId());
        entityManager.clear();

        assertThat(removed).isZero();
        assertThat(entityManager.find(Period.class, period.getPeriodId())).isNotNull();
    }

    @Test
    void findAllForStoreLeavesOutDeletedPeriods() {
        addPeriod("Black Friday", null);
        addPeriod("Cyber Monday", DELETED);
        saveFixtures();

        assertThat(periodDAO.findAllForStore(null, NOW))
                .extracting(Period::getName)
                .containsExactly("Black Friday");
    }

    @Test
    void findAllForStoreIncludesPeriodsForAllStores() {
        addStorePeriod("Corner shop sale", "Corner shop", START, END);
        addStorePeriod("Black Friday", null, START, END);
        addStorePeriod("Other shop sale", "Other shop", START, END);
        saveFixtures();

        assertThat(periodDAO.findAllForStore("Corner shop", NOW))
                .extracting(Period::getName)
                .containsExactlyInAnyOrder("Corner shop sale", "Black Friday");
    }

    @Test
    void findAllForStoreWithoutAStoreIncludesEveryStore() {
        addStorePeriod("Corner shop sale", "Corner shop", START, END);
        addStorePeriod("Black Friday", null, START, END);
        addStorePeriod("Other shop sale", "Other shop", START, END);
        saveFixtures();

        assertThat(periodDAO.findAllForStore(null, NOW))
                .extracting(Period::getName)
                .containsExactlyInAnyOrder("Corner shop sale", "Black Friday", "Other shop sale");
    }

    @Test
    void findAllForStorePutsCurrentAndUpcomingPeriodsFirstSoonestStartFirst() {
        addStorePeriod("Later sale", null, Timestamp.valueOf("2026-12-20 00:00:00"), Timestamp.valueOf("2026-12-21 00:00:00"));
        addStorePeriod("Past sale", null, Timestamp.valueOf("2026-11-01 00:00:00"), Timestamp.valueOf("2026-11-02 00:00:00"));
        addStorePeriod("Soon sale", null, Timestamp.valueOf("2026-12-01 00:00:00"), Timestamp.valueOf("2026-12-02 00:00:00"));
        addStorePeriod("Long sale", null, Timestamp.valueOf("2026-11-01 00:00:00"), Timestamp.valueOf("2026-12-31 00:00:00"));
        saveFixtures();

        assertThat(periodDAO.findAllForStore(null, NOW))
                .extracting(Period::getName)
                .containsExactly("Long sale", "Soon sale", "Later sale", "Past sale");
    }

    @Test
    void findAllForStorePutsPastPeriodsMostRecentlyEndedFirst() {
        addStorePeriod("Short sale", null, Timestamp.valueOf("2026-11-10 00:00:00"), Timestamp.valueOf("2026-11-12 00:00:00"));
        addStorePeriod("Long sale", null, Timestamp.valueOf("2026-10-01 00:00:00"), Timestamp.valueOf("2026-11-25 00:00:00"));
        saveFixtures();

        assertThat(periodDAO.findAllForStore(null, NOW))
                .extracting(Period::getName)
                .containsExactly("Long sale", "Short sale");
    }

    @Test
    void findAllForStoreCountsAPeriodEndingNowAsPast() {
        addStorePeriod("Ending sale", null, Timestamp.valueOf("2026-11-01 00:00:00"), NOW);
        addStorePeriod("Past sale", null, Timestamp.valueOf("2026-10-01 00:00:00"), Timestamp.valueOf("2026-10-02 00:00:00"));
        addStorePeriod("Soon sale", null, Timestamp.valueOf("2026-12-01 00:00:00"), Timestamp.valueOf("2026-12-02 00:00:00"));
        saveFixtures();

        assertThat(periodDAO.findAllForStore(null, NOW))
                .extracting(Period::getName)
                .containsExactly("Soon sale", "Ending sale", "Past sale");
    }
}
