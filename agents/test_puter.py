import putergenai
import asyncio

async def main():
    try:
        response = await putergenai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello, are you working?"}]
        )
        print(response)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
