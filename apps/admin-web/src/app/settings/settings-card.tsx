import { ReactNode } from 'react'

export function SettingsCard({ title, desc, children, actions }: {
  title: string
  desc?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {desc && <p className="text-sm text-slate-500 mt-1">{desc}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export function SettingsCardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
}

export function SettingsEmpty({ text = '暂无数据' }: { text?: string }) {
  return <div className="text-center py-16 text-slate-400 text-sm">{text}</div>
}
