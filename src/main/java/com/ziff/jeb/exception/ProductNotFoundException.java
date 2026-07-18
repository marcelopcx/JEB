package com.ziff.jeb.exception;

import jakarta.ejb.ApplicationException;

/**
 * Excepción de negocio (no se envuelve como EJBException ni llena el log de ERROR).
 */
@ApplicationException(rollback = true)
public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(Long productId) {
        super("Producto no encontrado: " + productId);
    }
}
