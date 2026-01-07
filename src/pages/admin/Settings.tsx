export default function Settings() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-8">
      <div>
        <h1 className="text-neutral-900 font-sans  text-3xl font-semibold mb-2">Settings</h1>
        <p className="text-neutral-600 text-sm">Configure system preferences and integrations</p>
      </div>

      <div className="bg-white rounded-xl p-8 border border-neutral-200 transition-all duration-200">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#A57865]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-[#A57865]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">System Settings</h3>
          <p className="text-neutral-600 max-w-md mx-auto">
            This is the Settings page. Future UI will include property configuration,
            user management, integrations, billing, and system preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
