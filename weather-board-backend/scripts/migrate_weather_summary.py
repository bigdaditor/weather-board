import argparse
import sqlite3


def migrate(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE weather
        SET summary = CASE
            WHEN summary LIKE '%비옴%' THEN '강우'
            WHEN summary LIKE '%비 안옴%' THEN
                CASE
                    WHEN summary LIKE '맑음%' THEN '맑음'
                    ELSE '흐림'
                END
            WHEN summary LIKE '%강우 없음%' THEN
                CASE
                    WHEN summary LIKE '맑음%' THEN '맑음'
                    ELSE '흐림'
                END
            WHEN summary LIKE '%강우%' THEN '강우'
            WHEN summary LIKE '맑음%' THEN '맑음'
            ELSE '흐림'
        END
        """
    )

    conn.commit()
    conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize weather summaries to 맑음/흐림/강우")
    parser.add_argument("--db", default="sales.db", help="SQLite DB path")
    args = parser.parse_args()

    migrate(args.db)
    print(f"Updated weather summaries in {args.db}")


if __name__ == "__main__":
    main()
