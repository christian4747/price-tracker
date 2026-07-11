package com.christian4747.pricetracker.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;

@Component
@Entity
@Table(name="prices")
public class Price {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int priceId;

    @Column
    private String currency;

    @Column
    private double amount;

    @Column
    private Timestamp added;

    @Column
    private Timestamp updated;

    @Column
    private Timestamp priceStarted;

    @Column
    private Timestamp priceEnded;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "productId")
    @JsonIgnore
    private Product product;

    public Price() {
    }

    public Price(int priceId, String currency, double amount, Timestamp added, Timestamp updated, Timestamp priceStarted, Timestamp priceEnded, Product product) {
        this.priceId = priceId;
        this.currency = currency;
        this.amount = amount;
        this.added = added;
        this.updated = updated;
        this.priceStarted = priceStarted;
        this.priceEnded = priceEnded;
        this.product = product;
    }

    public int getPriceId() {
        return priceId;
    }

    public void setPriceId(int priceId) {
        this.priceId = priceId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public Timestamp getAdded() {
        return added;
    }

    public void setAdded(Timestamp added) {
        this.added = added;
    }

    public Timestamp getUpdated() {
        return updated;
    }

    public void setUpdated(Timestamp updated) {
        this.updated = updated;
    }

    public Timestamp getPriceStarted() {
        return priceStarted;
    }

    public void setPriceStarted(Timestamp priceStarted) {
        this.priceStarted = priceStarted;
    }

    public Timestamp getPriceEnded() {
        return priceEnded;
    }

    public void setPriceEnded(Timestamp priceEnded) {
        this.priceEnded = priceEnded;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    @Override
    public String toString() {
        return "Price{" +
                "priceId=" + priceId +
                ", currency='" + currency + '\'' +
                ", amount=" + amount +
                ", added=" + added +
                ", updated=" + updated +
                ", priceStarted=" + priceStarted +
                ", priceEnded=" + priceEnded +
                ", product=" + product +
                '}';
    }
}
