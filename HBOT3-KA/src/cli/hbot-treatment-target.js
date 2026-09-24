#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { executeKnowledgeAssembly } = require('../orchestrator');

function printHelp() {
  const helpText = [
    'HBOT Treatment Target Knowledge Assembly CLI',
    '',
    'Usage:',
    '  hbot-treatment-target-ka --file <path-to-request.json>',
    '  hbot-treatment-target-ka --request <json-object-text>',
    '  hbot-treatment-target-ka --help',
    '',
    'Reads one KA request object conforming to CKS Version 1.0 Section 2.5',
    'and prints the closed canonical result object (Section 7.3) as JSON.',
    '',
    'wagner_response_artifact and burden_questionnaire_artifact are not part',
    'of the input contract: this CLI always prompts interactively on',
    'stdin/stdout through the Wagner and Burden KOs\' own questionnaire',
    'runners to collect them.'
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

  const result = await executeKnowledgeAssembly(request);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Unhandled error: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
