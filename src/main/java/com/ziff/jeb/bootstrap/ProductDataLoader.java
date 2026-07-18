package com.ziff.jeb.bootstrap;

import com.ziff.jeb.entity.Product;
import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.util.logging.Logger;

/**
 * Si import.sql no se ejecuta (según el servidor), este bean
 * inserta productos de ejemplo al arrancar la aplicación.
 */
@Singleton
@Startup
public class ProductDataLoader {

    private static final Logger LOGGER = Logger.getLogger(ProductDataLoader.class.getName());

    @PersistenceContext(unitName = "default")
    private EntityManager em;

    @PostConstruct
    public void load() {
        Long count = em.createQuery("SELECT COUNT(p) FROM Product p", Long.class)
                .getSingleResult();

        if (count > 0) {
            LOGGER.info("Productos ya cargados (" + count + "). No se inserta seed.");
            return;
        }

        em.persist(new Product("Laptop", "Laptop 15 pulgadas 16GB RAM", new BigDecimal("899.99"), 10));
        em.persist(new Product("Mouse", "Mouse inalambrico", new BigDecimal("25.50"), 50));
        em.persist(new Product("Teclado", "Teclado mecanico RGB", new BigDecimal("79.90"), 30));
        em.persist(new Product("Monitor", "Monitor 27 pulgadas 144Hz", new BigDecimal("299.00"), 15));
        em.persist(new Product("Audifonos", "Audifonos bluetooth noise cancelling", new BigDecimal("149.99"), 20));

        LOGGER.info("Seed de productos insertado correctamente.");
    }
}
