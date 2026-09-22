import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { ehConflito409 } from './conflito-409'

const erroAxios = (status: number) =>
  new AxiosError('erro', undefined, undefined, undefined, {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: null,
  })

describe('ehConflito409', () => {
  it('true pra AxiosError com status 409', () => {
    expect(ehConflito409(erroAxios(409))).toBe(true)
  })

  it('false pra AxiosError com outro status (ex.: 404)', () => {
    expect(ehConflito409(erroAxios(404))).toBe(false)
  })

  it('false pra erro que não é do axios', () => {
    expect(ehConflito409(new Error('erro qualquer'))).toBe(false)
  })

  it('false pra valores não-erro (null, undefined, string)', () => {
    expect(ehConflito409(null)).toBe(false)
    expect(ehConflito409(undefined)).toBe(false)
    expect(ehConflito409('erro')).toBe(false)
  })
})
