/** Общие списки значений для квартир: используются и в админке, и в фильтрах каталога */
export const finishValues = ['none', 'whiteFrame', 'renovated', 'furnished'] as const
export const featureValues = ['loggia', 'euro', 'bigKitchen', 'masterZone', 'corner', 'twoLevel', 'panoramic'] as const

export type Finish = (typeof finishValues)[number]
export type Feature = (typeof featureValues)[number]

export const finishLabelsRu: Record<Finish, string> = {
  none: 'Без отделки',
  whiteFrame: 'Белый каркас',
  renovated: 'С ремонтом',
  furnished: 'С мебелью',
}

export const featureLabelsRu: Record<Feature, string> = {
  loggia: 'Лоджия / балкон',
  euro: 'Евроформат',
  bigKitchen: 'Большая кухня',
  masterZone: 'Мастер-зона с гардеробной',
  corner: 'Угловая',
  twoLevel: 'Двухуровневая',
  panoramic: 'Панорамные окна',
}
