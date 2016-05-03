CREATE TABLE IF NOT EXISTS users (
    id SERIAL,
    username VARCHAR(50),
    email VARCHAR(255),
    encrypted_password VARCHAR(255),
    unique_hash VARCHAR(255),
    current_sign_in_ip VARCHAR(255) NULL,
    last_sign_in_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    PRIMARY KEY (id)
);
