// 写文章时候重新写的代码
// TODO: 一些直接使用 selection 的 $from $to 需要更新为 通过 ranges 遍历
import { Attrs, MarkType, Schema } from "prosemirror-model";
import { Command, TextSelection } from 'prosemirror-state';
import { EditorView } from "prosemirror-view";

function getMarkType(markType: MarkType | string, schema: Schema) {
  return typeof markType === 'string' ? schema.marks[markType] : markType;
}

function isTextSelection(selection: unknown): selection is TextSelection {
  return selection instanceof TextSelection;
}

/**
 * 设置 mark
 * 
 * @param view 
 * @param markType 
 * @param attrs 
 */
export function setMark(view: EditorView, markType: MarkType | string, attrs: Attrs | null = null) {
  const { schema, selection, tr } = view.state;
  const { $from, $to, empty } = selection;

  const realMarkType = getMarkType(markType, schema);
  const mark = realMarkType.create(attrs);

  // 光标状态，如果 storedMarks 里没有 当前 mark，就把当前 mark 加进去
  if (empty) {
    if (!realMarkType.isInSet((tr.storedMarks || $from.marks()))) {
      tr.addStoredMark(mark)
    }
  } else {
    // 否则再执行之前的逻辑
    tr.addMark($from.pos, $to.pos, mark);
  }

  view.dispatch(tr);

  return true;
}

/**
 * 取消 mark
 * 
 * @param view 
 * @param markType 
 */
export function unsetMark(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;
  const { $from, $to, empty } = selection;
  
  const type = getMarkType(markType, schema);

  // 如果处于光标模式，查看是否有 StoredMark，有的话移除（此时如果是 $from.marks() 中有，此 api 也能移除）
  if (empty) {
    if (type.isInSet(tr.storedMarks || $from.marks())) {
      tr.removeStoredMark(type)
    }
  } else {
    tr.removeMark($from.pos, $to.pos, type);
  }

  view.dispatch(tr)

  return true;
}

/**
 * 选区内所有的内容都被设置了 mark，那就是 active
 * 
 * @param view 
 * @param markType 
 */
export function isMarkActive(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;

  // 暂时规定：如果不是文本选区，就不能设置 mark
  if (!isTextSelection(selection)) {
    return false;
  }

  const { $from, $to, empty } = selection;
  
  const realMarkType = getMarkType(markType, schema);

  let isActive = true;

  // 增加 光标情况下，判断当前是否处于 markType 下
  if (empty) {
    if (!realMarkType.isInSet((tr.storedMarks || $from.marks()))) {
      isActive = false;
    }
  } else {
    tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (!isActive) return false;
      if (node.isInline) {
        const mark = realMarkType.isInSet(node.marks)
        if (!mark) {
          isActive = false;
        }
      }
    })
  }
  
  return isActive;
}

/**
 * toggle mark
 * 
 * @param view 
 * @param markType 
 * @returns 
 */
export function toggleMark(view: EditorView, markType: MarkType | string) {
  if (isMarkActive(view, markType)) {
    return unsetMark(view, markType)
  } else {
    return setMark(view, markType)
  }
}

/**
 * 当前是否能设置某个 mark
 * 
 * @param view 
 * @param markType 
 * @returns 
 */
export function canSetMark(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;

  // 非文本选区，不可以设置 mark
  if (!isTextSelection(selection)) return false;

  const { $cursor, empty, ranges } = selection;
  
  const realMarkType = getMarkType(markType, schema);

  let canSet = false;
  // 先处理 empty
  if (empty) {
    if ($cursor && $cursor.parent.type.allowsMarkType(realMarkType)) {
      canSet = true;
    }
  } else {
    for (let i = 0; !canSet && i < ranges.length; i++) {
      const { $from, $to } = ranges[i];
      tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
        // 只要有能设置的文本，立刻停止遍历
        if (canSet) return false;
        if (node.inlineContent && node.type.allowsMarkType(realMarkType)) {
          canSet = true;
        }
      })
    }
  }
  return canSet;
}

export const toggleBoldCmd:Command = (state, dispatch, view) => {
  if (view) {
    return toggleMark(view, 'bold')
  }
  return false;
}