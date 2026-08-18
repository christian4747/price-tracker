package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import com.christian4747.pricetracker.models.dtos.ProductNameGroupDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductDAO productDAO;

    @Autowired
    public ProductService(ProductDAO productDAO) {
        this.productDAO = productDAO;
    }

    /**
     * Adds a new Product to the 'products' database table.
     * @param productDTO The new Product details
     * @return The newly added Product
     */
    public Product addProduct(IncomingProductDTO productDTO) {
        Optional<Product> existingProduct = productDAO.findByName(productDTO.getName());

        if (existingProduct.isPresent() && existingProduct.get().getStore().equals(productDTO.getStore())) {
            throw new IllegalArgumentException("Product already exists!");
        }

        Product newProduct = new Product(
                0,
                productDTO.getBrand(),
                productDTO.getName(),
                productDTO.getLink(),
                productDTO.getStore(),
                true,
                null,
                null,
                null
        );

        return productDAO.save(newProduct);
    }

    /**
     * Deletes a Product from the 'products' database table.
     * @param productId The ID of the Product to delete
     * @return The deleted Product
     */
    public Product deleteProduct(Integer productId) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isPresent()) {
            productDAO.deleteById(productId);
            return existingProduct.get();
        } else {
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");
        }
    }

    /**
     * Gets all the Products in the 'products' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Products (default 20)
     */
    public List<Product> getAllProducts(Pageable pageable) {
        return productDAO.findAllByOrderByNameAsc(pageable).getContent();
    }

    /**
     * Gets the Products grouped by name.
     * The returned list is formatted as ProductNameGroupDTO records and contains the following:
     *  - name: name of the Product
     *  - products: list of the Products corresponding to the 'name'
     * @param pageable Pagination settings
     * @return A list of ProductNameGroupDTO
     */
    public List<ProductNameGroupDTO> getProductsGroupedByName(Pageable pageable) {
        Page<String> namesPage = productDAO.findDistinctNames(pageable);
        List<Product> productsInNamesPage = productDAO.findByNameIn(namesPage.getContent());

        Map<String, List<Product>> groupedByName = productsInNamesPage.stream()
                .collect(Collectors.groupingBy(Product :: getName));

        return namesPage.getContent().stream()
                .map(name -> new ProductNameGroupDTO(name, groupedByName.getOrDefault(name, List.of())))
                .toList();
    }

    /**
     * Gets the Product in the 'products' database table with the given ID.
     * @param productId ID of the Product to get
     * @return The Product associated with the given ID
     */
    public Product getProductById(Integer productId) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isEmpty())
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");

        return existingProduct.get();
    }

    /**
     * Updates a Product from the 'products' database table.
     * @param productId The ID of the Product to update
     * @param productDTO The updated Product details
     * @return The updated product
     */
    public Product updateProduct(Integer productId, IncomingProductDTO productDTO) {
        Optional<Product> existingProduct = productDAO.findById(productId);

        if (existingProduct.isEmpty()) {
            throw new IllegalArgumentException("Product with ID " + productId + " does not exist!");
        }

        Product productToUpdate = existingProduct.get();

        productToUpdate.setBrand(productDTO.getBrand());
        productToUpdate.setName(productDTO.getName());
        productToUpdate.setLink(productDTO.getLink());
        productToUpdate.setStore(productDTO.getStore());
        productToUpdate.setActive(productDTO.isActive());

        return productDAO.save(productToUpdate);
    }
}
