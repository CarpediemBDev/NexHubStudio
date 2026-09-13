/**
 * 목업 모드 진입점. main.js 에서 VITE_USE_MOCK 일 때만 동적 import 되므로
 * 실제 빌드 번들에는 msw 가 포함되지 않는다.
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
