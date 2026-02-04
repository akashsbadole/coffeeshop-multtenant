'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { X, Coffee, Settings, Snowflake, Droplet, Thermometer, Zap } from 'lucide-react'

interface ModifiersDialogProps {
  isOpen: boolean
  onClose: () => void
  menuItem: {
    name: string
    price: number
    gstRate: string
  }
  currentModifiers: {
    size?: 'S' | 'M' | 'L'
    milkType?: 'Whole' | 'Skim' | 'Oat' | 'Soy'
    sugarLevel?: 'None' | 'Less' | 'Regular' | 'More'
    temperature?: 'Hot' | 'Iced'
    extraShots?: number
    whippedCream?: boolean
  }
  onConfirm: (modifiers: any) => void
}

export function ModifiersDialog({ isOpen, onClose, menuItem, currentModifiers, onConfirm }: ModifiersDialogProps) {
  const [modifiers, setModifiers] = useState({
    size: currentModifiers.size || 'M',
    milkType: currentModifiers.milkType || 'Whole',
    sugarLevel: currentModifiers.sugarLevel || 'Regular',
    temperature: currentModifiers.temperature || 'Regular',
    extraShots: currentModifiers.extraShots || 0,
    whippedCream: currentModifiers.whippedCream || false
  })

  const sizeOptions = ['S', 'M', 'L']
  const milkTypeOptions = ['Whole', 'Skim', 'Oat', 'Soy']
  const sugarLevelOptions = ['None', 'Less', 'Regular', 'More']
  const temperatureOptions = ['Hot', 'Iced']

  const getPriceAdjustment = () => {
    let adjustment = 0
    if (modifiers.milkType === 'Whole') adjustment += 0
    if (modifiers.milkType === 'Skim') adjustment -= 5
    if (modifiers.milkType === 'Oat') adjustment -= 10
    if (modifiers.sugarLevel === 'More') adjustment += 10
    if (modifiers.temperature === 'Hot') adjustment += 15
    if (modifiers.extraShots) adjustment += modifiers.extraShots * 15
    if (modifiers.whippedCream) adjustment += 10
    return adjustment
  }

  const handleSubmit = () => {
    onConfirm(modifiers)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Settings className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Coffee className="h-7 w-7" />
                  <div className="text-left">
                    <div className="text-xl font-bold">{menuItem.name}</div>
                    <div className="text-amber-100 text-sm mt-1">
                      Base: ₹{menuItem.price.toFixed(2)}
                    </div>
                  </div>
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-right">
              <DialogDescription className="text-amber-100">
                Customize your order
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Size Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Size</Label>
            <RadioGroup value={modifiers.size} onValueChange={(value) => setModifiers({ ...modifiers, size: value as any })}>
              <div className="flex items-center gap-4 flex-wrap">
                {sizeOptions.map((size) => (
                  <div key={size} className="flex items-center">
                    <RadioGroupItem value={size} id={`size-${size}`} className="peer" />
                    <span className="font-medium">{size}</span>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Milk Type */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Milk Type</Label>
            <RadioGroup value={modifiers.milkType} onValueChange={(value) => setModifiers({ ...modifiers, milkType: value as any })}>
              <div className="flex items-center gap-4 flex-wrap">
                {milkTypeOptions.map((type) => (
                  <div key={type} className="flex items-center">
                    <RadioGroupItem value={type} id={`milk-${type}`} />
                    <span className="font-medium">{type}</span>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Sugar Level */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Sugar Level</Label>
            <RadioGroup value={modifiers.sugarLevel} onValueChange={(value) => setModifiers({ ...modifiers, sugarLevel: value as any })}>
              <div className="flex items-center gap-4 flex-wrap">
                {sugarLevelOptions.map((level) => (
                  <div key={level} className="flex items-center">
                    <RadioGroupItem value={level} id={`sugar-${level}`} className="peer" />
                    <span className="font-medium">{level}</span>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Temperature */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Temperature</Label>
            <RadioGroup value={modifiers.temperature} onValueChange={(value) => setModifiers({ ...modifiers, temperature: value as any })}>
              <div className="flex items-center gap-4">
                {temperatureOptions.map((temp) => (
                  <div key={temp} className="flex items-center">
                    <RadioGroupItem value={temp} id={`temp-${temp}`} className="peer">
                      <span className="font-medium">{temp}</span>
                    </RadioGroupItem>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Extra Shots */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Extra Shots</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={modifiers.extraShots}
                onChange={(e) => setModifiers({ ...modifiers, extraShots: parseInt(e.target.value) || 0 })}
                min="0"
                max="10"
                className="w-24 h-10"
              />
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-2xl">{modifiers.extraShots}</span>
              </div>
            </div>
          </div>

          {/* Whipped Cream */}
          <div className="flex items-center gap-2 mt-4">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={modifiers.whippedCream}
                onChange={(e) => setModifiers({ ...modifiers, whippedCream: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-medium">Add Whipped Cream</span>
            </Label>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border-2 border-amber-200">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Price:</span>
              <span className="text-xl font-bold text-amber-600">₹{menuItem.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Adjustment:</span>
              <span className="text-xl font-bold text-green-600">₹+{getPriceAdjustment().toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Final Price:</span>
              <span className="text-xl font-bold">₹{(menuItem.price + getPriceAdjustment()).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex gap-2">
              <Snowflake className="h-4 w-4" color="#fff" />
              <span className="italic">Including GST @ {parseFloat(menuItem.gstRate)}% tax</span>
            </div>
            <div>
              {getPriceAdjustment() > 0 && (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">Auto-adds GST: +₹{(menuItem.price * parseFloat(menuItem.gstRate) / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 border-amber-200 hover:bg-amber-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
          >
            <Settings className="h-5 w-5 mr-2" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
