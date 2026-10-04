import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SavingsSimulator from './SavingsSimulator'

const START = new Date(2026, 9, 1) // 1 Oktober 2026

describe('SavingsSimulator Component', () => {
  it('renders default commitments (Mas 2,5 Jt, Cece 2 Jt) and projection', () => {
    render(<SavingsSimulator remaining={45000000} startDate={START} />)

    expect(screen.getByLabelText(/Komitmen Mas per bulan/i)).toHaveValue('2500000')
    expect(screen.getByLabelText(/Komitmen Cece per bulan/i)).toHaveValue('2000000')

    // 45.000.000 / 4.500.000 = 10 bulan -> Agustus 2027
    expect(screen.getByTestId('sim-total')).toHaveTextContent('Rp 4.500.000')
    expect(screen.getByTestId('sim-months')).toHaveTextContent('10 bulan')
    expect(screen.getByTestId('sim-date')).toHaveTextContent('Agustus 2027')
  })

  it('updates projection when Mas slider changes', () => {
    render(<SavingsSimulator remaining={45000000} startDate={START} />)

    fireEvent.change(screen.getByLabelText(/Komitmen Mas per bulan/i), {
      target: { value: '7000000' },
    })

    // 45.000.000 / 9.000.000 = 5 bulan -> Maret 2027
    expect(screen.getByTestId('sim-total')).toHaveTextContent('Rp 9.000.000')
    expect(screen.getByTestId('sim-months')).toHaveTextContent('5 bulan')
    expect(screen.getByTestId('sim-date')).toHaveTextContent('Maret 2027')
  })

  it('updates projection when Cece slider changes', () => {
    render(<SavingsSimulator remaining={45000000} startDate={START} />)

    fireEvent.change(screen.getByLabelText(/Komitmen Cece per bulan/i), {
      target: { value: '6500000' },
    })

    // 45.000.000 / 9.000.000 = 5 bulan
    expect(screen.getByTestId('sim-months')).toHaveTextContent('5 bulan')
  })

  it('shows a warning when total commitment is zero', () => {
    render(<SavingsSimulator remaining={45000000} startDate={START} />)

    fireEvent.change(screen.getByLabelText(/Komitmen Mas per bulan/i), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/Komitmen Cece per bulan/i), { target: { value: '0' } })

    expect(screen.getByTestId('sim-months')).toHaveTextContent('-')
    expect(screen.getByText(/Atur komitmen menabung/i)).toBeInTheDocument()
  })

  it('shows celebration when target already reached', () => {
    render(<SavingsSimulator remaining={0} startDate={START} />)

    expect(screen.getByTestId('sim-months')).toHaveTextContent('0 bulan')
    expect(screen.getByText(/Target sudah tercapai/i)).toBeInTheDocument()
  })
})
