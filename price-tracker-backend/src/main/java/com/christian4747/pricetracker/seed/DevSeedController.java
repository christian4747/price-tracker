package com.christian4747.pricetracker.seed;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * Rebuilds the local dummy data. Only exists with the 'seed' profile, and never with the 'prod' profile.
 */
@RestController
@RequestMapping("/dev/seed")
@CrossOrigin
@Profile("seed & !prod")
public class DevSeedController {

    private final DevSeeder devSeeder;

    /**
     * Creates the controller.
     * @param devSeeder Adds the dummy data to the database
     */
    public DevSeedController(DevSeeder devSeeder) {
        this.devSeeder = devSeeder;
    }

    /**
     * Permanently removes the seed's own records and adds them again, with dates counted back from now. Records that
     * aren't part of the seed are left alone.
     * @return How many records were added
     */
    @PostMapping
    public ResponseEntity<SeedResult> seed() {
        return ResponseEntity.ok(devSeeder.seed(DevSeedData.build(Instant.now())));
    }
}
