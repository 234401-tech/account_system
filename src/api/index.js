/**
 * API 추상화 레이어.
 *
 * VITE_API_BASE 환경변수가 있거나, Vite 프록시(/api)로 접근 가능하면
 * http 어댑터(실제 백엔드 REST)로 동작합니다.
 * 그렇지 않으면 mock 어댑터(메모리 + seed)로 동작합니다.
 */
import * as mock from "./mock.js";
import * as real from "./http.js";

const USE_REAL = import.meta.env.PROD || !!import.meta.env.VITE_API_BASE || import.meta.env.VITE_USE_BACKEND === "true";

const impl = USE_REAL ? real : mock;

export const api = impl;
