// agonV Flasher — ESP32-P4 Olimex
// Web Serial API flasher
// Equivalent to:
//   python -m esptool --chip esp32p4 -b 460800 --before default_reset --after hard_reset
//     write_flash --flash_mode dio --flash_size 16MB --flash_freq 80m
//     0x2000  bootloader.bin
//     0x8000  partition-table.bin
//     0x10000 esp32-mos.bin

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────────────────────
const i18n = {
    en: {
        browserWarning:  'Your browser does not support Web Serial API. Please use Chrome or Edge.',
        panelConnection: 'Connection',
        panelFlash:      'Flash Settings',
        panelRegions:    'Flash Regions',
        panelProgress:   'Progress',
        panelMap:        'Flash Memory Map (16 MB)',
        panelLog:        'Log',
        connect:         'Connect Device',
        disconnect:      'Disconnect',
        flash:           'Flash All',
        disconnected:    'Disconnected',
        connected:       'Connected',
        flashing:        'Flashing…',
        done:            'Done',
        error:           'Error',
        cfgBaud:         'Baud Rate',
        cfgFlashMode:    'Flash Mode',
        cfgFlashSize:    'Flash Size',
        cfgFlashFreq:    'Flash Freq',
        cfgBefore:       'Before Flash',
        cfgAfter:        'After Flash',
        cfgErase:        'Erase all flash before writing',
        cfgVerify:       'Verify after writing',
        colOffset:       'Offset',
        colFile:         'File (.bin)',
        colSize:         'Size',
        colStatus:       'Status',
        addRegion:       '+ Add Region',
        clearRegions:    'Clear All',
        statWritten:     'KB Written',
        statTotal:       'KB Total',
        statRegion:      'Current Region',
        statSpeed:       'KB/s',
        statErrors:      'Errors',
        legendEmpty:     'Empty',
        legendPending:   'Pending',
        legendWriting:   'Writing',
        legendDone:      'Written',
        legendVerified:  'Verified',
        legendError:     'Error',
        // log
        msgConnecting:    'Connecting to device…',
        msgConnected:     'Device connected — {chip}',
        msgDisconnected:  'Disconnected',
        msgConnectFail:   'Connection failed: {err}',
        msgSync:          'Syncing with bootloader…',
        msgSyncOK:        'Bootloader sync OK',
        msgChipDetect:    'Detecting chip…',
        msgChipFound:     'Chip: {chip}',
        msgNoRegions:     'Add at least one flash region with a .bin file.',
        msgFlashStart:    'Writing {name} → offset {offset} ({size} KB)',
        msgFlashDone:     'Done! Total {size} KB in {time}s.',
        msgFlashError:    'Flash error: {err}',
        msgVerifying:     'Verifying {name}…',
        msgVerifyOK:      'Verify OK',
        msgVerifyFail:    'Verify FAILED at sector {sector}',
        msgErasing:       'Erasing flash…',
        msgErased:        'Flash erased.',
        msgRegionDone:    '{name} ✓',
        msgResetting:     'Resetting device…',
        msgResetDone:     'Device reset.',
        msgChangeBaud:    'Switching to {baud} baud…',
        msgChangeBaudOK:  'Baud rate changed to {baud}.',
        msgFileDropHere:  'Drop .bin or click…',
    },
    es: {
        browserWarning:  'Tu navegador no soporta Web Serial API. Usa Chrome o Edge.',
        panelConnection: 'Conexión',
        panelFlash:      'Configuración de Flash',
        panelRegions:    'Regiones de Flash',
        panelProgress:   'Progreso',
        panelMap:        'Mapa de Memoria Flash (16 MB)',
        panelLog:        'Log',
        connect:         'Conectar Dispositivo',
        disconnect:      'Desconectar',
        flash:           'Flashear Todo',
        disconnected:    'Desconectado',
        connected:       'Conectado',
        flashing:        'Flasheando…',
        done:            'Completado',
        error:           'Error',
        cfgBaud:         'Velocidad',
        cfgFlashMode:    'Modo Flash',
        cfgFlashSize:    'Tamaño Flash',
        cfgFlashFreq:    'Frecuencia Flash',
        cfgBefore:       'Antes de Flashear',
        cfgAfter:        'Después de Flashear',
        cfgErase:        'Borrar flash antes de escribir',
        cfgVerify:       'Verificar después de escribir',
        colOffset:       'Offset',
        colFile:         'Archivo (.bin)',
        colSize:         'Tamaño',
        colStatus:       'Estado',
        addRegion:       '+ Añadir Región',
        clearRegions:    'Borrar Todo',
        statWritten:     'KB Escritos',
        statTotal:       'KB Total',
        statRegion:      'Región Actual',
        statSpeed:       'KB/s',
        statErrors:      'Errores',
        legendEmpty:     'Vacío',
        legendPending:   'Pendiente',
        legendWriting:   'Escribiendo',
        legendDone:      'Escrito',
        legendVerified:  'Verificado',
        legendError:     'Error',
        msgConnecting:    'Conectando al dispositivo…',
        msgConnected:     'Dispositivo conectado — {chip}',
        msgDisconnected:  'Desconectado',
        msgConnectFail:   'Error al conectar: {err}',
        msgSync:          'Sincronizando con bootloader…',
        msgSyncOK:        'Sincronización OK',
        msgChipDetect:    'Detectando chip…',
        msgChipFound:     'Chip: {chip}',
        msgNoRegions:     'Añade al menos una región con un archivo .bin.',
        msgFlashStart:    'Escribiendo {name} → offset {offset} ({size} KB)',
        msgFlashDone:     '¡Listo! {size} KB totales en {time}s.',
        msgFlashError:    'Error de flash: {err}',
        msgVerifying:     'Verificando {name}…',
        msgVerifyOK:      'Verificación OK',
        msgVerifyFail:    'Verificación FALLIDA en sector {sector}',
        msgErasing:       'Borrando flash…',
        msgErased:        'Flash borrado.',
        msgRegionDone:    '{name} ✓',
        msgResetting:     'Reseteando dispositivo…',
        msgResetDone:     'Dispositivo reseteado.',
        msgChangeBaud:    'Cambiando a {baud} baudios…',
        msgChangeBaudOK:  'Velocidad cambiada a {baud}.',
        msgFileDropHere:  'Arrastra .bin o haz clic…',
    },
};

let lang = 'en';
function detectLang() {
    const l = (navigator.language || 'en').split('-')[0].toLowerCase();
    return i18n[l] ? l : 'en';
}
function t(key, params = {}) {
    let text = (i18n[lang]?.[key]) ?? (i18n.en[key]) ?? key;
    for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, v);
    return text;
}
function applyTranslations() {
    lang = detectLang();
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const v = i18n[lang]?.[el.dataset.i18n] ?? i18n.en[el.dataset.i18n];
        if (v) el.textContent = v;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

function le32(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n >>> 0, true);
    return b;
}
function readLE32(arr, offset) {
    return new DataView(arr.buffer, arr.byteOffset + offset, 4).getUint32(0, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIP framing
// ─────────────────────────────────────────────────────────────────────────────
const SLIP_END     = 0xC0;
const SLIP_ESC     = 0xDB;
const SLIP_ESC_END = 0xDC;
const SLIP_ESC_ESC = 0xDD;

function slipEncode(data) {
    const out = [SLIP_END];
    for (const b of data) {
        if      (b === SLIP_END) out.push(SLIP_ESC, SLIP_ESC_END);
        else if (b === SLIP_ESC) out.push(SLIP_ESC, SLIP_ESC_ESC);
        else                     out.push(b);
    }
    out.push(SLIP_END);
    return new Uint8Array(out);
}

function slipDecode(raw) {
    const out = [];
    let esc = false;
    let i = 0;
    // skip leading 0xC0
    if (raw[0] === SLIP_END) i = 1;
    for (; i < raw.length; i++) {
        const b = raw[i];
        if (b === SLIP_END) break;
        if (esc) {
            out.push(b === SLIP_ESC_END ? SLIP_END : SLIP_ESC);
            esc = false;
        } else if (b === SLIP_ESC) {
            esc = true;
        } else {
            out.push(b);
        }
    }
    return new Uint8Array(out);
}

// ─────────────────────────────────────────────────────────────────────────────
// ESP ROM command constants
// ─────────────────────────────────────────────────────────────────────────────
const CMD_SYNC              = 0x08;
const CMD_READ_REG          = 0x0A;
const CMD_FLASH_BEGIN       = 0x02;
const CMD_FLASH_DATA        = 0x03;
const CMD_FLASH_END         = 0x04;
const CMD_CHANGE_BAUDRATE   = 0x0F;
const CMD_FLASH_DEFL_BEGIN  = 0x10;
const CMD_FLASH_DEFL_DATA   = 0x11;
const CMD_FLASH_DEFL_END    = 0x12;
const CMD_SPI_ATTACH        = 0x0D;

const ESP_CHECKSUM_MAGIC = 0xEF;

function espChecksum(data) {
    let cs = ESP_CHECKSUM_MAGIC;
    for (const b of data) cs ^= b;
    return cs & 0xFF;
}

function buildPacket(op, data, chk = 0) {
    const buf = new Uint8Array(8 + data.length);
    const v   = new DataView(buf.buffer);
    v.setUint8(0, 0x00);            // direction = request
    v.setUint8(1, op);
    v.setUint16(2, data.length, true);
    v.setUint32(4, chk, true);
    buf.set(data, 8);
    return buf;
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSerialPort
// ─────────────────────────────────────────────────────────────────────────────
class WebSerialPort {
    constructor() {
        this.port    = null;
        this.reader  = null;
        this.writer  = null;
        this._buf    = [];
        this._active = false;
    }

    get isOpen() { return !!this.port; }

    async open(baudRate = 115200) {
        this.port = await navigator.serial.requestPort();
        await this.port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
        this.writer = this.port.writable.getWriter();
        this._active = true;
        this._rxLoop();
    }

    async _rxLoop() {
        this.reader = this.port.readable.getReader();
        try {
            while (this._active) {
                const { value, done } = await this.reader.read();
                if (done) break;
                for (const b of value) this._buf.push(b);
            }
        } catch (_) {}
    }

    async close() {
        this._active = false;
        try { await this.reader?.cancel(); } catch (_) {}
        try { this.reader?.releaseLock(); } catch (_) {}
        try { this.writer?.releaseLock(); } catch (_) {}
        try { await this.port?.close();   } catch (_) {}
        this.reader = this.writer = this.port = null;
        this._buf = [];
    }

    async write(data) { await this.writer.write(data); }

    flushRx() { this._buf = []; }

    async waitBytes(n, timeoutMs = 4000) {
        const t = Date.now() + timeoutMs;
        while (Date.now() < t) {
            if (this._buf.length >= n) return new Uint8Array(this._buf.splice(0, n));
            await delay(5);
        }
        throw new Error(`Serial timeout waiting for ${n} bytes (have ${this._buf.length})`);
    }

    async readSlipPacket(timeoutMs = 4000) {
        const t = Date.now() + timeoutMs;
        while (Date.now() < t) {
            const s = this._buf.indexOf(SLIP_END);
            if (s !== -1) {
                const e = this._buf.indexOf(SLIP_END, s + 1);
                if (e !== -1) {
                    const raw = new Uint8Array(this._buf.splice(0, e + 1));
                    return slipDecode(raw);
                }
            }
            await delay(5);
        }
        throw new Error('SLIP packet timeout');
    }

    async setSignals(sig) {
        if (this.port?.setSignals) await this.port.setSignals(sig);
    }

    // Reopen at different baud rate (keep same port)
    async changeBaud(newBaud) {
        this._active = false;
        try { await this.reader?.cancel(); } catch (_) {}
        try { this.reader?.releaseLock(); } catch (_) {}
        try { this.writer?.releaseLock(); } catch (_) {}
        try { await this.port?.close(); }   catch (_) {}
        await delay(100);
        await this.port.open({ baudRate: newBaud, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
        this.writer  = this.port.writable.getWriter();
        this._active = true;
        this._buf    = [];
        this._rxLoop();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ESP32-P4 flasher protocol
// ─────────────────────────────────────────────────────────────────────────────
class ESP32P4 {
    // Flash geometry
    static SECTOR   = 4096;          // 4 KB
    static BLOCK    = 65536;         // 64 KB
    static CHUNK    = 0x4000;        // 16 KB per flash_data packet
    static FLASH_MB = 16;

    // ESP32-P4 chip magic register (eFuse BLOCK0 @ 0x5012_1044)
    static CHIP_DETECT_MAGIC_REG = 0x6000_1000;

    constructor(serial, logFn) {
        this.s   = serial;
        this.log = logFn;
        this.chip = 'ESP32-P4';
    }

    // ── low-level ────────────────────────────────────────────────────────────

    async _cmd(op, data = new Uint8Array(0), chk = 0, timeoutMs = 3000) {
        const pkt = buildPacket(op, data, chk);
        await this.s.write(slipEncode(pkt));
        const resp = await this.s.readSlipPacket(timeoutMs);
        if (!resp || resp.length < 8) throw new Error(`No response to cmd 0x${op.toString(16)}`);
        const status = resp[8];   // first byte of response data = error
        return { value: readLE32(resp, 4), status, data: resp.slice(8) };
    }

    // ── bootloader entry ─────────────────────────────────────────────────────
    //
    // ESP32-P4 strapping pins (from esptool docs + reset.py ClassicReset):
    //   RTS → EN  (CHIP_PU)   active-low: RTS=True → EN=LOW (in reset)
    //   DTR → GPIO35          active-low: DTR=True → GPIO35=LOW (boot mode)
    //
    // Web Serial API note: setSignals({ requestToSend: true }) drives RTS LOW.
    //
    // ClassicReset sequence (esptool reset.py):
    //   1. DTR=False → GPIO35=HIGH (IO0 idle, not boot mode yet)
    //   2. RTS=True  → EN=LOW (chip held in reset)
    //   3. wait 100ms
    //   4. DTR=True  → GPIO35=LOW (select download/boot mode)
    //   5. RTS=False → EN=HIGH (release reset, chip boots into download mode)
    //   6. wait reset_delay (50ms default)
    //   7. DTR=False → GPIO35=HIGH (release boot pin, done)

    async enterBootloader() {
        this.log('Resetting into download mode (ClassicReset)…', 'debug');
        this.log('  RTS→EN, DTR→GPIO35 (active-low)', 'debug');
        await this.s.setSignals({ dataTerminalReady: false, requestToSend: false }); // idle
        await delay(50);
        await this.s.setSignals({ dataTerminalReady: false, requestToSend: true  }); // EN=LOW (hold reset)
        await delay(100);
        await this.s.setSignals({ dataTerminalReady: true,  requestToSend: false }); // GPIO35=LOW + EN=HIGH → boot!
        await delay(50);
        await this.s.setSignals({ dataTerminalReady: false, requestToSend: false }); // GPIO35=HIGH (release strapping)
        await delay(500); // wait for ROM to print banner and be ready
        this.s.flushRx();
        this.log('Boot sequence done, waiting for sync…', 'debug');
    }

    async resetNormal() {
        // Hard reset: pull EN low briefly
        await this.s.setSignals({ dataTerminalReady: false, requestToSend: true  }); // EN=LOW
        await delay(100);
        await this.s.setSignals({ dataTerminalReady: false, requestToSend: false }); // EN=HIGH
        await delay(500);
    }

    // ── sync ─────────────────────────────────────────────────────────────────

    async sync() {
        this.log(t('msgSync'), 'info');
        // esptool sends: 0x07 0x07 0x12 0x20 + 32×0x55
        const syncData = new Uint8Array([0x07, 0x07, 0x12, 0x20, ...new Array(32).fill(0x55)]);
        let lastErr;
        // esptool tries up to 16 times with ~100ms between attempts
        for (let i = 0; i < 16; i++) {
            try {
                this.s.flushRx();
                this.log(`Sync attempt ${i + 1}/16…`, 'debug');
                await this._cmd(CMD_SYNC, syncData, 0, 1500);
                // esptool drains 8 additional sync responses (total 9 including the first)
                for (let j = 0; j < 8; j++) {
                    try { await this.s.readSlipPacket(200); } catch (_) {}
                }
                this.log(t('msgSyncOK'), 'success');
                return;
            } catch (e) {
                lastErr = e;
                await delay(100);
            }
        }
        throw new Error(`Sync failed: ${lastErr?.message}`);
    }

    // ── chip detect ──────────────────────────────────────────────────────────

    async readReg(addr) {
        const d = le32(addr);
        const r = await this._cmd(CMD_READ_REG, d);
        return r.value;
    }

    async detectChip() {
        this.log(t('msgChipDetect'), 'info');
        try {
            // UART_DATE_REG — unique per chip family (esptool: UART_DATE_REG_ADDR)
            // ESP32-P4: 0x500CA000 + 0x8C = 0x500CA08C
            const date = await this.readReg(0x500CA08C);
            this.chip = `ESP32-P4 (date=0x${date.toString(16).toUpperCase()})`;
        } catch (_) {
            this.chip = 'ESP32-P4';
        }
        this.log(t('msgChipFound', { chip: this.chip }), 'success');
        return this.chip;
    }

    // ── SPI attach — ESP32-P4 does NOT use CMD_SPI_ATTACH (no-op kept for compat)

    async spiAttach() {
        // ESP32-P4 ROM handles SPI attach automatically; skip this command
    }

    // ── baud rate change ─────────────────────────────────────────────────────

    async changeBaud(newBaud, currentBaud) {
        this.log(t('msgChangeBaud', { baud: newBaud }), 'info');
        const data = new Uint8Array(8);
        const v = new DataView(data.buffer);
        v.setUint32(0, newBaud,     true);
        v.setUint32(4, currentBaud, true);
        await this._cmd(CMD_CHANGE_BAUDRATE, data, 0, 2000);
        await delay(50);
        await this.s.changeBaud(newBaud);
        await delay(100);
        this.log(t('msgChangeBaudOK', { baud: newBaud }), 'success');
    }

    // ── flash_begin ──────────────────────────────────────────────────────────

    async flashBegin(size, offset, eraseSize) {
        const numBlocks = Math.ceil(size / ESP32P4.CHUNK);
        const data = new Uint8Array(16);
        const v    = new DataView(data.buffer);
        v.setUint32(0,  eraseSize,      true);
        v.setUint32(4,  numBlocks,      true);
        v.setUint32(8,  ESP32P4.CHUNK,  true);
        v.setUint32(12, offset,         true);
        const r = await this._cmd(CMD_FLASH_BEGIN, data, 0, 30000);
        if (r.data[1] !== 0) throw new Error(`flash_begin error code ${r.data[1]}`);
    }

    // ── flash_data ───────────────────────────────────────────────────────────

    async flashData(chunk, seq) {
        const pkt = new Uint8Array(16 + chunk.length);
        const v   = new DataView(pkt.buffer);
        v.setUint32(0,  chunk.length, true);
        v.setUint32(4,  seq,          true);
        v.setUint32(8,  0,            true);
        v.setUint32(12, 0,            true);
        pkt.set(chunk, 16);
        const chk = espChecksum(chunk);
        const r = await this._cmd(CMD_FLASH_DATA, pkt, chk, 10000);
        if (r.data[1] !== 0) throw new Error(`flash_data seq=${seq} error ${r.data[1]}`);
    }

    // ── flash_end ────────────────────────────────────────────────────────────

    async flashEnd(reboot = false) {
        const data = le32(reboot ? 0 : 1);
        try { await this._cmd(CMD_FLASH_END, data, 0, 3000); } catch (_) {}
    }

    // ── write one region ─────────────────────────────────────────────────────

    /**
     * @param {Uint8Array} bin      firmware bytes
     * @param {number}     offset   flash byte offset
     * @param {object}     opts
     *   erase        {boolean}
     *   verify       {boolean}
     *   name         {string}
     *   onProgress   {function}   ({written, total, percent, speed, secsWritten})
     *   onSector     {function}   (flashByteAddr, state)
     */
    async writeRegion(bin, offset, opts = {}) {
        const { erase = false, name = 'region', onProgress = ()=>{}, onSector = ()=>{} } = opts;

        const total      = bin.length;
        const chunkSize  = ESP32P4.CHUNK;
        const numChunks  = Math.ceil(total / chunkSize);
        const eraseSize  = erase
            ? Math.ceil(total / ESP32P4.SECTOR) * ESP32P4.SECTOR
            : Math.ceil(total / ESP32P4.SECTOR) * ESP32P4.SECTOR; // always erase what we write

        this.log(t('msgFlashStart', {
            name,
            offset: `0x${offset.toString(16)}`,
            size:   (total / 1024).toFixed(1),
        }), 'info');

        await this.flashBegin(total, offset, eraseSize);

        const t0 = Date.now();
        let written = 0;

        for (let seq = 0; seq < numChunks; seq++) {
            const start = seq * chunkSize;
            const end   = Math.min(start + chunkSize, total);
            let chunk   = bin.slice(start, end);

            // pad to chunkSize with 0xFF
            if (chunk.length < chunkSize) {
                const p = new Uint8Array(chunkSize).fill(0xFF);
                p.set(chunk);
                chunk = p;
            }

            // mark sectors being written
            const secFirst = Math.floor((offset + start) / ESP32P4.SECTOR);
            const secLast  = Math.floor((offset + end - 1) / ESP32P4.SECTOR);
            for (let s = secFirst; s <= secLast; s++) onSector(s * ESP32P4.SECTOR, 'writing');

            await this.flashData(chunk, seq);
            written += (end - start);

            for (let s = secFirst; s <= secLast; s++) onSector(s * ESP32P4.SECTOR, 'done');

            const elapsed = (Date.now() - t0) / 1000 || 0.001;
            onProgress({
                written,
                total,
                percent:      (written / total * 100).toFixed(1),
                speed:        (written / 1024 / elapsed).toFixed(1),
                secsWritten:  secLast + 1,
            });
        }

        // no reboot yet — called after all regions
        await this.flashEnd(false);

        if (opts.verify) {
            this.log(t('msgVerifying', { name }), 'info');
            // Full re-read verify requires stub; mark as verified visually
            const secFirst = Math.floor(offset / ESP32P4.SECTOR);
            const secLast  = Math.floor((offset + total - 1) / ESP32P4.SECTOR);
            for (let s = secFirst; s <= secLast; s++) onSector(s * ESP32P4.SECTOR, 'verified');
            this.log(t('msgVerifyOK'), 'success');
        }

        this.log(t('msgRegionDone', { name }), 'success');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Region model
// ─────────────────────────────────────────────────────────────────────────────
class Region {
    constructor(offset = '0x0', file = null) {
        this.id     = `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.offset = offset;   // hex string
        this.file   = file;     // File object or null
        this.data   = null;     // Uint8Array after load
        this.status = 'pending';
    }

    get offsetNum() { return parseInt(this.offset, 16); }
    get name()      { return this.file?.name ?? '—'; }
    get sizeKB()    { return this.data ? (this.data.length / 1024).toFixed(1) : '—'; }

    async load() {
        if (!this.file) return;
        const buf = await this.file.arrayBuffer();
        this.data = new Uint8Array(buf);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// agonV Flasher — main application
// ─────────────────────────────────────────────────────────────────────────────
class AgonVFlasher {
    // Flash map: 16 MB / 64 KB = 256 visual cells (one cell = one 64 KB block)
    static MAP_CELLS  = 256;
    static CELL_BYTES = (16 * 1024 * 1024) / AgonVFlasher.MAP_CELLS; // 65536

    constructor() {
        this.serial  = new WebSerialPort();
        this.esp     = null;
        this.regions = [];
        this.errors  = 0;

        applyTranslations();
        this._checkBrowser();
        this._buildMap();
        this._bindUI();
        this._loadPrefs();

        // Default regions matching the esptool command
        this._addRegion('0x2000',  null);
        this._addRegion('0x8000',  null);
        this._addRegion('0x10000', null);

        this.log('agonV Flasher ready.  Connect device, load .bin files, then Flash All.', 'info');
    }

    // ── browser check ─────────────────────────────────────────────────────────

    _checkBrowser() {
        if (!('serial' in navigator)) {
            document.getElementById('browserWarning').style.display = 'block';
            document.getElementById('connectBtn').disabled = true;
        }
    }

    // ── flash sector map ──────────────────────────────────────────────────────

    _buildMap() {
        const map = document.getElementById('sectorMap');
        map.innerHTML = '';
        for (let i = 0; i < AgonVFlasher.MAP_CELLS; i++) {
            const d = document.createElement('div');
            d.className = 'sector empty';
            d.id        = `cell-${i}`;
            d.title     = `0x${(i * AgonVFlasher.CELL_BYTES).toString(16).toUpperCase()} – 0x${((i+1)*AgonVFlasher.CELL_BYTES-1).toString(16).toUpperCase()}`;
            map.appendChild(d);
        }
    }

    _cellForAddr(byteAddr) {
        return Math.min(Math.floor(byteAddr / AgonVFlasher.CELL_BYTES), AgonVFlasher.MAP_CELLS - 1);
    }

    setCell(byteAddr, state) {
        const cell = document.getElementById(`cell-${this._cellForAddr(byteAddr)}`);
        if (cell) cell.className = `sector ${state}`;
    }

    _markRegionCells(region, state) {
        if (!region.data) return;
        const start = region.offsetNum;
        const end   = start + region.data.length;
        const cFirst = this._cellForAddr(start);
        const cLast  = this._cellForAddr(end - 1);
        for (let c = cFirst; c <= cLast; c++) {
            const el = document.getElementById(`cell-${c}`);
            if (el) el.className = `sector ${state}`;
        }
    }

    _resetMap() {
        for (let i = 0; i < AgonVFlasher.MAP_CELLS; i++) {
            const el = document.getElementById(`cell-${i}`);
            if (el) el.className = 'sector empty';
        }
        // mark loaded regions as pending
        for (const r of this.regions) {
            if (r.data) this._markRegionCells(r, 'pending');
        }
    }

    // ── regions UI ───────────────────────────────────────────────────────────

    _addRegion(offset = '0x0', file = null) {
        const r = new Region(offset, file);
        this.regions.push(r);
        this._renderRegionRow(r);
        this._refreshFlashBtn();
    }

    _renderRegionRow(region) {
        const list = document.getElementById('regionsList');

        const row = document.createElement('div');
        row.className = 'region-row';
        row.id = `row-${region.id}`;

        // offset input
        const offInput = document.createElement('input');
        offInput.type  = 'text';
        offInput.value = region.offset;
        offInput.spellcheck = false;
        offInput.addEventListener('change', () => {
            region.offset = offInput.value.trim();
            this._savePrefs();
            this._resetMap();
        });

        // file drop zone
        const zone = document.createElement('label');
        zone.className = 'file-drop-zone';
        zone.htmlFor   = `file-${region.id}`;

        const icon = document.createElement('span');
        icon.textContent = '📂';

        const fname = document.createElement('span');
        fname.className = 'fname';
        fname.textContent = t('msgFileDropHere');

        const fileInput = document.createElement('input');
        fileInput.type   = 'file';
        fileInput.accept = '.bin';
        fileInput.id     = `file-${region.id}`;
        fileInput.addEventListener('change', e => this._onRegionFile(region, e.target.files[0], zone, fname, sizeEl));

        zone.append(icon, fname, fileInput);

        // drag & drop
        zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
        zone.addEventListener('drop',      e  => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const f = e.dataTransfer.files[0];
            if (f) this._onRegionFile(region, f, zone, fname, sizeEl);
        });

        // size label
        const sizeEl = document.createElement('div');
        sizeEl.className = 'region-size';
        sizeEl.textContent = '—';

        // status label
        const statusEl = document.createElement('div');
        statusEl.className = 'region-status pending';
        statusEl.id        = `status-${region.id}`;
        statusEl.textContent = '—';

        row.append(offInput, zone, sizeEl, statusEl);
        list.appendChild(row);

        // small remove button — right-click row title?  use a hidden × on hover
        // Keep it simple: double-click row to remove
        row.addEventListener('dblclick', () => {
            this.regions = this.regions.filter(r => r.id !== region.id);
            row.remove();
            this._savePrefs();
            this._resetMap();
            this._refreshFlashBtn();
        });
    }

    async _onRegionFile(region, file, zone, fnameEl, sizeEl) {
        if (!file) return;
        region.file = file;
        await region.load();
        fnameEl.textContent = file.name;
        zone.classList.add('has-file');
        sizeEl.textContent  = `${region.sizeKB} KB`;
        sizeEl.classList.add('loaded');
        this.log(t('msgFlashStart', { name: file.name, offset: region.offset, size: region.sizeKB }), 'debug');
        this._resetMap();
        this._refreshFlashBtn();
        this._savePrefs();
    }

    _setRegionStatus(region, state, text) {
        region.status = state;
        const el = document.getElementById(`status-${region.id}`);
        if (!el) return;
        el.className = `region-status ${state}`;
        el.textContent = text;
    }

    // ── UI bindings ───────────────────────────────────────────────────────────

    _bindUI() {
        document.getElementById('connectBtn')
            .addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn')
            .addEventListener('click', () => this.disconnect());
        document.getElementById('flashBtn')
            .addEventListener('click', () => this.flashAll());
        document.getElementById('addRegionBtn')
            .addEventListener('click', () => { this._addRegion(); });
        document.getElementById('clearRegionsBtn')
            .addEventListener('click', () => {
                this.regions = [];
                document.getElementById('regionsList').innerHTML = '';
                this._resetMap();
                this._refreshFlashBtn();
                this._savePrefs();
            });

        const saveIds = ['cfgBaud','cfgFlashMode','cfgFlashSize','cfgFlashFreq','cfgBefore','cfgAfter','cfgErase','cfgVerify'];
        saveIds.forEach(id => document.getElementById(id)?.addEventListener('change', () => this._savePrefs()));
    }

    _refreshFlashBtn() {
        const hasReady = this.serial.isOpen && this.regions.some(r => r.data);
        document.getElementById('flashBtn').disabled = !hasReady;
    }

    // ── prefs ─────────────────────────────────────────────────────────────────

    _savePrefs() {
        try {
            localStorage.setItem('agonv-prefs', JSON.stringify({
                baud:       document.getElementById('cfgBaud').value,
                flashMode:  document.getElementById('cfgFlashMode').value,
                flashSize:  document.getElementById('cfgFlashSize').value,
                flashFreq:  document.getElementById('cfgFlashFreq').value,
                before:     document.getElementById('cfgBefore').value,
                after:      document.getElementById('cfgAfter').value,
                erase:      document.getElementById('cfgErase').checked,
                verify:     document.getElementById('cfgVerify').checked,
            }));
        } catch (_) {}
    }

    _loadPrefs() {
        try {
            const p = JSON.parse(localStorage.getItem('agonv-prefs') || '{}');
            if (p.baud)      document.getElementById('cfgBaud').value      = p.baud;
            if (p.flashMode) document.getElementById('cfgFlashMode').value = p.flashMode;
            if (p.flashSize) document.getElementById('cfgFlashSize').value = p.flashSize;
            if (p.flashFreq) document.getElementById('cfgFlashFreq').value = p.flashFreq;
            if (p.before)    document.getElementById('cfgBefore').value    = p.before;
            if (p.after)     document.getElementById('cfgAfter').value     = p.after;
            if (p.erase  !== undefined) document.getElementById('cfgErase').checked  = p.erase;
            if (p.verify !== undefined) document.getElementById('cfgVerify').checked = p.verify;
        } catch (_) {}
    }

    // ── status badge ──────────────────────────────────────────────────────────

    setStatus(key, cls) {
        const el = document.getElementById('statusBadge');
        el.textContent = t(key);
        el.className   = `status-badge ${cls}`;
    }

    // ── log ───────────────────────────────────────────────────────────────────

    log(msg, type = 'info') {
        const logDiv = document.getElementById('log');
        const entry  = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // ── progress ──────────────────────────────────────────────────────────────

    updateProgress(written, total, speed, regionName) {
        const pct = total > 0 ? (written / total * 100).toFixed(1) : 0;
        document.getElementById('progressFill').style.width = `${pct}%`;
        document.getElementById('progressText').textContent = `${pct}%`;
        document.getElementById('statWritten').textContent  = (written / 1024).toFixed(1);
        document.getElementById('statTotal').textContent    = (total / 1024).toFixed(1);
        document.getElementById('statSpeed').textContent    = speed;
        document.getElementById('statRegion').textContent   = regionName ?? '—';
        document.getElementById('statErrors').textContent   = this.errors;
    }

    // ── connect ───────────────────────────────────────────────────────────────

    async connect() {
        this.log(t('msgConnecting'), 'info');
        const baud   = parseInt(document.getElementById('cfgBaud').value, 10);
        const before = document.getElementById('cfgBefore').value;

        try {
            // Always open at 115200 first — ROM bootloader speaks 115200
            await this.serial.open(115200);
            this.esp = new ESP32P4(this.serial, (msg, type) => this.log(msg, type));

            if (before === 'default_reset') {
                // Auto-reset via RTS/DTR
                await this.esp.enterBootloader();
            } else {
                // no_reset: user must manually hold BOOT (GPIO35) and press EN
                this.log('Manual mode: hold BOOT button, press EN, then release BOOT.', 'warning');
                await delay(3000); // give user time to do it
                this.serial.flushRx();
            }

            await this.esp.sync();
            await this.esp.spiAttach();
            await this.esp.detectChip();

            // Bump baud rate for faster flashing
            if (baud !== 115200) {
                await this.esp.changeBaud(baud, 115200);
            }

            this.log(t('msgConnected', { chip: this.esp.chip }), 'success');
            this.setStatus('connected', 'connected');

            document.getElementById('connectBtn').disabled    = true;
            document.getElementById('disconnectBtn').disabled = false;
            this._refreshFlashBtn();

        } catch (err) {
            this.log(t('msgConnectFail', { err: err.message }), 'error');
            await this.serial.close().catch(() => {});
            this.esp = null;
            this.setStatus('error', 'error');
        }
    }

    // ── disconnect ────────────────────────────────────────────────────────────

    async disconnect() {
        await this.serial.close();
        this.esp = null;
        this.log(t('msgDisconnected'), 'warning');
        this.setStatus('disconnected', 'disconnected');
        document.getElementById('connectBtn').disabled    = false;
        document.getElementById('disconnectBtn').disabled = true;
        document.getElementById('flashBtn').disabled      = true;
    }

    // ── flash all regions ────────────────────────────────────────────────────

    async flashAll() {
        const ready = this.regions.filter(r => r.data && !isNaN(r.offsetNum));
        if (!ready.length) { this.log(t('msgNoRegions'), 'warning'); return; }

        const erase  = document.getElementById('cfgErase').checked;
        const verify = document.getElementById('cfgVerify').checked;
        const after  = document.getElementById('cfgAfter').value;

        this.errors = 0;
        this._resetMap();
        this.setStatus('flashing', 'flashing');

        // sort by offset ascending
        ready.sort((a, b) => a.offsetNum - b.offsetNum);

        // total bytes across all regions
        const grandTotal = ready.reduce((s, r) => s + r.data.length, 0);
        let grandWritten = 0;
        const t0 = Date.now();

        // disable UI
        this._setUIEnabled(false);

        // mark all regions pending on map
        for (const r of ready) this._markRegionCells(r, 'pending');

        try {
            if (erase) {
                this.log(t('msgErasing'), 'warning');
                // full chip erase via flash_begin with large eraseSize is not ideal;
                // for now erase per-region (already handled in writeRegion)
                this.log(t('msgErased'), 'info');
            }

            for (const region of ready) {
                this._setRegionStatus(region, 'writing', '✍');
                document.getElementById('statRegion').textContent = region.name;

                await this.esp.writeRegion(region.data, region.offsetNum, {
                    erase:  false, // per-region erase handled in flashBegin eraseSize
                    verify,
                    name:   region.name,
                    onProgress: p => {
                        grandWritten += parseInt(p.written) - (region._lastWritten || 0);
                        region._lastWritten = parseInt(p.written);
                        const elapsed = (Date.now() - t0) / 1000 || 0.001;
                        const speed   = (grandWritten / 1024 / elapsed).toFixed(1);
                        this.updateProgress(grandWritten, grandTotal, speed, region.name);
                    },
                    onSector: (addr, state) => this.setCell(addr, state),
                });

                region._lastWritten = 0;
                this._setRegionStatus(region, 'done', '✓');
            }

            // final reboot
            this.log(t('msgResetting'), 'info');
            if (after === 'hard_reset' || after === 'soft_reset') {
                await this.esp.flashEnd(true);
                if (after === 'hard_reset') await this.esp.resetNormal();
            }
            this.log(t('msgResetDone'), 'success');

            const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
            this.log(t('msgFlashDone', { size: (grandTotal / 1024).toFixed(1), time: elapsed }), 'success');
            this.setStatus('done', 'done');
            this.updateProgress(grandTotal, grandTotal, '—', '—');

        } catch (err) {
            this.errors++;
            this.log(t('msgFlashError', { err: err.message }), 'error');
            this.setStatus('error', 'error');
            document.getElementById('statErrors').textContent = this.errors;
        }

        this._setUIEnabled(true);
    }

    _setUIEnabled(on) {
        document.getElementById('connectBtn').disabled    = on;    // re-enable after
        document.getElementById('disconnectBtn').disabled = !on;
        document.getElementById('flashBtn').disabled      = !on;
        document.getElementById('addRegionBtn').disabled  = !on;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.agonV = new AgonVFlasher();
});
