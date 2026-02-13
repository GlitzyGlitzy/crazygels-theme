"""
Quick test script to verify Open Beauty Facts API v2 works.
Run: python scripts/test_obf_api.py

This uses only Python standard library (urllib) -- no aiohttp needed.
If this works, the main scraper will too.
"""

import json
import urllib.request
import urllib.error


def test_obf_api():
    url = (
        "https://world.openbeautyfacts.org/api/v2/search"
        "?categories_tags=en:moisturizers"
        "&page_size=5&page=1"
        "&fields=code,product_name,brands,ingredients_text"
    )

    print(f"Testing Open Beauty Facts API v2...")
    print(f"URL: {url}\n")

    req = urllib.request.Request(url, headers={
        "User-Agent": "CrazyGels-Scraper/1.0 (contact: hello@crazygels.com)",
        "Accept": "application/json",
    })

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
            content_type = resp.headers.get("Content-Type", "unknown")
            raw = resp.read()
            text = raw.decode("utf-8", errors="replace")

            print(f"HTTP Status: {status}")
            print(f"Content-Type: {content_type}")
            print(f"Response length: {len(text)} chars")
            print(f"First 100 chars: {text[:100]}")
            print()

            if text.strip().startswith("{"):
                data = json.loads(text)
                products = data.get("products", [])
                count = data.get("count", 0)
                page_count = data.get("page_count", 0)

                print(f"SUCCESS! API returned valid JSON.")
                print(f"Total products available: {count}")
                print(f"Page count: {page_count}")
                print(f"Products on this page: {len(products)}")
                print()

                for i, p in enumerate(products[:5]):
                    name = p.get("product_name", "N/A")
                    brand = p.get("brands", "N/A")
                    print(f"  {i+1}. {name} by {brand}")

                print(f"\nThe scraper should work. Make sure you've pulled the latest code from Git!")
            else:
                print(f"PROBLEM: Response is not JSON.")
                print(f"Response starts with: {text[:300]}")
                print(f"\nThis might be an HTML page. Check if the URL is correct.")

    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.reason}")
        body = e.read().decode("utf-8", errors="replace")
        print(f"Response: {body[:300]}")
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        print("Check your internet connection.")
    except Exception as e:
        print(f"Unexpected error: {e}")


if __name__ == "__main__":
    test_obf_api()
