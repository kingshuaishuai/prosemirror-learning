import { MarkType } from "prosemirror-model";
import { NodeSelection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// function isNodeSelection(selection: unknown): selection is NodeSelection {
//   return selection instanceof NodeSelection;
// }

function isTextSelection(selection: unknown): selection is TextSelection {
  return selection instanceof TextSelection;
}

function setMark(
  view: EditorView,
  markRaw: {
    type: MarkType | string,
    attrs?: Record<string, any>
  }
) {
  const { state, dispatch } = view;
  const { tr, } = state;
  const schema = state.schema;
  let markType = typeof markRaw.type === 'string' ? schema.marks[markRaw.type] : markRaw.type;

  if (isMarkActive(view, markType)) return false;

  const mark = schema.mark(markRaw.type, markRaw.attrs);
  const { $from, $to, empty } = state.selection;

  let newTr: Transaction;
  if (empty) {
    const storedMarks = tr.storedMarks || [];
    if (storedMarks.find(m => m.type === markType)) {
      return false;
    } else {
      newTr =tr.setStoredMarks([...storedMarks,mark])
    }
  } else {
    newTr = tr.addMark($from.pos, $to.pos, mark);
  }

  dispatch(newTr);
  return true;
}

function unsetMark(view: EditorView, type: MarkType) {
  const { state } = view;

  const { selection, tr } = state;
  const { $from, empty, ranges } = selection;

  let newTr = tr;

  if (empty && type.isInSet(tr.storedMarks || $from.marks())) {
    newTr = tr.removeStoredMark(type);
    view.dispatch(newTr);
    return true
  }

  ranges.forEach(range => {
    newTr = tr.removeMark(range.$from.pos, range.$to.pos, type);
  })

  view.dispatch(newTr);

  return true;
}

function isMarkActive(view: EditorView, type: MarkType) {
  const { state } = view;
  const { selection, tr } = state;

  const { $from, $to, ranges } = selection;

  let allMarked = true;

  if (!isTextSelection(selection)) {
    return false;
  }

  if (selection.empty) {
    const isInset = type.isInSet(tr.storedMarks || $from.marks())
    
    if (isInset) return true;

    return false;
  }

  tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
    if (!node.isInline) return;

    const hasTargetMark = node.marks.some(mark => mark.type === type)

    if (!hasTargetMark) {
      allMarked = false;
    }
  })

  return allMarked
}

function canSetMark(view: EditorView, type: MarkType) {
  const { ranges, empty, $cursor } = view.state.selection as TextSelection;
  const tr = view.state;

  if (empty && $cursor) {
    return $cursor.parent.inlineContent && $cursor.parent.type.allowsMarkType(type)
  }

  let canSet = false;
  // 如果所选范围里
  // 1. 只要包含不能设置 mark 的内容，就不允许
  // 2. 全部内容都不能设置，才不允许 ✅
  for(let i = 0; i < ranges.length; i++) {
    const {$from, $to} = ranges[i];

    tr.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (canSet) return false;
      if (node.inlineContent) {
        canSet = node.type.allowsMarkType(type)
      }
    })

    if (canSet) break;
  }
  
  return canSet
}

export function isBold(view: EditorView) {
  const boldType = view.state.schema.marks.bold;

  return isMarkActive(view, boldType)
}

export function setBold(view: EditorView) {
  const boldType = view.state.schema.marks.bold;
    
  return setMark(view, {
    type: boldType
  })
}

export function unsetBold(view: EditorView) {
  const boldType = view.state.schema.marks.bold;
  return unsetMark(view, boldType)
}

export function toggleBold(view: EditorView) {
  const boldType = view.state.schema.marks.bold;
  
  if (isMarkActive(view, boldType)) {
    return unsetBold(view)
  } else {
    return setBold(view)
  }
}

export function isAllowBold(view: EditorView) {
  const boldType = view.state.schema.marks.bold;

  return canSetMark(view, boldType)
}

export function isItalic(view: EditorView) {
  const italicType = view.state.schema.marks.italic;

  return isMarkActive(view, italicType)
} 

export function setItalic(view: EditorView) {
  const italicType = view.state.schema.marks.italic;
  return setMark(view, { type: italicType })
}

export function unsetItalic(view: EditorView) {
  const italicType = view.state.schema.marks.italic;
  return unsetMark(view, italicType)
}

export function toggleItalic(view: EditorView) {
  const italicType = view.state.schema.marks.italic;
  
  if (isMarkActive(view, italicType)) {
    return unsetItalic(view)
  } else {
    return setItalic(view)
  }
}

export function isAllowItalic(view: EditorView) {
  const italicType = view.state.schema.marks.italic;

  return canSetMark(view, italicType)
}