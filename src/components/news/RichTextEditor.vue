<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

interface Props {
  modelValue: string
  placeholder?: string
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'اكتب هنا...',
  maxLength: 1000
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Predefined colors
const colors = [
  { name: 'أسود', value: '#000000' },
  { name: 'رمادي', value: '#6b7280' },
  { name: 'أحمر', value: '#dc2626' },
  { name: 'برتقالي', value: '#ea580c' },
  { name: 'ذهبي', value: '#A17D23' },
  { name: 'أخضر', value: '#16a34a' },
  { name: 'أزرق', value: '#2563eb' },
  { name: 'بنفسجي', value: '#7c3aed' },
]

const showColorPicker = ref(false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3]
      }
    }),
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link'
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    CharacterCount.configure({
      limit: props.maxLength
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor'
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// Set text color
const setColor = (color: string) => {
  editor.value?.chain().focus().setColor(color).run()
  showColorPicker.value = false
}

// Remove color
const removeColor = () => {
  editor.value?.chain().focus().unsetColor().run()
  showColorPicker.value = false
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, { emitUpdate: false })
  }
})

// Cleanup
onBeforeUnmount(() => {
  editor.value?.destroy()
})

// Character count
const characterCount = ref(0)
watch(() => editor.value?.storage.characterCount.characters(), (count) => {
  characterCount.value = count || 0
}, { immediate: true })

// Link handling
const showLinkInput = ref(false)
const linkUrl = ref('')

const setLink = () => {
  if (linkUrl.value) {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run()
  } else {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  }
  showLinkInput.value = false
  linkUrl.value = ''
}

const openLinkInput = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  linkUrl.value = previousUrl || ''
  showLinkInput.value = true
}
</script>

<template>
  <div :class="$style.editorWrapper">
    <!-- Toolbar -->
    <div v-if="editor" :class="$style.toolbar">
      <div :class="$style.toolbarGroup">
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('bold') }]"
          @click="editor.chain().focus().toggleBold().run()"
          title="غامق"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </button>
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('italic') }]"
          @click="editor.chain().focus().toggleItalic().run()"
          title="مائل"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="4" x2="10" y2="4"/>
            <line x1="14" y1="20" x2="5" y2="20"/>
            <line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </button>
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('underline') }]"
          @click="editor.chain().focus().toggleUnderline().run()"
          title="تسطير"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
            <line x1="4" y1="21" x2="20" y2="21"/>
          </svg>
        </button>
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('strike') }]"
          @click="editor.chain().focus().toggleStrike().run()"
          title="يتوسطه خط"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10.5 10 12 12 12"/>
            <path d="M8 18C8 18 9.5 20 12 20C14.5 20 17 18.5 17 16C17 13.5 14 12 12 12"/>
          </svg>
        </button>
      </div>

      <div :class="$style.divider"></div>

      <div :class="$style.toolbarGroup">
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('heading', { level: 2 }) }]"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          title="عنوان كبير"
        >
          <span :class="$style.headingText">H2</span>
        </button>
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('heading', { level: 3 }) }]"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          title="عنوان صغير"
        >
          <span :class="$style.headingText">H3</span>
        </button>
      </div>

            <!-- Color Picker -->
      <div :class="$style.toolbarGroup">
        <div :class="$style.colorPickerWrapper">
          <button
            type="button"
            :class="$style.toolbarBtn"
            @click="showColorPicker = !showColorPicker"
            title="لون النص"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 22h20L12 2z" fill="none"/>
              <path d="M12 6l-6 14h12L12 6z" fill="none"/>
            </svg>
            <span 
              :class="$style.colorIndicator" 
              :style="{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }"
            ></span>
          </button>
          <Transition name="fade">
            <div v-if="showColorPicker" :class="$style.colorDropdown">
              <div :class="$style.colorGrid">
                <button
                  v-for="color in colors"
                  :key="color.value"
                  type="button"
                  :class="$style.colorSwatch"
                  :style="{ backgroundColor: color.value }"
                  :title="color.name"
                  @click="setColor(color.value)"
                ></button>
              </div>
              <button type="button" :class="$style.removeColorBtn" @click="removeColor">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                إزالة اللون
              </button>
            </div>
          </Transition>
        </div>
      </div>
      
      <div :class="$style.divider"></div>

      <div :class="$style.toolbarGroup">
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('bulletList') }]"
          @click="editor.chain().focus().toggleBulletList().run()"
          title="قائمة نقطية"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="9" y1="6" x2="20" y2="6"/>
            <line x1="9" y1="12" x2="20" y2="12"/>
            <line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('orderedList') }]"
          @click="editor.chain().focus().toggleOrderedList().run()"
          title="قائمة مرقمة"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="10" y1="6" x2="21" y2="6"/>
            <line x1="10" y1="12" x2="21" y2="12"/>
            <line x1="10" y1="18" x2="21" y2="18"/>
            <text x="3" y="8" font-size="8" fill="currentColor">1</text>
            <text x="3" y="14" font-size="8" fill="currentColor">2</text>
            <text x="3" y="20" font-size="8" fill="currentColor">3</text>
          </svg>
        </button>
      </div>

      <div :class="$style.divider"></div>

      <div :class="$style.toolbarGroup">
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive({ textAlign: 'right' }) }]"
          @click="editor.chain().focus().setTextAlign('right').run()"
          title="محاذاة لليمين"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="21" y1="6" x2="3" y2="6"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
            <line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </button>
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive({ textAlign: 'center' }) }]"
          @click="editor.chain().focus().setTextAlign('center').run()"
          title="توسيط"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="21" y1="6" x2="3" y2="6"/>
            <line x1="17" y1="12" x2="7" y2="12"/>
            <line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </button>
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive({ textAlign: 'left' }) }]"
          @click="editor.chain().focus().setTextAlign('left').run()"
          title="محاذاة لليسار"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="21" y1="6" x2="3" y2="6"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </button>
      </div>

      <div :class="$style.divider"></div>

      <div :class="$style.toolbarGroup">
        <button
          type="button"
          :class="[$style.toolbarBtn, { [$style.active]: editor.isActive('link') }]"
          @click="openLinkInput"
          title="رابط"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button
          type="button"
          :class="$style.toolbarBtn"
          @click="editor.chain().focus().toggleBlockquote().run()"
          :active="editor.isActive('blockquote')"
          title="اقتباس"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"/>
          </svg>
        </button>
      </div>

      <div :class="$style.divider"></div>


    </div>

    <!-- Link Input Popup -->
    <Transition name="fade">
      <div v-if="showLinkInput" :class="$style.linkPopup">
        <input
          v-model="linkUrl"
          type="url"
          :class="$style.linkInput"
          placeholder="https://example.com"
          @keydown.enter="setLink"
        />
        <button type="button" :class="$style.linkBtn" @click="setLink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        <button type="button" :class="$style.linkBtnCancel" @click="showLinkInput = false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Editor Content -->
    <EditorContent :editor="editor" :class="$style.editorContent" />

    <!-- Character Count -->
    <div :class="$style.charCount">
      <span>{{ editor?.storage.characterCount.characters() || 0 }}/{{ maxLength }} حرف</span>
    </div>
  </div>
</template>

<style module>
.editorWrapper {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.editorWrapper:focus-within {
  border-color: #A17D23;
  box-shadow: 0 0 0 3px rgba(161, 125, 35, 0.1);
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbarGroup {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbarBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbarBtn:hover {
  background: #e5e7eb;
  color: #374151;
}

.toolbarBtn.active {
  background: #A17D23;
  color: white;
}

.headingText {
  font-weight: 700;
  font-size: 12px;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 4px;
}

/* Color Picker */
.colorPickerWrapper {
  position: relative;
}

.colorIndicator {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 3px;
  border-radius: 2px;
}

.colorDropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 160px;
}

.colorGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.colorSwatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.colorSwatch:hover {
  transform: scale(1.15);
  border-color: #A17D23;
}

.removeColorBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.removeColorBtn:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}

/* Link Popup */
.linkPopup {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.linkInput {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  direction: ltr;
}

.linkInput:focus {
  outline: none;
  border-color: #A17D23;
}

.linkBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #A17D23;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.linkBtnCancel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* Editor Content */
.editorContent {
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
}

.editorContent :global(.ProseMirror) {
  padding: 16px;
  min-height: 150px;
  outline: none;
  font-size: 15px;
  line-height: 1.7;
  color: #1f2937;
}

.editorContent :global(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: right;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

.editorContent :global(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: 700;
  margin: 0.5em 0;
  color: #111827;
}

.editorContent :global(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.5em 0;
  color: #1f2937;
}

.editorContent :global(.ProseMirror ul),
.editorContent :global(.ProseMirror ol) {
  padding-right: 1.5em;
  margin: 0.5em 0;
}

.editorContent :global(.ProseMirror li) {
  margin: 0.25em 0;
}

.editorContent :global(.ProseMirror blockquote) {
  border-right: 4px solid #A17D23;
  padding-right: 1em;
  margin: 1em 0;
  color: #6b7280;
  font-style: italic;
}

.editorContent :global(.ProseMirror a) {
  color: #A17D23;
  text-decoration: underline;
}

/* Character Count */
.charCount {
  padding: 8px 12px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: left;
  font-size: 12px;
  color: #6b7280;
}

/* Dark Mode */
:global([data-theme="night"]) .editorWrapper {
  background: #1f2937;
  border-color: #374151;
}

:global([data-theme="night"]) .editorWrapper:focus-within {
  border-color: #A17D23;
  box-shadow: 0 0 0 3px rgba(161, 125, 35, 0.2);
}

:global([data-theme="night"]) .toolbar {
  background: #111827;
  border-color: #374151;
}

:global([data-theme="night"]) .toolbarBtn {
  color: #9ca3af;
}

:global([data-theme="night"]) .toolbarBtn:hover {
  background: #374151;
  color: #e5e7eb;
}

:global([data-theme="night"]) .divider {
  background: #374151;
}

:global([data-theme="night"]) .colorDropdown {
  background: #1f2937;
  border-color: #374151;
}

:global([data-theme="night"]) .removeColorBtn {
  background: #374151;
  border-color: #4b5563;
  color: #9ca3af;
}

:global([data-theme="night"]) .removeColorBtn:hover {
  background: #7f1d1d;
  border-color: #991b1b;
  color: #fecaca;
}

:global([data-theme="night"]) .linkPopup {
  background: #111827;
  border-color: #374151;
}

:global([data-theme="night"]) .linkInput {
  background: #1f2937;
  border-color: #374151;
  color: #e5e7eb;
}

:global([data-theme="night"]) .editorContent :global(.ProseMirror) {
  color: #e5e7eb;
}

:global([data-theme="night"]) .editorContent :global(.ProseMirror h2),
:global([data-theme="night"]) .editorContent :global(.ProseMirror h3) {
  color: #f9fafb;
}

:global([data-theme="night"]) .editorContent :global(.ProseMirror blockquote) {
  color: #9ca3af;
}

:global([data-theme="night"]) .charCount {
  background: #111827;
  border-color: #374151;
  color: #9ca3af;
}

/* Transitions */
:global(.fade-enter-active),
:global(.fade-leave-active) {
  transition: opacity 0.2s ease;
}

:global(.fade-enter-from),
:global(.fade-leave-to) {
  opacity: 0;
}
</style>
