package com.ziff.jeb.resource;

import com.ziff.jeb.dto.AddCartItemRequest;
import com.ziff.jeb.dto.CartDto;
import com.ziff.jeb.service.CartService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/cart/{userId}")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CartResource {

    @Inject
    private CartService cartService;

    @GET
    public CartDto getCart(@PathParam("userId") String userId) {
        return cartService.getCart(userId);
    }

    @POST
    @Path("/items")
    public CartDto addItem(@PathParam("userId") String userId, AddCartItemRequest request) {
        return cartService.addItem(userId, request.getProductId(), request.getQuantity());
    }

    @DELETE
    @Path("/items/{productId}")
    public CartDto removeItem(@PathParam("userId") String userId,
                              @PathParam("productId") Long productId) {
        return cartService.removeItem(userId, productId);
    }

    @DELETE
    public CartDto clearCart(@PathParam("userId") String userId) {
        return cartService.clearCart(userId);
    }
}