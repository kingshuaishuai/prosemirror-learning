import crel from "crelt";
import type { Node as PMNode, NodeSpec } from "prosemirror-model";
import { Command } from "prosemirror-state";
import { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view';
import 'highlight.js/styles/dark.min.css';

export const codeBlock: NodeSpec = {
  content: 'text*',
  group: 'block',
  inline: false,
  marks: '',
  code: true,
  defining: true,
  isolating: false,
  draggable: false,
  selectable: true,

  attrs: {
    language: {
      default: 'plaintext'
    },
    theme: {
      default: 'dark'
    },
    showLineNumber: {
      default: true
    },
  },

  toDOM(node) {
    return ['pre', {
      'data-language': node.attrs.language,
      'data-theme': node.attrs.theme,
      'data-show-line-number': node.attrs.showLineNumber,
      'data-node-type': 'code_block',
    }, ['code', 0]]
  },

  parseDOM: [
    {
      tag: 'pre',
      preserveWhitespace: 'full',
      getAttrs(node) {
        const domNode = node as HTMLElement;
        return {
          language: domNode.getAttribute('data-language'),
          theme: domNode.getAttribute('data-theme'),
          showLineNumber: domNode.getAttribute('data-show-line-number')
        }
      }
    }
  ]
}

export const createCodeBlockCmd: Command = (state, dispatch, view) => {
  // 上次使用的 langguage
  const lastLanguage = state.schema.cached.lastLanguage || 'plaintext';

  const { block_tile, code_block } = state.schema.nodes;
  const codeBlockNode = block_tile.create({}, code_block.create({ language: lastLanguage }));

  let tr = state.tr;
  tr.replaceSelectionWith(codeBlockNode);
  tr.scrollIntoView();

  if (dispatch) {
    dispatch(tr)
    return true
  }
  return false;
}

export class CodeBlockView implements NodeView {
  name = 'block_code';

  private view: EditorView;
  private getPos: () => number | undefined;

  constructor(...args: Parameters<NodeViewConstructor>) {
    const [node, view, getPos] = args;
    
    this.view = view;
    this.getPos = getPos;
    this.node = node;

    this.renderUI(node)

  }
  
  dom!: Node;
  contentDOM!: HTMLElement;
  node!: PMNode;

  update(...params: Parameters<Required<NodeView>['update']>) {
    const [node] = params;
    this.node = node;
    if (node.type.name !== 'code_block') {
      return false;
    }

    this.updateUI(node);

    return true;
  };

  /**
   * 渲染 ui
   * @param node 
   */
  private renderUI(node: PMNode) {
    // pre-wrapper
    this.dom = crel('pre', {
      'data-language': node.attrs.language,
      'data-theme': node.attrs.theme,
      'data-show-line-number': node.attrs.showLineNumber,
      'data-node-type': 'code_block',
    })

    // code-meanu
    const menuContainer = crel('div', 
      {
        class: 'code-block-memu-container',
      },
      crel('div', 
        {
          class: 'code-block-menu',
        }, 
        crel('select', {
          class: 'code-name-select',
          onchange: (event: Event) => {
            const { state, dispatch } = this.view;
            const language = (event.target as HTMLSelectElement).value;
            const pos = this.getPos();
            this.view.state.schema.cached.lastLanguage = language;
            if (pos) {
              const tr = state.tr.setNodeAttribute(pos, 'language', language);
              dispatch(tr);
              setTimeout(() => this.view.focus(), 16);
            }
          }
        }, ['plaintext','javascript', 'html', 'markdown', 'typescript', 'python', 'java'].map(item => crel('option', { value: item, selected: item === node.attrs.language }, item))), 
        crel('div', {
          class: 'code-menu-right'
        }, 
          crel('select', 
            { 
              class: 'show-line-number-select',
              onchange: (event: Event) => {
                const { state, dispatch } = this.view;
                const showLineNumber = (event.target as HTMLSelectElement).value === 'true';
                const pos = this.getPos();
                if (pos) {
                  const tr = state.tr.setNodeAttribute(pos, 'showLineNumber', showLineNumber);
                  dispatch(tr);
                  setTimeout(() => this.view.focus(), 16)
                }
              }
            }, 
            [{value: 'true', label: '展示行号'},{value: 'false', label: '隐藏行号'}].map(item => (
              crel('option', {
                selected: item.value === node.attrs.showLineNumber.toString(),
                value: item.value
                
              }, item.label)
            ))
          ),
          crel('button', {
            class: 'copy-btn',
            onmousedown: () => {
              navigator.clipboard.writeText(this.node.textContent).then(() => {
                alert("copied!")
              })
            }
          }, 'copy')
        )
      )
    )

    // content dom
    const code = crel('code', {
      class: `code-block language-typescript ${node.attrs.showLineNumber ? 'show-line-number' : ''}`,
      lang: node.attrs.language
    })

    this.contentDOM = code;

    this.dom.appendChild(menuContainer)
    this.dom.appendChild(code)
  }

  /**
   * 更新 ui
   * @param node 
   */
  private updateUI(node: PMNode) {
    const {showLineNumber, language} = node.attrs;
    const showLineNumberClass = 'show-line-number'
    if (showLineNumber && !this.contentDOM.classList.contains(showLineNumberClass)) {
      this.contentDOM.classList.add(showLineNumberClass)
    }
    if (!showLineNumber && this.contentDOM.classList.contains(showLineNumberClass)) {
      this.contentDOM.classList.remove(showLineNumberClass)
    }

    this.contentDOM.dataset.lang = language;
  }
}

export const codeBlockViewConstructor: NodeViewConstructor = (...args) => new CodeBlockView(...args)

