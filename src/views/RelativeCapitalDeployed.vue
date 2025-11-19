<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import type { ColumnDefinition } from 'tabulator-tables'
import { useTop20PositionsByCapitalQuery, type SymbolPositionGroup } from '@y2kfund/core/relativeCapitalDeployedForRiskManagement'
import { useTabulator } from '../composables/useTabulator'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import { Pie } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

interface relativeCapitalDeployedProps {
  userId?: string | null
}

const props = withDefaults(defineProps<relativeCapitalDeployedProps>(), {
  userId: '67e578fd-2cf7-48a4-b028-a11a3f89bb9b'
})

// Fetch top 20 positions by capital invested
const { data: top20Positions, isLoading, isError, error, _cleanup } = useTop20PositionsByCapitalQuery(props.userId)

// Calculate total capital invested across all top 20 positions
const totalCapitalInvested = computed(() => {
  if (!top20Positions.value) return 0
  return top20Positions.value.reduce((sum, pos) => sum + pos.capitalInvested, 0)
})

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Format number with commas
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Calculate percentage
const calculatePercentage = (value: number): string => {
  if (totalCapitalInvested.value === 0) return '0.00'
  return ((value / totalCapitalInvested.value) * 100).toFixed(2)
}

// Format currency for Tabulator
const formatCurrencyForTable = (cell: any): string => {
  const value = cell.getValue()
  if (value == null) return ''
  return formatCurrency(value)
}

// Format number for Tabulator
const formatNumberForTable = (cell: any): string => {
  const value = cell.getValue()
  if (value == null) return ''
  return formatNumber(value)
}

// Calculate bottom totals
const totalPositionCount = computed(() => {
  if (!top20Positions.value) return 0
  return top20Positions.value.reduce((sum: number, pos: SymbolPositionGroup) => sum + pos.positionCount, 0)
})

// Define Tabulator columns
const columns: ColumnDefinition[] = [
  {
    title: '#',
    field: 'rank',
    width: 60,
    hozAlign: 'center',
    headerHozAlign: 'center',
    formatter: (cell: any) => {
      const row = cell.getRow()
      return String(row.getPosition())
    }
  },
  {
    title: 'Symbol',
    field: 'symbolRoot',
    widthGrow: 1.2,
    headerHozAlign: 'left',
    formatter: (cell: any) => {
      const value = cell.getValue()
      return `<strong style="color:#007bff;font-size:1.05rem">${value}</strong>`
    }
  },
  {
    title: 'Total Quantity',
    field: 'totalQuantity',
    widthGrow: 1.5,
    hozAlign: 'right',
    headerHozAlign: 'right',
    formatter: formatNumberForTable,
    bottomCalc: 'sum',
    bottomCalcFormatter: (cell: any) => {
      const value = cell.getValue()
      return formatNumber(value)
    }
  },
  {
    title: 'Market Price',
    field: 'currentMarketPrice',
    widthGrow: 1.3,
    hozAlign: 'right',
    headerHozAlign: 'right',
    formatter: (cell: any) => {
      const value = cell.getValue()
      if (value == null) return '<span style="color:#6c757d;font-style:italic;">N/A</span>'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }
  },
  {
    title: 'Capital Used',
    field: 'capitalInvested',
    widthGrow: 1.8,
    hozAlign: 'right',
    headerHozAlign: 'right',
    formatter: (cell: any) => {
      const value = cell.getValue()
      if (value == null) return ''
      return `<strong style="color:#28a745;font-size:1.05rem">${formatCurrency(value)}</strong>`
    },
    bottomCalc: 'sum',
    bottomCalcFormatter: (cell: any) => {
      const value = cell.getValue()
      return `<strong style="color:#28a745;font-size:1.05rem">${formatCurrency(value)}</strong>`
    }
  },
  {
    title: '% of Total',
    field: 'percentage',
    widthGrow: 1.3,
    hozAlign: 'center',
    headerHozAlign: 'center',
    formatter: (cell: any) => {
      const row = cell.getRow().getData() as SymbolPositionGroup
      const percentage = calculatePercentage(row.capitalInvested)
      return `<span style="display:inline-block;padding:0.375rem 0.75rem;background:#e7f3ff;color:#007bff;border-radius:12px;font-weight:600;font-size:0.875rem">${percentage}%</span>`
    },
    bottomCalc: () => 100,
    bottomCalcFormatter: () => {
      return `<span style="display:inline-block;padding:0.375rem 0.75rem;background:#e7f3ff;color:#007bff;border-radius:12px;font-weight:600;font-size:0.875rem">100.00%</span>`
    }
  },
  /* {
    title: 'Positions',
    field: 'positionCount',
    width: 100,
    hozAlign: 'center',
    headerHozAlign: 'center',
    formatter: (cell: any) => {
      const value = cell.getValue()
      return `<span style="color:#6c757d">${value}</span>`
    },
    bottomCalc: 'sum',
    bottomCalcFormatter: (cell: any) => {
      const value = cell.getValue()
      return `<span style="color:#6c757d">${value}</span>`
    }
  } */
]

// Computed data for Tabulator
const tableData = computed(() => {
  if (!top20Positions.value) return []
  return top20Positions.value
})

// Computed success state for Tabulator
const isSuccess = computed(() => {
  return !isLoading.value && !isError.value && !!top20Positions.value && top20Positions.value.length > 0
})

// Initialize Tabulator
const { tableDiv, initializeTabulator, isTableInitialized, tabulator } = useTabulator({
  data: tableData,
  columns,
  isSuccess,
  placeholder: 'No position data available'
})

// Generate colors for pie chart
const generateColors = (count: number): string[] => {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
    '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB'
  ]
  return colors.slice(0, count)
}

// Chart data
const chartData = computed(() => {
  if (!top20Positions.value || top20Positions.value.length === 0) {
    return {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    }
  }

  return {
    labels: top20Positions.value.map(pos => pos.symbolRoot),
    datasets: [{
      data: top20Positions.value.map(pos => pos.capitalInvested),
      backgroundColor: generateColors(top20Positions.value.length),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
})

// Chart options
const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: {
          size: 12
        },
        padding: 10,
        generateLabels: (chart) => {
          const data = chart.data
          if (data.labels && data.datasets.length) {
            return data.labels.map((label, i) => {
              const dataset = data.datasets[0]
              const value = dataset.data[i] as number
              const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              
              return {
                text: `${label}: ${percentage}%`,
                fillStyle: (dataset.backgroundColor as string[])[i],
                hidden: false,
                index: i,
                strokeStyle: '#fff',
                lineWidth: 2
              }
            })
          }
          return []
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((sum: number, val) => sum + (val as number), 0)
          const percentage = ((value / total) * 100).toFixed(2)
          return `${label}: ${formatCurrency(value)} (${percentage}%)`
        }
      }
    }
  }
}

// Cleanup on unmount
onBeforeUnmount(() => {
  if (_cleanup) _cleanup()
})
</script>

<template>
  <div class="relative-capital-deployed-risk-management-view">
    <!-- Header -->
    <div class="header">
      <h2>Top 20 Positions by Capital Used</h2>
      <p class="subtitle">Risk management view showing capital deployment across largest positions</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading position data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="isError" class="error-state">
      <p class="error-message">❌ Error loading data: {{ error?.message }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="top20Positions && top20Positions.length > 0" class="content">
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-label">Total Capital Used</div>
          <div class="stat-value">{{ formatCurrency(totalCapitalInvested) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Number of Positions</div>
          <div class="stat-value">{{ top20Positions.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Largest Position</div>
          <div class="stat-value">{{ top20Positions[0].symbolRoot }}</div>
          <div class="stat-detail">{{ formatCurrency(top20Positions[0].capitalInvested) }}</div>
        </div>
      </div>

      <!-- Pie Chart -->
      <div class="chart-container">
        <Pie :data="chartData" :options="chartOptions" />
      </div>

      <!-- Positions Table -->
      <div class="positions-container">
        <div ref="tableDiv" class="tabulator-table"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>No position data available</p>
    </div>
  </div>
</template>

<style>
@import 'tabulator-tables/dist/css/tabulator_modern.min.css';
@import '../styles/styles.css';
</style>
<style scoped>
@import '../styles/scoped-styles.css';
</style>