'use client'

import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/30 ${
        error
          ? 'border-red-400 bg-red-50'
          : 'border-slate-200 bg-white focus:border-[#7FB300]'
      } ${className}`}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      rows={4}
      className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/30 resize-none ${
        error
          ? 'border-red-400 bg-red-50'
          : 'border-slate-200 bg-white focus:border-[#7FB300]'
      } ${className}`}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ error, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/30 ${
        error
          ? 'border-red-400 bg-red-50'
          : 'border-slate-200 bg-white focus:border-[#7FB300]'
      } ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#7FB300]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </div>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  )
}
