import { createContext, useContext, type ReactNode } from 'react'
import { useAppData } from '../hooks/useAppData'

type AppDataValue = ReturnType<typeof useAppData>

const AppDataContext = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const value = useAppData()
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppDataContext(): AppDataValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) {
    throw new Error('useAppDataContext debe usarse dentro de AppDataProvider')
  }
  return ctx
}