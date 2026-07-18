package com.ziff.jeb.cache;

import com.ziff.jeb.dto.CartDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class CartCache {

    private final ConcurrentHashMap<String, CartDto> carts = new ConcurrentHashMap<>();

    public CartDto getOrCreate(String userId) {
        return carts.computeIfAbsent(userId, CartDto::new);
    }

    public Optional<CartDto> get(String userId) {
        return Optional.ofNullable(carts.get(userId));
    }

    public void put(String userId, CartDto cart) {
        carts.put(userId, cart);
    }

    public void clear(String userId) {
        carts.remove(userId);
    }
}