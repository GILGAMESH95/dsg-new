import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export function RichText({ data }: { data: unknown }) {
  if (!data) return null
  return (
    <div className="prose">
      <LexicalRichText data={data as SerializedEditorState} />
    </div>
  )
}
