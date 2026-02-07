#!/usr/bin/env node

/**
 * Translation Coverage Verification Script
 * Compares lang/it.json and lang/en.json to ensure complete coverage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Italian words to detect in English translations
// NOTE: Excludes technical terms that are valid in both languages (audio, browser, server, cache, etc.)
const ITALIAN_WORDS = [
    'assistente', 'chiave', 'trascrizione', 'lingua', 'posizione', 'pannello',
    'sensibilita', 'rilevamento', 'fuori', 'tema', 'bassa', 'alta',
    'apri', 'chiudi', 'avvia', 'ferma', 'pausa', 'riprendi', 'genera', 'immagine',
    'suggerimento', 'disponibile', 'registrazione', 'analizzerà', 'conversazione',
    'attenzione', 'storia', 'configurata', 'configura', 'impostazioni', 'elaborazione',
    'cancella', 'copia', 'appunti', 'generata', 'ascolto', 'caricati',
    'nessun', 'nessuna', 'inizializzato', 'attendi', 'caricamento', 'fallita',
    'valido', 'assicurati', 'contenga', 'dati', 'troppo', 'grande',
    'limite', 'massimo', 'verifica', 'richieste', 'raggiunto', 'momento', 'riprovare',
    'richiesta', 'errore', 'più', 'tardi', 'trascrizione', 'analisi',
    'descrizione', 'infografica', 'contenuto', 'viola', 'prova',
    'diversa', 'contesto', 'prima', 'impossibile', 'supporta', 'cattura',
    'microfono', 'permesso', 'negato', 'consenti', 'accesso', 'trovato', 'collega',
    'uso', 'applicazione', 'altre', 'soddisfa', 'requisiti', 'richiesti',
    'sicurezza', 'richiede', 'produzione', 'connessione', 'impiegato',
    'verificato', 'imprevisto', 'servizio', 'temporaneamente', 'minuto', 'minuti',
    'incompleta', 'salvate', 'pronto', 'completata', 'aggiornata', 'allontanando',
    'trama', 'narrazione', 'dialogo', 'azione', 'riferimento', 'confidenza',
    'inattivo', 'livello', 'normale', 'alto', 'basso', 'pagine', 'senza', 'nome',
    'generazione', 'corso', 'scaduto', 'usando', 'locale', 'clicca',
    'ingrandire', 'elimina', 'scarica', 'pulsante', 'indicatore', 'navigazione',
    'schede', 'galleria', 'lista', 'della', 'delle', 'negli', 'dell', 'con',
    'una', 'per', 'sono', 'sta', 'stanno', 'dal', 'dalla', 'alle', 'alla',
    'negli', 'analizzerà'
];

function getAllKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
            keys.push(...getAllKeys(value, fullKey));
        } else {
            keys.push({ key: fullKey, value });
        }
    }
    return keys;
}

function checkItalianText(text) {
    const lowerText = text.toLowerCase();
    const found = [];

    for (const word of ITALIAN_WORDS) {
        // Check for whole word matches (with word boundaries)
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lowerText)) {
            found.push(word);
        }
    }

    return found;
}

function main() {
    console.log('🔍 Verifying English translation coverage...\n');

    // Load both files
    const itPath = path.join(__dirname, 'lang', 'it.json');
    const enPath = path.join(__dirname, 'lang', 'en.json');

    let itJson, enJson;
    try {
        itJson = JSON.parse(fs.readFileSync(itPath, 'utf8'));
        enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    } catch (error) {
        console.error('❌ Error reading translation files:', error.message);
        process.exit(1);
    }

    // Get all keys from both files
    const itKeys = getAllKeys(itJson);
    const enKeys = getAllKeys(enJson);

    // Create maps for easy lookup
    const itKeyMap = new Map(itKeys.map(k => [k.key, k.value]));
    const enKeyMap = new Map(enKeys.map(k => [k.key, k.value]));

    let hasErrors = false;

    // Check 1: All Italian keys have English translations
    console.log('📋 Checking key coverage...');
    const missingKeys = [];
    for (const [key, value] of itKeyMap) {
        if (!enKeyMap.has(key)) {
            missingKeys.push(key);
            hasErrors = true;
        }
    }

    if (missingKeys.length > 0) {
        console.error(`❌ Missing ${missingKeys.length} keys in English file:`);
        missingKeys.forEach(key => console.error(`   - ${key}`));
    } else {
        console.log('✅ All Italian keys have English translations');
    }

    // Check 2: No extra keys in English (should match Italian structure)
    console.log('\n📋 Checking for extra keys in English...');
    const extraKeys = [];
    for (const [key] of enKeyMap) {
        if (!itKeyMap.has(key)) {
            extraKeys.push(key);
        }
    }

    if (extraKeys.length > 0) {
        console.warn(`⚠️  Found ${extraKeys.length} extra keys in English file:`);
        extraKeys.forEach(key => console.warn(`   - ${key}`));
    } else {
        console.log('✅ No extra keys in English file');
    }

    // Check 3: No Italian text in English translations
    console.log('\n📋 Checking for Italian text in English translations...');
    const italianInEnglish = [];
    for (const [key, value] of enKeyMap) {
        if (typeof value === 'string') {
            const foundWords = checkItalianText(value);
            if (foundWords.length > 0) {
                italianInEnglish.push({ key, value, words: foundWords });
            }
        }
    }

    if (italianInEnglish.length > 0) {
        console.error(`❌ Found Italian text in ${italianInEnglish.length} English translations:`);
        italianInEnglish.forEach(({ key, value, words }) => {
            console.error(`   - ${key}: "${value}"`);
            console.error(`     Detected Italian words: ${words.join(', ')}`);
        });
        hasErrors = true;
    } else {
        console.log('✅ No Italian text detected in English translations');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Italian keys: ${itKeys.length}`);
    console.log(`   English keys: ${enKeys.length}`);
    console.log(`   Missing translations: ${missingKeys.length}`);
    console.log(`   Extra keys: ${extraKeys.length}`);
    console.log(`   Italian text in English: ${italianInEnglish.length}`);
    console.log('='.repeat(60));

    if (hasErrors) {
        console.error('\n❌ Verification FAILED - issues found!');
        process.exit(1);
    } else {
        console.log('\n✅ Verification PASSED - English translation coverage is complete!');
        process.exit(0);
    }
}

main();
