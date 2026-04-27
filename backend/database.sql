CREATE DATABASE IF NOT EXISTS monfacture;
USE monfacture;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE factures (
  id VARCHAR(20) PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(150),
  company_address TEXT,
  company_email VARCHAR(150),
  company_phone VARCHAR(50),
  client_name VARCHAR(150),
  client_address TEXT,
  client_email VARCHAR(150),
  client_phone VARCHAR(50),
  invoice_number VARCHAR(50),
  invoice_date DATE,
  due_date DATE,
  currency VARCHAR(10) DEFAULT 'EUR',
  tva_rate DECIMAL(5,2) DEFAULT 20,
  payment_method VARCHAR(50),
  notes TEXT,
  discount DECIMAL(5,2) DEFAULT 0,
  total_ht DECIMAL(10,2),
  tva DECIMAL(10,2),
  total_ttc DECIMAL(10,2),
  status ENUM('paid','pending','overdue') DEFAULT 'pending',
  deleted_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE facture_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facture_id VARCHAR(20) NOT NULL,
  description TEXT,
  qty DECIMAL(10,2),
  price DECIMAL(10,2),
  unit ENUM('piece','kg','litre') DEFAULT 'piece',
  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
);