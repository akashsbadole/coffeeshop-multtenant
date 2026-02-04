'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calculator,
  Plus,
  Minus,
  X,
  Divide,
  Equal,
  Delete,
  Percent,
  DollarSign,
  History,
  RotateCcw,
  Wand2
} from 'lucide-react'

interface CalculatorProps {
  onInsertAmount?: (amount: number) => void
  position?: 'left' | 'right' | 'bottom'
}

interface CalculatorState {
  display: string
  previousValue: string | null
  operation: string | null
  shouldResetDisplay: boolean
  history: CalculationHistory[]
  memory: number
}

interface CalculationHistory {
  id: string
  expression: string
  result: string
  timestamp: Date
}

export function POSCalculator({ onInsertAmount, position = 'left' }: CalculatorProps) {
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    previousValue: null,
    operation: null,
    shouldResetDisplay: false,
    history: [],
    memory: 0
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleNumber = useCallback((num: string) => {
    setState(prev => ({
      ...prev,
      display: prev.shouldResetDisplay ? num : prev.display === '0' ? num : prev.display + num,
      shouldResetDisplay: false
    }))
   }, [])

  const getOperationSymbol = (op: string | null): string => {
    switch (op) {
      case 'add': return '+'
      case 'subtract': return '-'
      case 'multiply': return '×'
      case 'divide': return '÷'
      default: return ''
    }
  }

  const handleOperation = useCallback((op: string) => {
    setState(prev => {
      if (prev.operation && prev.previousValue) {
        const result = calculate(prev.previousValue, prev.display, prev.operation)
        const newHistory: CalculationHistory = {
          id: Date.now().toString(),
          expression: `${prev.previousValue} ${getOperationSymbol(prev.operation)} ${prev.display}`,
          result: result,
          timestamp: new Date()
        }
        return {
          ...prev,
          display: result,
          previousValue: result,
          operation: op,
          shouldResetDisplay: true,
          history: [newHistory, ...prev.history.slice(0, 9)]
        }
      }
      return {
        ...prev,
        previousValue: prev.display,
        operation: op,
        shouldResetDisplay: true
      }
    })
  }, [])

  const handleEqual = useCallback(() => {
    setState(prev => {
      if (!prev.operation || !prev.previousValue) return prev

      const result = calculate(prev.previousValue, prev.display, prev.operation)
      const newHistory: CalculationHistory = {
        id: Date.now().toString(),
        expression: `${prev.previousValue} ${getOperationSymbol(prev.operation)} ${prev.display}`,
        result: result,
        timestamp: new Date()
      }
      return {
        ...prev,
        display: result,
        previousValue: null,
        operation: null,
        shouldResetDisplay: true,
        history: [newHistory, ...prev.history.slice(0, 9)]
      }
    })
  }, [])

  const handlePercentage = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: (parseFloat(prev.display) / 100).toString()
    }))
  }, [])

  const handlePlusMinus = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: (parseFloat(prev.display) * -1).toString()
    }))
  }, [])

  const handleClear = useCallback(() => {
    setState({
      display: '0',
      previousValue: null,
      operation: null,
      shouldResetDisplay: false,
      history: [],
      memory: 0
    })
  }, [])

  const handleDelete = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: prev.display.length > 1 ? prev.display.slice(0, -1) : '0'
    }))
  }, [])

  const handleMemoryStore = useCallback(() => {
    setState(prev => ({
      ...prev,
      memory: parseFloat(prev.display)
    }))
  }, [])

  const handleMemoryRecall = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: prev.memory.toString(),
      shouldResetDisplay: true
    }))
  }, [])

  const handleMemoryClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      memory: 0
    }))
  }, [])

  const handleInsertAmount = useCallback(() => {
    if (onInsertAmount) {
      onInsertAmount(parseFloat(state.display))
    }
  }, [onInsertAmount, state.display])

  const handleQuickDiscount = useCallback((percentage: number) => {
    const currentTotal = parseFloat(state.display)
    const discount = currentTotal * (percentage / 100)
    const result = (currentTotal - discount).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  const handleQuickTax = useCallback((percentage: number) => {
    const currentTotal = parseFloat(state.display)
    const tax = currentTotal * (percentage / 100)
    const result = (currentTotal + tax).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  const handleSplitBill = useCallback((split: number) => {
    const currentTotal = parseFloat(state.display)
    const result = (currentTotal / split).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  const handleDiscountAmount = useCallback((amount: number) => {
    const currentTotal = parseFloat(state.display)
    const result = (currentTotal - amount).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  const handleRoundUp = useCallback(() => {
    const currentTotal = parseFloat(state.display)
    const result = Math.ceil(currentTotal).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  const handleRoundDown = useCallback(() => {
    const currentTotal = parseFloat(state.display)
    const result = Math.floor(currentTotal).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  const handleSquare = useCallback(() => {
    const currentTotal = parseFloat(state.display)
    const result = (currentTotal * currentTotal).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  const handleSquareRoot = useCallback(() => {
    const currentTotal = parseFloat(state.display)
    const result = Math.sqrt(currentTotal).toFixed(2)
    setState(prev => ({
      ...prev,
      display: result,
      shouldResetDisplay: true
    }))
  }, [state.display])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key >= '0' && e.key <= '9') handleNumber(e.key)
      else if (e.key === '.') handleNumber('.')
      else if (e.key === '+') handleOperation('add')
      else if (e.key === '-') handleOperation('subtract')
      else if (e.key === '*') handleOperation('multiply')
      else if (e.key === '/') handleOperation('divide')
      else if (e.key === 'Enter' || e.key === '=') handleEqual()
      else if (e.key === 'Escape') handleClear()
      else if (e.key === 'Backspace') handleDelete()
      else if (e.key === '%') handlePercentage()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNumber, handleOperation, handleEqual, handleClear, handleDelete, handlePercentage])

  return (
    <Card className={`${position === 'left' ? 'sticky top-0' : ''} h-full bg-gray-900 text-white border-gray-800 shadow-xl`}>
      <CardHeader className="pb-2 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
            <Calculator className="h-4 w-4" color="#fff" />
            Calculator
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs h-6 px-2 hover:bg-gray-800 text-white hover:text-white"
            >
              <Wand2 className="h-3 w-3 mr-1 text-white hover:text-white" />
              {showAdvanced ? 'Basic' : 'Advanced'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 space-y-2">
        {/* Display */}
        <div className="bg-gray-950 rounded-lg p-3 text-right">
          <div className="text-xs text-white h-4 ">
            {state.previousValue && `${state.previousValue} ${getOperationSymbol(state.operation)}`}
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {state.display}
          </div>
          {state.memory !== 0 && (
            <div className="text-xs text-white mt-1">
              M: {state.memory.toFixed(2)}
            </div>
          )}
        </div>

        {/* Memory Functions */}
        <div className="grid grid-cols-4 gap-1">
          <Button variant="ghost" size="sm" onClick={handleMemoryStore} className="text-xs bg-gray-800 hover:bg-gray-700 text-white">MS</Button>
          <Button variant="ghost" size="sm" onClick={handleMemoryRecall} className="text-xs bg-gray-800 hover:bg-gray-700 text-white">MR</Button>
          <Button variant="ghost" size="sm" onClick={handleMemoryClear} className="text-xs bg-gray-800 hover:bg-gray-700 text-white">MC</Button>
          <Button variant="ghost" size="sm" onClick={() => handleSplitBill(2)} className="text-xs bg-blue-900 hover:bg-blue-800 text-white">½</Button>
        </div>

        {/* Main Calculator */}
        <div className="grid grid-cols-4 gap-1">
          <Button variant="ghost" size="lg" onClick={handleClear} className="text-white bg-gray-800 hover:bg-red-900/30">
            <X className="h-4 w-4" color="#fff" />
          </Button>
          <Button variant="ghost" size="lg" onClick={handleDelete} className="text-white bg-gray-800 hover:bg-orange-900/30">
            <Delete className="h-4 w-4" color="#fff" />
          </Button>
          <Button variant="ghost" size="lg" onClick={handlePercentage} className="text-white bg-gray-800 hover:bg-amber-900/30">
            <Percent className="h-4 w-4" color="#fff" />
          </Button>
          <Button variant="ghost" size="lg" onClick={handlePlusMinus} className="text-white bg-gray-800 hover:bg-amber-900/30">
            ±
          </Button>

          <Button variant="ghost" size="lg" onClick={() => handleNumber('7')} className="bg-gray-800 hover:bg-gray-700 text-white">7</Button>
          <Button variant="ghost" size="lg" onClick={() => handleNumber('8')} className="bg-gray-800 hover:bg-gray-700 text-white">8</Button>
          <Button variant="ghost" size="lg" onClick={() => handleNumber('9')} className="bg-gray-800 hover:bg-gray-700 text-white">9</Button>
          <Button variant="ghost" size="lg" onClick={() => handleOperation('divide')} className="bg-blue-900/50 hover:bg-blue-800 text-white">
            <Divide className="h-4 w-4" color="#fff" />
          </Button>

          <Button variant="ghost" size="lg" onClick={() => handleNumber('4')} className="bg-gray-800 hover:bg-gray-700 text-white">4</Button>
          <Button variant="ghost" size="lg" onClick={() => handleNumber('5')} className="bg-gray-800 hover:bg-gray-700 text-white">5</Button>
          <Button variant="ghost" size="lg" onClick={() => handleNumber('6')} className="bg-gray-800 hover:bg-gray-700 text-white">6</Button>
          <Button variant="ghost" size="lg" onClick={() => handleOperation('multiply')} className="bg-blue-900/50 hover:bg-blue-800 text-white">
            <X className="h-4 w-4" color="#fff" />
          </Button>

          <Button variant="ghost" size="lg" onClick={() => handleNumber('1')} className="bg-gray-800 hover:bg-gray-700 text-white">1</Button>
          <Button variant="ghost" size="lg" onClick={() => handleNumber('2')} className="bg-gray-800 hover:bg-gray-700 text-white">2</Button>
          <Button variant="ghost" size="lg" onClick={() => handleNumber('3')} className="bg-gray-800 hover:bg-gray-700 text-white">3</Button>
          <Button variant="ghost" size="lg" onClick={() => handleOperation('subtract')} className="bg-blue-900/50 hover:bg-blue-800 text-white">
            <Minus className="h-4 w-4" color="#fff" />
          </Button>

          <Button variant="ghost" size="lg" onClick={() => handleNumber('0')} className="bg-gray-800 hover:bg-gray-700 text-white col-span-2">0</Button>
          <Button variant="ghost" size="lg" onClick={() => handleNumber('.')} className="bg-gray-800 hover:bg-gray-700 text-white">.</Button>
          <Button variant="ghost" size="lg" onClick={() => handleOperation('add')} className="bg-blue-900/50 hover:bg-blue-800 text-white">
            <Plus className="h-4 w-4" color="#fff" />
          </Button>
        </div>

        {/* Equal Button */}
        <Button 
          onClick={handleEqual} 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold"
        >
          <Equal className="h-5 w-5 mr-2" />
          =
        </Button>

        {/* Advanced Functions */}
        {showAdvanced && (
          <>
            <div className="border-t border-gray-800 pt-2 space-y-2">
              <div className="text-xs text-white flex items-center gap-1">
                <Wand2 className="h-3 w-3" />
                Quick Calculations
              </div>
              <div className="grid grid-cols-4 gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleQuickDiscount(5)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white">-5%</Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickDiscount(10)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white">-10%</Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickDiscount(15)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white">-15%</Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickDiscount(20)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white">-20%</Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickTax(5)} className="text-xs bg-green-900/30 hover:bg-green-800/50 text-white">+5%</Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickTax(12)} className="text-xs bg-green-900/30 hover:bg-green-800/50 text-white">+12%</Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickTax(18)} className="text-xs bg-green-900/30 hover:bg-green-800/50 text-white">+18%</Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickTax(28)} className="text-xs bg-green-900/30 hover:bg-green-800/50 text-white">+28%</Button>
                <Button variant="ghost" size="sm" onClick={handleRoundUp} className="text-xs bg-amber-900/30 hover:bg-amber-800/50 text-white">↑</Button>
                <Button variant="ghost" size="sm" onClick={handleRoundDown} className="text-xs bg-amber-900/30 hover:bg-amber-800/50 text-white">↓</Button>
                <Button variant="ghost" size="sm" onClick={() => handleSplitBill(4)} className="text-xs bg-blue-900/30 hover:bg-blue-800/50 text-white">¼</Button>
                <Button variant="ghost" size="sm" onClick={handleSquare} className="text-xs bg-purple-900/30 hover:bg-purple-800/50 text-white">x²</Button>
                <Button variant="ghost" size="sm" onClick={handleSquareRoot} className="text-xs bg-purple-900/30 hover:bg-purple-800/50 text-white">√x</Button>
                <Button variant="ghost" size="sm" onClick={handleInsertAmount} className="text-xs bg-green-600 hover:bg-green-500 text-white">
                  Insert
                </Button>
              </div>
            </div>

            {/* Amount Buttons */}
            <div className="border-t border-gray-800 pt-2 space-y-2">
              <div className="text-xs text-white">Quick Amounts</div>
              <div className="grid grid-cols-4 gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(5)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-5</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(10)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-10</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(20)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-20</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(50)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-50</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(100)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-100</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(200)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-200</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(500)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-500</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDiscountAmount(1000)} className="text-xs bg-red-900/30 hover:bg-red-800/50">-1K</Button>
              </div>
            </div>
          </>
        )}

        {/* History */}
        {state.history.length > 0 && (
          <div className="border-t border-gray-800 pt-2">
            <div className="flex items-center justify-between text-xs text-white mb-1">
              <span className="flex items-center gap-1">
                <History className="h-3 w-3" />
                History
              </span>
              <Button variant="ghost" size="sm" onClick={() => setState(prev => ({ ...prev, history: [] }))} className="h-4 p-1">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {state.history.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-800 p-1 rounded"
                    onClick={() => setState(prev => ({ ...prev, display: item.result, shouldResetDisplay: true }))}
                  >
                    <span className="text-gray-400">{item.expression}</span>
                    <span className="text-white font-mono">{item.result}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function calculate(a: string, b: string, operation: string): string {
  const numA = parseFloat(a)
  const numB = parseFloat(b)

  switch (operation) {
    case 'add': return (numA + numB).toFixed(2)
    case 'subtract': return (numA - numB).toFixed(2)
    case 'multiply': return (numA * numB).toFixed(2)
    case 'divide': return numB !== 0 ? (numA / numB).toFixed(2) : 'Error'
    default: return b
  }
}
