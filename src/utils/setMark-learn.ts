import { Attrs, MarkType } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

function setMark(view: EditorView, markType: MarkType | string, attrs: Attrs | null = null) {
  const { schema, selection, tr } = view.state;
  const { $from, $to } = selection;

  const mark = schema.mark(markType, attrs)

  tr.addMark($from.pos, $to.pos, mark)
}
