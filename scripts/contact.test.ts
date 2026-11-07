import { describe, expect, it } from 'vitest'
import { cleanEmail, cleanPhone, emailError, nameError, phoneError, textError } from '../utils/contact'

describe('cleanPhone', () => {
  it.each([
    ['949*201#1190', '9492011190'],
    ['(949) 201-4471', '(949) 201-4471'],
    ['+1 949.201.4471', '+1 949.201.4471'],
    ['94+92+01', '949201'],
    ['abc😀<>', ''],
  ])('%j becomes %j', (input, output) => {
    expect(cleanPhone(input)).toBe(output)
  })
})

describe('cleanEmail', () => {
  it.each([
    ['na*me@example.com', 'name@example.com'],
    ['jenna moore@yahoo.com', 'jennamoore@yahoo.com'],
    ['first.last+tag@mail.example.co', 'first.last+tag@mail.example.co'],
    ['<a>😀@b.co', 'a@b.co'],
  ])('%j becomes %j', (input, output) => {
    expect(cleanEmail(input)).toBe(output)
  })
})

describe('nameError', () => {
  it.each(["Kevin O'Neil", 'Kevin O’Neil', 'Tom & Rachel Nguyen', 'María-José Núñez', 'Robert Kim Jr.', 'Smith, Jr.', '  Lee  ', ''])('accepts %j', (v) => {
    expect(nameError(v)).toBe('')
  })
  it.each(['<script>', 'Maria😀', 'Bob123', 'a@b', '---', '{name}'])('rejects %j', (v) => {
    expect(nameError(v)).not.toBe('')
  })
  it('names the character to remove', () => {
    expect(nameError('Maria<>')).toBe("Names can't include: < >")
  })
})

describe('textError', () => {
  it.each([
    "AC isn't working in #12, 3rd floor — it's 95°F!",
    'Friendly dog (bedroom)',
    'Weekdays after 3pm / 50% chance: call first.',
    'Shower / tub',
    "I don't know",
    'I paid $50 for the part',
    'See photo_1 in my email',
    'Line one\nLine two',
    '',
  ])('accepts %j', (v) => {
    expect(textError(v)).toBe('')
  })
  it.each(['<b>hi</b>', 'leak 😀', 'a{b}', '[x]', 'back\\slash', '!!!'])('rejects %j', (v) => {
    expect(textError(v)).not.toBe('')
  })
})

describe('emailError', () => {
  it.each(['name@example.com', 'first.last+tag@mail.example.co', 'NAME@EXAMPLE.COM', ''])('accepts %j', (v) => {
    expect(emailError(v)).toBe('')
  })
  it.each(['denise.carter@gmail', 'jenna moore@yahoo.com', 'a<b>@example.com', 'name@exa_mple.com', 'name@@example.com', `${'a'.repeat(250)}@example.com`])('rejects %j', (v) => {
    expect(emailError(v)).not.toBe('')
  })
})

describe('phoneError', () => {
  it.each(['(949) 201-4471', '949-201-1190', '9492013345', '949.201.4471', '1 949 201 4471', '+1 949 201 4471', '+19492014471', ''])('accepts %j', (v) => {
    expect(phoneError(v)).toBe('')
  })
  it.each([
    '949-410', // too short
    '949x201x1190',
    '94+92013345',
    '<9492013345>',
    '0000000000',
    '1234567890', // area code can't start with 0 or 1 (reads as 1 + 9 digits)
    '049-201-4471', // area code starts with 0
    '949-101-4471', // next three digits start with 1
    '2949-201-4471', // 11 digits not starting with 1
    '+44 7911 123456', // foreign
    '+49 1234 5678', // foreign, even though it happens to have 10 digits
  ])('rejects %j', (v) => {
    expect(phoneError(v)).not.toBe('')
  })
})
