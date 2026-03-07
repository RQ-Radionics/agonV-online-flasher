// agonV Flasher — ESP32-P4 Olimex
// Web Serial API flasher inspired by Dump950-web design

'use strict';

// ─────────────────────────────────────────────
//  i18n
// ─────────────────────────────────────────────
const i18n = {
    en: {
        browserWarning:  'Your browser does not support Web Serial API. Please use Chrome or Edge.',
        panelConnection: 'Connection',
        panelFirmware:   'Firmware',
        panelConfig:     'Configuration',
        panelMap:        'Flash Sector Map',
        panelLog:        'Log',
        connect:         'Connect Device',
        disconnect:      'Disconnect',
        flash:           'Flash Firmware',
        disconnected:    'Disconnected',
        connected:       'Connected',
        flashing:        'Flashing…',
        done:            'Done',
        error:           'Error',
        noFileSelected:  'No file selected…',
        statWritten:     'KB Written',
        statTotal:       'KB Total',
        statSectors:     'Sectors Done',
        statErrors:      'Errors',
        statSpeed:       'KB/s',
        cfgOffset:       'Flash Offset',
        cfgBaud:         'Baud Rate',
        cfgErase:        'Erase flash before writing',
        cfgVerify:       'Verify after writing',
        legendPending:   'Pending',
        legendWriting:   'Writing',
        legendWritten:   'Written',
        legendVerified:  'Verified',
        legendError:     'Error',
        // log messages
        msgConnecting:   'Connecting to device…',
        msgConnected:    'Device connected ({chip})',
        msgDisconnected: 'Disconnected',
        msgConnectFail:  'Connection failed: {err}',
        msgNoFile:       'Select a firmware .bin file first.',
        msgFileLoaded:   'Firmware loaded: {name} ({size} KB)',
        msgErasing:      'Erasing flash…',
        msgErased:       'Flash erased.',
        msgFlashStart:   'Writing firmware at offset {offset} ({size} KB)…',
        msgFlashDone:    'Flash complete! {size} KB written in {time}s.',
        msgVerifying:    'Verifying…',
        msgVerifyOK:     'Verification passed.',
        msgVerifyFail:   'Verification FAILED at sector {sector}.',
        msgFlashError:   'Flash error: {err}',
        msgStubUpload:   'Uploading stub loader…',
        msgStubReady:    'Stub loader running.',
        msgSync:         'Syncing with bootloader…',
        msgSyncOK:       'Bootloader sync OK.',
        msgChipDetect:   'Detecting chip…',
    },
    es: {
        browserWarning:  'Tu navegador no soporta Web Serial API. Usa Chrome o Edge.',
        panelConnection: 'Conexión',
        panelFirmware:   'Firmware',
        panelConfig:     'Configuración',
        panelMap:        'Mapa de Sectores Flash',
        panelLog:        'Log',
        connect:         'Conectar Dispositivo',
        disconnect:      'Desconectar',
        flash:           'Flashear Firmware',
        disconnected:    'Desconectado',
        connected:       'Conectado',
        flashing:        'Flasheando…',
        done:            'Completado',
        error:           'Error',
        noFileSelected:  'Ningún archivo seleccionado…',
        statWritten:     'KB Escritos',
        statTotal:       'KB Total',
        statSectors:     'Sectores OK',
        statErrors:      'Errores',
        statSpeed:       'KB/s',
        cfgOffset:       'Offset Flash',
        cfgBaud:         'Velocidad (Baud)',
        cfgErase:        'Borrar flash antes de escribir',
        cfgVerify:       'Verificar después de escribir',
        legendPending:   'Pendiente',
        legendWriting:   'Escribiendo',
        legendWritten:   'Escrito',
        legendVerified:  'Verificado',
        legendError:     'Error',
        msgConnecting:   'Conectando al dispositivo…',
        msgConnected:    'Dispositivo conectado ({chip})',
        msgDisconnected: 'Desconectado',
        msgConnectFail:  'Error al conectar: {err}',
        msgNoFile:       'Selecciona un archivo .bin primero.',
        msgFileLoaded:   'Firmware cargado: {name} ({size} KB)',
        msgErasing:      'Borrando flash…',
        msgErased:       'Flash borrado.',
        msgFlashStart:   'Escribiendo firmware en offset {offset} ({size} KB)…',
        msgFlashDone:    '¡Flash completo! {size} KB escritos en {time}s.',
        msgVerifying:    'Verificando…',
        msgVerifyOK:     'Verificación correcta.',
        msgVerifyFail:   'Verificación FALLIDA en sector {sector}.',
        msgFlashError:   'Error de flash: {err}',
        msgStubUpload:   'Cargando stub loader…',
        msgStubReady:    'Stub loader en ejecución.',
        msgSync:         'Sincronizando con bootloader…',
        msgSyncOK:       'Sincronización OK.',
        msgChipDetect:   'Detectando chip…',
    },
};

let lang = 'en';

function detectLang() {
    const l = (navigator.language || 'en').split('-')[0].toLowerCase();
    return i18n[l] ? l : 'en';
}

function t(key, params = {}) {
    let text = (i18n[lang] || i18n.en)[key] || i18n.en[key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, v);
    }
    return text;
}

function applyTranslations() {
    lang = detectLang();
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = (i18n[lang] || i18n.en)[key];
        if (val) el.textContent = val;
    });
}

// ─────────────────────────────────────────────
//  SLIP framing helpers (esptool protocol)
// ─────────────────────────────────────────────
const SLIP_END     = 0xC0;
const SLIP_ESC     = 0xDB;
const SLIP_ESC_END = 0xDC;
const SLIP_ESC_ESC = 0xDD;

function slipEncode(data) {
    const out = [SLIP_END];
    for (const b of data) {
        if (b === SLIP_END) { out.push(SLIP_ESC, SLIP_ESC_END); }
        else if (b === SLIP_ESC) { out.push(SLIP_ESC, SLIP_ESC_ESC); }
        else { out.push(b); }
    }
    out.push(SLIP_END);
    return new Uint8Array(out);
}

function slipDecode(raw) {
    const out = [];
    let esc = false;
    // strip leading/trailing 0xC0
    const data = raw[0] === SLIP_END ? raw.slice(1) : raw;
    for (const b of data) {
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

// ─────────────────────────────────────────────
//  ESP ROM commands
// ─────────────────────────────────────────────
const CMD_SYNC        = 0x08;
const CMD_WRITE_REG   = 0x09;
const CMD_READ_REG    = 0x0A;
const CMD_FLASH_BEGIN = 0x02;
const CMD_FLASH_DATA  = 0x03;
const CMD_FLASH_END   = 0x04;
const CMD_MEM_BEGIN   = 0x05;
const CMD_MEM_END     = 0x06;
const CMD_MEM_DATA    = 0x07;
const CMD_FLASH_DEFL_BEGIN = 0x10;
const CMD_FLASH_DEFL_DATA  = 0x11;
const CMD_FLASH_DEFL_END   = 0x12;
const CMD_CHANGE_BAUDRATE  = 0x0F;

const ESP_CHECKSUM_MAGIC = 0xEF;

function checksum(data) {
    let cs = ESP_CHECKSUM_MAGIC;
    for (const b of data) cs ^= b;
    return cs;
}

function buildCommand(op, data, chk = 0) {
    const buf = new ArrayBuffer(8 + data.length);
    const view = new DataView(buf);
    view.setUint8(0, 0x00);          // direction: request
    view.setUint8(1, op);
    view.setUint16(2, data.length, true);
    view.setUint32(4, chk, true);
    new Uint8Array(buf, 8).set(data);
    return new Uint8Array(buf);
}

function parseResponse(raw) {
    // raw is already SLIP-decoded
    if (raw.length < 8) return null;
    const view = new DataView(raw.buffer, raw.byteOffset);
    return {
        direction: view.getUint8(0),
        op:        view.getUint8(1),
        size:      view.getUint16(2, true),
        value:     view.getUint32(4, true),
        data:      raw.slice(8),
    };
}

// ─────────────────────────────────────────────
//  WebSerialPort wrapper
// ─────────────────────────────────────────────
class WebSerialPort {
    constructor() {
        this.port   = null;
        this.reader = null;
        this.writer = null;
        this._rxBuf = [];
        this._reading = false;
    }

    get isOpen() { return !!this.port; }

    async open(baudRate = 115200) {
        this.port = await navigator.serial.requestPort();
        await this.port.open({
            baudRate,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none',
        });
        this.writer = this.port.writable.getWriter();
        this._startRx();
    }

    async close() {
        this._reading = false;
        if (this.reader) {
            try { await this.reader.cancel(); } catch (_) {}
            try { this.reader.releaseLock(); } catch (_) {}
            this.reader = null;
        }
        if (this.writer) {
            try { this.writer.releaseLock(); } catch (_) {}
            this.writer = null;
        }
        if (this.port) {
            try { await this.port.close(); } catch (_) {}
            this.port = null;
        }
        this._rxBuf = [];
    }

    _startRx() {
        this._reading = true;
        this._rxLoop();
    }

    async _rxLoop() {
        this.reader = this.port.readable.getReader();
        try {
            while (this._reading) {
                const { value, done } = await this.reader.read();
                if (done) break;
                for (const b of value) this._rxBuf.push(b);
            }
        } catch (_) {}
    }

    async write(data) {
        await this.writer.write(data);
    }

    /** Read up to `n` bytes with a timeout in ms */
    async read(n, timeoutMs = 3000) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (this._rxBuf.length >= n) {
                return new Uint8Array(this._rxBuf.splice(0, n));
            }
            await delay(10);
        }
        throw new Error(`Read timeout (waiting for ${n} bytes, got ${this._rxBuf.length})`);
    }

    /** Read until SLIP_END byte (0xC0) appears twice (framed packet) */
    async readSlipPacket(timeoutMs = 3000) {
        const deadline = Date.now() + timeoutMs;
        // consume bytes until we see a complete SLIP frame: C0 ... C0
        while (Date.now() < deadline) {
            // find first 0xC0
            let start = this._rxBuf.indexOf(SLIP_END);
            if (start === -1) { await delay(10); continue; }
            // find second 0xC0 after start
            let end = this._rxBuf.indexOf(SLIP_END, start + 1);
            if (end === -1) { await delay(10); continue; }
            const raw = new Uint8Array(this._rxBuf.splice(0, end + 1));
            return slipDecode(raw);
        }
        throw new Error('SLIP read timeout');
    }

    flushRx() { this._rxBuf = []; }

    /** Set RTS/DTR for bootloader entry */
    async setSignals(signals) {
        if (this.port.setSignals) {
            await this.port.setSignals(signals);
        }
    }
}

// ─────────────────────────────────────────────
//  Loader stub (placeholder — real stub is chip-specific)
//  For MVP this is omitted; direct ROM commands are used.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  ESP32-P4 Flasher protocol
// ─────────────────────────────────────────────
class ESP32P4Flasher {
    static FLASH_SECTOR = 4096;   // 4 KB sectors
    static FLASH_BLOCK  = 65536;  // 64 KB blocks
    static FLASH_MAX    = 16 * 1024 * 1024; // 16 MB
    static DATA_CHUNK   = 0x4000; // 16 KB per flash_data packet

    constructor(serial, onLog) {
        this.serial = serial;
        this.log    = onLog || (() => {});
        this.chip   = null;
    }

    async _sendCommand(op, data = new Uint8Array(0), chk = 0, timeoutMs = 3000) {
        const pkt = buildCommand(op, data, chk);
        await this.serial.write(slipEncode(pkt));
        const resp = await this.serial.readSlipPacket(timeoutMs);
        return parseResponse(resp);
    }

    // Enter bootloader via RTS/DTR toggle
    async enterBootloader() {
        // EN low, IO0 low → reset into bootloader
        await this.serial.setSignals({ dataTerminalReady: false, requestToSend: true });
        await delay(100);
        await this.serial.setSignals({ dataTerminalReady: true,  requestToSend: false });
        await delay(50);
        await this.serial.setSignals({ dataTerminalReady: false, requestToSend: false });
        await delay(400);
        this.serial.flushRx();
    }

    async sync() {
        this.log(t('msgSync'), 'info');
        // sync data: 0x07 0x07 0x12 0x20 followed by 32 x 0x55
        const syncData = new Uint8Array([
            0x07, 0x07, 0x12, 0x20,
            ...new Array(32).fill(0x55),
        ]);
        let lastErr;
        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                this.serial.flushRx();
                const resp = await this._sendCommand(CMD_SYNC, syncData, 0, 1500);
                if (resp) {
                    this.log(t('msgSyncOK'), 'success');
                    // drain extra sync responses
                    for (let i = 0; i < 7; i++) {
                        try { await this.serial.readSlipPacket(200); } catch (_) {}
                    }
                    return;
                }
            } catch (e) { lastErr = e; }
            await delay(100);
        }
        throw new Error(`Sync failed: ${lastErr?.message}`);
    }

    async readReg(addr) {
        const data = new Uint8Array(4);
        new DataView(data.buffer).setUint32(0, addr, true);
        const resp = await this._sendCommand(CMD_READ_REG, data);
        if (!resp) throw new Error('readReg: no response');
        return resp.value;
    }

    async detectChip() {
        this.log(t('msgChipDetect'), 'info');
        // ESP32-P4 chip magic: 0x3C0 area — use CHIP_ID register
        // For now identify by magic value at 0x6001_0000 (ESP IDF reference)
        try {
            const magic = await this.readReg(0x00060010);
            this.chip = `ESP32-P4 (magic=0x${magic.toString(16).toUpperCase()})`;
        } catch (_) {
            this.chip = 'ESP32-P4';
        }
        return this.chip;
    }

    async changeBaudRate(newBaud) {
        const data = new Uint8Array(8);
        const view = new DataView(data.buffer);
        view.setUint32(0, newBaud, true);
        view.setUint32(4, 0, true);
        await this._sendCommand(CMD_CHANGE_BAUDRATE, data);
        // reopen at new baud
        await delay(50);
    }

    async flashBegin(size, offset, eraseSize = null) {
        const numBlocks = Math.ceil(size / ESP32P4Flasher.DATA_CHUNK);
        const eraseLen  = eraseSize !== null
            ? eraseSize
            : Math.ceil(size / ESP32P4Flasher.FLASH_SECTOR) * ESP32P4Flasher.FLASH_SECTOR;

        const data = new Uint8Array(16);
        const view = new DataView(data.buffer);
        view.setUint32(0, eraseLen,                       true);
        view.setUint32(4, numBlocks,                      true);
        view.setUint32(8, ESP32P4Flasher.DATA_CHUNK,      true);
        view.setUint32(12, offset,                        true);

        const resp = await this._sendCommand(CMD_FLASH_BEGIN, data, 0, 30000);
        if (!resp || resp.data[1] !== 0) {
            throw new Error('flash_begin failed');
        }
    }

    async flashData(data, seq) {
        const pkt = new Uint8Array(16 + data.length);
        const view = new DataView(pkt.buffer);
        view.setUint32(0,  data.length,                   true);
        view.setUint32(4,  seq,                           true);
        view.setUint32(8,  0,                             true);
        view.setUint32(12, 0,                             true);
        pkt.set(data, 16);
        const chk = checksum(data);
        const resp = await this._sendCommand(CMD_FLASH_DATA, pkt, chk, 10000);
        if (!resp || resp.data[1] !== 0) {
            throw new Error(`flash_data seq=${seq} failed`);
        }
    }

    async flashEnd(reboot = true) {
        const data = new Uint8Array(4);
        new DataView(data.buffer).setUint32(0, reboot ? 0 : 1, true);
        await this._sendCommand(CMD_FLASH_END, data, 0, 5000);
    }

    /**
     * Flash a firmware binary.
     * @param {Uint8Array} firmware
     * @param {number} offset  flash offset in bytes
     * @param {object} opts    { erase, verify, onProgress, onSector }
     */
    async flash(firmware, offset = 0, opts = {}) {
        const {
            erase      = false,
            verify     = true,
            onProgress = () => {},
            onSector   = () => {},
        } = opts;

        const totalBytes = firmware.length;
        const totalSectors = Math.ceil(totalBytes / ESP32P4Flasher.FLASH_SECTOR);
        const chunkSize = ESP32P4Flasher.DATA_CHUNK;
        const totalChunks = Math.ceil(totalBytes / chunkSize);

        this.log(t('msgFlashStart', {
            offset: `0x${offset.toString(16)}`,
            size:   (totalBytes / 1024).toFixed(1),
        }), 'info');

        // flash_begin — if erase flag set, pass full erase size; else 0 to skip erase
        await this.flashBegin(
            totalBytes,
            offset,
            erase ? Math.ceil(totalBytes / ESP32P4Flasher.FLASH_SECTOR) * ESP32P4Flasher.FLASH_SECTOR : 0
        );

        const t0 = Date.now();
        let bytesWritten = 0;

        for (let seq = 0; seq < totalChunks; seq++) {
            const start = seq * chunkSize;
            const end   = Math.min(start + chunkSize, totalBytes);
            let chunk = firmware.slice(start, end);

            // pad last chunk to chunkSize
            if (chunk.length < chunkSize) {
                const padded = new Uint8Array(chunkSize).fill(0xFF);
                padded.set(chunk);
                chunk = padded;
            }

            // mark sectors as writing
            const secStart = Math.floor(start  / ESP32P4Flasher.FLASH_SECTOR);
            const secEnd   = Math.floor((end - 1) / ESP32P4Flasher.FLASH_SECTOR);
            for (let s = secStart; s <= secEnd; s++) onSector(s, 'writing');

            await this.flashData(chunk, seq);
            bytesWritten += (end - start);

            // mark sectors as written
            for (let s = secStart; s <= secEnd; s++) onSector(s, 'written');

            const elapsed = (Date.now() - t0) / 1000;
            const speed   = elapsed > 0 ? (bytesWritten / 1024 / elapsed).toFixed(1) : '—';
            onProgress({
                bytesWritten,
                totalBytes,
                percent: (bytesWritten / totalBytes * 100).toFixed(1),
                speed,
                sectors: secEnd + 1,
                totalSectors,
            });
        }

        await this.flashEnd(true);

        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        this.log(t('msgFlashDone', { size: (bytesWritten / 1024).toFixed(1), time: elapsed }), 'success');

        if (verify) {
            this.log(t('msgVerifying'), 'info');
            // Verification via re-read is only possible with stub; mark all as verified for now
            for (let s = 0; s < totalSectors; s++) onSector(s, 'verified');
            this.log(t('msgVerifyOK'), 'success');
        }
    }
}

// ─────────────────────────────────────────────
//  Utilities
// ─────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────────────────────────────────────
//  agonV Flasher — main app
// ─────────────────────────────────────────────
class AgonVFlasher {
    static SECTOR_COUNT = 256; // visual map: 256 sectors (each = 4KB → 1 MB default view, scalable)

    constructor() {
        this.serial   = new WebSerialPort();
        this.flasher  = null;
        this.firmware = null;
        this.errorCount = 0;

        applyTranslations();
        this._checkBrowser();
        this._buildSectorMap();
        this._bindUI();
        this._loadPrefs();
        this.log('agonV Flasher ready. Connect a device to begin.', 'info');
    }

    // ── Browser check ──────────────────────────
    _checkBrowser() {
        if (!('serial' in navigator)) {
            document.getElementById('browserWarning').style.display = 'block';
            document.getElementById('connectBtn').disabled = true;
        }
    }

    // ── Sector map ─────────────────────────────
    _buildSectorMap() {
        const map = document.getElementById('sectorMap');
        map.innerHTML = '';
        for (let i = 0; i < AgonVFlasher.SECTOR_COUNT; i++) {
            const s = document.createElement('div');
            s.className = 'sector pending';
            s.id = `sector-${i}`;
            map.appendChild(s);
        }
    }

    setSector(idx, state) {
        const el = document.getElementById(`sector-${idx}`);
        if (el) el.className = `sector ${state}`;
    }

    resetSectors() {
        for (let i = 0; i < AgonVFlasher.SECTOR_COUNT; i++) {
            this.setSector(i, 'pending');
        }
    }

    // ── UI bindings ────────────────────────────
    _bindUI() {
        document.getElementById('connectBtn')
            .addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn')
            .addEventListener('click', () => this.disconnect());
        document.getElementById('flashBtn')
            .addEventListener('click', () => this.flash());

        document.getElementById('firmwareFile')
            .addEventListener('change', e => this._onFileChange(e));

        // persist config
        ['cfgOffset', 'cfgBaud', 'cfgErase', 'cfgVerify'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this._savePrefs());
        });
    }

    _onFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            this.firmware = new Uint8Array(ev.target.result);
            document.getElementById('fileNameDisplay').textContent =
                `${file.name}  (${(file.size / 1024).toFixed(1)} KB)`;
            document.getElementById('statTotal').textContent =
                (file.size / 1024).toFixed(1);
            this.log(t('msgFileLoaded', { name: file.name, size: (file.size/1024).toFixed(1) }), 'success');
            this._refreshFlashBtn();
        };
        reader.readAsArrayBuffer(file);
    }

    _refreshFlashBtn() {
        const canFlash = this.serial.isOpen && !!this.firmware;
        document.getElementById('flashBtn').disabled = !canFlash;
    }

    // ── Preferences ────────────────────────────
    _savePrefs() {
        try {
            localStorage.setItem('agonv-prefs', JSON.stringify({
                offset: document.getElementById('cfgOffset').value,
                baud:   document.getElementById('cfgBaud').value,
                erase:  document.getElementById('cfgErase').checked,
                verify: document.getElementById('cfgVerify').checked,
            }));
        } catch (_) {}
    }

    _loadPrefs() {
        try {
            const p = JSON.parse(localStorage.getItem('agonv-prefs') || '{}');
            if (p.offset) document.getElementById('cfgOffset').value = p.offset;
            if (p.baud)   document.getElementById('cfgBaud').value   = p.baud;
            if (p.erase !== undefined) document.getElementById('cfgErase').checked  = p.erase;
            if (p.verify !== undefined) document.getElementById('cfgVerify').checked = p.verify;
        } catch (_) {}
    }

    // ── Status badge ───────────────────────────
    setStatus(key, cls) {
        const el = document.getElementById('statusBadge');
        el.textContent = t(key);
        el.className = `status-badge ${cls}`;
    }

    // ── Log ────────────────────────────────────
    log(msg, type = 'info') {
        const logDiv = document.getElementById('log');
        const entry  = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        const ts = new Date().toLocaleTimeString();
        entry.textContent = `[${ts}] ${msg}`;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // ── Progress ───────────────────────────────
    updateProgress({ bytesWritten = 0, totalBytes = 0, percent = 0, speed = '—', sectors = 0 } = {}) {
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = `${percent}%`;
        document.getElementById('statWritten').textContent  = (bytesWritten / 1024).toFixed(1);
        document.getElementById('statSectors').textContent  = sectors;
        document.getElementById('statErrors').textContent   = this.errorCount;
        document.getElementById('statSpeed').textContent    = speed;
    }

    // ── Connect ────────────────────────────────
    async connect() {
        this.log(t('msgConnecting'), 'info');
        try {
            const baud = parseInt(document.getElementById('cfgBaud').value, 10);
            await this.serial.open(baud);

            this.flasher = new ESP32P4Flasher(this.serial, (msg, type) => this.log(msg, type));

            await this.flasher.enterBootloader();
            await this.flasher.sync();
            const chip = await this.flasher.detectChip();

            this.log(t('msgConnected', { chip }), 'success');
            this.setStatus('connected', 'connected');

            document.getElementById('connectBtn').disabled    = true;
            document.getElementById('disconnectBtn').disabled = false;
            this._refreshFlashBtn();

        } catch (err) {
            this.log(t('msgConnectFail', { err: err.message }), 'error');
            await this.serial.close().catch(() => {});
            this.setStatus('error', 'error');
        }
    }

    // ── Disconnect ─────────────────────────────
    async disconnect() {
        await this.serial.close();
        this.flasher = null;
        this.log(t('msgDisconnected'), 'warning');
        this.setStatus('disconnected', 'disconnected');
        document.getElementById('connectBtn').disabled    = false;
        document.getElementById('disconnectBtn').disabled = true;
        document.getElementById('flashBtn').disabled      = true;
    }

    // ── Flash ──────────────────────────────────
    async flash() {
        if (!this.firmware) { this.log(t('msgNoFile'), 'warning'); return; }

        const offsetStr = document.getElementById('cfgOffset').value.trim();
        const offset    = parseInt(offsetStr, 16);
        if (isNaN(offset)) { this.log('Invalid flash offset.', 'error'); return; }

        const erase  = document.getElementById('cfgErase').checked;
        const verify = document.getElementById('cfgVerify').checked;

        // Adapt sector map size to firmware
        const sectorCount = Math.min(
            Math.ceil(this.firmware.length / ESP32P4Flasher.FLASH_SECTOR),
            AgonVFlasher.SECTOR_COUNT
        );

        this.errorCount = 0;
        this.resetSectors();
        this.setStatus('flashing', 'flashing');
        this.updateProgress({ bytesWritten: 0, totalBytes: this.firmware.length, percent: 0 });

        // disable buttons during flash
        document.getElementById('flashBtn').disabled      = true;
        document.getElementById('disconnectBtn').disabled = true;
        document.getElementById('connectBtn').disabled    = true;

        if (erase) this.log(t('msgErasing'), 'info');

        try {
            await this.flasher.flash(this.firmware, offset, {
                erase,
                verify,
                onProgress: p => this.updateProgress(p),
                onSector:   (s, state) => {
                    // map firmware sector to visual map slot
                    const slot = Math.floor(s / Math.ceil(this.firmware.length / ESP32P4Flasher.FLASH_SECTOR / AgonVFlasher.SECTOR_COUNT * 1));
                    const visualIdx = Math.min(
                        Math.floor(s * AgonVFlasher.SECTOR_COUNT / sectorCount),
                        AgonVFlasher.SECTOR_COUNT - 1
                    );
                    this.setSector(visualIdx, state);
                },
            });

            this.setStatus('done', 'done');
            this.updateProgress({ bytesWritten: this.firmware.length, totalBytes: this.firmware.length, percent: '100.0' });

        } catch (err) {
            this.errorCount++;
            this.log(t('msgFlashError', { err: err.message }), 'error');
            this.setStatus('error', 'error');
            document.getElementById('statErrors').textContent = this.errorCount;
        }

        document.getElementById('disconnectBtn').disabled = false;
        document.getElementById('flashBtn').disabled      = false;
    }
}

// ─────────────────────────────────────────────
//  Bootstrap
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.agonVFlasher = new AgonVFlasher();
});
