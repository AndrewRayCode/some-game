CREATE TABLE IF NOT EXISTS books (
    id SERIAL,
    title VARCHAR(255) NOT NULL,
    data text NOT NULL,
    description text,
    PRIMARY KEY (id)
);
