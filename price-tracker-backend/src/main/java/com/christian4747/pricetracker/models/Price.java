package com.christian4747.pricetracker.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;

@Component
@Entity
@Table(name="prices")
public class Price {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int priceId;

    @Column(nullable = false)
    private double amount;

    private String currency;

    private Timestamp priceStarted;

    private Timestamp priceEnded;

    @CreationTimestamp
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "productId")
    @JsonIgnore
    private Product product;

    public Price() {
    }

    public Price(int priceId, double amount, String currency, Timestamp priceStarted, Timestamp priceEnded, Timestamp createdAt, Timestamp updatedAt, Product product) {
        this.priceId = priceId;
        this.amount = amount;
        this.currency = currency;
        this.priceStarted = priceStarted;
        this.priceEnded = priceEnded;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.product = product;
    }

    public int getPriceId() {
        return priceId;
    }

    public void setPriceId(int priceId) {
        this.priceId = priceId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
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

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
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
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                ", priceStarted=" + priceStarted +
                ", priceEnded=" + priceEnded +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", product=" + product +
                '}';
    }
}
