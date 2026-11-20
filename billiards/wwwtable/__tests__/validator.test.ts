/**
 * validator.test.ts — 输入校验工具测试
 */
import { describe, it, expect } from 'vitest'
import { Validator, phoneRules, passwordRules, tableCodeRules } from '../src/utils/validator'

describe('Validator.isPhone', () => {
  it('正确 11 位手机号', () => {
    expect(Validator.isPhone('13800138000')).toBe(true)
  })

  it('第二位数不在3-9', () => {
    expect(Validator.isPhone('12000138000')).toBe(false)
    expect(Validator.isPhone('11000138000')).toBe(false)
  })

  it('少于 11 位', () => {
    expect(Validator.isPhone('1380013800')).toBe(false)
  })

  it('多于 11 位', () => {
    expect(Validator.isPhone('138001380001')).toBe(false)
  })

  it('含非数字字符', () => {
    expect(Validator.isPhone('1380013800a')).toBe(false)
  })

  it('空字符串', () => {
    expect(Validator.isPhone('')).toBe(false)
  })
})

describe('Validator.isPassword', () => {
  it('6位密码 → 合法', () => {
    expect(Validator.isPassword('123456')).toBe(true)
  })

  it('5位密码 → 不合法', () => {
    expect(Validator.isPassword('12345')).toBe(false)
  })

  it('空字符串 → 不合法', () => {
    expect(Validator.isPassword('')).toBe(false)
  })
})

describe('Validator — 规则模式', () => {
  it('phoneRules: 合法手机号', () => {
    expect(Validator.validate('13800138000', phoneRules).valid).toBe(true)
  })

  it('phoneRules: 非法手机号', () => {
    expect(Validator.validate('12345', phoneRules).valid).toBe(false)
  })

  it('passwordRules: 6位密码', () => {
    expect(Validator.validate('123456', passwordRules).valid).toBe(true)
  })

  it('passwordRules: 短密码', () => {
    expect(Validator.validate('123', passwordRules).valid).toBe(false)
  })

  it('tableCodeRules: 6位数字', () => {
    expect(Validator.validate('123456', tableCodeRules).valid).toBe(true)
  })

  it('tableCodeRules: 非6位', () => {
    expect(Validator.validate('1234', tableCodeRules).valid).toBe(false)
  })

  it('tableCodeRules: 含字母', () => {
    expect(Validator.validate('12345a', tableCodeRules).valid).toBe(false)
  })

  it('tableCodeRules: 空值', () => {
    expect(Validator.validate('', tableCodeRules).valid).toBe(false)
  })
})

describe('Validator.isNotEmpty', () => {
  it('null → false', () => expect(Validator.isNotEmpty(null)).toBe(false))
  it('空字符串 → false', () => expect(Validator.isNotEmpty('')).toBe(false))
  it('纯空格 → false', () => expect(Validator.isNotEmpty('   ')).toBe(false))
  it('非空 → true', () => expect(Validator.isNotEmpty('hello')).toBe(true))
  it('空数组 → false', () => expect(Validator.isNotEmpty([])).toBe(false))
  it('非空数组 → true', () => expect(Validator.isNotEmpty([1])).toBe(true))
})

describe('Validator.isNumber', () => {
  it('纯数字字符串 → true', () => expect(Validator.isNumber('123')).toBe(true))
  it('含字母 → false', () => expect(Validator.isNumber('123a')).toBe(false))
  it('小数 → false', () => expect(Validator.isNumber('12.3')).toBe(false))
  it('空 → false', () => expect(Validator.isNumber('')).toBe(false))
})
