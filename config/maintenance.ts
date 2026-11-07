/**
 * Everything staff might want to change about the request form lives here.
 * Adding a category, question, status or source only needs an edit to this file.
 */

export const EMERGENCY_PHONE = '(000) 000-0000'

export const EMERGENCY_TEXT = `Gas smell, flooding, or no AC when it's above 90°F? Don't use this form — call ${EMERGENCY_PHONE} now.`

export type FollowUp = {
  id: string
  question: string
  type: 'select' | 'text'
  options?: string[]
  /** Show the emergency notice when the tenant picks this answer. */
  emergencyIf?: string
}

export type Category = {
  label: string
  /** Icon on the category button in the form: a name from components/Icon.vue. */
  icon?: string
  followUps: FollowUp[]
  /** Safe things to try before submitting. */
  selfCheck?: string[]
}

export const CATEGORIES: Record<string, Category> = {
  ac_heating: {
    label: 'AC / heating',
    icon: 'snowflake',
    followUps: [
      { id: 'symptom', question: 'Is it blowing warm air, or not turning on at all?', type: 'select', options: ['Blowing warm air', 'Not turning on at all', 'Something else'] },
      { id: 'filter', question: 'When did you last change the filter?', type: 'select', options: ['In the last 3 months', 'More than 3 months ago', "I don't know"] },
    ],
    selfCheck: [
      'Check the thermostat is set to Cool or Heat (not Off or Fan) and the temperature setting is right.',
      'Replace the thermostat batteries if the screen is blank.',
      'Check the breaker panel for a tripped AC or furnace breaker and switch it fully off, then on.',
    ],
  },
  plumbing: {
    label: 'Plumbing',
    icon: 'droplets',
    followUps: [
      { id: 'leaking_now', question: 'Is water leaking right now?', type: 'select', options: ['Yes', 'No'], emergencyIf: 'Yes' },
      { id: 'fixture', question: 'Which fixture?', type: 'select', options: ['Kitchen sink', 'Bathroom sink', 'Toilet', 'Shower / tub', 'Water heater', 'Other'] },
    ],
  },
  electrical: {
    label: 'Electrical',
    icon: 'zap',
    followUps: [
      { id: 'scope', question: 'Is it one outlet/light, a whole room, or the whole unit?', type: 'select', options: ['One outlet or light', 'A whole room', 'The whole unit'] },
    ],
    selfCheck: [
      'Press the reset button on the GFCI outlet (usually in the kitchen or bathroom).',
      'Check the breaker panel for a tripped breaker and switch it fully off, then on.',
    ],
  },
  pest: {
    label: 'Pest',
    icon: 'bug',
    followUps: [
      { id: 'pest_type', question: 'What kind of pest?', type: 'select', options: ['Ants', 'Roaches', 'Rodents', 'Bed bugs', 'Other'] },
      { id: 'where', question: 'Where have you seen them?', type: 'text' },
    ],
  },
  appliance: {
    label: 'Appliance',
    icon: 'refrigerator',
    followUps: [
      { id: 'appliance', question: 'Which appliance?', type: 'select', options: ['Fridge', 'Stove / oven', 'Dishwasher', 'Washer', 'Dryer', 'Microwave', 'Other'] },
    ],
  },
  door_lock: {
    label: 'Door / lock',
    icon: 'key-round',
    followUps: [
      { id: 'locked_out', question: 'Are you locked out or unable to secure the unit?', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  other: {
    label: 'Other',
    icon: 'circle-ellipsis',
    followUps: [],
  },
}

export const STATUSES: Record<string, string> = {
  new: 'New',
  scheduled: 'Scheduled',
  waiting_on_vendor: 'Waiting on vendor',
  done: 'Done',
}

/** Badge colour for each status. A status with no colour here shows as gray. */
export const STATUS_TONES: Record<string, 'blue' | 'violet' | 'amber' | 'green'> = {
  new: 'blue',
  scheduled: 'violet',
  waiting_on_vendor: 'amber',
  done: 'green',
}

export const SOURCES: Record<string, string> = {
  form: 'Online form',
  phone: 'Phone',
  text: 'Text',
  in_person: 'In person',
}

export const MAX_PHOTOS = 3

/** Requests per page on the dashboard. 12 fills whole rows at 1, 2 and 3 columns. */
export const PAGE_SIZE = 12

/** Every date and time in the app is shown in this time zone (US Eastern). */
export const TIME_ZONE = 'America/New_York'
