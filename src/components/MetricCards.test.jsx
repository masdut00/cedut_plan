import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MetricCards from './MetricCards'
import WeddingProgressBar from './WeddingProgressBar'
import ContributionSplit from './ContributionSplit'

describe('MetricCards Component', () => {
  const mockSummary = {
    targetAmount: 100000000,
    totalSavings: 50000000,
    totalExpense: 5000000,
    netSavings: 45000000,
    remaining: 55000000,
    percentComplete: 45,
    masTotal: 25000000,
    ceceTotal: 20000000,
    masPercent: 56,
    cecePercent: 44,
  }

  it('renders all 4 metric cards with formatted numbers from summary', () => {
    render(<MetricCards summary={mockSummary} />)

    // Check target amount card
    expect(screen.getByText('Target Tabungan')).toBeInTheDocument()
    expect(screen.getByText('Rp 100.000.000')).toBeInTheDocument()

    // Check net savings card
    expect(screen.getByText('Total Terkumpul')).toBeInTheDocument()
    expect(screen.getByText('Rp 45.000.000')).toBeInTheDocument()

    // Check remaining card
    expect(screen.getByText('Sisa Kebutuhan')).toBeInTheDocument()
    expect(screen.getByText('Rp 55.000.000')).toBeInTheDocument()

    // Check percentage card
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('renders safely with undefined summary or defaults', () => {
    render(<MetricCards />)

    expect(screen.getByText('Target Tabungan')).toBeInTheDocument()
    expect(screen.getAllByText('Rp 100.000.000')).toHaveLength(2)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders custom grid structure with responsive classes', () => {
    const { container } = render(<MetricCards summary={mockSummary} />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid.className).toContain('grid-cols-2')
    expect(grid.className).toContain('lg:grid-cols-4')
    expect(grid.className).toContain('gap-4')
  })

  it('displays celebratory subtitle when goal is 100% reached', () => {
    const completedSummary = {
      targetAmount: 100000000,
      totalSavings: 100000000,
      totalExpense: 0,
      netSavings: 100000000,
      remaining: 0,
      percentComplete: 100,
    }
    render(<MetricCards summary={completedSummary} />)

    expect(screen.getByText('Target tercapai! 🎉')).toBeInTheDocument()
    expect(screen.getByText('Target telah terpenuhi')).toBeInTheDocument()
  })
})

describe('WeddingProgressBar Component', () => {
  it('renders milestone markers at 25%, 50%, 75%, and 100%', () => {
    render(<WeddingProgressBar percentComplete={45} targetAmount={100000000} netSavings={45000000} />)

    // Milestone percentages
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()

    // Milestone nominal labels
    expect(screen.getByText('25 Jt')).toBeInTheDocument()
    expect(screen.getByText('50 Jt')).toBeInTheDocument()
    expect(screen.getByText('75 Jt')).toBeInTheDocument()
    expect(screen.getByText('100 Jt')).toBeInTheDocument()
  })

  it('renders dynamic milestone nominals for different target amount', () => {
    render(<WeddingProgressBar percentComplete={50} targetAmount={200000000} netSavings={100000000} />)

    expect(screen.getByText('50 Jt')).toBeInTheDocument()
    expect(screen.getByText('100 Jt')).toBeInTheDocument()
    expect(screen.getByText('150 Jt')).toBeInTheDocument()
    expect(screen.getByText('200 Jt')).toBeInTheDocument()
  })

  it('renders current progress percentage and formatted net savings', () => {
    render(<WeddingProgressBar percentComplete={45} targetAmount={100000000} netSavings={45000000} />)

    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText(/Rp 45\.000\.000/)).toBeInTheDocument()
    expect(screen.getByText(/Rp 100\.000\.000/)).toBeInTheDocument()
  })

  it('accepts summary object prop as well', () => {
    const summary = {
      targetAmount: 100000000,
      netSavings: 60000000,
      percentComplete: 60,
    }
    render(<WeddingProgressBar summary={summary} />)

    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText(/Rp 60\.000\.000/)).toBeInTheDocument()
  })

  it('clamps progress between 0 and 100%', () => {
    const { rerender } = render(<WeddingProgressBar percentComplete={120} targetAmount={100000000} netSavings={120000000} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')

    rerender(<WeddingProgressBar percentComplete={-10} targetAmount={100000000} netSavings={-1000000} />)
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })
})

describe('ContributionSplit Component', () => {
  const summary = {
    masTotal: 30000000,
    ceceTotal: 20000000,
    masPercent: 60,
    cecePercent: 40,
    netSavings: 50000000,
  }

  it('renders Mas and Cece contribution totals formatted in Rupiah', () => {
    render(<ContributionSplit summary={summary} />)

    expect(screen.getByText('Rp 30.000.000')).toBeInTheDocument()
    expect(screen.getByText('Rp 20.000.000')).toBeInTheDocument()
  })

  it('renders Mas and Cece percentage values correctly', () => {
    render(<ContributionSplit summary={summary} />)

    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('renders split segments with aria labels for accessibility', () => {
    render(<ContributionSplit summary={summary} />)

    const masSegment = screen.getByLabelText('Mas: 60%')
    const ceceSegment = screen.getByLabelText('Cece: 40%')

    expect(masSegment).toBeInTheDocument()
    expect(ceceSegment).toBeInTheDocument()
    expect(masSegment).toHaveStyle({ width: '60%' })
    expect(ceceSegment).toHaveStyle({ width: '40%' })
  })

  it('handles zero contributions gracefully without NaN', () => {
    const emptySummary = {
      masTotal: 0,
      ceceTotal: 0,
      masPercent: 0,
      cecePercent: 0,
      netSavings: 0,
    }
    render(<ContributionSplit summary={emptySummary} />)

    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Rp 0').length).toBeGreaterThanOrEqual(2)
  })

  it('accepts individual props when summary is not passed', () => {
    render(
      <ContributionSplit
        masTotal={15000000}
        ceceTotal={15000000}
        masPercent={50}
        cecePercent={50}
      />
    )

    expect(screen.getAllByText('Rp 15.000.000')).toHaveLength(2)
    expect(screen.getAllByText('50%')).toHaveLength(2)
  })
})
