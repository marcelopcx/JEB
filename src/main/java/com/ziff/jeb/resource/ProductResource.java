package com.ziff.jeb.resource;

import com.ziff.jeb.entity.Product;
import com.ziff.jeb.service.ProductService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
public class ProductResource {

    @Inject
    private ProductService productService;

    @GET
    public List<Product> list() {
        return productService.listProducts();
    }

    @GET
    @Path("/{id}")
    public Product get(@PathParam("id") Long id) {
        return productService.getProduct(id);
    }
}