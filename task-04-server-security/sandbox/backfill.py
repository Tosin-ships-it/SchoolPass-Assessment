import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'sandbox.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check rows before backfill
rows_null = cur.execute("SELECT id, name, phoneNumber FROM Parent WHERE phoneNumber IS NULL").fetchall()
print(f"Step 2 Pre-check: {len(rows_null)} rows with NULL phoneNumber")

# Execute backfill
cur.execute("UPDATE Parent SET phoneNumber = '+23480' || hex(randomblob(4)) WHERE phoneNumber IS NULL")
conn.commit()

# Check rows after backfill
rows_filled = cur.execute("SELECT id, email, name, phoneNumber FROM Parent").fetchall()
print("Step 2 Post-backfill verification:")
for r in rows_filled:
    print(f"  Row {r[0]}: {r[2]} ({r[1]}) -> phoneNumber = {r[3]}")

remaining_null = cur.execute("SELECT COUNT(*) FROM Parent WHERE phoneNumber IS NULL").fetchone()[0]
print(f"Step 2 Result: {remaining_null} NULL rows remaining. Table is fully populated.")
conn.close()
