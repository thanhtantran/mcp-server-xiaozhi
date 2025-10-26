# mcp-server-xiaozhi

Test thử một số mcp-server để dùng với Tiểu Trí, chạy tốt trên các thiết bị Orange Pi nh ư 
[Orange Pi 5](https://orangepi.vn/shop/orange-pi-5-chip-rk3588s-ram-8gb), [Orange Pi 4A](https://orangepi.vn/shop/orange-pi-4a-phien-ban-2gb-ram), [Orange Pi 3B](https://orangepi.vn/shop/orange-pi-3b-chip-rk3566-wifi5-bt5-ram-4gb) ...

## Quick Start

1. Install dependencies 
```bash
pip install -r requirements.txt
```
Đối với Phạt nguội API, cần cài NodeJS (dùng NVM cài node 18), sau đó cài đặt chạy background trong service
```bash
sudo cp phatnguoi-api/phatnguoi-api.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable --now phatnguoi-api.service
```
File `phatnguoi.py` cai sử dụng `localhost:3033` nếu thay đổi phải sửa file này

2. Set up environment variables
```bash
export MCP_ENDPOINT=<your_mcp_endpoint>
```
hoặc tạo file `.env` và paste `export MCP_ENDPOINT=<your_mcp_endpoint>` vào đó

3. Run the calculator example
```bash
python mcp_pipe.py calculator.py
```

Or run all configured servers
```bash
python mcp_pipe.py
```

*Requires `mcp_config.json` configuration file with server definitions (supports stdio/sse/http transport types)*

## Contributing 

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Forked from the original https://github.com/78/mcp-calculator
- API Phạt nguội lấy từ https://github.com/anyideaz/phatnguoi-api

