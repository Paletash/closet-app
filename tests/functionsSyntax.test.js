import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { stripTypeScriptTypes } from 'node:module'

test('Edge Function TypeScript parses (syntax only, not Deno type checking)', () => {
  const root = new URL('../supabase/functions/', import.meta.url)
  const files = fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
  assert.ok(files.length >= 6)
  for (const file of files) {
    const source = fs.readFileSync(new URL(file.split(path.sep).join('/'), root), 'utf8')
    assert.doesNotThrow(() => stripTypeScriptTypes(source), file)
  }
})
