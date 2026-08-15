package com.christian4747.pricetracker.models.dtos;

public class IncomingProductDTO {

    private String brand;
    private String name;
    private String link;
    private String store;
    private boolean active;

    public IncomingProductDTO() {
    }

    public IncomingProductDTO(String brand, String name, String link, String store, boolean active) {
        this.brand = brand;
        this.name = name;
        this.link = link;
        this.store = store;
        this.active = active;
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

    @Override
    public String toString() {
        return "IncomingProductDTO{" +
                "brand='" + brand + '\'' +
                ", name='" + name + '\'' +
                ", link='" + link + '\'' +
                ", store='" + store + '\'' +
                ", active=" + active +
                '}';
    }
}
