'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Editor as WangEditor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import TurndownService from 'turndown'

// window.localStorage.setItem('wangeditor-content', '')

interface EditorProps {
  value?: string
  onChange?: (html: string, markdown: string) => void
  placeholder?: string
}

export default function Editor({ value = '', onChange, placeholder = '请输入内容...' }: EditorProps) {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const [html, setHtml] = useState(value)

  // 初始化 Turndown (HTML to Markdown 转换器)
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  })

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
      'headerSelect',
      'bold',
      'italic',
      'underline',
      'through',
      '|',
      'color',
      'bgColor',
      '|',
      'bulletedList',
      'numberedList',
      'todo',
      '|',
      'fontSize',
      'lineHeight',
      '|',
      'emotion',
      'insertLink',
      'insertImage',
      'insertVideo',
      'insertTable',
      'codeBlock',
      'divider',
      '|',
      'undo',
      'redo',
      '|',
      'fullScreen',
    ],
  }

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    MENU_CONF: {
      // 配置上传图片
      uploadImage: {
        // 这里可以配置图片上传到 Supabase Storage
        async customUpload(file: File, insertFn: (url: string) => void) {
          // TODO: 实现上传到 Supabase Storage
          // 临时使用 base64
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            insertFn(base64)
          }
          reader.readAsDataURL(file)
        },
      },
    },
  }

  // 及时销毁 editor
  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  // HTML 转 Markdown
  // [图片1](https://example.com/image.jpg)
  const htmlToMarkdown = (html: string): string => {
    if (!html) return ''
    try {
      return turndownService.turndown(html)
    } catch (error) {
      console.error('HTML to Markdown conversion error:', error)
      return html
    }
  }

  // 处理内容变化
  const handleChange = (editor: IDomEditor) => {
    const newHtml = editor.getHtml()
    setHtml(newHtml)
    
    if (onChange) {
      const markdown = htmlToMarkdown(newHtml)
      onChange(newHtml, markdown)
    }
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ borderBottom: 'none' }}
        />
      </div>

      {/* 编辑器 */}
      <div className="bg-white dark:bg-gray-900">
        <WangEditor
          defaultConfig={editorConfig}
          value={html}
          onCreated={setEditor}
          onChange={handleChange}
          mode="default"
          style={{ 
            height: '500px',
            overflowY: 'auto',
          }}
        />
      </div>
    </div>
  )
}

