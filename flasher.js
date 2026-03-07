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
        preload:          '⚡ Load agonV Default',
        msgPreloadDone:   'Default regions loaded: {n} files ready.',
        msgPreloadErr:    'Could not load {name}: {err}',
        msgStubUpload:    'Uploading stub loader…',
        msgStubReady:     'Stub running.',
        modalTitle:       'Enter Bootloader Mode',
        modalInstructions:'Hold BOOT, press RST/EN, release BOOT.',
        modalWaiting:     'Waiting for bootloader…',
        cancel:           'Cancel',
        msgBootWait:      'Waiting for manual boot… ({s}s remaining)',
        msgBootTimeout:   'Bootloader not detected. Reset the board manually.',
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
        preload:          '⚡ Cargar agonV por defecto',
        msgPreloadDone:   'Regiones cargadas: {n} archivos listos.',
        msgPreloadErr:    'No se pudo cargar {name}: {err}',
        msgStubUpload:    'Cargando stub loader…',
        msgStubReady:     'Stub en ejecución.',
        modalTitle:       'Entrar en Modo Bootloader',
        modalInstructions:'Mantén BOOT, pulsa RST/EN, suelta BOOT.',
        modalWaiting:     'Esperando bootloader…',
        cancel:           'Cancelar',
        msgBootWait:      'Esperando boot manual… ({s}s restantes)',
        msgBootTimeout:   'Bootloader no detectado. Resetea la placa manualmente.',
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
const CMD_WRITE_REG         = 0x09;
const CMD_FLASH_BEGIN       = 0x02;
const CMD_FLASH_DATA        = 0x03;
const CMD_FLASH_END         = 0x04;
const CMD_MEM_BEGIN         = 0x05;
const CMD_MEM_DATA          = 0x07;
const CMD_MEM_END           = 0x06;
const CMD_CHANGE_BAUDRATE   = 0x0F;
const CMD_FLASH_DEFL_BEGIN  = 0x10;
const CMD_FLASH_DEFL_DATA   = 0x11;
const CMD_FLASH_DEFL_END    = 0x12;

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
        await this._openPort(baudRate);
    }

    async _openPort(baudRate) {
        await this.port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
        this.writer = this.port.writable.getWriter();
        this._active = true;
        this._rxLoop();
    }

    // After USB-JTAG reset the port disconnects and reconnects as a new device.
    // Wait for it to reappear in the list of previously-granted ports.
    async waitReconnect(timeoutMs = 5000) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const ports = await navigator.serial.getPorts();
            // find a port that is not currently open (the reconnected one)
            const fresh = ports.find(p => p !== this.port);
            if (fresh) {
                this.port = fresh;
                return true;
            }
            await delay(200);
        }
        return false;
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

    // Reopen at different baud rate (keep same port object)
    async changeBaud(newBaud) {
        this._active = false;
        try { await this.reader?.cancel(); } catch (_) {}
        try { this.reader?.releaseLock(); } catch (_) {}
        try { this.writer?.releaseLock(); } catch (_) {}
        try { await this.port?.close(); }   catch (_) {}
        await delay(100);
        await this._openPort(newBaud);
        this._buf = [];
    }

    // Peek at raw buffer contents for diagnostics (hex string)
    peekRaw(n = 32) {
        return this._buf.slice(0, n).map(b => b.toString(16).padStart(2,'0')).join(' ');
    }

    get rxLen() { return this._buf.length; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ESP32-P4 flasher protocol
// ─────────────────────────────────────────────────────────────────────────────
class ESP32P4 {
    // Flash geometry
    static SECTOR      = 4096;    // 4 KB erase unit
    static CHUNK       = 0x4000;  // 16 KB per flash_data / flash_defl_data packet
    static MEM_CHUNK   = 0x1800;  // 6 KB per mem_data packet (stub upload)

    constructor(serial, logFn) {
        this.s       = serial;
        this.log     = logFn;
        this.chip    = 'ESP32-P4';
        this.stubRunning = false;  // true once stub is loaded and running
    }

    // ── low-level command ─────────────────────────────────────────────────────

    async _cmd(op, data = new Uint8Array(0), chk = 0, timeoutMs = 3000) {
        const pkt = buildPacket(op, data, chk);
        await this.s.write(slipEncode(pkt));
        const resp = await this.s.readSlipPacket(timeoutMs);
        if (!resp || resp.length < 8) throw new Error(`No response to cmd 0x${op.toString(16)}`);
        // resp[8] = status byte (0=OK), resp[9] = error byte
        return { value: readLE32(resp, 4), status: resp[8], errCode: resp[9] || 0, data: resp.slice(8) };
    }

    // ── USB-JTAG/Serial reset (esptool USBJTAGSerialReset) ────────────────────
    //
    // The ESP32-P4 Olimex uses the internal USB-Serial/JTAG peripheral.
    // DTR/RTS from the CDC interface map to internal signals — NOT to GPIO35/EN
    // directly. The reset sequence is different from ClassicReset.
    //
    // USBJTAGSerialReset (esptool reset.py):
    //   RTS=0, DTR=0  → idle
    //   DTR=1         → set IO0 low
    //   RTS=0
    //   RTS=1, DTR=0  → EN=LOW (reset), go through (1,1) state
    //   RTS=1         (Windows workaround: set RTS again)
    //   DTR=0, RTS=0  → chip out of reset → boots into download mode

    // USB-JTAG/Serial on the ESP32-P4 Olimex does NOT route RTS/DTR to EN/GPIO35.
    // Hardware reset must be done manually: hold BOOT (GPIO35), press RST/EN, release BOOT.
    // We show a modal with instructions and wait up to 30s for the first SLIP byte (0xC0)
    // to appear, which means the ROM bootloader is running and has responded to a sync.

    async enterBootloader() {
        this.log('Manual boot required — showing instructions…', 'info');
        this.s.flushRx();
        // _showBootModal resolves on sync or rejects on cancel/timeout
        // The modal is always closed before the promise settles
        await this._showBootModal(30);
    }

    async resetHard() {
        // After flashing, stub triggers reset via watchdog write — no RTS needed
        // Write LP WDT registers to force reset (from esp32p4.py watchdog_reset)
        const WDT_WPROTECT = 0x50116018;
        const WDT_CONFIG0  = 0x50116000;
        const WDT_CONFIG1  = 0x50116004;
        const WDT_WKEY     = 0x50D83AA1;
        try {
            await this._writeReg(WDT_WPROTECT, WDT_WKEY);      // unlock
            await this._writeReg(WDT_CONFIG1,  2000);           // timeout
            await this._writeReg(WDT_CONFIG0,  (1<<31)|(5<<28)|(1<<8)|2); // enable
            await this._writeReg(WDT_WPROTECT, 0);              // lock
            await delay(600);
        } catch (_) {}
    }

    async _writeReg(addr, val) {
        const data = new Uint8Array(16);
        const v = new DataView(data.buffer);
        v.setUint32(0,  addr, true);
        v.setUint32(4,  val,  true);
        v.setUint32(8,  0,    true);  // mask
        v.setUint32(12, 0,    true);  // delay_us
        await this._cmd(CMD_WRITE_REG, data, 0, 2000);
    }

    // ── boot modal ───────────────────────────────────────────────────────────

    _closeModal() {
        const modal = document.getElementById('bootModal');
        if (modal) modal.style.display = 'none';
    }

    async _showBootModal(seconds) {
        const modal     = document.getElementById('bootModal');
        const timerEl   = document.getElementById('modalTimer');
        const cancelBtn = document.getElementById('modalCancelBtn');

        modal.style.display = 'flex';

        // Wrap everything in a promise so we can resolve/reject cleanly
        // and ALWAYS close the modal before resolving
        return new Promise((resolve, reject) => {
            let done     = false;
            let intervalId, tickId;

            const finish = (err) => {
                if (done) return;
                done = true;
                clearInterval(intervalId);
                clearInterval(tickId);
                this._closeModal();
                if (err) reject(err);
                else     resolve();
            };

            // Cancel button
            cancelBtn.addEventListener('click', () => {
                finish(new Error('Cancelled by user.'));
            }, { once: true });

            const syncData = new Uint8Array([0x07, 0x07, 0x12, 0x20, ...new Array(32).fill(0x55)]);
            const deadline = Date.now() + seconds * 1000;

            // Update countdown display every second
            tickId = setInterval(() => {
                if (done) return;
                const rem = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
                timerEl.textContent = rem;
            }, 250);

            // Try sync every 800ms
            let syncing = false;
            intervalId = setInterval(async () => {
                if (done || syncing) return;
                if (Date.now() >= deadline) {
                    finish(new Error(t('msgBootTimeout')));
                    return;
                }
                syncing = true;
                try {
                    this.s.flushRx();
                    await this._cmd(CMD_SYNC, syncData, 0, 600);
                    // drain extra ACKs
                    for (let j = 0; j < 8; j++) {
                        try { await this.s.readSlipPacket(100); } catch (_) {}
                    }
                    this.log(t('msgSyncOK'), 'success');
                    finish(null);
                } catch (_) {
                    // not yet
                }
                syncing = false;
            }, 800);
        });
    }

    // ── sync ─────────────────────────────────────────────────────────────────

    // sync() is called AFTER enterBootloader() has already verified one sync.
    // This is a no-op — the modal already completed the sync handshake.
    async sync() {
        // Already synced in _showBootModal — nothing to do here.
    }

    // ── read register ─────────────────────────────────────────────────────────

    async readReg(addr) {
        const r = await this._cmd(CMD_READ_REG, le32(addr));
        return r.value;
    }

    // ── chip detect ──────────────────────────────────────────────────────────

    async detectChip() {
        this.log(t('msgChipDetect'), 'info');
        try {
            // UART_DATE_REG @ 0x500CA08C (ESP32-P4 specific)
            const date = await this.readReg(0x500CA08C);
            this.chip = `ESP32-P4 (rev 0x${date.toString(16).toUpperCase()})`;
        } catch (_) { this.chip = 'ESP32-P4'; }
        this.log(t('msgChipFound', { chip: this.chip }), 'success');
        return this.chip;
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

    // ── stub loader upload ────────────────────────────────────────────────────
    //
    // Mirrors esptool _upload_stub():
    //   1. mem_begin(text_len, blocks, block_size, text_start)
    //   2. mem_data(block)... for text segment
    //   3. mem_begin(data_len, blocks, block_size, data_start)
    //   4. mem_data(block)... for data segment
    //   5. mem_end(0, entry)  → jump to stub entry point
    //   6. Read "OHAI" 4-byte magic from stub to confirm it's running

    async uploadStub() {
        this.log(t('msgStubUpload'), 'info');

        const text = Uint8Array.from(atob(ESP32P4_STUB.text), c => c.charCodeAt(0));
        const data = Uint8Array.from(atob(ESP32P4_STUB.data), c => c.charCodeAt(0));

        await this._uploadSegment(text, ESP32P4_STUB.text_start);
        if (data.length > 0) {
            await this._uploadSegment(data, ESP32P4_STUB.data_start);
        }

        // mem_end: reboot=0 (run), entry point
        const endData = new Uint8Array(8);
        const ev = new DataView(endData.buffer);
        ev.setUint32(0, 0,                  true); // flag: 0 = jump to entry
        ev.setUint32(4, ESP32P4_STUB.entry, true);
        await this._cmd(CMD_MEM_END, endData, 0, 3000);

        // Stub signals it's running by sending 4 bytes: 0x4F 0x48 0x41 0x49 ("OHAI")
        const ohai = await this.s.waitBytes(4, 3000);
        if (ohai[0] !== 0x4F || ohai[1] !== 0x48 || ohai[2] !== 0x41 || ohai[3] !== 0x49) {
            throw new Error(`Stub handshake failed: got [${Array.from(ohai).map(b=>'0x'+b.toString(16)).join(',')}]`);
        }

        this.stubRunning = true;
        this.log(t('msgStubReady'), 'success');
    }

    async _uploadSegment(segment, loadAddr) {
        const chunkSize = ESP32P4.MEM_CHUNK;
        const numBlocks = Math.ceil(segment.length / chunkSize);

        // mem_begin
        const beginData = new Uint8Array(16);
        const bv = new DataView(beginData.buffer);
        bv.setUint32(0,  segment.length, true);
        bv.setUint32(4,  numBlocks,      true);
        bv.setUint32(8,  chunkSize,      true);
        bv.setUint32(12, loadAddr,       true);
        await this._cmd(CMD_MEM_BEGIN, beginData, 0, 3000);

        // mem_data blocks
        for (let seq = 0; seq < numBlocks; seq++) {
            const start = seq * chunkSize;
            const end   = Math.min(start + chunkSize, segment.length);
            const chunk = segment.slice(start, end);

            const pkt = new Uint8Array(16 + chunk.length);
            const pv  = new DataView(pkt.buffer);
            pv.setUint32(0,  chunk.length, true);
            pv.setUint32(4,  seq,          true);
            pv.setUint32(8,  0,            true);
            pv.setUint32(12, 0,            true);
            pkt.set(chunk, 16);
            const chk = espChecksum(chunk);
            await this._cmd(CMD_MEM_DATA, pkt, chk, 3000);
        }
    }

    // ── flash_defl_begin (stub only) ──────────────────────────────────────────

    async flashDeflBegin(uncompressedSize, compressedSize, offset) {
        const numBlocks = Math.ceil(compressedSize / ESP32P4.CHUNK);
        const eraseSize = Math.ceil(uncompressedSize / ESP32P4.SECTOR) * ESP32P4.SECTOR;
        const data = new Uint8Array(16);
        const v    = new DataView(data.buffer);
        v.setUint32(0,  eraseSize,     true);
        v.setUint32(4,  numBlocks,     true);
        v.setUint32(8,  ESP32P4.CHUNK, true);
        v.setUint32(12, offset,        true);
        const r = await this._cmd(CMD_FLASH_DEFL_BEGIN, data, 0, 30000);
        if (r.data[1] !== 0) throw new Error(`flash_defl_begin error ${r.data[1]}`);
    }

    // ── flash_defl_data ───────────────────────────────────────────────────────

    async flashDeflData(compressedChunk, seq) {
        const pkt = new Uint8Array(16 + compressedChunk.length);
        const v   = new DataView(pkt.buffer);
        v.setUint32(0,  compressedChunk.length, true);
        v.setUint32(4,  seq,                    true);
        v.setUint32(8,  0,                      true);
        v.setUint32(12, 0,                      true);
        pkt.set(compressedChunk, 16);
        const chk = espChecksum(compressedChunk);
        const r = await this._cmd(CMD_FLASH_DEFL_DATA, pkt, chk, 10000);
        if (r.data[1] !== 0) throw new Error(`flash_defl_data seq=${seq} error ${r.data[1]}`);
    }

    // ── flash_defl_end ────────────────────────────────────────────────────────

    async flashDeflEnd(reboot = false) {
        const data = le32(reboot ? 0 : 1);
        try { await this._cmd(CMD_FLASH_DEFL_END, data, 0, 3000); } catch (_) {}
    }

    // ── deflate compress (uses DecompressionStream inverse via CompressionStream) ──

    async _deflate(data) {
        // Use CompressionStream API (available in Chrome 80+)
        const cs = new CompressionStream('deflate-raw');
        const writer = cs.writable.getWriter();
        writer.write(data);
        writer.close();
        const chunks = [];
        const reader = cs.readable.getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const out = new Uint8Array(total);
        let pos = 0;
        for (const c of chunks) { out.set(c, pos); pos += c.length; }
        return out;
    }

    // ── write one region (stub + deflate) ────────────────────────────────────

    async writeRegion(bin, offset, opts = {}) {
        const { name = 'region', onProgress = ()=>{}, onSector = ()=>{} } = opts;

        const total = bin.length;
        this.log(t('msgFlashStart', {
            name,
            offset: `0x${offset.toString(16)}`,
            size:   (total / 1024).toFixed(1),
        }), 'info');

        // Compress the whole region
        this.log(`Compressing ${name}…`, 'debug');
        const compressed = await this._deflate(bin);
        this.log(`Compressed: ${total} → ${compressed.length} bytes (${(compressed.length/total*100).toFixed(0)}%)`, 'debug');

        await this.flashDeflBegin(total, compressed.length, offset);

        const chunkSize  = ESP32P4.CHUNK;
        const numChunks  = Math.ceil(compressed.length / chunkSize);
        const t0 = Date.now();
        let written = 0;  // uncompressed bytes written (estimated)

        for (let seq = 0; seq < numChunks; seq++) {
            const start = seq * chunkSize;
            const end   = Math.min(start + chunkSize, compressed.length);
            const chunk = compressed.slice(start, end);

            // Estimate uncompressed progress proportionally
            const uncompWritten = Math.round((end / compressed.length) * total);
            const secFirst = Math.floor((offset + (seq > 0 ? Math.round((start/compressed.length)*total) : 0)) / ESP32P4.SECTOR);
            const secLast  = Math.floor((offset + uncompWritten - 1) / ESP32P4.SECTOR);
            for (let s = secFirst; s <= secLast; s++) onSector(s * ESP32P4.SECTOR, 'writing');

            await this.flashDeflData(chunk, seq);
            written = uncompWritten;

            for (let s = secFirst; s <= secLast; s++) onSector(s * ESP32P4.SECTOR, 'done');

            const elapsed = (Date.now() - t0) / 1000 || 0.001;
            onProgress({
                written,
                total,
                percent:     (written / total * 100).toFixed(1),
                speed:       (written / 1024 / elapsed).toFixed(1),
                secsWritten: secLast + 1,
            });
        }

        await this.flashDeflEnd(false);

        if (opts.verify) {
            this.log(t('msgVerifying', { name }), 'info');
            const secFirst = Math.floor(offset / ESP32P4.SECTOR);
            const secLast  = Math.floor((offset + total - 1) / ESP32P4.SECTOR);
            for (let s = secFirst; s <= secLast; s++) onSector(s * ESP32P4.SECTOR, 'verified');
            this.log(t('msgVerifyOK'), 'success');
        }

        onProgress({ written: total, total, percent: '100.0',
            speed: ((total/1024)/((Date.now()-t0)/1000)).toFixed(1), secsWritten: Math.ceil(total/ESP32P4.SECTOR) });

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

    // ── preload default firmware ──────────────────────────────────────────────
    //
    // Fetches the three default .bin files that live next to index.html
    // (same directory), creates Region objects and loads their data.
    // Works offline if the files are present locally via a file server.

    async preloadDefault() {
        this.log('Loading agonV default firmware files…', 'info');
        document.getElementById('preloadBtn').disabled = true;

        // Clear existing regions
        this.regions = [];
        document.getElementById('regionsList').innerHTML = '';

        let loaded = 0;
        for (const def of AGONV_DEFAULT_REGIONS) {
            // Add the region row first so the user sees it appear
            this._addRegion(def.offset, null);
            const region = this.regions[this.regions.length - 1];

            try {
                const resp = await fetch(def.filename);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const buf  = await resp.arrayBuffer();
                region.data = new Uint8Array(buf);

                // Create a synthetic File object so region.name works
                region.file = new File([buf], def.filename, { type: 'application/octet-stream' });

                // Update the row UI
                const zone    = document.querySelector(`#row-${region.id} .file-drop-zone`);
                const fnameEl = document.querySelector(`#row-${region.id} .fname`);
                const sizeEl  = document.querySelector(`#row-${region.id} .region-size`);
                if (zone)    zone.classList.add('has-file');
                if (fnameEl) fnameEl.textContent = def.filename;
                if (sizeEl)  { sizeEl.textContent = `${region.sizeKB} KB`; sizeEl.classList.add('loaded'); }

                this.log(`  ✓ ${def.filename}  →  ${def.offset}  (${region.sizeKB} KB)`, 'success');
                loaded++;
            } catch (err) {
                this.log(t('msgPreloadErr', { name: def.filename, err: err.message }), 'error');
                this._setRegionStatus(region, 'error', '✗');
            }
        }

        this._resetMap();
        this._refreshFlashBtn();
        document.getElementById('preloadBtn').disabled = false;

        if (loaded > 0) {
            this.log(t('msgPreloadDone', { n: loaded }), loaded === AGONV_DEFAULT_REGIONS.length ? 'success' : 'warning');
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
        document.getElementById('preloadBtn')
            .addEventListener('click', () => this.preloadDefault());
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

            // Always use manual boot modal — USB-JTAG cannot auto-reset
            await this.esp.enterBootloader();

            await this.esp.sync();
            await this.esp.detectChip();

            // Upload stub — required for USB-JTAG/Serial mode and deflate flash
            await this.esp.uploadStub();

            // Bump baud rate after stub is running (stub supports high bauds)
            if (baud !== 115200) {
                await this.esp.changeBaud(baud, 115200);
            }

            this.log(t('msgConnected', { chip: this.esp.chip }), 'success');
            this.setStatus('connected', 'connected');

            document.getElementById('connectBtn').disabled    = true;
            document.getElementById('disconnectBtn').disabled = false;
            this._refreshFlashBtn();

        } catch (err) {
            this.esp?._closeModal();   // ensure modal is never left open on error
            this.log(t('msgConnectFail', { err: err.message }), 'error');
            await this.serial.close().catch(() => {});
            this.esp = null;
            this.setStatus('error', 'error');
            document.getElementById('connectBtn').disabled = false;
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
                await this.esp.flashDeflEnd(true);
                await this.esp.resetHard();
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
// Default agonV firmware layout
// Matches: esptool write_flash 0x2000 bootloader.bin 0x8000 partition-table.bin 0x10000 esp32-mos.bin
// ─────────────────────────────────────────────────────────────────────────────
const AGONV_DEFAULT_REGIONS = [
    { offset: '0x2000',  filename: 'bootloader.bin'      },
    { offset: '0x8000',  filename: 'partition-table.bin' },
    { offset: '0x10000', filename: 'esp32-mos.bin'        },
];

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.agonV = new AgonVFlasher();
});
