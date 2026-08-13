#!/usr/bin/env node
'use strict';

const readline = require('node:readline');
const { stdin, stdout, stderr } = require('node:process');

const {
  showRegimenRange,
  runBurdenQuestionnaire,
  calculateBurdenRange
} = require('../src');

function formatJsonCompactArrays(value, indentSize = 2, depth = 0) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }

    const indent = ' '.repeat(indentSize * depth);
    const childIndent = ' '.repeat(indentSize * (depth + 1));
    const body = entries
      .map(
        ([key, child]) =>
          `${childIndent}${JSON.stringify(key)}: ${formatJsonCompactArrays(child, indentSize, depth + 1)}`
      )
      .join(',\n');

    return `{\n${body}\n${indent}}`;
  }

  return JSON.stringify(value);
}

function createPrompter() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout
  });

  const askLine = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

  const askQuestion = async (question) => {
    while (true) {
      stdout.write(`\n${question.id}: ${question.text}\n`);
      const raw = await askLine(`${question.prompt} `);
      const value = String(raw || '').trim();

      if (value.length === 0) {
        stdout.write('Please provide a value.\n');
        continue;
      }

      if (question.id === 'Q02' || question.id === 'Q03') {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          stdout.write('Please enter a numeric value.\n');
          continue;
        }
        return numeric;
      }

      return value;
    }
  };

  const close = () => rl.close();

  return { askQuestion, close };
}

async function main() {
  const { askQuestion, close } = createPrompter();

  try {
    stdout.write('DFU HBOT bounded regimen and execution burden CLI\n\n');

    const regimenRangeResponse = showRegimenRange({
      request_type: 'show_regimen_range'
    });

    const questionnaireResponse = await runBurdenQuestionnaire(askQuestion);

    const analysisResult = calculateBurdenRange({
      request_type: 'calculate_burden_range',
      provider_roster_version_iri:
        'https://kgrid.org/cks/dfu-hbot-burden/provider-rosters/appendix-e/versions/1.0',
      questionnaire_response: questionnaireResponse,
      fixed_regimen_range_response: regimenRangeResponse
    });

    stdout.write('\nFixed Regimen Range Response\n');
    stdout.write(formatJsonCompactArrays(regimenRangeResponse) + '\n');

    stdout.write('\nCompleted Questionnaire Response\n');
    stdout.write(formatJsonCompactArrays(questionnaireResponse) + '\n');

    stdout.write('\nBurden Analysis Result\n');
    stdout.write(formatJsonCompactArrays(analysisResult) + '\n');

    close();
    process.exitCode = 0;
  } catch (error) {
    close();
    stderr.write((error && error.message ? error.message : String(error)) + '\n');
    process.exitCode = 1;
  }
}

main();
