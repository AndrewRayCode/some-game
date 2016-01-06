CREATE TABLE IF NOT EXISTS levels (
    id SERIAL,
    title VARCHAR(255) NOT NULL,
    data text NOT NULL,
    description text,
    PRIMARY KEY (id)
);
