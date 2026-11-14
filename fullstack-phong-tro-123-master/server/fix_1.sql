SELECT * FROM phongtro12345.users;
USE phongtro12345;

CREATE TABLE IF NOT EXISTS `Prices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order` INT,
  `code` VARCHAR(255),
  `value` VARCHAR(255),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `Areas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order` INT,
  `code` VARCHAR(255),
  `value` VARCHAR(255),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `Provinces` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255),
  `value` VARCHAR(255),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
);