'use client'

import * as Accordion from '@radix-ui/react-accordion'

/** Вопросы и ответы: аккордеон Radix (как в shadcn/ui) — плавное раскрытие и управление с клавиатуры */
export function FaqAccordion({ items }: { items: { id: string | number; question: string; answer: string }[] }) {
  return (
    <Accordion.Root type="single" collapsible className="faq-list">
      {items.map((item) => (
        <Accordion.Item key={item.id} value={String(item.id)} className="faq-item faq-item--ui">
          <Accordion.Header asChild>
            <h3 className="faq-item__head">
              <Accordion.Trigger className="faq-item__trigger">
                <span>{item.question}</span>
                <i aria-hidden />
              </Accordion.Trigger>
            </h3>
          </Accordion.Header>
          <Accordion.Content className="faq-item__content">
            <p>{item.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
