# phatnguoi.py
import asyncio
import aiohttp
from mcp.server.fastmcp import FastMCP
import logging

logger = logging.getLogger("phatnguoi_mcp")

mcp = FastMCP("PhatNguoi")

@mcp.tool()
async def check_traffic_violation(license_plate: str) -> dict:
    """
    Tra cứu phạt nguội thông qua Node.js API.
    API: http://localhost:3033/api?licensePlate={license_plate}
    Hàm này là async — MCP client sẽ đợi cho đến khi nhận được kết quả.
    """
    base_url = "http://localhost:3033/api"
    params = {"licensePlate": license_plate}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(base_url, params=params, timeout=60) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    logger.error(f"API error {resp.status}: {text}")
                    return {"success": False, "message": f"HTTP {resp.status}: {text}"}

                data = await resp.json()
                logger.info(f"Result for {license_plate}: {data}")
                return {"success": True, "data": data}

    except asyncio.TimeoutError:
        logger.error("Timeout waiting for Node.js API response")
        return {"success": False, "message": "Timeout waiting for Node.js API"}

    except aiohttp.ClientError as e:
        logger.error(f"Network error: {e}")
        return {"success": False, "message": f"Network error: {e}"}

# Run the MCP server (stdio transport)
if __name__ == "__main__":
    mcp.run(transport="stdio")

    # ✅ Test trực tiếp không qua MCP, test xong xóa đi
    # print("=== TEST TRA CỨU PHẠT NGUỘI ===\n")
    # result = check_traffic_violation("30H47465")  # thay biển số tùy ý, biển 30H47465 đang có phạt nguội
    
    # import json
    # print(json.dumps(result, ensure_ascii=False, indent=2))