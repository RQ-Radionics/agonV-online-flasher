// agonV Flasher — ESP32-P4 Olimex
// Uses esptool-js (Espressif) for all serial protocol handling.
// https://github.com/espressif/esptool-js

'use strict';

import { ESPLoader, Transport } from './esptool-bundle.js';

// ─────────────────────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────────────────────
const LANG = (navigator.language || 'en').startsWith('es') ? 'es' : 'en';
const STR = {
    en: {
        connect: 'Connect Device', disconnect: 'Disconnect', flash: 'Flash All',
        preload: '⚡ Load agonV Default',
        disconnected: 'Disconnected', connected: 'Connected',
        flashing: 'Flashing…', done: 'Done', error: 'Error',
        addRegion: '+ Add Region', clearRegions: 'Clear All',
        msgConnecting: 'Connecting…',
        msgConnected: 'Connected — {chip}',
        msgDisconnected: 'Disconnected',
        msgConnectFail: 'Connection failed: {err}',
        msgFlashStart: 'Writing {name} → {offset} ({size} KB)',
        msgFlashDone: 'Done! {size} KB in {time}s.',
        msgFlashError: 'Flash error: {err}',
        msgNoRegions: 'Add at least one .bin file.',
        msgRegionDone: '{name} ✓',
        msgResetting: 'Resetting device…',
        msgResetDone: 'Device reset.',
        msgPreloadDone: '{n} files loaded.',
        msgPreloadErr: 'Could not load {name}: {err}',
        msgFileDropHere: 'Drop .bin or click…',
        modalTitle: 'Enter Bootloader Mode',
        modalDone: 'Done — board is in bootloader',
        msgBootInstructions: 'Hold BOOT → press RST → release BOOT → click Done',
        msgChangeBaud: 'Switching to {baud} baud…',
        msgChangeBaudOK: 'Baud rate: {baud}',
    },
    es: {
        connect: 'Conectar Dispositivo', disconnect: 'Desconectar', flash: 'Flashear Todo',
        preload: '⚡ Cargar agonV por defecto',
        disconnected: 'Desconectado', connected: 'Conectado',
        flashing: 'Flasheando…', done: 'Listo', error: 'Error',
        addRegion: '+ Añadir Región', clearRegions: 'Limpiar Todo',
        msgConnecting: 'Conectando…',
        msgConnected: 'Conectado — {chip}',
        msgDisconnected: 'Desconectado',
        msgConnectFail: 'Error al conectar: {err}',
        msgFlashStart: 'Escribiendo {name} → {offset} ({size} KB)',
        msgFlashDone: '¡Listo! {size} KB en {time}s.',
        msgFlashError: 'Error flash: {err}',
        msgNoRegions: 'Añade al menos un archivo .bin.',
        msgRegionDone: '{name} ✓',
        msgResetting: 'Reseteando dispositivo…',
        msgResetDone: 'Dispositivo reseteado.',
        msgPreloadDone: '{n} archivos cargados.',
        msgPreloadErr: 'No se pudo cargar {name}: {err}',
        msgFileDropHere: 'Suelta .bin o haz clic…',
        modalTitle: 'Entrar en Modo Bootloader',
        modalDone: 'Listo — la placa está en bootloader',
        msgBootInstructions: 'Mantén BOOT → pulsa RST → suelta BOOT → clic en Listo',
        msgChangeBaud: 'Cambiando a {baud} baud…',
        msgChangeBaudOK: 'Velocidad: {baud}',
    },
};
function t(key, vars = {}) {
    let s = (STR[LANG] || STR.en)[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default firmware layout
// ─────────────────────────────────────────────────────────────────────────────
const AGONV_DEFAULT_REGIONS = [
    { offset: 0x2000,  filename: 'bootloader.bin'      },
    { offset: 0x8000,  filename: 'partition-table.bin' },
    { offset: 0x10000, filename: 'esp32-mos.bin'        },
];

// ─────────────────────────────────────────────────────────────────────────────
// Region model
// ─────────────────────────────────────────────────────────────────────────────
class Region {
    constructor(offset = 0x0, file = null) {
        this.id     = `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.offset = offset;   // number
        this.file   = file;
        this.data   = null;     // Uint8Array
        this.status = 'pending';
    }
    get name()   { return this.file?.name ?? '—'; }
    get sizeKB() { return this.data ? (this.data.length / 1024).toFixed(1) : '—'; }
    async load() {
        if (!this.file) return;
        this.data = new Uint8Array(await this.file.arrayBuffer());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Terminal adapter for esptool-js
// ─────────────────────────────────────────────────────────────────────────────
function makeTerminal(logFn) {
    return {
        clean() {},
        writeLine(s) { logFn(s, 'debug'); },
        write(s)     { logFn(s, 'debug'); },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main application
// ─────────────────────────────────────────────────────────────────────────────
class AgonVFlasher {
    static MAP_CELLS  = 256;
    static CELL_BYTES = (16 * 1024 * 1024) / AgonVFlasher.MAP_CELLS; // 64 KB

    constructor() {
        this.regions  = [];
        this.errors   = 0;
        this.device   = null;   // SerialPort
        this.transport = null;  // esptool-js Transport
        this.loader   = null;   // esptool-js ESPLoader

        this._checkBrowser();
        this._buildMap();
        this._bindUI();
        this._loadPrefs();

        // Default regions
        for (const d of AGONV_DEFAULT_REGIONS) this._addRegion(d.offset, null);

        this.log('agonV Flasher ready.', 'info');
    }

    // ── browser check ────────────────────────────────────────────────────────

    _checkBrowser() {
        if (!('serial' in navigator)) {
            document.getElementById('browserWarning').style.display = 'block';
            document.getElementById('connectBtn').disabled = true;
        }
    }

    // ── log ──────────────────────────────────────────────────────────────────

    log(msg, type = 'info') {
        // Suppress empty/whitespace-only debug lines from esptool-js internals
        if (type === 'debug' && !msg.trim()) return;
        const logDiv = document.getElementById('log');
        const entry  = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // ── status ───────────────────────────────────────────────────────────────

    setStatus(key, cls) {
        const el = document.getElementById('statusBadge');
        el.textContent = t(key);
        el.className   = `status-badge ${cls}`;
    }

    // ── progress ─────────────────────────────────────────────────────────────

    updateProgress(written, total, speed, regionName) {
        const pct = total > 0 ? (written / total * 100).toFixed(1) : 0;
        document.getElementById('progressFill').style.width = `${pct}%`;
        document.getElementById('progressText').textContent = `${pct}%`;
        document.getElementById('statWritten').textContent  = (written / 1024).toFixed(1);
        document.getElementById('statTotal').textContent    = (total   / 1024).toFixed(1);
        document.getElementById('statSpeed').textContent    = speed ?? '—';
        document.getElementById('statRegion').textContent   = regionName ?? '—';
        document.getElementById('statErrors').textContent   = this.errors;
    }

    // ── boot modal (UI only) ─────────────────────────────────────────────────

    _showBootModal() {
        const modal = document.getElementById('bootModal');
        modal.style.display = 'flex';
        return new Promise(resolve => {
            document.getElementById('modalDoneBtn').addEventListener('click', () => {
                modal.style.display = 'none';
                resolve();
            }, { once: true });
        });
    }

    // ── connect ───────────────────────────────────────────────────────────────

    async connect() {
        this.log(t('msgConnecting'), 'info');
        document.getElementById('connectBtn').disabled = true;

        try {
            // Show boot instructions FIRST — user puts chip in bootloader.
            // We don't touch the port yet because on USB-JTAG chips the port
            // may re-enumerate when entering bootloader mode.
            this.log(t('msgBootInstructions'), 'info');
            await this._showBootModal();

            // NOW pick the port — after the chip is already in bootloader.
            // This ensures we get the valid post-enumeration port object.
            this.device = await navigator.serial.requestPort();

            // Build Transport + ESPLoader
            this.transport = new Transport(this.device);
            this.loader = new ESPLoader({
                transport: this.transport,
                baudrate:  115200,
                terminal:  makeTerminal((m, tp) => this.log(m, tp)),
            });

            // Connect — 'no_reset': don't touch RTS/DTR, just sync.
            const chip = await this.loader.main('no_reset');
            this.log(t('msgConnected', { chip }), 'success');
            this.setStatus('connected', 'connected');

            // Bump baud if needed
            const baud = parseInt(document.getElementById('cfgBaud').value, 10);
            if (baud !== 115200) {
                this.log(t('msgChangeBaud', { baud }), 'info');
                await this.loader.changeBaud();
                this.log(t('msgChangeBaudOK', { baud }), 'success');
            }

            document.getElementById('disconnectBtn').disabled = false;
            this._refreshFlashBtn();

        } catch (err) {
            document.getElementById('bootModal').style.display = 'none';
            this.log(t('msgConnectFail', { err: err.message }), 'error');
            this.setStatus('error', 'error');
            await this._cleanup();
            document.getElementById('connectBtn').disabled = false;
        }
    }

    // ── disconnect ────────────────────────────────────────────────────────────

    async disconnect() {
        await this._cleanup();
        this.log(t('msgDisconnected'), 'warning');
        this.setStatus('disconnected', 'disconnected');
        document.getElementById('connectBtn').disabled    = false;
        document.getElementById('disconnectBtn').disabled = true;
        document.getElementById('flashBtn').disabled      = true;
    }

    async _cleanup() {
        try { await this.transport?.disconnect(); } catch (_) {}
        this.transport = null;
        this.loader    = null;
        this.device    = null;
    }

    // ── flash all ─────────────────────────────────────────────────────────────

    async flashAll() {
        const ready = this.regions.filter(r => r.data);
        if (!ready.length) { this.log(t('msgNoRegions'), 'warning'); return; }

        this.errors = 0;
        this._resetMap();
        this.setStatus('flashing', 'flashing');
        this._setUIEnabled(false);

        const grandTotal = ready.reduce((s, r) => s + r.data.length, 0);
        const t0 = Date.now();

        try {
            // Build fileArray for esptool-js writeFlash
            const fileArray = ready.map(r => ({
                data:    this.loader.ui8ToBstr(r.data),
                address: r.offset,
            }));

            const flashMode = document.getElementById('cfgFlashMode').value;
            const flashSize = document.getElementById('cfgFlashSize').value;
            const flashFreq = document.getElementById('cfgFlashFreq').value;

            // Mark all pending on map
            for (const r of ready) this._markRegionCells(r, 'pending');

            let grandWritten = 0;
            await this.loader.writeFlash({
                fileArray,
                reportProgress: (fileIndex, written, total) => {
                    const r = ready[fileIndex];
                    if (r) {
                        const delta = written - (r._lastWritten || 0);
                        grandWritten += delta;
                        r._lastWritten = written;
                        const elapsed = (Date.now() - t0) / 1000 || 0.001;
                        const speed   = (grandWritten / 1024 / elapsed).toFixed(1);
                        this.updateProgress(grandWritten, grandTotal, speed, r.name);
                        this._markRegionCells(r, written >= total ? 'done' : 'writing');
                    }
                },
                eraseAll:  document.getElementById('cfgErase').checked,
                compress:  true,
                flashMode,
                flashSize,
                flashFreq,
            });

            for (const r of ready) {
                r._lastWritten = 0;
                this._setRegionStatus(r, 'done', '✓');
                this.log(t('msgRegionDone', { name: r.name }), 'success');
            }

            // Hard reset after flash
            this.log(t('msgResetting'), 'info');
            const after = document.getElementById('cfgAfter').value;
            if (after === 'hard_reset' || after === 'soft_reset') {
                await this.loader.hardReset();
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
        }

        this._setUIEnabled(true);
    }

    // ── preload default firmware ──────────────────────────────────────────────

    async preloadDefault() {
        document.getElementById('preloadBtn').disabled = true;
        this.regions = [];
        document.getElementById('regionsList').innerHTML = '';

        let loaded = 0;
        for (const def of AGONV_DEFAULT_REGIONS) {
            this._addRegion(def.offset, null);
            const region = this.regions[this.regions.length - 1];
            try {
                const resp = await fetch(def.filename);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const buf = await resp.arrayBuffer();
                region.data = new Uint8Array(buf);
                region.file = new File([buf], def.filename);
                this._updateRegionRow(region);
                loaded++;
            } catch (err) {
                this.log(t('msgPreloadErr', { name: def.filename, err: err.message }), 'error');
            }
        }

        this._resetMap();
        this._refreshFlashBtn();
        document.getElementById('preloadBtn').disabled = false;
        if (loaded) this.log(t('msgPreloadDone', { n: loaded }), 'success');
    }

    // ── regions UI ───────────────────────────────────────────────────────────

    _addRegion(offset = 0x0, file = null) {
        const r = new Region(offset, file);
        this.regions.push(r);
        this._renderRegionRow(r);
        this._refreshFlashBtn();
    }

    _renderRegionRow(region) {
        const list = document.getElementById('regionsList');
        const row  = document.createElement('div');
        row.className = 'region-row';
        row.id = `row-${region.id}`;

        const offInput = document.createElement('input');
        offInput.type  = 'text';
        offInput.value = `0x${region.offset.toString(16)}`;
        offInput.spellcheck = false;
        offInput.addEventListener('change', () => {
            region.offset = parseInt(offInput.value.trim(), 16) || 0;
            this._savePrefs(); this._resetMap();
        });

        const zone = document.createElement('label');
        zone.className = 'file-drop-zone';
        zone.htmlFor   = `file-${region.id}`;

        const fname = document.createElement('span');
        fname.className = 'fname';
        fname.textContent = t('msgFileDropHere');

        const fileInput = document.createElement('input');
        fileInput.type   = 'file';
        fileInput.accept = '.bin';
        fileInput.id     = `file-${region.id}`;
        fileInput.addEventListener('change', e => this._onRegionFile(region, e.target.files[0], zone, fname, sizeEl));

        zone.append(document.createTextNode('📂 '), fname, fileInput);
        zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
        zone.addEventListener('drop',      e  => {
            e.preventDefault(); zone.classList.remove('drag-over');
            const f = e.dataTransfer.files[0];
            if (f) this._onRegionFile(region, f, zone, fname, sizeEl);
        });

        const sizeEl = document.createElement('div');
        sizeEl.className = 'region-size';
        sizeEl.id = `size-${region.id}`;
        sizeEl.textContent = '—';

        const statusEl = document.createElement('div');
        statusEl.className = 'region-status pending';
        statusEl.id        = `status-${region.id}`;
        statusEl.textContent = '—';

        row.append(offInput, zone, sizeEl, statusEl);
        list.appendChild(row);

        row.addEventListener('dblclick', () => {
            this.regions = this.regions.filter(r => r.id !== region.id);
            row.remove();
            this._savePrefs(); this._resetMap(); this._refreshFlashBtn();
        });
    }

    _updateRegionRow(region) {
        const fname   = document.querySelector(`#row-${region.id} .fname`);
        const zone    = document.querySelector(`#row-${region.id} .file-drop-zone`);
        const sizeEl  = document.getElementById(`size-${region.id}`);
        if (fname)  fname.textContent  = region.name;
        if (zone)   zone.classList.add('has-file');
        if (sizeEl) { sizeEl.textContent = `${region.sizeKB} KB`; sizeEl.classList.add('loaded'); }
    }

    async _onRegionFile(region, file, zone, fnameEl, sizeEl) {
        if (!file) return;
        region.file = file;
        await region.load();
        fnameEl.textContent = file.name;
        zone.classList.add('has-file');
        sizeEl.textContent = `${region.sizeKB} KB`;
        sizeEl.classList.add('loaded');
        this._resetMap(); this._refreshFlashBtn(); this._savePrefs();
    }

    _setRegionStatus(region, state, text) {
        region.status = state;
        const el = document.getElementById(`status-${region.id}`);
        if (!el) return;
        el.className = `region-status ${state}`;
        el.textContent = text;
    }

    // ── flash map ─────────────────────────────────────────────────────────────

    _buildMap() {
        const map = document.getElementById('sectorMap');
        map.innerHTML = '';
        for (let i = 0; i < AgonVFlasher.MAP_CELLS; i++) {
            const d = document.createElement('div');
            d.className = 'sector empty';
            d.id = `cell-${i}`;
            d.title = `0x${(i * AgonVFlasher.CELL_BYTES).toString(16).toUpperCase()}`;
            map.appendChild(d);
        }
    }

    _cellForAddr(byteAddr) {
        return Math.min(Math.floor(byteAddr / AgonVFlasher.CELL_BYTES), AgonVFlasher.MAP_CELLS - 1);
    }

    _markRegionCells(region, state) {
        if (!region.data) return;
        const cFirst = this._cellForAddr(region.offset);
        const cLast  = this._cellForAddr(region.offset + region.data.length - 1);
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
        for (const r of this.regions) if (r.data) this._markRegionCells(r, 'pending');
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
            .addEventListener('click', () => this._addRegion());
        document.getElementById('clearRegionsBtn')
            .addEventListener('click', () => {
                this.regions = [];
                document.getElementById('regionsList').innerHTML = '';
                this._resetMap(); this._refreshFlashBtn(); this._savePrefs();
            });
        const saveIds = ['cfgBaud','cfgFlashMode','cfgFlashSize','cfgFlashFreq','cfgBefore','cfgAfter','cfgErase','cfgVerify'];
        saveIds.forEach(id => document.getElementById(id)?.addEventListener('change', () => this._savePrefs()));
    }

    _refreshFlashBtn() {
        const ok = this.loader && this.regions.some(r => r.data);
        document.getElementById('flashBtn').disabled = !ok;
    }

    _setUIEnabled(on) {
        document.getElementById('connectBtn').disabled    =  on;
        document.getElementById('disconnectBtn').disabled = !on;
        document.getElementById('flashBtn').disabled      = !on;
        document.getElementById('addRegionBtn').disabled  = !on;
    }

    // ── prefs ─────────────────────────────────────────────────────────────────

    _savePrefs() {
        try {
            localStorage.setItem('agonv-prefs', JSON.stringify({
                baud:      document.getElementById('cfgBaud').value,
                flashMode: document.getElementById('cfgFlashMode').value,
                flashSize: document.getElementById('cfgFlashSize').value,
                flashFreq: document.getElementById('cfgFlashFreq').value,
                before:    document.getElementById('cfgBefore').value,
                after:     document.getElementById('cfgAfter').value,
                erase:     document.getElementById('cfgErase').checked,
                verify:    document.getElementById('cfgVerify').checked,
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.agonV = new AgonVFlasher();
});
