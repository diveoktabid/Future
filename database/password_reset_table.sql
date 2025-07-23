-- ============================================================================
-- BARTECH DATABASE - Password Reset Table
-- ============================================================================
-- Script untuk membuat tabel password_resets
-- Jalankan script ini di phpMyAdmin atau MySQL console

-- Pastikan menggunakan database yang benar
USE bartech;

-- Buat tabel password_resets jika belum ada
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    INDEX idx_email (email),
    INDEX idx_code (code),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menampilkan struktur tabel yang baru dibuat
DESCRIBE password_resets;

-- Query untuk melihat semua tabel dalam database
SHOW TABLES;

-- ============================================================================
-- CONTOH PENGGUNAAN (UNTUK TESTING - HAPUS SETELAH PRODUCTION)
-- ============================================================================

-- Contoh insert kode reset (biasanya dilakukan oleh API)
-- INSERT INTO password_resets (email, code, expires_at, created_at) 
-- VALUES ('test@example.com', '123456', DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

-- Contoh query untuk melihat kode reset aktif
-- SELECT * FROM password_resets WHERE used = 0 AND expires_at > NOW();

-- Contoh query untuk membersihkan kode yang sudah expired
-- DELETE FROM password_resets WHERE expires_at < NOW();

-- Contoh query untuk membersihkan kode yang sudah digunakan (lebih dari 1 hari)
-- DELETE FROM password_resets WHERE used = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY);
