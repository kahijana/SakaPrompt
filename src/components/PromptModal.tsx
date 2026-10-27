import React, { useState, useEffect } from 'react';
import { Prompt } from '../types/prompt';
import { extractVariables } from '../utils/variableExtractor';
import { X, Sparkles, Tag, Folder, Star, Eye, Code, ImageIcon, AlertCircle } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promptData: {
    id?: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    favorite: boolean;
    imageUrl?: string;
  }) => void;
  promptToEdit?: Prompt | null;
  existingCategories: string[];
  existingTags: string[];
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  promptToEdit,
  existingCategories,
  existingTags,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewImgError, setPreviewImgError] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [errors, setErrors] = useState<{ title?: string; content?: string; imageUrl?: string }>({});

  useEffect(() => {
    if (promptToEdit) {
      setTitle(promptToEdit.title);
      setContent(promptToEdit.content);
      setCategory(promptToEdit.category);
      setTags([...promptToEdit.tags]);
      setFavorite(promptToEdit.favorite);
      setImageUrl(promptToEdit.imageUrl || '');
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      setTitle('');
      setContent('');
      setCategory(existingCategories[0] || 'General');
      setTags([]);
      setFavorite(false);
      setImageUrl('');
      setIsCustomCategory(false);
      setCustomCategory('');
    }
    setTagInput('');
    setErrors({});
    setPreviewImgError(false);
    setActiveTab('edit');
  }, [promptToEdit, isOpen, existingCategories]);

  if (!isOpen) return null;

  const detectedVariables = extractVariables(content);

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // optional
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; content?: string; imageUrl?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!content.trim()) {
      newErrors.content = 'Prompt content is required';
    }
    if (imageUrl.trim() && !validateUrl(imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL starting with http:// or https://';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategory.trim() || 'General'
      : category || 'General';

    onSave({
      id: promptToEdit ? promptToEdit.id : undefined,
      title: title.trim(),
      content: content.trim(),
      category: finalCategory,
      tags,
      favorite,
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-xl border border-zinc-200/80 w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <h2 id="prompt-modal-title" className="text-sm font-semibold text-zinc-900">
              {promptToEdit ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>
            {detectedVariables.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-zinc-200/70 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-zinc-500" />
                {detectedVariables.length} variable{detectedVariables.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-md hover:bg-zinc-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto p-5 space-y-4 flex-1">
            {/* Title & Favorite */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Title <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFavorite(!favorite)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-all active:scale-95 ${
                    favorite
                      ? 'text-amber-700 bg-amber-50 font-medium'
                      : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{favorite ? 'Favorite' : 'Mark Favorite'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g. Senior Code Reviewer & Security Audit"
                className={`w-full px-3 py-2 text-sm bg-zinc-50 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white text-zinc-900 placeholder:text-zinc-400 transition-all ${
                  errors.title
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-zinc-200 focus:ring-zinc-900'
                }`}
              />
              {errors.title && <p className="text-[11px] text-rose-500">{errors.title}</p>}
            </div>

            {/* Thumbnail Image URL Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                  Thumbnail Image URL <span className="text-[10px] text-zinc-400 font-normal lowercase">(optional)</span>
                </span>
                {imageUrl.trim() && validateUrl(imageUrl) && !previewImgError && (
                  <span className="text-[10px] text-emerald-600 font-medium">Valid URL</span>
                )}
              </label>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewImgError(false);
                    if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: undefined }));
                  }}
                  placeholder="https://images.unsplash.com/... or direct image link"
                  className={`flex-1 px-3 py-1.5 text-xs bg-zinc-50 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white text-zinc-900 placeholder:text-zinc-400 transition-all ${
                    errors.imageUrl
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-zinc-200 focus:ring-zinc-900'
                  }`}
                />
              </div>

              {errors.imageUrl && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.imageUrl}
                </p>
              )}

              {/* Live Image Preview Thumbnail inside Form */}
              {imageUrl.trim() && validateUrl(imageUrl) && (
                <div className="flex items-center gap-3 p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="w-16 h-10 rounded overflow-hidden bg-zinc-200 border border-zinc-200 flex-shrink-0">
                    {!previewImgError ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        onError={() => setPreviewImgError(true)}
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-rose-500">
                        Error
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-[11px]">
                    <p className="text-zinc-700 font-medium truncate">{imageUrl}</p>
                    <p className="text-zinc-400 text-[10px]">
                      {previewImgError ? 'Image failed to load (placeholder will be shown)' : 'Thumbnail preview (16:9)'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-zinc-400" />
                Category
              </label>
              <div className="flex gap-2">
                {!isCustomCategory ? (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                        setCustomCategory('');
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900 transition-all"
                  >
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Add new category...</option>
                  </select>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter new category name..."
                      className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content & Tab Switch */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Prompt Content <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium transition-all active:scale-95 ${
                      activeTab === 'edit'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium transition-all active:scale-95 ${
                      activeTab === 'preview'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                </div>
              </div>

              {activeTab === 'edit' ? (
                <div>
                  <textarea
                    rows={8}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
                    }}
                    placeholder="Enter prompt text here. Use [variable_name] or {{variable_name}} to add dynamic placeholders..."
                    className={`w-full px-3 py-2 text-xs font-mono leading-relaxed bg-zinc-50 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white text-zinc-900 placeholder:text-zinc-400 transition-all resize-y ${
                      errors.content
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-zinc-200 focus:ring-zinc-900'
                    }`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                    <span>
                      Variables tip: Use <code className="bg-zinc-100 text-zinc-600 px-1 py-0.2 rounded">[variable]</code> or <code className="bg-zinc-100 text-zinc-600 px-1 py-0.2 rounded">{`{{variable}}`}</code>
                    </span>
                    <span>{content.length} characters</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg min-h-[180px] max-h-72 overflow-y-auto">
                  {content ? (
                    <div className="text-xs font-mono text-zinc-700 whitespace-pre-wrap leading-relaxed">
                      {content}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No prompt content entered yet.</p>
                  )}
                </div>
              )}
              {errors.content && <p className="text-[11px] text-rose-500">{errors.content}</p>}
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Tags
              </label>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-800 border border-zinc-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Input for new tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  placeholder="Type tag and press Enter or comma..."
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900 placeholder:text-zinc-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-all active:scale-95"
                >
                  Add
                </button>
              </div>

              {/* Suggestions from existing tags */}
              {existingTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] uppercase text-zinc-400">Suggestions:</span>
                  {existingTags
                    .filter((t) => !tags.includes(t))
                    .slice(0, 6)
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleAddTag(t)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 px-1.5 py-0.5 rounded border border-dashed border-zinc-200 transition-all active:scale-95"
                      >
                        +{t}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-100 bg-zinc-50/70">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-md transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-xs active:scale-95 transition-all"
            >
              {promptToEdit ? 'Save Changes' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
