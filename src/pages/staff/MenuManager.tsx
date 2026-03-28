import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { MenuItem } from '../../types';
import { Plus, Edit2, Trash2, Check, Camera } from 'lucide-react';

const MenuManager = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'Lunch',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500',
    isAvailable: true
  });

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.category) return;
    
    if (editingId) {
      updateMenuItem(editingId, formData);
      setEditingId(null);
    } else {
      addMenuItem(formData as Omit<MenuItem, 'id'>);
      setIsAdding(false);
    }
  };

  const startEdit = (item: MenuItem) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      name: '', description: '', price: 0, category: 'Lunch', imageUrl: '', isAvailable: true
    });
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
          <p className="text-textMuted">Add, edit, or remove items from the canteen menu.</p>
        </div>
        {!isAdding && !editingId && (
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Item
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="glass-panel p-6 mb-8 border-primary/30 animate-slide-up">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Item Name</label>
              <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Category</label>
              <input type="text" className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Price (₹)</label>
              <input type="number" className="input-field" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
              <textarea className="input-field" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Image URL</label>
              <div className="flex gap-2">
                <input type="text" className="input-field flex-1" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                <label className="flex items-center justify-center gap-2 cursor-pointer shrink-0 py-2 px-4 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-white font-medium">
                  <Camera size={18} />
                  <span className="hidden sm:inline">Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-6">
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" checked={formData.isAvailable} onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })} />
                 <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                 <span className="ml-3 text-sm font-medium text-white">Available</span>
               </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
            <button onClick={cancelEdit} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Check size={18} /> Save Item</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className="glass-panel overflow-hidden flex flex-col group">
            <div className="h-40 overflow-hidden relative">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
              <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={() => startEdit(item)} className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:text-primary transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => deleteMenuItem(item.id)} className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
              </div>
              {!item.isAvailable && <div className="absolute top-2 left-2 bg-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase text-white">Sold Out</div>}
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                <span className="font-bold text-primary">₹{item.price}</span>
              </div>
              <span className="text-xs bg-white/5 text-textMuted px-2 py-0.5 rounded uppercase tracking-wider">{item.category}</span>
              <p className="text-sm text-textMuted mt-2 line-clamp-2">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuManager;
