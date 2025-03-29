import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';

interface Params {
  params: {
    path: string[];
  };
}

// GET /api/files/[...path] - Get file content
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const filePath = params.path.join('/');
    
    const storageService = getStorageService();
    const content = await storageService.getFile(filePath);
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error(`Error fetching file ${params.path.join('/')}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

// DELETE /api/files/[...path] - Delete a file
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const filePath = params.path.join('/');
    
    const storageService = getStorageService();
    await storageService.deleteFile(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting file ${params.path.join('/')}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 