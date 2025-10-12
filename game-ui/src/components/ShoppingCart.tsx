'use client';

import { motion } from 'framer-motion';
import { ShoppingCart as ShoppingCartIcon, Trash2, Plus, Minus, DollarSign, Package } from 'lucide-react';
import { useGameStore, GameItem } from '@/store/gameStore';
import { Button } from '@/components/ui/Button';

interface ShoppingCartProps {
  className?: string;
}

export function ShoppingCart({ className = '' }: ShoppingCartProps) {
  const { 
    currentItems, 
    removeItem, 
    updateItemQuantity,
    clearBag,
    session
  } = useGameStore();

  const totalPrice = currentItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * item.quantity), 0);
  const targetPrice = session?.targetPrice || 100;
  const remainingBudget = targetPrice - totalPrice;
  const isOverBudget = totalPrice > targetPrice;

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = currentItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = Math.max(0, Math.min(5, item.quantity + change));
      updateItemQuantity(itemId, newQuantity);
    }
  };

  // Create 5 bags - some filled, some empty
  const bags = Array.from({ length: 5 }, (_, index) => {
    const item = currentItems[index];
    return {
      bagNumber: index + 1,
      item: item || null,
      isEmpty: !item
    };
  });

  if (currentItems.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-elastic-blue p-2 rounded-full">
              <ShoppingCartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shopping Cart</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fill exactly 5 bags to win</p>
            </div>
          </div>
        </div>

        {/* Show 5 empty bags */}
        <div className="space-y-3 mb-6">
          {bags.map((bag) => (
            <div key={bag.bagNumber} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 dark:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Bag {bag.bagNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Empty</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Ask your agent to suggest items to fill your bags!
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">$0.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Remaining Budget:</span>
            <span className="text-sm font-medium text-green-600">${targetPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-elastic-blue p-2 rounded-full">
              <ShoppingCartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shopping Cart</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentItems.length}/5 bags filled</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Total</div>
            <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-elastic-blue'}`}>
              ${totalPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Bags Display */}
      <div className="max-h-96 overflow-y-auto p-4">
        <div className="space-y-3">
          {bags.map((bag) => (
            <div key={bag.bagNumber} className={`rounded-lg border-2 p-4 ${
              bag.isEmpty 
                ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50' 
                : 'border-solid border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
            }`}>
              {/* Bag Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    bag.isEmpty 
                      ? 'bg-gray-200 dark:bg-gray-600' 
                      : 'bg-elastic-blue/10'
                  }`}>
                    <Package className={`h-4 w-4 ${
                      bag.isEmpty 
                        ? 'text-gray-400' 
                        : 'text-elastic-blue'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Bag {bag.bagNumber}
                  </h3>
                </div>
                
                {!bag.isEmpty && (
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ${(parseFloat(bag.item!.price || 0) * bag.item!.quantity).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => removeItem(bag.item!.id)}
                      title={`Empty Bag ${bag.bagNumber}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Bag Content */}
              {bag.isEmpty ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Item Name - Full Width */}
                  <div className="w-full">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white leading-tight">
                      {bag.item!.name}
                    </h4>
                  </div>
                  
                  {/* Quantity and Price Description */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {bag.item!.quantity}x @ ${parseFloat(bag.item!.price || 0).toFixed(2)} each
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-600 rounded-lg">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleQuantityChange(bag.item!.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 text-sm font-medium text-gray-900 dark:text-white min-w-[2rem] text-center">
                        {bag.item!.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleQuantityChange(bag.item!.id, 1)}
                        disabled={bag.item!.quantity >= 5}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Remaining Budget:</span>
            <span className={`text-sm font-medium ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${remainingBudget.toFixed(2)}
            </span>
          </div>
          {isOverBudget && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ Over budget by ${(totalPrice - targetPrice).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
