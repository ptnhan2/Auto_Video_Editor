import time
import secrets

def generate_ulid() -> str:
    """
    Generates a sortable unique identifier.
    Format: [Timestamp in ms (12 chars hex)][Random (10 chars hex)]
    Globally unique and chronologically sortable.
    """
    # 48-bit timestamp (milliseconds)
    timestamp = int(time.time() * 1000)
    # Random part
    random_part = secrets.token_hex(10)
    return f"{timestamp:012x}{random_part}"

if __name__ == "__main__":
    print(generate_ulid())
