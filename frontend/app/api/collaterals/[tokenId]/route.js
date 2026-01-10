import dbConnect from '../../../../lib/mongodb';
import Collateral from '../../../../models/Collateral';
import { NextResponse } from 'next/server';

// GET - Lấy thông tin một collateral theo tokenId
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { tokenId } = params;
    
    const collateral = await Collateral.findOne({ tokenId });
    
    if (!collateral) {
      return NextResponse.json(
        { error: 'Collateral not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: collateral
    });
  } catch (error) {
    console.error('Error fetching collateral:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collateral', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật thông tin collateral (lock/unlock, update value, etc.)
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { tokenId } = params;
    const body = await request.json();
    
    const collateral = await Collateral.findOne({ tokenId });
    
    if (!collateral) {
      return NextResponse.json(
        { error: 'Collateral not found' },
        { status: 404 }
      );
    }
    
    // Handle lock operation
    if (body.action === 'lock' && body.contractAddress && body.loanAmount !== undefined) {
      await collateral.lock(body.contractAddress, body.loanAmount);
      if (body.lockTxHash) {
        collateral.lockTxHash = body.lockTxHash;
        await collateral.save();
      }
    }
    // Handle unlock operation
    else if (body.action === 'unlock') {
      await collateral.unlock();
      if (body.unlockTxHash) {
        collateral.unlockTxHash = body.unlockTxHash;
        await collateral.save();
      }
    }
    // Handle value update
    else if (body.estimatedValue !== undefined) {
      await collateral.updateValue(body.estimatedValue);
    }
    // General update
    else {
      Object.keys(body).forEach(key => {
        if (key !== 'action' && collateral[key] !== undefined) {
          collateral[key] = body[key];
        }
      });
      collateral.updatedAt = new Date();
      await collateral.save();
    }
    
    return NextResponse.json({
      success: true,
      data: collateral
    });
  } catch (error) {
    console.error('Error updating collateral:', error);
    return NextResponse.json(
      { error: 'Failed to update collateral', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Xóa collateral record (khi NFT bị burn)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { tokenId } = params;
    
    const collateral = await Collateral.findOneAndDelete({ tokenId });
    
    if (!collateral) {
      return NextResponse.json(
        { error: 'Collateral not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Collateral deleted successfully',
      data: collateral
    });
  } catch (error) {
    console.error('Error deleting collateral:', error);
    return NextResponse.json(
      { error: 'Failed to delete collateral', details: error.message },
      { status: 500 }
    );
  }
}
