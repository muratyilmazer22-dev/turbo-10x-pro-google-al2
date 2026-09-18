import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const sourcePath = new URL('../data.json', import.meta.url)
const legacy = JSON.parse(await fs.readFile(sourcePath, 'utf8'))
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli')

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const rows = []
for (const [category, value] of Object.entries(legacy)) {
  if (category === 'last_tjk_sync_date') {
    rows.push({ source: 'google-ai-studio-export', category, record_key: category, payload: { value } })
    continue
  }
  if (Array.isArray(value)) {
    value.forEach((payload, index) => rows.push({ source: 'google-ai-studio-export', category, record_key: `${category}:${index}:${hash(payload)}`, payload }))
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([keyName, payload]) => rows.push({ source: 'google-ai-studio-export', category, record_key: `${category}:${keyName}`, payload }))
  }
}

for (let i = 0; i < rows.length; i += 500) {
  const { error } = await supabase.from('memory_archive').upsert(rows.slice(i, i + 500), { onConflict: 'source,category,record_key' })
  if (error) throw error
  console.log(`Imported ${Math.min(i + 500, rows.length)}/${rows.length}`)
}
console.log(`Imported ${rows.length} legacy memory records from data.json`)

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)
}
