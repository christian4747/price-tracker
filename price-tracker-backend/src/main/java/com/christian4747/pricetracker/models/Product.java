package com.christian4747.pricetracker.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.List;

@Component
@Entity
@Table(name="products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int productId;

    private String brand;

    @Column(nullable = false)
    private String name;

    private String link;

    private String store;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

    @OneToMany(mappedBy = "product", fetch = FetchType.EAGER, cascade = CascadeType.REMOVE, orphanRemoval = true)
    @OrderBy("priceStarted ASC")
    private List<Price> prices;

    public Product() {
    }

    public Product(int productId, String brand, String name, String link, String store, boolean active, Timestamp createdAt, Timestamp updatedAt, List<Price> prices) {
        this.productId = productId;
        this.brand = brand;
        this.name = name;
        this.link = link;
        this.store = store;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.prices = prices;
    }

    public int getProductId() {
        return productId;
    }

    public void setProductId(int productId) {
        this.productId = productId;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public String getStore() {
        return store;
    }

    public void setStore(String store) {
        this.store = store;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
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

    public List<Price> getPrices() {
        return prices;
    }

    public void setPrices(List<Price> prices) {
        this.prices = prices;
    }

    @Override
    public String toString() {
        return "Product{" +
                "productId=" + productId +
                ", brand='" + brand + '\'' +
                ", name='" + name + '\'' +
                ", link='" + link + '\'' +
                ", store='" + store + '\'' +
                ", active=" + active +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", prices=" + prices +
                '}';
    }
}
