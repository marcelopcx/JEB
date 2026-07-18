package com.ziff.jeb.service;

import com.ziff.jeb.entity.Product;
import com.ziff.jeb.repository.dao.ProductRepository;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@Stateless
public class ProductService {

    @Inject
    private ProductRepository productRepository;

    public List<Product> listProducts() {
        return productRepository.findAll();
    }

    public Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
    }
}