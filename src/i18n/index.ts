import 'server-only'

import type { Locale } from './config'
import { en } from './dictionaries/en'
import { ka } from './dictionaries/ka'
import { ru, type Dictionary } from './dictionaries/ru'

const dictionaries: Record<Locale, Dictionary> = { ka, ru, en }

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale]
export type { Dictionary }
