import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'sandbox.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

parents = [
    ('p1', 'parent1@example.com', 'Aisha Bello', 'hash1', '2026-11-02 10:00:00', '2026-11-02 10:00:00'),
    ('p2', 'parent2@example.com', 'Chidi Okonkwo', 'hash2', '2026-11-02 10:05:00', '2026-11-02 10:05:00'),
    ('p3', 'parent3@example.com', 'Tunde Adeleke', 'hash3', '2026-11-02 10:10:00', '2026-11-02 10:10:00')
]

cur.executemany(
    "INSERT INTO Parent (id, email, name, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    parents
)
conn.commit()

count = cur.execute("SELECT COUNT(*) FROM Parent").fetchone()[0]
print(f"Successfully populated Parent table. Total rows: {count}")
conn.close()
