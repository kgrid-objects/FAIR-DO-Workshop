'use strict';

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const { runQuestionnaire } = require('./src/index');

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const result = await runQuestionnaire(async (question) => {
      const answer = await rl.question(`${question.id} ${question.text} (y/n): `);
      const normalized = String(answer).trim().toLowerCase();
      return normalized === 'y' || normalized === 'yes';
    });

    output.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.message || String(error)}\n`);
  process.exitCode = 1;
});