"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import { Notebook, Block, MarkdownBlock, PythonBlock, CsvBlock } from '@/lib/types';
import { generateUUID } from '@/lib/utils';

interface NotebookContextType {
  notebook: Notebook | null;
  setNotebook: (notebook: Notebook) => void;
  selectedBlockId: string | null;
  selectBlock: (id: string | null) => void;
  updateBlock: (id: string, updates: Partial<MarkdownBlock | PythonBlock | CsvBlock>) => void;
  createBlock: (type: 'markdown' | 'python' | 'csv', position?: number) => Promise<string>;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export function NotebookProvider({ children }: { children: ReactNode }) {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  const selectBlock = (id: string | null) => {
    setSelectedBlockId(id);
  };
  
  const updateBlock = (id: string, updates: Partial<MarkdownBlock | PythonBlock | CsvBlock>) => {
    if (!notebook) return;
    
    const updatedBlocks = notebook.blocks.map(block => {
      if (block.id !== id) return block;
      
      // Always preserve the original type
      if (block.type === 'markdown') {
        return { ...block, ...updates } as MarkdownBlock;
      } else if (block.type === 'python') {
        return { ...block, ...updates } as PythonBlock;
      } else {
        return { ...block, ...updates } as CsvBlock;
      }
    });
    
    setNotebook({
      ...notebook,
      blocks: updatedBlocks
    });
  };
  
  const createBlock = async (type: 'markdown' | 'python' | 'csv', position?: number) => {
    if (!notebook) throw new Error('No notebook loaded');
    
    const now = new Date().toISOString();
    const id = generateUUID();
    const newPosition = position !== undefined ? position : notebook.blocks.length;
    
    // Create file path
    const filePath = `${notebook.id}/${id}.${type === 'markdown' ? 'md' : type === 'python' ? 'py' : 'csv'}`;
    
    // Create new block based on type
    let newBlock: MarkdownBlock | PythonBlock | CsvBlock;
    
    if (type === 'markdown') {
      const markdownBlock: MarkdownBlock = {
        id,
        type: 'markdown',
        filePath,
        position: newPosition,
        created: now,
        updated: now,
        editMode: true
      };
      newBlock = markdownBlock;
    } else if (type === 'python') {
      const pythonBlock: PythonBlock = {
        id,
        type: 'python',
        filePath,
        position: newPosition,
        created: now,
        updated: now,
        output: '',
        isExecuting: false
      };
      newBlock = pythonBlock;
    } else {
      const csvBlock: CsvBlock = {
        id,
        type: 'csv',
        filePath,
        position: newPosition,
        created: now,
        updated: now
      };
      newBlock = csvBlock;
    }
    
    // Update blocks order if inserting at a specific position
    const updatedBlocks = [...notebook.blocks];
    
    if (position !== undefined) {
      // Adjust positions of blocks after the insertion point
      for (let i = 0; i < updatedBlocks.length; i++) {
        if (updatedBlocks[i].position >= newPosition) {
          updatedBlocks[i].position += 1;
        }
      }
    }
    
    // Add the new block
    updatedBlocks.push(newBlock);
    
    // Sort blocks by position
    updatedBlocks.sort((a, b) => a.position - b.position);
    
    // Update notebook
    setNotebook({
      ...notebook,
      blocks: updatedBlocks,
      files: [...notebook.files, { path: filePath, type }]
    });
    
    // Create file on the server
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: filePath,
          content: ''
        })
      });
    } catch (error) {
      console.error('Failed to create file:', error);
    }
    
    return id;
  };
  
  return (
    <NotebookContext.Provider value={{
      notebook,
      setNotebook,
      selectedBlockId,
      selectBlock,
      updateBlock,
      createBlock
    }}>
      {children}
    </NotebookContext.Provider>
  );
}

export function useNotebook() {
  const context = useContext(NotebookContext);
  if (context === undefined) {
    throw new Error('useNotebook must be used within a NotebookProvider');
  }
  return context;
} 