# mcp-server-xiaozhi

Test thử một số mcp-server để dùng với Tiểu Trí

## Quick Start

1. Install dependencies 
```bash
pip install -r requirements.txt
```

2. Set up environment variables
```bash
export MCP_ENDPOINT=<your_mcp_endpoint>
```

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

Forked from the original https://github.com/78/mcp-calculator

