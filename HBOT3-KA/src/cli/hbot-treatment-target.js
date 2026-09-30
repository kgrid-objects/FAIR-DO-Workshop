#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { prepareAndExecuteKnowledgeAssembly } = require('../preparation');

function printHelp() {
  const helpText = [
    'HBOT Treatment Target Knowledge Assembly CLI',
    '',
    'Usage:',
    '  hbot-treatment-target-ka --file <path-to-request.json>',
    '  hbot-treatment-target-ka --request <json-object-text>',
    '  Add --preparation <path-to-preparation.json> for artifact payloads and',
    '  provenance needed when either questionnaire must be collected.',
    '  hbot-treatment-target-ka --help',
    '',
    'Prepares missing questionnaire artifacts through their owning KOs,',
    'then submits a complete Section 2.5 request to the closed KA core.',
    '',
    'A supplied artifact is never recollected. Its response payload must be',
    'available in preparation.artifactPayloads under its artifact_locator.'
  ].join('\n');
  process.stdout.write(`${helpText}\n`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (token === '--file') {
      args.file = argv[i + 1];
      i += 1;
    } else if (token === '--request') {
      args.request = argv[i + 1];
      i += 1;
    } else if (token === '--preparation') {
      args.preparation = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.file && !args.request)) {
    printHelp();
    process.exitCode = args.help ? 0 : 1;
    return;
  }

  let requestText;
  if (args.file) {
    requestText = fs.readFileSync(path.resolve(args.file), 'utf8');
  } else {
    requestText = args.request;
  }

  let request;
  try {
    request = JSON.parse(requestText);
  } catch (error) {
    process.stderr.write(`Invalid JSON request: ${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const preparation = args.preparation
    ? JSON.parse(fs.readFileSync(path.resolve(args.preparation), 'utf8'))
    : {};
  const { result } = await prepareAndExecuteKnowledgeAssembly(request, preparation);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Unhandled error: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
