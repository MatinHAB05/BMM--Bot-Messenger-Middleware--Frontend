import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { chatsApi } from "../../api/chats";
import { useToast } from "../../contexts/ToastContext";
import {
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Terminal,
  Send,
  MessageSquare,
  Clock,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

interface ChatLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChatLinkingModal: React.FC<ChatLinkingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [activeMethod, setActiveMethod] = useState<
    "command" | "tg_group" | "tg_channel"
  >("command");
  const [otp, setOtp] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(600); // 10 minutes default
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate linking OTP
  const generateOTP = async () => {
    try {
      setIsLoading(true);
      const res = await chatsApi.sendLinkOTP();
      setOtp(res.otp || null);
      setExpiresIn(res.expires_in || 600);
      setCopied(false);
    } catch (err: any) {
      showToast(err.message || "Failed to generate chat link OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !otp) {
      generateOTP();
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !otp || expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, otp, expiresIn]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const commandText = otp ? `/link ${otp}` : "";
  const groupDeepLink = otp ? `https://t.me/tel_bmm_bot?startgroup=${otp}` : "";
  const channelDeepLink = otp ? `https://t.me/tel_bmm_bot?start=${otp}` : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link New Chat (Telegram / Bale)"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Method Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveMethod("command")}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg font-medium transition-all ${
              activeMethod === "command"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>1. OTP Command</span>
            <span className="text-[10px] opacity-75">(TG & Bale)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod("tg_group")}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg font-medium transition-all ${
              activeMethod === "tg_group"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>2. TG Group Link</span>
            <span className="text-[10px] opacity-75">(Deep-Link)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod("tg_channel")}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg font-medium transition-all ${
              activeMethod === "tg_channel"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>3. TG Channel Link</span>
            <span className="text-[10px] opacity-75">(Deep-Link)</span>
          </button>
        </div>

        {/* OTP Status & Expiration Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs font-semibold text-slate-200">
                OTP Expiration:{" "}
                <span className="font-mono text-blue-400">
                  {formatTimer(expiresIn)}
                </span>
              </p>
              <p className="text-[11px] text-slate-400">
                {expiresIn > 0
                  ? "Use code before timer expires"
                  : "Code expired, generate a new one"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateOTP}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate OTP
          </Button>
        </div>

        {/* Method 1: OTP Command */}
        {activeMethod === "command" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Method 1: Manual Command Linking (Telegram & Bale)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect any Telegram or Bale group/channel in three simple
                steps:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-400 pl-1">
                <li>
                  Add our bot (
                  <code className="text-blue-300">@tel_bmm_bot</code> or Bale
                  bot) as an <strong>Administrator</strong> in your target chat.
                </li>
                <li>Copy the generated command below.</li>
                <li>
                  Send the command directly in the chat. The bot will
                  automatically authenticate and link it.
                </li>
              </ol>
            </div>

            {/* Command Copy Box */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <code className="font-mono text-sm text-emerald-400 select-all font-bold">
                {commandText || "Generating OTP..."}
              </code>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => copyToClipboard(commandText)}
                disabled={!otp || expiresIn <= 0}
                leftIcon={
                  copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
              >
                {copied ? "Copied" : "Copy Command"}
              </Button>
            </div>
          </div>
        )}

        {/* Method 2: Telegram Group Deep-Link */}
        {activeMethod === "tg_group" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                Method 2: Telegram Group Deep-Link
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking the button below will open Telegram, prompt you to
                choose a Group, and add the bot with your company's
                authentication token.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <p className="font-mono text-xs text-slate-400 truncate bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {groupDeepLink || "Generating Deep-Link..."}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={() => window.open(groupDeepLink, "_blank")}
                  disabled={!otp || expiresIn <= 0}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Open in Telegram Group
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyToClipboard(groupDeepLink)}
                  disabled={!otp || expiresIn <= 0}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Method 3: Telegram Channel Deep-Link */}
        {activeMethod === "tg_channel" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                Method 3: Telegram Channel Deep-Link
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking the button below will open Telegram with the start
                payload to configure channel administration and link it
                directly.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <p className="font-mono text-xs text-slate-400 truncate bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {channelDeepLink || "Generating Deep-Link..."}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={() => window.open(channelDeepLink, "_blank")}
                  disabled={!otp || expiresIn <= 0}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Open in Telegram Channel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyToClipboard(channelDeepLink)}
                  disabled={!otp || expiresIn <= 0}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure 1-time OTP verification</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onSuccess?.();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
