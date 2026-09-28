import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Emotion',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹', '☺️', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
      '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
      '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
      '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
      '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🫡', '🤫', '🫠', '🤥', '😶', '😐',
      '😑', '😬', '🫨', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪',
      '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    ],
  },
  {
    name: 'Gestures & Hands',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '👇', '☝️', '🫵', '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲',
      '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾',
    ],
  },
  {
    name: 'Hearts & Vibes',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '💥', '✨', '🌟', '⭐', '💫',
      '⚡', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯', '🎲', '🚀', '🍾',
    ],
  },
  {
    name: 'Objects & Symbols',
    icon: '💡',
    emojis: [
      '💡', '🔔', '🔕', '📢', '📣', '🔍', '🔎', '🔑', '🗝️', '🔒', '🔓', '✉️',
      '📩', '📨', '📦', '🏷️', '📌', '📍', '📎', '🗑️', '💻', '📱', '📞', '⏳',
      '⌛', '⏰', '⏱️', '🗓️', '📅', '📊', '📈', '📉', '✅', '❌', '⚠️', '⛔',
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES[activeTab].emojis;

  return (
    <div className="w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50">
      <div className="p-2 border-b border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!search.trim() && (
        <div className="flex border-b border-slate-800 px-2 pt-1 gap-1">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-2.5 py-1.5 text-base rounded-t-lg transition-colors ${
                activeTab === idx
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      <div className="p-2 h-56 overflow-y-auto grid grid-cols-7 gap-1 scrollbar-thin">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-800 rounded-lg transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
