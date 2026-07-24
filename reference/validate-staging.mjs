#!/usr/bin/env node

import {runValidationCli} from '../method/validate-signals.mjs';

await runValidationCli(process.argv.slice(2));
