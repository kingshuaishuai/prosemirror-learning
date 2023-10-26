import { PluginKey, Plugin, Command, TextSelection } from "prosemirror-state"
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";
import { NodeWithPos, findNodesOfType } from "./utils";
import hljs from 'highlight.js'
import type { HLJSOptions, Emitter } from 'highlight.js'
import { findParentNode } from 'prosemirror-utils'
import crelt from "crelt";

interface TokenTreeEmitter extends Emitter {
  options: HLJSOptions;
  walk: (r: Renderer) => void;
}

type DataNode = { scope?: string; sublanguage?: boolean };

interface Renderer {
  addText: (text: string) => void;
  openNode: (node: DataNode) => void;
  closeNode: (node: DataNode) => void;
  value: RenderInfo[];
}

interface HighlightCodePluginState {
  decorations: DecorationSet
}

export const highlightCodePluginKey = new PluginKey<HighlightCodePluginState>('highlight-code');


interface RenderInfo {
  from: number;
  to: number;
  classNames: string[];
  scope: string;
}

class ProseMirrorRenderer implements Renderer{
  private currentPos: number;
  private finishedRenderInfos: RenderInfo[] = [];
  private trackingRenderInfoStack: RenderInfo[] = [];
  private classPrefix: string;
  
  constructor(tree: TokenTreeEmitter, blockStartPos: number) {
    this.currentPos = blockStartPos + 1;
    this.classPrefix = tree.options.classPrefix;

    tree.walk(this)
  }

  addText(text: string){
    if (text) {
      this.currentPos += text.length
    }
  }

  openNode(node: DataNode){
    // node.scope is className
    if (!node.scope) return;

    // create new render info, which corresponds to HTML open tag.
    const renderInfo = this.newRenderInfo({
      from: this.currentPos,
      classNames: node.scope.split('.').filter(item => item).map(item => this.classPrefix + item),
      scope: node.scope
    });
    
    // push tracking stack
    this.trackingRenderInfoStack.push(renderInfo)
  }

  closeNode(node: DataNode){
    if (!node.scope) return;
    const renderInfo = this.trackingRenderInfoStack.pop()
    if (!renderInfo) throw new Error("[highlight-code-plugin-error]: Cannot close node!")

    if (node.scope !== renderInfo.scope) throw new Error("[highlight-code-plugin-error]: Matching error!")

    renderInfo.to = this.currentPos;

    // finish a render info, which corresponds to html close tag.
    this.finishedRenderInfos.push(renderInfo)
  }

  newRenderInfo(info: Partial<RenderInfo>): RenderInfo {
    return {
      from: this.currentPos,
      to: -1,
      classNames: [],
      scope: '',
      ...info
    }
  }

  get value() {
    return this.finishedRenderInfos;
  }
  
}

/**
 * select all in code_block just select code inner content
 * 
 * @param state 
 * @param dispatch 
 * @returns 
 */
export const selectAllCodeCmd:Command = (state, dispatch) => {
  const { selection, tr } = state;

  const codeBlock = findParentNode(node => node.type.name === 'code_block')(selection);

  if (!codeBlock || !dispatch) return false;

  tr.setSelection(TextSelection.create(tr.doc, codeBlock.pos + 1, codeBlock.pos + codeBlock.node.nodeSize - 1))
  
  dispatch(tr);
  
  return true;
} 

/**
 * highlight code plugin
 * 
 * @returns 
 */
export function highlightCodePlugin() {
  function getDecs(doc: PMNode): Decoration[] {
    if (!doc || !doc.nodeSize) {
      return []
    }
    const blocks = findNodesOfType(doc, 'code_block');
    let decorations: Decoration[] = [];
    
    blocks.forEach(block => {
      let language: string = block.node.attrs.language;

      // show line number
      if (block.node.attrs.showLineNumber) {
        const lineNumberDecorations = createLineNumberDecorations(block);

        decorations = decorations.concat(lineNumberDecorations);
      }
      

      if (language && !hljs.getLanguage(language)) {
        language = 'plaintext'
      }
      const highlightResult = language 
        ? hljs.highlight(block.node.textContent, { language })
        : hljs.highlightAuto(block.node.textContent)

      
      const emmiter = highlightResult._emitter as TokenTreeEmitter;
      const renderer = new ProseMirrorRenderer(emmiter, block.pos);

      if (renderer.value.length) {
        const blockDecorations = renderer.value.map(renderInfo => Decoration.inline(renderInfo.from, renderInfo.to, {
          class: renderInfo.classNames.join(' '),
        }))

        decorations = decorations.concat(blockDecorations);
      }
    })

    return decorations;
  }

  function createLineNumberDecorations(block: NodeWithPos) {
    const textContent = block.node.textContent;

    const lineInfos = textContent.split('\n');
    
    let currentPos = block.pos + 1;

    const decorations: Decoration[] = lineInfos.map((item, index) => {
      const span = crelt('span', {class: 'line-number', line: `${index + 1}`}, "\u200B");

      const decoration = Decoration.widget(currentPos, (view) => span, {
        side: -1,
        ignoreSelection: true,
        destroy() {
          span.remove()
        }
      })

      currentPos += item.length + 1;

      return decoration
    });

    return decorations
  }

  return new Plugin({
    key: highlightCodePluginKey,
    state: {
      init(_, instance) {   
        const decorations = getDecs(instance.doc)
        return {
          decorations: DecorationSet.create(instance.doc, decorations)
        }
      },
      apply(tr, data, oldState, newState) {
        if (!tr.docChanged) return data;

        const decorations = getDecs(newState.doc)
        return {
          decorations: DecorationSet.create(tr.doc, decorations)
        }
      }
    },
    props: {
      decorations(state) {
        const pluginState = highlightCodePluginKey.getState(state);

        return pluginState?.decorations
      },
      handleKeyDown(view: EditorView, event: KeyboardEvent) {
        if (event.key === "Enter") {
          const { state, dispatch } = view;
          const { $head } = state.selection;
      
          // 如果光标位于文本的末尾，添加一个空行
          if ($head && $head.parentOffset === $head.parent.nodeSize - 1) {
            const tr = state.tr.insertText("\n", $head.pos);
            dispatch(tr);
            event.preventDefault();
          }
        }
      }
    }
  })
}
