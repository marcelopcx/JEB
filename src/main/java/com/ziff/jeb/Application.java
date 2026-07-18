package com.ziff.jeb;

import jakarta.annotation.sql.DataSourceDefinition;
import jakarta.ws.rs.ApplicationPath;

/**
 * Datasource apuntando al PostgreSQL de Docker Compose.
 * URL: jdbc:postgresql://localhost:5433/jeb
 * Credenciales: jeb / jeb
 */
@DataSourceDefinition(
        name = "java:app/jdbc/jeb",
        className = "org.postgresql.xa.PGXADataSource",
        serverName = "localhost",
        portNumber = 5433,
        databaseName = "jeb",
        user = "jeb",
        password = "jeb"
)
@ApplicationPath("/api")
public class Application extends jakarta.ws.rs.core.Application {

}
