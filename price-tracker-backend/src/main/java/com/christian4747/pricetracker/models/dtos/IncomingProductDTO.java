package com.christian4747.pricetracker.models.dtos;

public class IncomingProductDTO {
    private String name;
    private String link;
    private String store;
    private boolean active;

    public IncomingProductDTO() {
    }

    public IncomingProductDTO(String name, String link, String store, boolean active) {
        this.name = name;
        this.link = link;
        this.store = store;
        this.active = active;
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
                "name='" + name + '\'' +
                ", link='" + link + '\'' +
                ", store='" + store + '\'' +
                ", active=" + active +
                '}';
    }
}
