#!/usr/bin/env node
/**
 * Language File Key Coverage Verification Script
 * Verifies all language files have complete and consistent key coverage
 */

const fs = require('fs');
const path = require('path');

const LANG_DIR = path.join(__dirname, 'lang');
const REFERENCE_LANG = 'it.json'; // Italian is the reference language
const LANGUAGES = ['en.json', 'de.json', 'fr.json', 'es.json', 'pt.json', 'ja.json'];

/**
 * Recursively get all keys from an object with dot notation paths
 */
function getKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            keys.push(...getKeys(value, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys.sort();
}

/**
 * Load and parse a JSON file
 */
function loadJSON(filename) {
    const filePath = path.join(LANG_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

/**
 * Compare two sets of keys and return differences
 */
function compareKeys(referenceKeys, targetKeys, langCode) {
    const missing = referenceKeys.filter(key => !targetKeys.includes(key));
    const extra = targetKeys.filter(key => !referenceKeys.includes(key));

    return { missing, extra };
}

/**
 * Main verification function
 */
function verifyLanguageFiles() {
    console.log('=== Language File Key Coverage Verification ===\n');

    // Load reference language (Italian)
    console.log(`Loading reference language: ${REFERENCE_LANG}`);
    const referenceData = loadJSON(REFERENCE_LANG);
    const referenceKeys = getKeys(referenceData);
    console.log(`Reference has ${referenceKeys.length} keys\n`);

    let allValid = true;
    const results = [];

    // Check each language file
    for (const langFile of LANGUAGES) {
        const langCode = langFile.replace('.json', '');
        console.log(`Checking ${langFile}...`);

        const langData = loadJSON(langFile);
        const langKeys = getKeys(langData);

        const { missing, extra } = compareKeys(referenceKeys, langKeys, langCode);

        const result = {
            language: langCode,
            file: langFile,
            totalKeys: langKeys.length,
            valid: missing.length === 0 && extra.length === 0,
            missing,
            extra
        };

        results.push(result);

        if (result.valid) {
            console.log(`  ✓ PASS - ${langKeys.length} keys (complete match)\n`);
        } else {
            allValid = false;
            console.log(`  ✗ FAIL - ${langKeys.length} keys`);

            if (missing.length > 0) {
                console.log(`    Missing ${missing.length} keys:`);
                missing.forEach(key => console.log(`      - ${key}`));
            }

            if (extra.length > 0) {
                console.log(`    Extra ${extra.length} keys:`);
                extra.forEach(key => console.log(`      + ${key}`));
            }
            console.log();
        }
    }

    // Summary
    console.log('=== Summary ===');
    console.log(`Reference: ${REFERENCE_LANG} (${referenceKeys.length} keys)`);
    console.log();

    const passed = results.filter(r => r.valid).length;
    const failed = results.filter(r => !r.valid).length;

    console.log(`Languages checked: ${LANGUAGES.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log();

    if (allValid) {
        console.log('✓ ALL LANGUAGE FILES HAVE COMPLETE KEY COVERAGE');
        process.exit(0);
    } else {
        console.log('✗ SOME LANGUAGE FILES HAVE INCOMPLETE KEY COVERAGE');
        process.exit(1);
    }
}

// Run verification
try {
    verifyLanguageFiles();
} catch (error) {
    console.error('Error during verification:', error.message);
    process.exit(1);
}
