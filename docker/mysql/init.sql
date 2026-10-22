SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Database is created by MYSQL_DATABASE env var.
-- This file exists for any extra initialization if needed.

GRANT ALL PRIVILEGES ON `numeros_rojos`.* TO 'app'@'%';
FLUSH PRIVILEGES;

-- BD aislada para la suite de tests (phpunit migra y usa transacciones acá,
-- nunca contra la BD de desarrollo real).
CREATE DATABASE IF NOT EXISTS `numeros_rojos_testing` CHARACTER SET utf8mb4;
GRANT ALL PRIVILEGES ON `numeros_rojos_testing`.* TO 'app'@'%';
FLUSH PRIVILEGES;
