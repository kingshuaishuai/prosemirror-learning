import './style.css'
import { setupEditor } from './first-demo/view'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div>
    <h3>从第一个 prosemirror 案例开始认识它</h3>
    <div id="editorContainer"></div>
  </div>
`

setupEditor(document.querySelector('#editorContainer'))