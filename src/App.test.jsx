import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App Component', () => {
  it('renders welcoming header for Mas & Cece Wedding Saving', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Mas & Cece Wedding Saving/i)
  })

  it('renders target badge with 100.000.000', () => {
    render(<App />)
    expect(screen.getByText(/Target: Rp 100\.000\.000/i)).toBeInTheDocument()
  })
})
