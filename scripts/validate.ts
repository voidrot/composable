import fs from 'fs-extra';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { glob } from 'glob';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

async function validate() {
  const fragmentSchema = await fs.readJson(path.join(process.cwd(), 'schemas', 'fragment.schema.json'));
  const stackSchema = await fs.readJson(path.join(process.cwd(), 'schemas', 'stack.schema.json'));

  const validateFragment = ajv.compile(fragmentSchema);
  const validateStack = ajv.compile(stackSchema);

  let hasErrors = false;

  // Validate fragments
  const fragments = await glob('fragments/compose/*.json');
  console.log(`Validating ${fragments.length} fragments...`);
  for (const file of fragments) {
    const data = await fs.readJson(file);
    const valid = validateFragment(data);
    if (!valid) {
      console.error(`Error in ${file}:`);
      console.error(ajv.errorsText(validateFragment.errors));
      hasErrors = true;
    }
  }

  // Validate stacks
  const stacks = await glob('stacks/*.json');
  console.log(`Validating ${stacks.length} stacks...`);
  for (const file of stacks) {
    const data = await fs.readJson(file);
    const valid = validateStack(data);
    if (!valid) {
      console.error(`Error in ${file}:`);
      console.error(ajv.errorsText(validateStack.errors));
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log('Validation successful!');
  }
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
