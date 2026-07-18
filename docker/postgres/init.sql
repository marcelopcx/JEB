-- Se ejecuta solo la primera vez que se crea el volumen.
-- La base "jeb", el usuario y el password ya los crea Docker
-- con POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD.
--
-- El esquema (tabla products) y los datos de ejemplo los crea
-- la app Java vía JPA (persistence.xml + import.sql / ProductDataLoader).

SELECT 'PostgreSQL listo para JEB' AS status;
