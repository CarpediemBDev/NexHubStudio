#!/usr/bin/env node
import { writeFile, mkdir } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// utils 모듈 경로
const utilsPath = resolve(__dirname, '../src/utils/generateMockUsers.js')
// 동적 import (ESM)
const { generateMockUsers } = await import(pathToFileURL(utilsPath).href)

// CLI 옵션 파싱: --count=100 --seed=42
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

const count = Number(args.count ?? 100)
const seed = Number(args.seed ?? 42)

// 데이터 생성
const users = generateMockUsers(count, { seed })

// public/db.json 경로
const outFile = resolve(__dirname, '../public/db.json')

// 폴더 생성 보장
await mkdir(dirname(outFile), { recursive: true })

// 파일 쓰기 (배열 형태)
await writeFile(outFile, JSON.stringify(users, null, 2), 'utf8')

console.log(`✅ Generated ${count} users → ${outFile} (seed=${seed})`)
