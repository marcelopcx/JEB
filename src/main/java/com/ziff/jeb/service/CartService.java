package com.ziff.jeb.service;

import com.ziff.jeb.cache.CartCache;
import com.ziff.jeb.dto.CartDto;
import com.ziff.jeb.dto.CartItemDto;
import com.ziff.jeb.entity.Product;
import com.ziff.jeb.repository.dao.ProductRepository;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.Optional;

@Stateless
public class CartService {

    @Inject
    private ProductRepository productRepository;

    @Inject
    private CartCache cartCache;

    public CartDto getCart(String userId) {
        return cartCache.getOrCreate(userId);
    }

    public CartDto addItem(String userId, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("La cantidad debe ser mayor a 0");
        }

        // Solo aquí se consulta la DB: validar que el producto existe
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + productId));

        CartDto cart = cartCache.getOrCreate(userId);

        Optional<CartItemDto> existing = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();

        if (existing.isPresent()) {
            CartItemDto item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
        } else {
            cart.getItems().add(new CartItemDto(
                    product.getId(),
                    product.getName(),
                    product.getPrice(),
                    quantity
            ));
        }

        cart.recalculateTotal();
        cartCache.put(userId, cart);
        return cart;
    }

    public CartDto removeItem(String userId, Long productId) {
        // Valida que el producto existe en DB
        productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + productId));

        CartDto cart = cartCache.getOrCreate(userId);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        cart.recalculateTotal();
        cartCache.put(userId, cart);
        return cart;
    }

    public CartDto clearCart(String userId) {
        cartCache.clear(userId);
        return cartCache.getOrCreate(userId);
    }
}