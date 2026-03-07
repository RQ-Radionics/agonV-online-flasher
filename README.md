# agonV Online Flasher

Web-based firmware flasher for the **Olimex ESP32-P4** board running **agonV** (AgonLight MOS for ESP32-P4).

**No installation required** — runs entirely in the browser using the Web Serial API.

## Use it now

**https://rq-radionics.github.io/agonV-online-flasher/**

Requires Google Chrome or Microsoft Edge (Web Serial API).

## What it flashes

| Region | File | Description |
|--------|------|-------------|
| 0x2000 | `bootloader.bin` | ESP-IDF bootloader |
| 0x8000 | `partition-table.bin` | Partition table |
| 0x10000 | `esp32-mos.bin` | agonV MOS firmware |

## How to use

1. Open the flasher in Chrome or Edge
2. Click **⚡ Load agonV Default** to load the firmware files
3. Click **Connect Device** and select the board's serial port (`usbmodem` on macOS, `COM` on Windows)
4. The board resets automatically into bootloader mode — no buttons needed
5. Click **Flash All**
6. Wait ~10 seconds for the flash to complete
7. The board resets automatically and boots the new firmware

## Hardware

- **Board:** Olimex ESP32-P4-DevKit or compatible
- **Chip:** ESP32-P4 (USB-JTAG/Serial, VID `0x303A` PID `0x1001`)
- **Flash:** 16 MB, mode DIO, frequency 80 MHz

## Browser support

| Browser | Supported |
|---------|-----------|
| Google Chrome 89+ | ✅ |
| Microsoft Edge 89+ | ✅ |
| Firefox | ❌ (no Web Serial API) |
| Safari | ❌ (no Web Serial API) |

## Development

```bash
# Serve locally (required — file:// does not work with Web Serial)
python3 -m http.server 8080
# Open http://localhost:8080
```

The project uses [esptool-js](https://github.com/espressif/esptool-js) by Espressif for all serial protocol handling.

## License

MIT
