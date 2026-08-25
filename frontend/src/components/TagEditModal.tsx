import React, { useState, useEffect } from "react";
import {
  Edit3,
  Check,
  Loader2,
  Calendar,
  Globe,
  Lock,
  X,
  Info,
  Palette,
} from "lucide-react";
import { Tag, TagUsageData } from "../types";
import { eventsApi } from "../api/events.api";
import { useToast } from "../contexts/ToastContext";
import { format } from "date-fns";
import {
  PRESET_TAG_COLORS,
  DEFAULT_TAG_COLOR,
} from "../constants";
import { tagFormSchema, validateForm as validateWithZod, mapApiErrors } from "../dto";

interface TagEditModalProps {
  isOpen: boolean;
  tag: Tag | null;
  onClose: () => void;
  onSuccess: (updatedTag: Tag) => void;
}

export const TagEditModal: React.FC<TagEditModalProps> = ({
  isOpen,
  tag,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState(DEFAULT_TAG_COLOR);
  const [usageData, setUsageData] = useState<TagUsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && tag) {
      setName(tag.name);
      setColorHex(tag.colorHex || DEFAULT_TAG_COLOR);
      setFieldError(null);
      setIsLoadingUsage(true);

      eventsApi
        .getTagUsage(tag.id)
        .then((res) => {
          if (res.success) {
            setUsageData(res.data);
          }
        })
        .catch(() => {
          setUsageData({
            tag,
            eventCount: tag.eventCount || 0,
            associatedEvents: [],
          });
        })
        .finally(() => {
          setIsLoadingUsage(false);
        });
    } else {
      setUsageData(null);
      setName("");
      setFieldError(null);
    }
  }, [isOpen, tag]);

  if (!isOpen || !tag) return null;

  const eventCount = usageData ? usageData.eventCount : tag.eventCount || 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const validation = validateWithZod(tagFormSchema, {
      name: name.trim(),
      colorHex: colorHex.trim(),
    });

    if (!validation.isValid) {
      setFieldError(validation.firstError || "Please enter a valid tag name and hex color.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldError(null);

      const res = await eventsApi.updateTag(tag.id, {
        name: validation.data?.name || name.trim(),
        colorHex: validation.data?.colorHex || colorHex.trim(),
      });

      if (res.success) {
        success(`Tag "#${res.data.name}" updated successfully!`);
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const msg = apiError?.message || "Failed to update tag";
      setFieldError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Edit Tag
                <span
                  style={{
                    backgroundColor: `${tag.colorHex}20`,
                    color: tag.colorHex,
                  }}
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                >
                  #{tag.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update tag name, theme color, and linked events
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Live Preview Pill */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Live Tag Preview:
            </span>
            <span
              style={{
                backgroundColor: `${colorHex}18`,
                color: colorHex,
                borderColor: `${colorHex}40`,
              }}
              className="px-3.5 py-1 rounded-full text-xs font-bold border transition-all shadow-sm"
            >
              #{name.trim() || "preview"}
            </span>
          </div>

          {/* Tag Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tag Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="e.g. Technology, AI, Networking"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Tag Color Picker & Swatches */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              Tag Theme Color
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer p-0.5 bg-transparent"
                title="Choose custom color"
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                placeholder="#6366f1"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase"
              />
            </div>

            {/* Quick Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_TAG_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColorHex(preset)}
                  style={{ backgroundColor: preset }}
                  className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 flex items-center justify-center ${
                    colorHex.toLowerCase() === preset.toLowerCase()
                      ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-110"
                      : ""
                  }`}
                  aria-label={`Select color ${preset}`}
                >
                  {colorHex.toLowerCase() === preset.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {fieldError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {fieldError}
            </p>
          )}

          {/* Loading Usage State */}
          {isLoadingUsage ? (
            <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Fetching event associations...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Event Associations Notice */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200 text-xs">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {eventCount > 0 ? (
                      <p>
                        This tag is linked to{" "}
                        <strong className="font-bold underline">
                          {eventCount} {eventCount === 1 ? "event" : "events"}
                        </strong>
                        . Editing will automatically update the tag name and
                        color across all {eventCount} events and global filters.
                      </p>
                    ) : (
                      <p>
                        This tag is not currently associated with any events.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Associated Events List */}
              {usageData && usageData.associatedEvents.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Impacted Events ({usageData.associatedEvents.length})
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    {usageData.associatedEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {format(new Date(evt.startTime), "MMM d")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingUsage}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
