import { EditorState, Plugin, PluginKey, PluginView } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

const DOC_CHANGED_TIMES_KEY = new PluginKey('doc-changed-times')

export const docChangedTimesPlugin = (options?: {
  onlyContentChanged?: boolean,
}) => {
  const { onlyContentChanged = true } = options || {};
  return new Plugin({
    key: DOC_CHANGED_TIMES_KEY,
    state: {
      init() {
        return {
          times: 0,
        }
      },
      apply(tr, value, oldState, newState) {
        const ediorView: EditorView | undefined = newState.schema.cached.view;
        // tr.docChanged 表示文档内容有修改，如果只是修改 node 的 attrs 则它为 false
        // ediorView.composing 代表当前正在输入中文拼音，此时的输入不计数
        // 上面两种情况不增加修改次数
        if ((onlyContentChanged && !tr.docChanged) || (ediorView && ediorView.composing)) {
          return value
        }

        const times = value.times + 1;

        return {
          ...value,
          times
        }
      }
    },
    view: (view) => new DocChangedView(view)
  })
}

/**
 * 类似 Toolbar 的实现，添加一个 dom，用来展示当前文档修改了几次
 */
class DocChangedView implements PluginView{
  constructor(private view: EditorView) {
    const dom = document.createElement('div');
    dom.classList.add('editor-footer');
    this.dom = dom;

    const span = document.createElement('span');
    this.recordChangedTimesDom = span;
    this.updateTimesView(this.view.state)

    dom.appendChild(this.recordChangedTimesDom);
    this.render(view);
    
    // 将 view 添加到 schema 的 cached 中，方便后续在 apply 中使用，因为 apply 中无法获取 editorView
    // 这里巩固之前讲 schema 时候的知识
    if (!view.state.schema.cached.view) {
      view.state.schema.cached.view = view;
    }
  }

  private dom: HTMLElement;
  private recordChangedTimesDom: HTMLElement;

  private render(view:EditorView) {
     // 获取编辑器根元素的父元素，将 dom 添加在编辑器后面
    const viewParent = view.dom.parentNode;
    viewParent?.appendChild(this.dom);
  }

  // 通过 PluginKey.getState 可以获取到插件的 state，此时更新修改次数
  private updateTimesView(state: EditorState) {
    this.recordChangedTimesDom.innerText = `文档被修改了 ${DOC_CHANGED_TIMES_KEY.getState(state).times} 次`
  }

  update(view: EditorView, state: EditorState) {
    this.updateTimesView(view.state);
  }

  destroy() {
    this.dom.remove();
  }
}
