import { useState, useRef } from 'react'
import { X, Tag as TagIcon } from 'lucide-react'
import { toast } from '../../lib/toast'

export default function TagInput({ tags, onChange, maxTags = 10, existingUserTags = [] }) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const addTag = (tagText) => {
    const trimmed = tagText.trim().toLowerCase()
    if (!trimmed) return

    if (tags.length >= maxTags) {
      toast.error(`Puedes agregar máximo ${maxTags} etiquetas`)
      return
    }

    if (tags.includes(trimmed)) {
      setInputValue('')
      return
    }

    onChange([...tags, trimmed])
    setInputValue('')
  }

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  const handleSelectExisting = (tagText) => {
    addTag(tagText)
    inputRef.current?.focus()
  }

  const suggestions = existingUserTags.filter(
    t => !tags.includes(t) && t.includes(inputValue.trim().toLowerCase())
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <TagIcon className="w-4 h-4 text-text-secondary" />
        <label className="text-sm font-medium text-text-secondary">Etiquetas ({tags.length}/{maxTags})</label>
      </div>
      
      <div 
        className={`flex flex-wrap gap-2 p-2 min-h-[46px] border rounded-xl bg-surface transition-colors cursor-text ${
          isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-border'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg"
          >
            #{tag}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="p-0.5 hover:bg-primary/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={tags.length === 0 ? "Ej: playa, oficina, boda..." : "Agregar otra..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
        />
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="p-2 bg-surface border border-border rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto z-10 flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelectExisting(s)}
              className="px-2.5 py-1 bg-bg-alt hover:bg-primary/10 text-text-secondary hover:text-primary text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
