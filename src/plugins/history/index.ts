import RopeSequence from "rope-sequence";
import { Command, EditorState, Plugin, PluginKey, Transaction, SelectionBookmark } from 'prosemirror-state';
import { Step, StepMap } from 'prosemirror-transform'

export const historyPluginKey = new PluginKey('history');

class Item {
  constructor(
    // The (forward) step map for this item.
    readonly map: StepMap,
    // The inverted step
    readonly step?: Step,
    // If this is non-null, this item is the start of a group, and
    // this selection is the starting selection for the group (the one
    // that was active before the first step was applied)
    readonly selection?: SelectionBookmark,
    // If this item is the inverse of a previous mapping on the stack,
    // this points at the inverse's offset
    readonly mirrorOffset?: number
  ) {}

  merge(other: Item) {
    if (this.step && other.step && !other.selection) {
      let step = other.step.merge(this.step)
      if (step) return new Item(step.getMap().invert(), step, this.selection)
    }
  }
}

class Branch {
  constructor(readonly items: RopeSequence<Item>, readonly eventCount: number) {}
}

class HistoryStack {
  constructor(private size: number) {}
}

interface HistoryConfig {
  // 栈深度，即栈大小
  depth: number;
}

function applyTransaction(tr: Transaction, stack: HistoryStack, newState: EditorState, config: HistoryConfig) {
  // 处理当前 tr 中的数据，操作历史栈
  // ...

  // 返回操作后的栈
  return stack;
}

const undo: Command = (state, dispatch) => {
  // 具体 undo 逻辑
  return true;
}

const redo: Command = (state, dispatch) => {
  // 具体 redo 逻辑
  return true;
}

export function history(config: HistoryConfig): Plugin {
  const { depth = 100 } = config;
  return new Plugin({
    key: historyPluginKey,
    state: {
      init() {
        return new HistoryStack(depth)
      },
      apply(tr, oldStack, oldState) {
        return applyTransaction(tr, oldStack, oldState, config);
      }
    },
    props: {
      handleDOMEvents: {
        // 拦截 beforeinput，默认如果输入类型为 'historyUndo', 'historyRedo' 则拦截，实现 undo, redo 具体功能
        beforeinput(view, event) {
          const inputType = event.inputType;

          let command: Command | null;

          switch(inputType) {
            case 'historyUndo':
              command = undo;
              break;
            case 'historyRedo':
              command = redo;
              break;
            default:
              command = null;
          }

          if (!command) return false;

          event.preventDefault();
          
          return command(view.state, view.dispatch)
        }
      }
    }
  })
}