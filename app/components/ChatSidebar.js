"use client";

import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAvatarUrl = (avatar, name) => {
  if (avatar && String(avatar).trim()) return avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=157A4F&color=ffffff&size=128`;
};

export default function ChatSidebar({
  conversations = [],
  selectedId,
  onSelectConversation,
  onDeleteConversation,
  loading = false,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* Header */}
      <div className="border-b border-gray-200 p-4 sm:p-5 md:p-6">
        <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
          Messages
        </h2>
      </div>

      {/* Chat List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 sm:p-4">

        {!loading && conversations.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8">
            No conversations yet. Start from an ad card chat button.
          </div>
        )}

        {loading && (
          <div className="text-sm text-gray-500 text-center py-8">
            Loading conversations...
          </div>
        )}

        {conversations.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectConversation?.(chat)}
            className={`flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 sm:p-4
            ${
              selectedId === chat.id
                ? "bg-[#FFF3D6] border border-[#F5B849]"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={getAvatarUrl(chat?.otherUser?.avatar, chat?.otherUser?.name)}
                width={45}
                height={45}
                alt={chat?.otherUser?.name || "User"}
                className="shrink-0 rounded-full object-cover"
              />

              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-800">
                  {chat?.otherUser?.name || "Unknown User"}
                </p>
                <p className="text-sm text-gray-500 truncate max-w-[52vw] sm:w-[160px]">
                  {chat.lastMessageText || "No messages yet"}
                </p>
                {(chat?.lastMessageAdTitle || chat?.ad?.title) && (
                  <p className="text-xs text-gray-400 truncate max-w-[52vw] mt-0.5 sm:w-[160px]">
                    Regarding: {chat.lastMessageAdTitle || chat.ad.title}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs text-gray-400">{formatTime(chat.lastMessageAt)}</p>
              <div className="relative mt-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId((prev) => (prev === chat.id ? null : chat.id));
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                >
                  <MoreVertical size={16} />
                </button>

                {openMenuId === chat.id && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(null);
                      onDeleteConversation?.(chat.id);
                    }}
                    className="absolute right-0 top-8 z-10 bg-white border border-gray-200 shadow-md rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete chat
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
